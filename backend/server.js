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
// MIDDLEWARE
// ======================
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


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

// ======================
// UTILITY FUNCTIONS
// ======================
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
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

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
      if (err.detail.includes('email')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (err.detail.includes('login')) {
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

    if (!result.rows[0].exists && !funkoId.endsWith('-undefined')) {
      result = await pool.query(
        `SELECT EXISTS(SELECT 1 FROM wishlist WHERE user_id = $1 AND funko_id = $2)`,
        [userId, `${funkoId}-undefined`]
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

// ======================
// DATABASE SEEDING
// ======================
const seedDatabase = async () => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM funko_items");
    if (parseInt(countRes.rows[0].count) > 0) {
      console.log("✅ Database already seeded");
      return;
    }

    console.log("🌱 Seeding database...");
    const response = await fetch(
      "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json"
    );
    const data = await response.json();

    for (const item of data) {
      const id = `${item.title}-${item.number}`.replace(/\s+/g, "-");
      await pool.query(
        `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          item.title,
          item.number,
          item.category,
          JSON.stringify(item.series),
          item.exclusive || false,
          item.imageName || null,
        ]
      );
    }
    console.log("✅ Database seeded successfully");
  } catch (err) {
    console.error("Database seeding error:", err);
  }
};

// ======================
// ROUTES
// ======================
// Auth routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);

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

// User routes
app.get('/api/users/:id', authenticateToken, getUserProfile);
app.put('/api/users/:id', authenticateToken, updateUserProfile);
app.put('/api/users/:id/settings', authenticateToken, updateUserSettings);

// Admin routes
app.get('/api/admin/users', authenticateToken, isAdmin, getAllUsers);
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, deleteUser);

// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the Funko React App Backend API!');
});

// ======================
// SERVER STARTUP
// ======================
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    // Seed database if needed
    await seedDatabase();
    
    // Start server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();