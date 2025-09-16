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
      series: item.series ? JSON.parse(item.series) : []
    }));
    
    res.json(items);
  } catch (err) {
    console.error('Error fetching admin items:', err);
    res.status(500).json({ error: 'Failed to load items' });
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
const seedDatabase = async () => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM funko_items");
    if (parseInt(countRes.rows[0].count) > 0) {
      console.log("✅ Database already seeded");
      return;
    }

    console.log("🌱 Seeding database...");
    // const response = await fetch(
    //   "https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.json  "
    // );
    // const data = await response.json();

    // for (const item of data) {
    //   const id = `${item.title}-${item.number}`.replace(/\s+/g, "-");
    //   await pool.query(
    //     `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
    //      VALUES ($1, $2, $3, $4, $5, $6, $7)
    //      ON CONFLICT (id) DO NOTHING`,
    //     [
    //       id,
    //       item.title,
    //       item.number,
    //       item.category,
    //       JSON.stringify(item.series),
    //       item.exclusive || false,
    //       item.imageName || null,
    //     ]
    //   );
    // }
    console.log("✅ Database seeded successfully");
  } catch (err) {
    console.error("Database seeding error:", err);
  }
};

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
// ROUTES
// ======================

// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the Funko React App Backend API!');
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

// Admin routes
app.get('/api/admin/users', authenticateToken, isAdmin, getAllUsers);
app.get('/api/admin/items', authenticateToken, isAdmin, getAdminItems);
app.get('/api/admin/items/search', authenticateToken, isAdmin, searchItems); // Only defined once!
app.post('/api/admin/items', authenticateToken, isAdmin, addItem);
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, deleteUser);

// PATCH: Zmień rolę użytkownika (tylko dla admina)
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

// ======================
// ADMIN STATS ROUTE
// ======================
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