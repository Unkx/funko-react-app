import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import morgan from 'morgan';
import fetch from 'node-fetch';

// ======================
// INITIALIZATION
// ======================
const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// CONFIGURATION
// ======================
// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Web-AppDB',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ======================
// UTILITY FUNCTIONS
// ======================

// Add this function to generate consistent IDs
const generateFunkoId = (title, number) => {
  return `${title}-${number}`
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .toLowerCase()             // Convert to lowercase
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      login: user.login,
      email: user.email,
      role: user.role
    },
    JWT_SECRET, // ← MUST be same as in authenticateToken
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ error: 'Forbidden: User data missing' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// AUTHENTICATION & AUTHORIZATION
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

// ======================
// CONTROLLER FUNCTIONS (DEFINED FIRST)
// ======================

// ======================
// AUTH CONTROLLERS
// ======================
const registerUser = async (req, res) => {
  const { email, login, name, surname, password, gender, date_of_birth } = req.body;

  if (!email || !login || !name || !surname || !password || !gender || !date_of_birth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, login, name, surname, gender, date_of_birth, role`,
      [email, login, name, surname, hashedPassword, gender, date_of_birth, 'user']
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.detail && err.detail.includes('email')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (err.detail && err.detail.includes('login')) {
        return res.status(409).json({ error: 'Login name already taken' });
      }
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add this controller
const createUserAsAdmin = async (req, res) => {
  const { email, login, name, surname, password, gender, date_of_birth, role = 'user' } = req.body;
  
  // Only allow 'user' or 'admin' roles
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (!email || !login || !name || !surname || !password || !gender || !date_of_birth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, login, name, surname, gender, date_of_birth, role`,
      [email, login, name, surname, hashedPassword, gender, date_of_birth, role]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.detail?.includes('email')) return res.status(409).json({ error: 'Email already registered' });
      if (err.detail?.includes('login')) return res.status(409).json({ error: 'Login already taken' });
    }
    console.error('Admin user creation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, login, password_hash, name, surname, gender, date_of_birth, role
       FROM users WHERE login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await comparePasswords(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      token: token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ======================
// USER CONTROLLERS
// ======================
const getUserProfile = async (req, res) => {
  const userId = req.params.id;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only access your own profile' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, login, name, surname, gender, date_of_birth, role, created_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { name, surname, gender, date_of_birth } = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
  }

  try {
    const query = `
      UPDATE users
      SET
        name = COALESCE($1, name),
        surname = COALESCE($2, surname),
        gender = COALESCE($3, gender),
        date_of_birth = COALESCE($4, date_of_birth),
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, surname, email, login, gender, date_of_birth, role, created_at, last_login
    `;
    const values = [name, surname, gender, date_of_birth, userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserSettings = async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only update your own settings' });
  }

  const userId = req.params.id;
  const { preferred_language, preferred_theme } = req.body;

  if (!preferred_language && !preferred_theme) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  try {
    const query = `
      UPDATE users
      SET
        preferred_language = COALESCE($1, preferred_language),
        preferred_theme = COALESCE($2, preferred_theme)
      WHERE id = $3
      RETURNING id, preferred_language, preferred_theme
    `;
    const values = [preferred_language, preferred_theme, userId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ======================
// WISHLIST CONTROLLERS
// ======================
const addToWishlist = async (req, res) => {
  const { funkoId, title, number, imageName } = req.body;
  const userId = req.user.id;

  if (!funkoId) {
    return res.status(400).json({ error: "Funko ID is required" });
  }

  try {
    await pool.query(
      `INSERT INTO funko_items (id, title, number, image_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         image_name = EXCLUDED.image_name`,
      [funkoId, title, number, imageName]
    );

    const result = await pool.query(
      `INSERT INTO wishlist (user_id, funko_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, funko_id) DO NOTHING
       RETURNING *`,
      [userId, funkoId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already in wishlist" });
    }

    res.status(201).json({
      message: "Added to wishlist",
      item: { id: funkoId, title, number, imageName }
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const removeFromWishlist = async (req, res) => {
  const { funkoId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM wishlist
       WHERE user_id = $1 AND funko_id = $2
       RETURNING *`,
      [userId, funkoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    res.json({ message: "Removed from wishlist", itemId: funkoId });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT fi.*, w.added_at FROM wishlist w
      JOIN funko_items fi ON w.funko_id = fi.id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ error: "Failed to load wishlist" });
  }
};

const checkWishlistItem = async (req, res) => {
  const { funkoId } = req.params;
  const userId = req.user.id;

  try {
    let result = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND funko_id = $2)`,
      [userId, funkoId]
    );

    if (!result.rows[0].exists && !funkoId.endsWith('-')) {
      result = await pool.query(
        `SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND funko_id = $2)`,
        [userId, `${funkoId}-`]
      );
    }

    res.json({ exists: result.rows[0].exists });
  } catch (err) {
    console.error("Error checking wishlist:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ======================
// COLLECTION CONTROLLERS
// ======================
const addToCollection = async (req, res) => {
  const { funkoId, title, number, imageName, condition = "Mint" } = req.body;
  const userId = req.user.id;

  if (!funkoId) {
    return res.status(400).json({ error: "Funko ID is required" });
  }

  try {
    await pool.query(
      `INSERT INTO funko_items (id, title, number, image_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         image_name = EXCLUDED.image_name`,
      [funkoId, title, number, imageName]
    );

    const result = await pool.query(
      `INSERT INTO collection (user_id, funko_id, condition)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, funko_id) DO NOTHING
       RETURNING *`,
      [userId, funkoId, condition]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already in collection" });
    }

    res.status(201).json({
      message: "Added to collection",
      item: { id: funkoId, title, number, imageName, condition }
    });
  } catch (err) {
    console.error("Error adding to collection:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const removeFromCollection = async (req, res) => {
  const { funkoId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `DELETE FROM collection
       WHERE user_id = $1 AND funko_id = $2
       RETURNING *`,
      [userId, funkoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found in collection" });
    }

    res.json({ message: "Removed from collection", itemId: funkoId });
  } catch (err) {
    console.error("Error removing from collection:", err);
    res.status(500).json({ error: "Database error" });
  }
};

const getCollection = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT fi.*, c.condition, c.purchase_date FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       WHERE c.user_id = $1
       ORDER BY c.purchase_date DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching collection:", err);
    res.status(500).json({ error: "Failed to load collection" });
  }
};


// Get or create conversation between two users
const getOrCreateConversation = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  if (userId == friendId) {
    return res.status(400).json({ error: "Cannot chat with yourself" });
  }

  try {
    // Ensure both users exist
    const users = await pool.query(
      'SELECT id FROM users WHERE id = $1 OR id = $2',
      [userId, friendId]
    );
    if (users.rows.length < 2) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if they are friends
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [userId, friendId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: "You must be friends to chat" });
    }

    // Get or create conversation
    let conv = await pool.query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [userId, friendId]
    );

    if (conv.rows.length === 0) {
      // Create new conversation
      const result = await pool.query(
        `INSERT INTO conversations (user1_id, user2_id) 
         VALUES ($1, $2) RETURNING id`,
        [Math.min(userId, friendId), Math.max(userId, friendId)]
      );
      conv = result;
    }

    res.json({ conversation_id: conv.rows[0].id });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

// Send message
const sendMessage = async (req, res) => {
  const { conversation_id } = req.params;
  const { content } = req.body;
  const sender_id = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
    // Verify user is part of this conversation
    const conv = await pool.query(
      `SELECT user1_id, user2_id FROM conversations WHERE id = $1`,
      [conversation_id]
    );
    if (conv.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const { user1_id, user2_id } = conv.rows[0];
    if (sender_id !== user1_id && sender_id !== user2_id) {
      return res.status(403).json({ error: "Not authorized to send message" });
    }

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [conversation_id, sender_id, content.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get messages in conversation
const getMessages = async (req, res) => {
  const { conversation_id } = req.params;
  const userId = req.user.id;

  try {
    // Verify user is in conversation
    const conv = await pool.query(
      `SELECT user1_id, user2_id FROM conversations WHERE id = $1`,
      [conversation_id]
    );
    if (conv.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const { user1_id, user2_id } = conv.rows[0];
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await pool.query(
      `SELECT m.*, u.login as sender_login
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversation_id]
    );

    res.json(messages.rows);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
};


const checkCollectionItem = async (req, res) => {
  const { funkoId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT EXISTS(
          SELECT 1 FROM collection 
          WHERE user_id = $1 AND funko_id = $2
      )`,
      [userId, funkoId]
    );
    res.json({ exists: result.rows[0].exists });
  } catch (err) {
    console.error("Error checking collection status:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ======================
// ADMIN ITEMS CONTROLLERS
// ======================
const addItem = async (req, res) => {
  const { title, number, category, series, exclusive, imageName } = req.body;

  // Validate required fields
  if (!title || !number || !category) {
    return res.status(400).json({ error: 'Title, number, and category are required.' });
  }

  try {
    // Generate consistent ID format
    const id = `${title}-${number}`.replace(/\s+/g, '-').toLowerCase();

    // Insert or update funko_items table
    const result = await pool.query(
      `
      INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        number = EXCLUDED.number,
        category = EXCLUDED.category,
        series = EXCLUDED.series,
        exclusive = EXCLUDED.exclusive,
        image_name = EXCLUDED.image_name
      RETURNING *
      `,
      [
        id,
        title,
        number,
        category,
        series ? JSON.stringify(series) : null,
        exclusive || false,
        imageName || null
      ]
    );

    console.log("✅ Item added:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding item:', err);
    res.status(500).json({ error: 'Failed to add item.' });
  }
};

// Submit item request
const submitItemRequest = async (req, res) => {
  const { title, number, reason } = req.body;
  const userId = req.user.id;

  if (!title?.trim() || !reason?.trim()) {
    return res.status(400).json({ error: 'Title and reason are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO item_requests (user_id, title, number, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, number, reason, status, created_at`,
      [userId, title.trim(), number?.trim() || null, reason.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting request:', err);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ir.id, ir.title, ir.number, ir.reason, ir.created_at,
              u.login as user_login, u.email as user_email
       FROM item_requests ir
       JOIN users u ON ir.user_id = u.id
       WHERE ir.status = 'pending'
       ORDER BY ir.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to load requests.' });
  }
};

const getPendingRequestsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM item_requests WHERE status = 'pending'`
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error fetching requests count:', err);
    res.status(500).json({ error: 'Failed to load requests count.' });
  }
};

const resolveRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE item_requests
       SET status = 'resolved', resolved_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or already resolved.' });
    }

    res.json({ message: 'Request marked as resolved.' });
  } catch (err) {
    console.error('Error resolving request:', err);
    res.status(500).json({ error: 'Failed to resolve request.' });
  }
};

const getAdminItems = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, number, category, 
              CASE 
                WHEN series IS NOT NULL THEN series::text
                ELSE '[]'
              END as series,
              exclusive, image_name as imageName 
       FROM funko_items 
       ORDER BY category, title, number`
    );
    
    // Parse the series JSON for each item
    const items = result.rows.map(item => ({
      ...item,
      // Corrected line: parse the series as JSON and return it as an array
      series: item.series ? JSON.parse(item.series) : []
    }));
    
    res.json(items);
  } catch (err) {
    console.error('Error fetching admin items:', err);
    res.status(500).json({ error: 'Failed to load items' });
  }
};

// ======================
// ADMIN CONTROLLERS
// ======================
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, login, name, surname, gender, date_of_birth, role, created_at, last_login,
              NOW() - last_login < INTERVAL '15 minutes' AS is_active
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users for admin:", err);
    res.status(500).json({ error: "Server error fetching user data" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', deletedUser: result.rows[0] });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Add this search controller function
const searchItems = async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    console.log('🔍 Searching for:', q);
    
    // Modified query that works with JSONB
    const result = await pool.query(
      `SELECT id, title, number, category, 
              CASE 
                WHEN series IS NOT NULL THEN series::text
                ELSE '[]'
              END as series,
              exclusive, image_name as imageName 
       FROM funko_items 
       WHERE LOWER(title) LIKE LOWER($1) 
          OR LOWER(number) LIKE LOWER($1)
          OR LOWER(category) LIKE LOWER($1)
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(series) elem 
            WHERE LOWER(elem) LIKE LOWER($1)
          )
       ORDER BY category, title, number`,
      [`%${q}%`]
    );
    
    console.log('✅ Found', result.rows.length, 'items');
    
    // Parse the series JSON for each item
    const items = result.rows.map(item => ({
      ...item,
      series: item.series ? JSON.parse(item.series) : []
    }));
    
    res.json(items);
  } catch (err) {
    console.error('❌ Error searching items:', err);
    res.status(500).json({ error: 'Failed to search items' });
  }
};

// ======================
// DATABASE SEEDING
// ======================
// ======================
// DATABASE SEEDING
// ======================
// Add this updated seedDatabase function to your backend
// Replace the existing seedDatabase function starting around line 600

const seedDatabase = async () => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM funko_items");
    if (parseInt(countRes.rows[0].count) > 0) {
      console.log("✅ Database already seeded");
      return;
    }

    console.log("🌱 Seeding database with Funko items...");

    // Sample Funko items data - now with consistent category naming
    
    // Insert all items
    for (const item of funkoItems) {
      await pool.query(
        `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.title,
          item.number,
          item.category,
          JSON.stringify(item.series),
          item.exclusive,
          item.imageName
        ]
      );
    }

    console.log(`✅ Database seeded successfully with ${funkoItems.length} Funko items`);
    
    // Log category counts
    const categoryCounts = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM funko_items 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log("📊 Category breakdown:");
    categoryCounts.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count} items`);
    });

  } catch (err) {
    console.error("❌ Database seeding error:", err);
  }
};

// ======================
// MIDDLEWARE
// ======================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// ✅ CORRECT: cors() must come BEFORE any routes
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit OPTIONS handler for PATCH
app.options('/api/admin/users/:id/role', cors());

// ======================
// ROUTES (DEFINED AFTER ALL CONTROLLER FUNCTIONS)
// ======================

// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the Funko React App Backend API!');
});

// ---------- PUBLIC item routes ----------

// Get all items with proper series parsing
// Add this route for /api/items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, number, category, 
              series,
              exclusive, image_name as "imageName"
       FROM funko_items
       ORDER BY category, title, number`
    );

    const items = result.rows.map(item => ({
      ...item,
      series: item.series || []
    }));

    console.log(`✅ Fetched ${items.length} items from database`);
    res.json(items);
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ error: "Failed to load items" });
  }
});

// Get single item with improved ID matching
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 Looking for item with ID:', id);
  
  try {
    // First try exact match
    let result = await pool.query(
      `SELECT id, title, number, category, 
              series,  -- Directly use the JSONB field
              exclusive, image_name as "imageName"
       FROM funko_items 
       WHERE id = $1`,
      [id]
    );
    
    // If not found, try case-insensitive search
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, title, number, category, 
                series,
                exclusive, image_name as "imageName"
         FROM funko_items 
         WHERE LOWER(id) = LOWER($1)`,
        [id]
      );
    }
    
    // If still not found, try searching by title and number separately
    if (result.rows.length === 0) {
      // Parse the ID to extract title and number
      const idParts = id.split('-');
      const numberPart = idParts.pop(); // Last part is usually the number
      const titlePart = idParts.join(' '); // Rest is the title
      
      if (numberPart && titlePart) {
        result = await pool.query(
          `SELECT id, title, number, category, 
                  series,
                  exclusive, image_name as "imageName"
           FROM funko_items 
           WHERE LOWER(title) = LOWER($1) AND number = $2`,
          [titlePart, numberPart]
        );
      }
    }

    if (result.rows.length === 0) {
      console.log('❌ Item not found with ID:', id);
      return res.status(404).json({ error: 'Funko Pop not found' });
    }

    const item = {
      ...result.rows[0],
      series: result.rows[0].series || []  // Ensure series is always an array
    };

    console.log('✅ Found item:', item.id);
    res.json(item);
  } catch (err) {
    console.error('❌ Error fetching item:', err);
    res.status(500).json({ error: 'Failed to load item' });
  }
});

// Improved search endpoint
app.get('/api/items/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, title, number, category, 
              series,
              exclusive, image_name as "imageName"
       FROM funko_items
       WHERE LOWER(title) LIKE LOWER($1) 
          OR LOWER(number) LIKE LOWER($1)
          OR LOWER(category) LIKE LOWER($1)
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(series) elem 
            WHERE LOWER(elem) LIKE LOWER($1)
          )
       ORDER BY 
         CASE 
           WHEN LOWER(title) LIKE LOWER($1) THEN 1
           WHEN LOWER(number) LIKE LOWER($1) THEN 2
           WHEN LOWER(category) LIKE LOWER($1) THEN 3
           ELSE 4
         END,
         category, title, number`,
      [`%${q}%`]
    );

    const items = result.rows.map(item => ({
      ...item,
      series: item.series || []
    }));

    res.json(items);
  } catch (err) {
    console.error("❌ Error searching items:", err);
    res.status(500).json({ error: "Failed to search items" });
  }
});

// Debug endpoint to check database contents
app.get('/api/debug/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, number, category FROM funko_items LIMIT 10'
    );
    res.json({
      count: result.rows.length,
      items: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint to check a specific ID pattern
app.get('/api/debug/id-check', async (req, res) => {
  const { title, number } = req.query;

  if (!title || !number) {
    return res.status(400).json({ error: 'Title and number required' });
  }

  const generatedId = generateFunkoId(String(title), String(number));

  try {
    const result = await pool.query(
      'SELECT id, title, number FROM funko_items WHERE id = $1',
      [generatedId]
    );

    res.json({
      input: { title, number },
      generatedId,
      found: result.rows.length > 0,
      match: result.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);

// User routes
app.get('/api/users/:id', authenticateToken, getUserProfile);
app.put('/api/users/:id', authenticateToken, updateUserProfile);
app.put('/api/users/:id/settings', authenticateToken, updateUserSettings);

// Wishlist routes
app.post('/api/wishlist', authenticateToken, addToWishlist);
app.delete('/api/wishlist/:funkoId', authenticateToken, removeFromWishlist);
app.get('/api/wishlist', authenticateToken, getWishlist);
app.get('/api/wishlist/check/:funkoId', authenticateToken, checkWishlistItem);

// Collection routes
app.post('/api/collection', authenticateToken, addToCollection);
app.delete('/api/collection/:funkoId', authenticateToken, removeFromCollection);
app.get('/api/collection', authenticateToken, getCollection);
app.get('/api/collection/check/:funkoId', authenticateToken, checkCollectionItem);

// Request routes
app.post('/api/requests', authenticateToken, submitItemRequest);
app.get('/api/admin/requests', authenticateToken, isAdmin, getPendingRequests);
app.get('/api/admin/requests/count', authenticateToken, isAdmin, getPendingRequestsCount);
app.patch('/api/admin/requests/:id/status', authenticateToken, isAdmin, resolveRequest);

// Admin routes
app.get('/api/admin/users', authenticateToken, isAdmin, getAllUsers);
app.get('/api/admin/items/search', authenticateToken, isAdmin, searchItems);
app.post('/api/admin/items', authenticateToken, isAdmin, addItem);
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, deleteUser);

// Add this route
app.post('/api/admin/users', authenticateToken, isAdmin, createUserAsAdmin);

// Chat routes
app.get('/api/chat/conversation/:friendId', authenticateToken, getOrCreateConversation);
app.post('/api/chat/conversation/:conversation_id/messages', authenticateToken, sendMessage);
app.get('/api/chat/conversation/:conversation_id/messages', authenticateToken, getMessages);

// PATCH: Change user role (admin only)
app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  console.log('Role change request received:', {
    params: req.params,
    body: req.body,
    user: req.user
  });

  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    console.log('Invalid role received:', role);
    return res.status(400).json({ 
      error: 'Invalid role. Only "user" or "admin" allowed.' 
    });
  }

  try {
    console.log('Attempting to update user role...');
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      console.log('User not found with ID:', id);
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log('Role updated successfully:', result.rows[0]);
    res.json({
      message: `User role updated to ${role}.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Detailed error updating user role:', {
      message: err.message,
      stack: err.stack,
      query: err.query,
      parameters: err.parameters
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin stats route
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [
      totalUsersRes,
      totalItemsRes,
      newUsers7DaysRes,
      newUsers30DaysRes,
      activeUsers24hRes,
      totalItemsAdded7DaysRes,
      totalItemsAdded30DaysRes,
    ] = await Promise.all([
      // Total Users
      pool.query('SELECT COUNT(*) AS count FROM users'),

      // Total Items
      pool.query('SELECT COUNT(*) AS count FROM funko_items'),

      // New Users (Last 7 Days)
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\''),

      // New Users (Last 30 Days)
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''),

      // Active Users (Last 24 Hours)
      pool.query('SELECT COUNT(*) AS count FROM users WHERE last_login >= NOW() - INTERVAL \'24 hours\''),

      // Items Added (Last 7 Days)
      pool.query('SELECT COUNT(*) AS count FROM funko_items WHERE created_at >= NOW() - INTERVAL \'7 days\''),

      // Items Added (Last 30 Days)
      pool.query('SELECT COUNT(*) AS count FROM funko_items WHERE created_at >= NOW() - INTERVAL \'30 days\''),
    ]);

    // Average users per day: total users / days since first registration
    let avgUsersPerDay = 0;
    const firstUser = await pool.query('SELECT MIN(created_at) AS first_date FROM users');
    const firstDate = firstUser.rows[0]?.first_date;
    if (firstDate) {
      const daysSinceStart = Math.max(1, Math.floor((new Date() - new Date(firstDate)) / (1000 * 60 * 60 * 24)));
      avgUsersPerDay = Math.round(parseInt(totalUsersRes.rows[0].count) / daysSinceStart);
    }

    // Most Active User (based on how many wishlist or collection items they have)
    const mostActiveUserRes = await pool.query(`
      SELECT u.login
      FROM users u
      LEFT JOIN wishlist w ON u.id = w.user_id
      LEFT JOIN collection c ON u.id = c.user_id
      GROUP BY u.id, u.login
      ORDER BY (COUNT(w.funko_id) + COUNT(c.funko_id)) DESC
      LIMIT 1
    `);

    const mostActiveUser = mostActiveUserRes.rows[0]?.login || 'N/A';

    // Construct response object matching your frontend's `SiteStats` interface
    const stats = {
      totalUsers: parseInt(totalUsersRes.rows[0].count),
      totalItems: parseInt(totalItemsRes.rows[0].count),
      newUsersLast7Days: parseInt(newUsers7DaysRes.rows[0].count),
      newUsersLast30Days: parseInt(newUsers30DaysRes.rows[0].count),
      activeUsersLast24Hours: parseInt(activeUsers24hRes.rows[0].count),
      totalVisits: 0, // You don't have a visits table yet — placeholder
      averageUsersPerDay: avgUsersPerDay,
      mostActiveUser,
      itemsAddedLast7Days: parseInt(totalItemsAdded7DaysRes.rows[0].count),
      itemsAddedLast30Days: parseInt(totalItemsAdded30DaysRes.rows[0].count),
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to load site statistics.' });
  }
});

// Admin items route with pagination
app.get("/api/admin/items", authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const countResult = await pool.query("SELECT COUNT(*) FROM funko_items");
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const result = await pool.query(
      `SELECT id, title, number, category, 
              CASE WHEN series IS NOT NULL THEN series::text ELSE '[]' END as series,
              exclusive, image_name as "imageName"
       FROM funko_items
       ORDER BY category, title, number
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = result.rows.map(item => ({
      ...item,
      series: item.series ? JSON.parse(item.series) : []
    }));

    // Return the paginated response
    res.json({ items, totalItems, totalPages });
  } catch (err) {
    console.error("❌ Error fetching admin items:", err);
    res.status(500).json({ error: "Failed to load items" });
  }
});

// ======================
// DIAGNOSTIC ROUTES
// ======================
// Add this temporary diagnostic route
app.get('/api/test/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: err.message 
    });
  }
});

// Add this route to check if funko_items table exists
app.get('/api/test/items', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM funko_items');
    const sample = await pool.query('SELECT id, title, number FROM funko_items LIMIT 3');
    
    res.json({
      totalItems: parseInt(result.rows[0].count),
      sampleItems: sample.rows,
      message: 'Database query successful'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to query items',
      details: err.message
    });
  }
});

// ==========================================
// ANALYTICS & ACTIVITY TRACKING
// ==========================================

// Log user activity
app.post('/api/activity/log', authenticateToken, async (req, res) => {
  const { action_type, action_details, session_duration } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      `INSERT INTO user_activity_log (user_id, action_type, action_details, session_duration)
       VALUES ($1, $2, $3, $4)`,
      [userId, action_type, JSON.stringify(action_details || {}), session_duration]
    );

    // Update last_activity_date
    await pool.query(
      `UPDATE users SET last_activity_date = CURRENT_DATE WHERE id = $1`,
      [userId]
    );

    res.json({ message: 'Activity logged' });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get user activity stats
app.get('/api/activity/stats', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(session_duration) as avg_session_duration,
        MAX(created_at) as last_activity
      FROM user_activity_log
      WHERE user_id = $1
    `, [userId]);

    const actionBreakdown = await pool.query(`
      SELECT action_type, COUNT(*) as count
      FROM user_activity_log
      WHERE user_id = $1
      GROUP BY action_type
      ORDER BY count DESC
    `, [userId]);

    res.json({
      overall: stats.rows[0],
      breakdown: actionBreakdown.rows
    });
  } catch (err) {
    console.error('Error fetching activity stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==========================================
// LOYALTY METRICS
// ==========================================

// Calculate and update loyalty score
app.post('/api/loyalty/calculate', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user data
    const userData = await pool.query(`
      SELECT 
        created_at,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = $1) as wishlist_count,
        (SELECT COUNT(*) FROM collection WHERE user_id = $1) as collection_count,
        (SELECT COUNT(DISTINCT DATE(created_at)) FROM user_activity_log WHERE user_id = $1) as active_days,
        (SELECT COUNT(*) FROM user_activity_log WHERE user_id = $1) as total_actions
      FROM users WHERE id = $1
    `, [userId]);

    const data = userData.rows[0];
    
    // Calculate loyalty score (0-100)
    const accountAge = Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24));
    const loyaltyScore = Math.min(100, 
      (data.active_days * 2) + 
      (data.wishlist_count * 0.5) + 
      (data.collection_count * 1) + 
      (Math.min(accountAge, 365) * 0.1) +
      (data.total_actions * 0.1)
    );

    // Update loyalty score
    await pool.query(
      `UPDATE users 
       SET loyalty_score = $1, days_active = $2 
       WHERE id = $3`,
      [Math.round(loyaltyScore), data.active_days, userId]
    );

    res.json({ 
      loyaltyScore: Math.round(loyaltyScore),
      activeDays: data.active_days,
      accountAge
    });
  } catch (err) {
    console.error('Error calculating loyalty:', err);
    res.status(500).json({ error: 'Failed to calculate loyalty' });
  }
});

// Get loyalty leaderboard
app.get('/api/loyalty/leaderboard', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await pool.query(`
      SELECT 
        login,
        loyalty_score,
        days_active,
        (SELECT COUNT(*) FROM collection WHERE user_id = users.id) as collection_size
      FROM users
      WHERE loyalty_score > 0
      ORDER BY loyalty_score DESC
      LIMIT 50
    `);

    res.json(leaderboard.rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==========================================
// SOCIAL FEATURES
// ==========================================

// Send friend request
app.post('/api/friends/request', authenticateToken, async (req, res) => {
  const { friendLogin } = req.body;
  const userId = req.user.id;

  try {
    // Find friend by login
    const friend = await pool.query(
      'SELECT id FROM users WHERE login = $1',
      [friendLogin]
    );

    if (friend.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friendId = friend.rows[0].id;

    if (friendId === userId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }

    // Insert friendship request
    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id, friend_id) DO NOTHING`,
      [userId, friendId]
    );

    res.json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ error: 'Failed to send request' });
  }
});
// Add these new endpoints to your server.js file

// ==========================================
// IMPROVED FRIEND SYSTEM ENDPOINTS
// ==========================================

// Get incoming friend requests (pending requests where user is the recipient)
app.get('/api/friends/requests/incoming', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const requests = await pool.query(`
      SELECT 
        f.id,
        u.id as sender_id,
        u.login,
        u.name,
        u.surname,
        f.created_at,
        (SELECT COUNT(*) FROM collection WHERE user_id = u.id) as collection_size
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(requests.rows);
  } catch (err) {
    console.error('Error fetching incoming requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get outgoing friend requests (pending requests sent by user)
app.get('/api/friends/requests/outgoing', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const requests = await pool.query(`
      SELECT 
        f.id,
        u.id as recipient_id,
        u.login,
        u.name,
        u.surname,
        f.created_at
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(requests.rows);
  } catch (err) {
    console.error('Error fetching outgoing requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Reject/Cancel friend request
app.delete('/api/friends/request/:friendshipId', authenticateToken, async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user is part of this friendship request
    const friendship = await pool.query(
      'SELECT user_id, friend_id FROM friendships WHERE id = $1',
      [friendshipId]
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { user_id, friend_id } = friendship.rows[0];
    
    // User can delete if they are sender or recipient
    if (user_id !== userId && friend_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM friendships WHERE id = $1', [friendshipId]);

    res.json({ message: 'Friend request removed' });
  } catch (err) {
    console.error('Error removing friend request:', err);
    res.status(500).json({ error: 'Failed to remove request' });
  }
});

// Remove friend (delete accepted friendship)
app.delete('/api/friends/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    // Delete both directions of friendship
    await pool.query(
      `DELETE FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) 
          OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// ==========================================
// IMPROVED CHAT ENDPOINTS
// ==========================================

// Get all conversations for user
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await pool.query(`
      SELECT 
        c.id as conversation_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.id
          ELSE u1.id
        END as friend_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.login
          ELSE u1.login
        END as friend_login,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as friend_name,
        (
          SELECT m.content 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.conversation_id = c.id 
            AND m.sender_id != $1 
            AND m.is_read = false
        ) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY last_message_time DESC NULLS LAST
    `, [userId]);

    res.json(conversations.rows);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read
app.patch('/api/chat/conversation/:conversation_id/read', authenticateToken, async (req, res) => {
  const { conversation_id } = req.params;
  const userId = req.user.id;

  try {
    // Verify user is part of conversation
    const conv = await pool.query(
      'SELECT user1_id, user2_id FROM conversations WHERE id = $1',
      [conversation_id]
    );

    if (conv.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { user1_id, user2_id } = conv.rows[0];
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark all messages in conversation as read for this user
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE conversation_id = $1 AND sender_id != $2`,
      [conversation_id, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
app.get('/api/chat/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.user1_id = $1 OR c.user2_id = $1)
        AND m.sender_id != $1
        AND m.is_read = false
    `, [userId]);

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});
// Accept friend request
app.patch('/api/friends/accept/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    await pool.query(
      `UPDATE friendships 
       SET status = 'accepted' 
       WHERE user_id = $1 AND friend_id = $2`,
      [friendId, userId]
    );

    // Create reciprocal friendship
    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [userId, friendId]
    );

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error accepting friend:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Get friends list
app.get('/api/friends', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const friends = await pool.query(`
      SELECT 
        u.id, u.login, u.name, u.surname,
        f.status, f.created_at,
        (SELECT COUNT(*) FROM collection WHERE user_id = u.id) as collection_size
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(friends.rows);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Add comment to item
app.post('/api/items/:funkoId/comments', authenticateToken, async (req, res) => {
  const { funkoId } = req.params;
  const { comment_text, rating } = req.body;
  const userId = req.user.id;

  if (!comment_text || !rating) {
    return res.status(400).json({ error: 'Comment and rating required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO item_comments (user_id, funko_id, comment_text, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, funkoId, comment_text, rating]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for item
app.get('/api/items/:funkoId/comments', async (req, res) => {
  const { funkoId } = req.params;

  try {
    const comments = await pool.query(`
      SELECT 
        c.*,
        u.login as user_login,
        u.name as user_name
      FROM item_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.funko_id = $1
      ORDER BY c.created_at DESC
    `, [funkoId]);

    res.json(comments.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Share collection publicly
app.post('/api/collection/share', authenticateToken, async (req, res) => {
  const { is_public } = req.body;
  const userId = req.user.id;

  try {
    // Generate unique share token
    const shareToken = require('crypto').randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO shared_collections (user_id, is_public, share_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE 
       SET is_public = $2, share_token = $3`,
      [userId, is_public, shareToken]
    );

    res.json({ 
      message: 'Collection sharing updated',
      shareToken: is_public ? shareToken : null
    });
  } catch (err) {
    console.error('Error sharing collection:', err);
    res.status(500).json({ error: 'Failed to share collection' });
  }
});

// View public collection by token
app.get('/api/collection/public/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const shared = await pool.query(
      `SELECT user_id, is_public FROM shared_collections 
       WHERE share_token = $1 AND is_public = true`,
      [token]
    );

    if (shared.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found or not public' });
    }

    const userId = shared.rows[0].user_id;

    // Get user info
    const userInfo = await pool.query(
      'SELECT login, name FROM users WHERE id = $1',
      [userId]
    );

    // Get collection
    const collection = await pool.query(`
      SELECT fi.*, c.condition, c.purchase_date 
      FROM collection c
      JOIN funko_items fi ON c.funko_id = fi.id
      WHERE c.user_id = $1
      ORDER BY c.purchase_date DESC
    `, [userId]);

    res.json({
      user: userInfo.rows[0],
      collection: collection.rows
    });
  } catch (err) {
    console.error('Error fetching public collection:', err);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// ==========================================
// ADMIN ANALYTICS DASHBOARD
// ==========================================

// Get comprehensive analytics for admin
app.get('/api/admin/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    // User engagement metrics
    const engagement = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        AVG(session_duration) as avg_session,
        COUNT(*) as total_actions
      FROM user_activity_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Top actions
    const topActions = await pool.query(`
      SELECT action_type, COUNT(*) as count
      FROM user_activity_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `);

    // Retention rate (users who came back after 7 days)
    const retention = await pool.query(`
      WITH first_login AS (
        SELECT user_id, MIN(created_at) as first_date
        FROM user_activity_log
        GROUP BY user_id
      ),
      returned_users AS (
        SELECT DISTINCT al.user_id
        FROM user_activity_log al
        JOIN first_login fl ON al.user_id = fl.user_id
        WHERE al.created_at > fl.first_date + INTERVAL '7 days'
      )
      SELECT 
        COUNT(DISTINCT fl.user_id) as total_users,
        COUNT(DISTINCT ru.user_id) as returned_users,
        ROUND(COUNT(DISTINCT ru.user_id)::numeric / NULLIF(COUNT(DISTINCT fl.user_id), 0) * 100, 2) as retention_rate
      FROM first_login fl
      LEFT JOIN returned_users ru ON fl.user_id = ru.user_id
    `);

    // Social engagement
    const social = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM friendships WHERE status = 'accepted') as total_friendships,
        (SELECT COUNT(*) FROM item_comments) as total_comments,
        (SELECT COUNT(*) FROM shared_collections WHERE is_public = true) as public_collections
    `);

    res.json({
      engagement: engagement.rows[0],
      topActions: topActions.rows,
      retention: retention.rows[0],
      social: social.rows[0]
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ======================
// SERVER STARTUP
// ======================
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // Seed database if needed
    await seedDatabase();
    
    // Start server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};
// ==========================================
// FRIEND PROFILE ENDPOINTS
// Add these to your server.js file
// ==========================================

// Get public user profile (only for friends)
app.get('/api/users/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Check if they are friends
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: 'You can only view profiles of your friends' });
    }

    // Get user data
    const user = await pool.query(
      `SELECT id, login, name, surname, created_at, loyalty_score
       FROM users WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error('Error fetching public profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get public collection of a user (only for friends)
app.get('/api/collection/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Check if they are friends
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: 'You can only view collections of your friends' });
    }

    // Get collection items
    const collection = await pool.query(
      `SELECT 
        fi.id,
        fi.title,
        fi.number,
        fi.image_name,
        fi.series,
        c.condition,
        c.purchase_date as added_date
       FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       WHERE c.user_id = $1
       ORDER BY c.purchase_date DESC`,
      [userId]
    );

    // Parse series from JSONB to array
    const items = collection.rows.map(item => ({
      ...item,
      series: item.series ? (typeof item.series === 'string' ? JSON.parse(item.series) : item.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching public collection:', err);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// GET /api/collection/user/:userId
app.get('/api/collection/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  // Optional: check if user allows public collection, or if requester is a friend
  try {
    const items = await db.query(
      'SELECT * FROM collection WHERE user_id = $1 AND is_public = true',
      [userId]
    );
    res.json(items.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/wishlist/user/:userId
app.get('/api/wishlist/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const items = await db.query(
      'SELECT * FROM wishlist WHERE user_id = $1 AND is_public = true',
      [userId]
    );
    res.json(items.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public wishlist of a user (only for friends)
app.get('/api/wishlist/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Check if they are friends
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: 'You can only view wishlists of your friends' });
    }

    // Get wishlist items
    const wishlist = await pool.query(
      `SELECT 
        fi.id,
        fi.title,
        fi.number,
        fi.image_name,
        fi.series,
        w.added_at as added_date,
        w.priority,
        w.max_price,
        w.target_condition
       FROM wishlist w
       JOIN funko_items fi ON w.funko_id = fi.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    // Parse series from JSONB to array
    const items = wishlist.rows.map(item => ({
      ...item,
      series: item.series ? (typeof item.series === 'string' ? JSON.parse(item.series) : item.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching public wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Optional: Get detailed friend statistics
app.get('/api/friends/:friendId/stats', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Check if they are friends
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, friendId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: 'You can only view stats of your friends' });
    }

    // Get collection stats
    const collectionCount = await pool.query(
      'SELECT COUNT(*) as count FROM collection WHERE user_id = $1',
      [friendId]
    );

    const wishlistCount = await pool.query(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = $1',
      [friendId]
    );

    // Get unique series
    const uniqueSeries = await pool.query(
      `SELECT COUNT(DISTINCT series) as count 
       FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       WHERE c.user_id = $1`,
      [friendId]
    );

    // Get most recent additions
    const recentItems = await pool.query(
      `SELECT fi.title, fi.number, c.purchase_date as added_date
       FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       WHERE c.user_id = $1
       ORDER BY c.purchase_date DESC
       LIMIT 5`,
      [friendId]
    );

    res.json({
      collection_count: parseInt(collectionCount.rows[0].count),
      wishlist_count: parseInt(wishlistCount.rows[0].count),
      unique_series: parseInt(uniqueSeries.rows[0].count),
      recent_additions: recentItems.rows
    });
  } catch (err) {
    console.error('Error fetching friend stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

startServer();