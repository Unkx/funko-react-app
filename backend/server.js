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
    const funkoItems = [
      // Funko TV Category - 10 items
      {
        id: "friends-rachel-green-01",
        title: "Rachel Green",
        number: "01",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "friends-monica-geller-02",
        title: "Monica Geller",
        number: "02",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "friends-chandler-bing-03",
        title: "Chandler Bing",
        number: "03",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "stranger-things-eleven-15",
        title: "Eleven",
        number: "15",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "stranger-things-mike-16",
        title: "Mike Wheeler",
        number: "16",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "office-michael-scott-42",
        title: "Michael Scott",
        number: "42",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "office-dwight-schrute-43",
        title: "Dwight Schrute",
        number: "43",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "game-of-thrones-daenerys-28",
        title: "Daenerys Targaryen",
        number: "28",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "game-of-thrones-jon-snow-29",
        title: "Jon Snow",
        number: "29",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "breaking-bad-walter-white-50",
        title: "Walter White",
        number: "50",
        category: "Funko TV",
        series: ["Breaking Bad", "Drama"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Movies Category - 10 items
      {
        id: "star-wars-darth-vader-01",
        title: "Darth Vader",
        number: "01",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "star-wars-luke-skywalker-02",
        title: "Luke Skywalker",
        number: "02",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "star-wars-yoda-03",
        title: "Yoda",
        number: "03",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "harry-potter-harry-15",
        title: "Harry Potter",
        number: "15",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "harry-potter-hermione-16",
        title: "Hermione Granger",
        number: "16",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "marvel-iron-man-42",
        title: "Iron Man",
        number: "42",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "marvel-captain-america-43",
        title: "Captain America",
        number: "43",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "dc-batman-28",
        title: "Batman",
        number: "28",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "dc-superman-29",
        title: "Superman",
        number: "29",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "dc-wonder-woman-30",
        title: "Wonder Woman",
        number: "30",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko WWE Category - 10 items
      {
        id: "wwe-john-cena-01",
        title: "John Cena",
        number: "01",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-the-rock-15",
        title: "The Rock",
        number: "15",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-stone-cold-42",
        title: "Stone Cold Steve Austin",
        number: "42",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-undertaker-28",
        title: "The Undertaker",
        number: "28",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-randy-orton-29",
        title: "Randy Orton",
        number: "29",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-triple-h-30",
        title: "Triple H",
        number: "30",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-shawn-michaels-31",
        title: "Shawn Michaels",
        number: "31",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-bret-hart-32",
        title: "Bret Hart",
        number: "32",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-roman-reigns-33",
        title: "Roman Reigns",
        number: "33",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "wwe-brock-lesnar-34",
        title: "Brock Lesnar",
        number: "34",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Games Category - 10 items
      {
        id: "fortnite-skull-trooper-01",
        title: "Skull Trooper",
        number: "01",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "fortnite-onesie-02",
        title: "Onesie",
        number: "02",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "overwatch-tracer-15",
        title: "Tracer",
        number: "15",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "overwatch-mercy-16",
        title: "Mercy",
        number: "16",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "halo-master-chief-42",
        title: "Master Chief",
        number: "42",
        category: "Funko Games",
        series: ["Halo", "FPS"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "halo-cortana-43",
        title: "Cortana",
        number: "43",
        category: "Funko Games",
        series: ["Halo", "FPS"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "pokemon-pikachu-28",
        title: "Pikachu",
        number: "28",
        category: "Funko Games",
        series: ["Pokémon", "RPG"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "pokemon-charizard-29",
        title: "Charizard",
        number: "29",
        category: "Funko Games",
        series: ["Pokémon", "RPG"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "mario-super-mario-60",
        title: "Super Mario",
        number: "60",
        category: "Funko Games",
        series: ["Super Mario", "Platformer"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "mario-luigi-61",
        title: "Luigi",
        number: "61",
        category: "Funko Games",
        series: ["Super Mario", "Platformer"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Anime Category - 10 items
      {
        id: "dragon-ball-goku-01",
        title: "Goku",
        number: "01",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "dragon-ball-vegeta-02",
        title: "Vegeta",
        number: "02",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "naruto-naruto-15",
        title: "Naruto Uzumaki",
        number: "15",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "naruto-sasuke-16",
        title: "Sasuke Uchiha",
        number: "16",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "one-piece-luffy-42",
        title: "Monkey D. Luffy",
        number: "42",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "one-piece-zoro-43",
        title: "Roronoa Zoro",
        number: "43",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "my-hero-deku-28",
        title: "Izuku Midoriya",
        number: "28",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "my-hero-bakugo-29",
        title: "Katsuki Bakugo",
        number: "29",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "attack-titan-eren-70",
        title: "Eren Yeager",
        number: "70",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "attack-titan-levi-71",
        title: "Levi Ackerman",
        number: "71",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Music Category - 10 items
      {
        id: "beatles-john-lennon-01",
        title: "John Lennon",
        number: "01",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "beatles-paul-mccartney-02",
        title: "Paul McCartney",
        number: "02",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "michael-jackson-thriller-15",
        title: "Michael Jackson",
        number: "15",
        category: "Funko Music",
        series: ["Pop", "King of Pop"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "queen-freddie-42",
        title: "Freddie Mercury",
        number: "42",
        category: "Funko Music",
        series: ["Queen", "Rock"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "kiss-gene-simmons-28",
        title: "Gene Simmons",
        number: "28",
        category: "Funko Music",
        series: ["KISS", "Rock"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "elvis-presley-50",
        title: "Elvis Presley",
        number: "50",
        category: "Funko Music",
        series: ["Rock and Roll", "Legend"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "madonna-51",
        title: "Madonna",
        number: "51",
        category: "Funko Music",
        series: ["Pop", "Queen of Pop"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "bob-marley-52",
        title: "Bob Marley",
        number: "52",
        category: "Funko Music",
        series: ["Reggae", "Legend"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "david-bowie-53",
        title: "David Bowie",
        number: "53",
        category: "Funko Music",
        series: ["Rock", "Legend"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "prince-54",
        title: "Prince",
        number: "54",
        category: "Funko Music",
        series: ["Pop", "Legend"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Sports Category - 10 items
      {
        id: "nba-lebron-james-01",
        title: "LeBron James",
        number: "01",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "nba-michael-jordan-02",
        title: "Michael Jordan",
        number: "02",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "nfl-tom-brady-15",
        title: "Tom Brady",
        number: "15",
        category: "Funko Sports",
        series: ["NFL", "Football"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "soccer-messi-42",
        title: "Lionel Messi",
        number: "42",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "soccer-ronaldo-43",
        title: "Cristiano Ronaldo",
        number: "43",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "baseball-babe-ruth-28",
        title: "Babe Ruth",
        number: "28",
        category: "Funko Sports",
        series: ["MLB", "Baseball"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "tennis-serena-60",
        title: "Serena Williams",
        number: "60",
        category: "Funko Sports",
        series: ["Tennis", "Legend"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "golf-tiger-61",
        title: "Tiger Woods",
        number: "61",
        category: "Funko Sports",
        series: ["Golf", "Legend"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "boxing-ali-62",
        title: "Muhammad Ali",
        number: "62",
        category: "Funko Sports",
        series: ["Boxing", "Legend"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "f1-schumacher-63",
        title: "Michael Schumacher",
        number: "63",
        category: "Funko Sports",
        series: ["Formula 1", "Racing"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Comics Category - 10 items
      {
        id: "spiderman-classic-01",
        title: "Spider-Man",
        number: "01",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "spiderman-miles-02",
        title: "Miles Morales",
        number: "02",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "batman-dark-knight-15",
        title: "Batman",
        number: "15",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "superman-man-of-steel-42",
        title: "Superman",
        number: "42",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "xmen-wolverine-28",
        title: "Wolverine",
        number: "28",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "xmen-storm-29",
        title: "Storm",
        number: "29",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "avengers-thor-50",
        title: "Thor",
        number: "50",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "avengers-hulk-51",
        title: "Hulk",
        number: "51",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "justice-league-flash-52",
        title: "The Flash",
        number: "52",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "justice-league-aquaman-53",
        title: "Aquaman",
        number: "53",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Disney Category - 10 items
      {
        id: "mickey-mouse-classic-01",
        title: "Mickey Mouse",
        number: "01",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "mickey-mouse-sorcerer-02",
        title: "Sorcerer Mickey",
        number: "02",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "frozen-elsa-15",
        title: "Elsa",
        number: "15",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "frozen-anna-16",
        title: "Anna",
        number: "16",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "toy-story-buzz-42",
        title: "Buzz Lightyear",
        number: "42",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "toy-story-woody-43",
        title: "Woody",
        number: "43",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "disney-iron-man-28",
        title: "Iron Man",
        number: "28",
        category: "Funko Disney",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "lion-king-simba-60",
        title: "Simba",
        number: "60",
        category: "Funko Disney",
        series: ["The Lion King", "Disney"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "little-mermaid-ariel-61",
        title: "Ariel",
        number: "61",
        category: "Funko Disney",
        series: ["The Little Mermaid", "Disney"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "aladdin-genie-62",
        title: "Genie",
        number: "62",
        category: "Funko Disney",
        series: ["Aladdin", "Disney"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },

      // Funko Holiday Category - 10 items
      {
        id: "santa-claus-christmas-01",
        title: "Santa Claus",
        number: "01",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "santa-claus-chimney-02",
        title: "Santa with Chimney",
        number: "02",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "jack-skellington-halloween-15",
        title: "Jack Skellington",
        number: "15",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "sally-halloween-16",
        title: "Sally",
        number: "16",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "easter-bunny-spring-42",
        title: "Easter Bunny",
        number: "42",
        category: "Funko Holiday",
        series: ["Easter", "Spring"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "cupid-valentines-28",
        title: "Cupid",
        number: "28",
        category: "Funko Holiday",
        series: ["Valentine's Day", "Love"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "ghostface-halloween-50",
        title: "Ghostface",
        number: "50",
        category: "Funko Holiday",
        series: ["Halloween", "Scream"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "frosty-snowman-51",
        title: "Frosty the Snowman",
        number: "51",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "rudolph-reindeer-52",
        title: "Rudolph",
        number: "52",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "/src/assets/placeholder.png"
      },
      {
        id: "elf-buddy-53",
        title: "Buddy the Elf",
        number: "53",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "/src/assets/placeholder.png"
      }
    ];

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

startServer();