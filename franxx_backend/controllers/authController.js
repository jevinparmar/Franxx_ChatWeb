import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/emailService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, username, email, password } = req.body;

  try {
    if (!name || !username || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    // Standardize username to always start with @
    let formattedUsername = username.trim();
    if (!formattedUsername.startsWith('@')) {
      formattedUsername = `@${formattedUsername}`;
    }

    const usernameExists = await User.findOne({ username: formattedUsername });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username is already taken');
    }

    const user = await User.create({
      name,
      username: formattedUsername,
      email: normalizedEmail,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        role: user.role,
        followers: user.followers,
        following: user.following,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  try {
    if (!emailOrUsername || !password) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    // Try finding by email or username
    let query = {};
    if (emailOrUsername.includes('@') && !emailOrUsername.startsWith('@')) {
      query.email = emailOrUsername.toLowerCase();
    } else {
      let formattedUsername = emailOrUsername.trim();
      if (!formattedUsername.startsWith('@')) {
        formattedUsername = `@${formattedUsername}`;
      }
      query.username = formattedUsername;
    }

    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      user.status = 'Online';
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        role: user.role,
        followers: user.followers,
        following: user.following,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email/username or password');
    }
  } catch (error) {
    next(error);
  }
};
// @desc    Get user profile session
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'name username avatar status')
      .populate('following', 'name username avatar status');
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and return token
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      res.status(400);
      throw new Error('Please enter email and verification code');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.loginOTP || user.loginOTP !== otp || Date.now() > user.loginOTPExpires) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // OTP correct, clear it and log user in
    user.loginOTP = null;
    user.loginOTPExpires = null;
    user.status = 'Online';
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      followers: user.followers,
      following: user.following,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend login OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please enter your email');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // Send OTP via email (or logs to console if SMTP is not configured)
    await sendOTPEmail(user.email, otp, 'login');

    res.json({ message: 'Verification code resent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please enter your email');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User with this email does not exist');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send reset OTP via email (or logs to console if SMTP is not configured)
    await sendOTPEmail(user.email, otp, 'reset');

    res.json({ message: 'Reset code sent to your registered email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset OTP and change password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please enter email, code, and new password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp || Date.now() > user.resetPasswordOTPExpires) {
      res.status(400);
      throw new Error('Invalid or expired reset code');
    }

    // Set new password (will trigger pre-save hashing)
    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth Google login verification
// @route   POST /api/auth/google-login
// @access  Public
export const googleLogin = async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token) {
      res.status(400);
      throw new Error('Google credential token is missing');
    }

    let payload;
    if (token === 'mock_google_token' && process.env.NODE_ENV !== 'production') {
      payload = {
        sub: 'google_sandbox_pilot_123',
        email: 'google_pilot@franxx.io',
        name: 'Google Sandbox Pilot',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
    } else {
      // Call Google tokeninfo API to verify the credential ID token
      const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
      const response = await fetch(tokenInfoUrl);

      if (!response.ok) {
        res.status(400);
        throw new Error('Failed to verify Google token');
      }

      payload = await response.json();
    }

    // Check payload values
    const { sub, email, name, picture } = payload;
    if (!email) {
      res.status(400);
      throw new Error('Google token does not contain a valid email address');
    }

    // Look for user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: sub }, { email: email.toLowerCase() }]
    });

    if (user) {
      // Update googleId if not present (case where email user signs in with Google first time)
      if (!user.googleId) {
        user.googleId = sub;
      }
      user.status = 'Online';
      await user.save();
    } else {
      // Create new user (automatically generate a safe random username)
      let baseUsername = `@${name.replace(/\s+/g, '').toLowerCase()}`;
      let uniqueUsername = baseUsername;
      let counter = 1;

      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate random secure password for database schema compliance
      const randomPassword = Math.random().toString(36).slice(-10);

      user = await User.create({
        name,
        username: uniqueUsername,
        email: email.toLowerCase(),
        password: randomPassword,
        avatar: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        googleId: sub,
        status: 'Online'
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      followers: user.followers,
      following: user.following,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};
