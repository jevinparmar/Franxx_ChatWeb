import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp, type = 'login') => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // If credentials are not configured, print to console as fallback and succeed.
  if (!emailUser || !emailPass) {
    console.log(`\n=================================================`);
    console.log(`[FRANXX EMAIL SERVICE FALLBACK] (No SMTP credentials in .env)`);
    console.log(`To: ${email}`);
    console.log(`Type: ${type === 'login' ? 'MFA Authentication' : 'Password Reset'}`);
    console.log(`Code: ${otp}`);
    console.log(`=================================================\n`);
    return true;
  }

  // Create transporter using standard SMTP configurations
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const subject = type === 'login' 
    ? 'FRANXX - MFA Login Verification Code' 
    : 'FRANXX - Password Reset Code';

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #1a1c2e; background-color: #0b0e1a; color: #ffffff; border-radius: 8px;">
      <h2 style="color: #6c5ce7; text-align: center; margin-bottom: 24px;">FRANXX Synchronization</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #a0aec0;">
        Hello Pilot,
      </p>
      <p style="font-size: 15px; line-height: 1.5; color: #a0aec0;">
        Use the verification code below to authorize your session:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6c5ce7; background-color: #1a1c2e; padding: 12px 24px; border-radius: 6px; border: 1px dashed #6c5ce7;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #718096; margin-top: 30px;">
        This code is valid for 5 minutes. If you did not request this login attempt, please secure your credentials immediately.
      </p>
      <hr style="border-color: #1a1c2e; margin: 20px 0;">
      <p style="font-size: 11px; text-align: center; color: #4a5568;">
        &copy; 2026 FRANXX. Automated security dispatch.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"FRANXX Security" <${emailUser}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[FRANXX EMAIL SERVICE] Verification email successfully sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`[FRANXX EMAIL SERVICE ERROR] Failed to send email:`, error);
    throw new Error('Verification email delivery failed. Please check backend SMTP configurations.');
  }
};
