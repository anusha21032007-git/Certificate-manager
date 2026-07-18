const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST /api/auth/register
// @desc    Register a new user
exports.register = async (req, res) => {
  const { username, full_name, email, password } = req.body;

  // Basic validation
  if (!username || !full_name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Check if user already exists (by email or username)
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, full_name, email, password, bio) VALUES (?, ?, ?, ?, ?)',
      [username, full_name, email, hashedPassword, '']
    );

    const userId = result.insertId;

    // Generate JWT
    const payload = {
      user: {
        id: userId
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, message: 'User registered successfully' });
      }
    );
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [emailOrUsername, emailOrUsername]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: 'Logged in successfully' });
      }
    );
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, email, bio, profile_image, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @route   PUT /api/auth/profile
// @desc    Update user profile & password
// @access  Private
exports.updateProfile = async (req, res) => {
  const { username, full_name, email, bio, currentPassword, newPassword } = req.body;

  try {
    // Fetch user to verify password changes if requested
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];

    // Build update parameters
    let updatedUsername = username !== undefined ? username : user.username;
    let updatedFullName = full_name !== undefined ? full_name : user.full_name;
    let updatedEmail = email !== undefined ? email : user.email;
    let updatedBio = bio !== undefined ? bio : user.bio;
    let updatedPassword = user.password;
    let updatedProfileImage = user.profile_image;

    // Check if new avatar file uploaded
    if (req.file) {
      updatedProfileImage = req.file.filename;
    }

    // Check username/email conflicts
    if (username && username !== user.username) {
      const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }
    if (email && email !== user.email) {
      const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }

    // Password change verification
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(newPassword, salt);
    }

    // Execute update query
    await db.query(
      'UPDATE users SET username = ?, full_name = ?, email = ?, password = ?, bio = ?, profile_image = ? WHERE id = ?',
      [updatedUsername, updatedFullName, updatedEmail, updatedPassword, updatedBio, updatedProfileImage, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        username: updatedUsername,
        full_name: updatedFullName,
        email: updatedEmail,
        bio: updatedBio,
        profile_image: updatedProfileImage
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
