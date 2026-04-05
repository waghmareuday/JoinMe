import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import userModel from '../models/userModel.js';
import { sendWelcomeEmail, sendResetOTPEmailFunc, sendOTPEmailFunc } from '../config/nodemailer.js';

const googleClient = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

export const register = async (req, res) => {
  const { name, email, password, gender, age, city, profession } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
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
        if (gender) existingUser.gender = gender;
        if (age) existingUser.age = age;
        if (city) existingUser.city = city;
        if (profession) existingUser.profession = profession;

        await existingUser.save();
        await sendWelcomeEmail(email, name);

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: true, 
          sameSite: 'none', 
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
        // ⚡ SECURITY: Token is now handled exclusively via HttpOnly cookies for web
        return res.status(201).json({ success: true, message: 'Registration successful', user: newSafeUser });
      }

      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
      name, email, password: hashedPassword, gender: gender || 'Not specified', age: age || 0, city: city || '', profession: profession || '', isVerified: true,
    });

    await newUser.save();
    await sendWelcomeEmail(email, name);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'none', 
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

    // ⚡ SECURITY: Token is now handled exclusively via HttpOnly cookies for web
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

        const expiresIn = rememberMe ? '30d' : '1d';
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, 
            sameSite: 'none', 
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

        // ⚡ SECURITY: Token is now handled exclusively via HttpOnly cookies for web
        return res.status(200).json({ success: true, message: 'Login successful', user: safeUser });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


export const logout = async (req, res) => {
    try {
        // Blacklist the token in Redis so it can't be reused
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (token) {
            const { blacklistToken } = await import('../config/redis.js');
            const jwt = await import('jsonwebtoken');
            try {
                const decoded = jwt.default.decode(token);
                if (decoded?.exp) {
                    const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
                    if (remainingSeconds > 0) {
                        await blacklistToken(token, remainingSeconds);
                    }
                }
            } catch { /* token decode failure is fine — just clear cookie */ }
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none', 
        });
        return res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const sendOTPEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    let user = await userModel.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    if (!user) {
      user = new userModel({
        name: 'Temp',
        email,
        password: 'dummyPassword123!',
        gender: '',
        age: 0,
        city: '',
        profession: '',
        isVerified: false,
        verifyOtp: otp,
        verifyOtpExpireAt: expiry
      });
      await user.save();
    } else {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'Account already verified!' });
      }
      user.verifyOtp = otp;
      user.verifyOtpExpireAt = expiry;
      await user.save();
    }

    const emailSent = await sendOTPEmailFunc(email, otp);

    if (emailSent) {
      return res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
    }

  } catch (error) {
    console.error('sendOTPEmail error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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

        // Don't reveal whether the user exists — prevents email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If an account exists with this email, an OTP has been sent.' });
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
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify OTP is valid before allowing password reset
        if (!otp || user.resetOtp !== otp || Date.now() > user.resetOtpExpireAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('resetPassword error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================
// Google OAuth — verify Google ID token, find or create user
// ============================================
export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not provided by Google' });
    }

    let user = await userModel.findOne({ email });
    let isNewUser = false;

    if (user) {
      // Existing user — just log them in
      // If they were a temp/unverified user from OTP flow, upgrade them
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      // New user — create account with Google data
      // Generate a random secure password (user won't need it, they auth via Google)
      const randomPassword = await bcrypt.hash(googleId + Date.now(), 10);

      user = new userModel({
        name: name || 'Google User',
        email,
        password: randomPassword,
        gender: '',
        age: 0,
        city: '',
        profession: '',
        isVerified: true,
        avatar: picture || '',
        bio: "Hey there! Just joined JoinMe. Excited to meet new people!",
      });
      await user.save();
      isNewUser = true;

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, user.name).catch(() => {});
    }

    // Issue JWT (30 day — same as "remember me")
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? 'Account created with Google!' : 'Welcome back!',
      user: safeUser,
      isNewUser,
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid Google credential' });
  }
};