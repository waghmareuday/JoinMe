// utils/nodemailer.js or config/nodemailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendWelcomeEmail = async (to, name) => {
  const mailOptions = {
    from: `"JoinMe Support" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'Welcome to JoinMe!',
    html: `<p>Hi <b>${name}</b>,</p>
           <p>Welcome to <b>JoinMe</b>! We're excited to have you onboard.</p>
           <p>Get ready to connect, collaborate and explore!</p>
           <br />
           <p>Cheers,<br />The JoinMe Team</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to", to);
  } catch (err) {
    console.error("Error sending welcome email:", err.message);
  }
};

export const sendOTPEmailFunc = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"JoinMe Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Your OTP for JoinMe Verification',
      text: `Hi there,

    Welcome to JoinMe!

    Your OTP for verification is: ${otp}

    This code is valid for the next 10 minutes. Please do not share it with anyone.

    Need help or have questions? Just reply to this email.

    Cheers,
    The JoinMe Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Hi there,</p>
          <p>Welcome to <strong>JoinMe</strong>!</p>
          <p>Your OTP for verification is: <strong style="font-size: 18px;">${otp}</strong></p>
          <p>This code is valid for the next 10 minutes. Please do not share it with anyone.</p>
          <p>Need help or have questions? Just reply to this email.</p>
          <p>Cheers,<br>The JoinMe Team</p>
        </div>
      `
    };


    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};

export const verifyOTPEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"JoinMe Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Your OTP for JoinMe Verification',
      text: `Hi there,

    Your OTP for verification is: ${otp}

    This code is valid for the next 10 minutes. Please do not share it with anyone.

    Cheers,
    The JoinMe Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Hi there,</p>
          <p>Your OTP for verification is: <strong style="font-size: 18px;">${otp}</strong></p>
          <p>This code is valid for the next 10 minutes. Please do not share it with anyone.</p>
          <p>Cheers,<br>The JoinMe Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
}

export const sendResetOTPEmailFunc = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"JoinMe Support" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Password Reset OTP - JoinMe',
      text: `Hello,

We received a request to reset your password on JoinMe.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for the next 10 minutes. Please do not share it with anyone for your security.

If you didn’t request a password reset, you can safely ignore this email.

Best regards,  
The JoinMe Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4a90e2;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password on <strong>JoinMe</strong>.</p>
          <p>Your OTP is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
          <p>This code is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <br>
          <p>Regards,<br><strong>The JoinMe Team</strong></p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending password reset OTP email:', error.message);
    return false;
  }
};


