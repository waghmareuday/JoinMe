import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { sendWelcomeEmail, sendResetOTPEmailFunc, sendOTPEmailFunc } from '../config/nodemailer.js';

export const register = async (req, res) => {
  const { name, email, password, gender, age, city, profession } = req.body;

  if (!name || !email || !password || !gender || !age || !city || !profession) {
    return res.json({ success: false, message: 'All fields are required' });
  }

  try {
    let existingUser = await userModel.findOne({ email });

    if (existingUser) {
      const isTemp = existingUser.name === 'Temp' || existingUser.password === 'dummy';
      const isFullyRegistered = existingUser.isVerified && !isTemp;

      if (isFullyRegistered) {
        return res.json({ success: false, message: 'User already exists' });
      }

      // Temp user who completed OTP verification — now complete registration
      if (existingUser.isVerified && isTemp) {
        existingUser.name = name;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.gender = gender;
        existingUser.age = age;
        existingUser.city = city;
        existingUser.profession = profession;

        await existingUser.save();
        await sendWelcomeEmail(email, name);

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
          expiresIn: '7d',
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.json({ success: true, message: 'Registration successful' });
      }

      // Case: user exists but not verified (e.g. closed signup modal early)
      return res.json({ success: false, message: 'Please verify your email first' });
    }

    // No existing user at all — fallback registration (should not hit if OTP flow is used correctly)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      gender,
      age,
      city,
      profession,
      isVerified: true,
    });

    await newUser.save();
    await sendWelcomeEmail(email, name);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, message: 'Registration successful' });

  } catch (error) {
    console.error('Register error:', error);
    return res.json({ success: false, message: error.message });
  }
};


export const login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid email' });
        }

        if (!user.isVerified) {
            return res.json({ success: false, message: 'Please verify your email before logging in' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        // ✅ Token expiry based on rememberMe
        const expiresIn = rememberMe ? '30d' : '1h';
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
            maxAge,
        });

        return res.json({ success: true, message: 'Login successful' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
        });
        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const sendOTPEmail = async (req, res) => {
  const { email } = req.body;

  console.log("\n🔵 Step 1: Incoming request to /send-otp");
  console.log("📨 Email received from frontend:", email);

  if (!email) {
    console.log("🔴 No email provided in request body");
    return res.json({ success: false, message: 'Email is required' });
  }

  try {
    let user = await userModel.findOne({ email });
    console.log("🟡 Step 2: Searched DB for existing user...");
    if (user) {
      console.log("🟢 Found existing user in DB:", user.email);
    } else {
      console.log("⚠️ No user found with this email. Creating temporary user...");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    if (!user) {
      user = new userModel({
        name: 'Temp',
        email,
        password: 'dummy',
        gender: 'Other',
        age: 5,
        city: 'Unknown',
        isVerified: false,
        verifyOtp: otp,
        verifyOtpExpireAt: expiry
      });

      try {
        await user.save();
        console.log("✅ Step 3: Temporary user saved to DB successfully");
      } catch (err) {
        console.error("❌ Failed to save temp user:", err.message);
        return res.json({ success: false, message: 'Failed to create temp user' });
      }

    } else {
      if (user.isVerified) {
        console.log("🚫 Step 3: User is already verified");
        return res.json({ success: false, message: 'Account already verified!' });
      }

      user.verifyOtp = otp;
      user.verifyOtpExpireAt = expiry;

      try {
        await user.save();
        console.log("🔄 Step 3: Updated OTP and expiry for existing user");
      } catch (err) {
        console.error("❌ Failed to update OTP for existing user:", err.message);
        return res.json({ success: false, message: 'Failed to update OTP' });
      }
    }

    console.log("📬 Step 4: Sending OTP via email:", otp);

    const emailSent = await sendOTPEmailFunc(email, otp);

    if (emailSent) {
      console.log("✅ Step 5: OTP sent successfully!");
      return res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      console.log("❌ Step 5: Failed to send OTP email");
      return res.json({ success: false, message: 'Failed to send OTP' });
    }

  } catch (error) {
    console.error("🔥 Unhandled error in sendOTPEmail:", error);
    return res.json({ success: false, message: error.message });
  }
};






export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.json({ success: false, message: 'Account already verified' });
        }

        if (user.verifyOtp !== otp || Date.now() > user.verifyOtpExpireAt) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Account verified successfully' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const isAuthenticated = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.json({ success: false, message: 'Unauthorized access' });
        }

        const user = await userModel.findById(req.user.id).select('name email gender age city profession isVerified');
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const sendResetOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;
        await user.save();

        const emailSent = await sendResetOTPEmailFunc(email, otp);

        if (emailSent) {
            return res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            return res.json({ success: false, message: 'Failed to send OTP' });
        }

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Just for verifying the OTP
export const verifyOnlyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user || user.resetOtp !== otp || Date.now() > user.resetOtpExpireAt) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        return res.json({ success: true, message: 'OTP Verified' });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
};


export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.json({ success: false, message: 'Email and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

