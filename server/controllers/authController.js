import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
// 🟢 The duplicate function was removed, and we import it directly from nodemailer.js
import { sendWelcomeEmail, sendResetOTPEmailFunc, sendOTPEmailFunc } from '../config/nodemailer.js'; 
import net from 'net';
import nodemailer from 'nodemailer';

export const register = async (req, res) => {
  const { name, email, password, gender, age, city, profession } = req.body;

  if (!name || !email || !password || !gender || !age || !city || !profession) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    let existingUser = await userModel.findOne({ email });

    if (existingUser) {
      const isTemp = existingUser.name === 'Temp' || existingUser.password === 'dummyPassword123!';
      const isFullyRegistered = existingUser.isVerified && !isTemp;

      if (isFullyRegistered) {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }

      // Temp user who completed OTP verification
      if (existingUser.isVerified && isTemp) {
        existingUser.name = name;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.gender = gender;
        existingUser.age = age;
        existingUser.city = city;
        existingUser.profession = profession;

        await existingUser.save();
        await sendWelcomeEmail(email, name);

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        const newSafeUser = {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          gender: existingUser.gender,
          age: existingUser.age,
          city: existingUser.city,
          profession: existingUser.profession,
          isVerified: existingUser.isVerified,
          averageRating: existingUser.averageRating || 0,
          totalRatings: existingUser.totalRatings || 0,
        };
        return res.status(201).json({ success: true, message: 'Registration successful', user: newSafeUser });
      }

      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      name, email, password: hashedPassword, gender, age, city, profession, isVerified: true,
    });

    await newUser.save();
    await sendWelcomeEmail(email, name);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const newSafeUser = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      gender: newUser.gender,
      age: newUser.age,
      city: newUser.city,
      profession: newUser.profession,
      isVerified: newUser.isVerified,
      averageRating: newUser.averageRating || 0,
      totalRatings: newUser.totalRatings || 0,
    };

    return res.status(201).json({ success: true, message: 'Registration successful', user: newSafeUser });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const expiresIn = rememberMe ? '30d' : '1h';
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
            maxAge,
        });

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            age: user.age,
            city: user.city,
            profession: user.profession,
            isVerified: user.isVerified,
            averageRating: user.averageRating || 0,
            totalRatings: user.totalRatings || 0,
        };

        return res.status(200).json({ success: true, message: 'Login successful', user: safeUser });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
        });
        return res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const sendOTPEmail = async (req, res) => {
  const { email } = req.body;

  console.log("\n🔵 Step 1: Incoming request to /send-otp");
  console.log("📨 Email received from frontend:", email);

  if (!email) {
    console.log("🔴 No email provided");
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    let user = await userModel.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    if (!user) {
      console.log("⚠️ Creating temporary user...");
      user = new userModel({
        name: 'Temp',
        email,
        password: 'dummyPassword123!',
        gender: 'Other',
        age: 18,
        city: 'Unknown',
        profession: 'Unknown', // Make sure this is provided since it's required on register
        isVerified: false,
        verifyOtp: otp,
        verifyOtpExpireAt: expiry
      });

      await user.save();
      console.log("✅ Step 3: Temporary user saved");
    } else {
      if (user.isVerified) {
        console.log("🚫 Step 3: User already verified");
        return res.status(400).json({ success: false, message: 'Account already verified!' });
      }

      user.verifyOtp = otp;
      user.verifyOtpExpireAt = expiry;
      await user.save();
      console.log("🔄 Step 3: Updated OTP for existing user");
    }

    console.log("📬 Step 4: Attempting to send email...");
    
    // 🟢 This function is now correctly importing from nodemailer.js
    const emailSent = await sendOTPEmailFunc(email, otp);

    if (emailSent) {
      console.log("✅ Step 5: Email sent successfully");
      return res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } else {
      console.log("❌ Step 5: Nodemailer failed. Check logs above.");
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Check backend logs.' });
    }

  } catch (error) {
    console.error("🔥 Unhandled error in sendOTPEmail:", error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }

        if (user.verifyOtp !== otp || Date.now() > user.verifyOtpExpireAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.status(200).json({ success: true, message: 'Account verified successfully' });

    } catch (error) {
        console.error('OTP verify error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    };
};

export const isAuthenticated = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        const user = await userModel.findById(req.user.id).select('_id name email gender age city profession isVerified averageRating totalRatings');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('isAuthenticated error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const sendResetOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        const emailSent = await sendResetOTPEmailFunc(email, otp);

        if (emailSent) {
            return res.status(200).json({ success: true, message: 'OTP sent successfully' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }

    } catch (error) {
        console.error('sendResetOTP error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Just for verifying the OTP
export const verifyOnlyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user || user.resetOtp !== otp || Date.now() > user.resetOtpExpireAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        return res.status(200).json({ success: true, message: 'OTP Verified' });
    } catch (err) {
        console.error('verifyOnlyOTP error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('resetPassword error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const testDatabase = async (req, res) => {
    try {
        // This fetches all users but only shows their email, name, and if they are verified
        const users = await userModel.find({}).select('email name isVerified password');
        return res.status(200).json({ 
            message: "Here is exactly who is inside your MongoDB Atlas right now:",
            totalUsers: users.length, 
            users 
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 🔍 TEST 2: Expose Nodemailer (To see why OTP fails)
export const testNodemailer = async (req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD, // Must match Render variable
        },
    });

    try {
        await transporter.verify();
        return res.status(200).json({ message: "✅ SUCCESS: Nodemailer connected!" });
    } catch (error) {
        return res.status(500).json({ 
            message: "❌ NODEMAILER CRASHED", 
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code
        });
    }
};