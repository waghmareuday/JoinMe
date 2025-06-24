import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { sendWelcomeEmail,  sendResetOTPEmailFunc, sendOTPEmailFunc } from '../config/nodemailer.js'; 



export const register = async (req, res) => {
    const { name, email, password, gender, age, city, profession } = req.body;

    if (!name || !email || !password || !gender || !age || !city || !profession) {
        return res.json({ success: false, message: 'All fields are required' });
    }

    try {
        const existingUser = await userModel.findOne({email});

        if( existingUser ) {
            return res.json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name,
            email,
            password: hashedPassword,
            gender,
            age,
            city,
        });
        await user.save();

        await sendWelcomeEmail(email, name);

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.json({ success: true, message: 'Registration successful'});

    } catch (error) {
        res.json({success: false, message: error.message })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'Invalid E-mail' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid Password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        

        return res.json({ success: true, message: 'Login successful'});

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'strict',
        });
        return res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const sendOTPEmail = async (req, res) => {
    console.log("BODY:", req.body);
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }

    try {
        // Store OTP in the user's document (you may want to hash it before storing)
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        if (user.isVerified) {
            return res.json({ success: false, message: 'Account Already verified!' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes 
        await user.save();
        // await userModel.updateOne({ email }, { otp });

        const emailSent = await sendOTPEmailFunc(email, otp);

        if (emailSent) {
            return res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            return res.json({ success: false, message: 'Failed to send OTP' });
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

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

        if (user.verifyOtp !== otp || user.verifyOtp === '' ||Date.now() > user.verifyOtpExpireAt) {
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
}

export const isAuthenticated = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.json({ success: false, message: 'Unauthorized access' });
        }
        // Fetch user from DB to ensure the user exists and is valid
        const user = await userModel.findById(req.user.id).select('name email gender age city profession isVerified');
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true});
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

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
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        const emailSent = await sendResetOTPEmailFunc(email, otp);

        if (emailSent) {
            return res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            return res.json({ success: false, message: 'Failed to send OTP' });
        }


    }catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const verifyResetOTP = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Email, OTP and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (user.resetOtp !== otp || user.resetOtp === '' || Date.now() > user.resetOtpExpireAt) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
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
}