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
      text: `Hi there,\n\nWelcome to JoinMe!\n\nYour OTP for verification is: ${otp}\n\nThis code is valid for the next 10 minutes. Please do not share it with anyone.\n\nNeed help or have questions? Just reply to this email.\n\nCheers,\nThe JoinMe Team`,
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
      text: `Hi there,\n\nYour OTP for verification is: ${otp}\n\nThis code is valid for the next 10 minutes. Please do not share it with anyone.\n\nCheers,\nThe JoinMe Team`,
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
      text: `Hello,\n\nWe received a request to reset your password on JoinMe.\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis OTP is valid for the next 10 minutes. Please do not share it with anyone for your security.\n\nIf you didn’t request a password reset, you can safely ignore this email.\n\nBest regards,  \nThe JoinMe Team`,
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

// 🟢 NEW: Automated Event Ticket Email!
export const sendEventTicketEmail = async (to, userName, eventDetails) => {
  const { title, date, time, venue, city, hostName } = eventDetails;
  
  // Format the date nicely
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  try {
    const mailOptions = {
      from: `"JoinMe Tickets" <${process.env.SMTP_USER}>`,
      to,
      subject: `🎫 Request Approved: You're in for ${title}!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Request Approved! 🎉</h1>
              <p style="color: #e0e7ff; margin-top: 10px; font-size: 16px;">You're officially on the guest list.</p>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Great news! <strong>${hostName}</strong> has accepted your request to join <strong>${title}</strong>. Here are your event details:</p>

              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">${title}</h3>
                
                <table style="width: 100%; margin-top: 15px;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 30%;"><strong>📅 Date:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>⏰ Time:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>📍 Venue:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${venue}, ${city}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;"><strong>👤 Host:</strong></td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">${hostName}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 14px; color: #64748b; text-align: center;">Make sure to arrive a little early and have fun!</p>
            </div>

            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">This is an automated ticket from JoinMe.</p>
              <p style="margin: 5px 0 0 0;">Please do not reply directly to this email.</p>
            </div>

          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event ticket email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending event ticket email:', error.message);
    return false;
  }
};

export const sendEventCompletedEmail = async (to, userName, eventDetails) => {
  const { title, hostName } = eventDetails;
  
  try {
    const mailOptions = {
      from: `"JoinMe Updates" <${process.env.SMTP_USER}>`,
      to,
      subject: `How was ${title}? Rate your experience!`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Event Completed! 🎉</h1>
              <p style="color: #d1fae5; margin-top: 10px; font-size: 16px;">We hope you had a great time.</p>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">The match for <strong>${title}</strong> has officially ended! To keep our community safe and reliable, please take a quick moment to rate <strong>${hostName}</strong>.</p>

              <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                <a href="https://joinme-theta.vercel.app/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Rate Host on Dashboard</a>
              </div>
            </div>

            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">This is an automated message from JoinMe.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event completed email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending completed email:', error.message);
    return false;
  }
};

export const sendEventCancelledEmail = async (to, userName, eventDetails, cancelReason) => {
  const { title } = eventDetails;
  
  try {
    const mailOptions = {
      from: `"JoinMe Updates" <${process.env.SMTP_USER}>`,
      to,
      subject: `Update: ${title} has been Cancelled`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Event Cancelled 🚫</h1>
              <p style="color: #fee2e2; margin-top: 10px; font-size: 16px;">There has been a change of plans.</p>
            </div>

            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">Unfortunately, the host had to cancel <strong>${title}</strong>.</p>

              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 15px 20px; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Reason provided by host:</p>
                <p style="margin: 0; font-style: italic; color: #7f1d1d; font-size: 15px;">"${cancelReason || 'No reason provided.'}"</p>
              </div>

              <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
                <a href="https://joinme-theta.vercel.app/dashboard" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Find New Events</a>
              </div>
            </div>

            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">This is an automated message from JoinMe.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event cancelled email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending cancelled email:', error.message);
    return false;
  }
};