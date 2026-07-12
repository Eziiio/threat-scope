import jwt from 'jsonwebtoken';

// Generate JWT Token and save in HTTP-only Cookie
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Sign JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  // Set Cookie Options
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' // lax is better to allow requests from cross-origin in development dev-server configurations
  };

  // Send Response
  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    }
  });
};
