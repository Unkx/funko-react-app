import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import morgan from 'morgan';
// (crypto imported at top)

// ======================
// INITIALIZATION
// ======================
const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// CONFIGURATION
// ======================
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Web-AppDB',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ======================
// UTILITY FUNCTIONS
// ======================
const generateFunkoId = (title, number) => {
  return `${title}-${number}`
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================
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
// DATABASE SEEDING
// ======================
const seedDatabase = async () => {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM funko_items");
    if (parseInt(countRes.rows[0].count) > 0) {
      console.log("✅ Database already seeded");
      return;
    }

    console.log("🌱 Seeding database with Funko items...");
    // Add your funko items here if needed
    console.log("✅ Database seeded successfully");
  } catch (err) {
    console.error("❌ Database seeding error:", err);
  }
};

// Create an initial admin user if none exists and environment variables are provided.
const createInitialAdminIfNeeded = async () => {
  try {
    const adminCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const adminCount = parseInt(adminCountRes.rows[0].count || '0');
    if (adminCount > 0) {
      console.log('✅ Admin user(s) already present');
      return;
    }

    const initEmail = process.env.INIT_ADMIN_EMAIL;
    const initPassword = process.env.INIT_ADMIN_PASSWORD;
    const initLogin = process.env.INIT_ADMIN_LOGIN || 'admin';
    const initName = process.env.INIT_ADMIN_NAME || 'Administrator';
    const initSurname = process.env.INIT_ADMIN_SURNAME || 'Account';

    if (!initEmail || !initPassword) {
      console.log('ℹ️ No initial admin credentials provided via environment variables');
      return;
    }

    const hashed = await hashPassword(initPassword);
    try {
      const result = await pool.query(
        `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, nationality, role, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id, email, login, role`,
        [initEmail, initLogin, initName, initSurname, hashed, 'other', '1970-01-01', null, 'admin']
      );
      console.log('✅ Initial admin user created:', result.rows[0].email);
    } catch (err) {
      if (err.code === '23505') {
        console.warn('⚠️ Could not create initial admin: user already exists');
      } else {
        console.error('❌ Error creating initial admin:', err);
      }
    }
  } catch (err) {
    console.error('❌ Error checking/creating initial admin:', err);
  }
};

// Ensure admin_invites and admin_requests tables exist
const ensureAdminTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_invites (
        id SERIAL PRIMARY KEY,
        token_hash TEXT NOT NULL,
        display_code TEXT UNIQUE,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        used_at TIMESTAMPTZ
      );
    `);

    // For older DBs, ensure the column exists and has a unique index
    await pool.query(`ALTER TABLE admin_invites ADD COLUMN IF NOT EXISTS display_code TEXT;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS admin_invites_display_code_idx ON admin_invites(display_code);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    console.log('✅ Admin tables ensured');
  } catch (err) {
    console.error('❌ Error ensuring admin tables:', err);
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

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('/api/admin/users/:id/role', cors());

// ======================
// ROUTES
// ======================

// Return current user from token
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, login, name, surname, gender, date_of_birth, nationality, role
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching /api/me:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin invites endpoints
import crypto from 'crypto';

app.post('/api/admin/invites', authenticateToken, isAdmin, async (req, res) => {
  const { expiresInDays = 7 } = req.body;
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    // generate a human-friendly persistent display code (stored in DB)
    const displayCode = `INV-${Date.now().toString(36).toUpperCase().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO admin_invites (token_hash, display_code, created_by, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, display_code, created_at, expires_at`,
      [tokenHash, displayCode, req.user.id, expiresAt]
    );

    // Return the raw token only once (to the admin who created it)
    res.status(201).json({ invite: result.rows[0], token });
  } catch (err) {
    console.error('Error creating invite:', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

app.get('/api/admin/invites', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, display_code, created_by, created_at, expires_at, used_by, used_at FROM admin_invites ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing invites:', err);
    res.status(500).json({ error: 'Failed to list invites' });
  }
});

app.delete('/api/admin/invites/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM admin_invites WHERE id = $1`, [id]);
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    console.error('Error revoking invite:', err);
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

// User requests to become admin
app.post('/api/request-admin', authenticateToken, async (req, res) => {
  const { message } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO admin_requests (user_id, message) VALUES ($1, $2) RETURNING id, created_at`,
      [req.user.id, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating admin request:', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// Admin manage admin requests
app.get('/api/admin/admin-requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ar.id, ar.user_id, ar.message, ar.status, ar.created_at, u.login as user_login, u.email as user_email
       FROM admin_requests ar JOIN users u ON ar.user_id = u.id WHERE ar.status = 'pending' ORDER BY ar.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing admin requests:', err);
    res.status(500).json({ error: 'Failed to list admin requests' });
  }
});

app.patch('/api/admin/admin-requests/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const reqRow = await pool.query(`SELECT user_id FROM admin_requests WHERE id = $1 AND status = 'pending'`, [id]);
    if (reqRow.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    const userId = reqRow.rows[0].user_id;

    await pool.query('BEGIN');
    await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);
    await pool.query(`UPDATE admin_requests SET status = 'approved', resolved_at = NOW(), processed_by = $1 WHERE id = $2`, [req.user.id, id]);
    await pool.query('COMMIT');

    res.json({ message: 'User promoted to admin' });
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Error approving admin request:', err);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

app.patch('/api/admin/admin-requests/:id/deny', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`UPDATE admin_requests SET status = 'denied', resolved_at = NOW(), processed_by = $1 WHERE id = $2 RETURNING id`, [req.user.id, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request denied' });
  } catch (err) {
    console.error('Error denying admin request:', err);
    res.status(500).json({ error: 'Failed to deny request' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Welcome to the Funko React App Backend API!');
});

// ======================
// AUTH ROUTES
// ======================
// Fixed /api/register endpoint
app.post('/api/register', async (req, res) => {
  const { email, login, name, surname, password, gender, date_of_birth, nationality } = req.body;

  // ✅ nationality is now optional — only require the rest
  if (!email || !login || !name || !surname || !password || !gender || !date_of_birth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Allow optional invite token for elevated roles (admin) using admin_invites
  const { invite_token } = req.body;
  let roleToSet = 'user';
  let matchedInviteId = null;

  try {
    if (invite_token && invite_token.trim()) {
      // ✅ FIXED: Get ALL unused, non-expired invites
      const inviteRes = await pool.query(
        `SELECT id, token_hash, expires_at 
         FROM admin_invites 
         WHERE used_by IS NULL 
         AND (expires_at IS NULL OR expires_at > NOW())`
      );

      if (inviteRes.rows.length === 0) {
        return res.status(400).json({ 
          error: 'No valid invite tokens available' 
        });
      }

      // Try to match the provided token against all valid invites
      let matchedInvite = null;
      for (const row of inviteRes.rows) {
        try {
          const isMatch = await bcrypt.compare(invite_token.trim(), row.token_hash);
          if (isMatch) {
            matchedInvite = row;
            break;
          }
        } catch (compareErr) {
          console.error('Error comparing invite token:', compareErr);
          continue;
        }
      }

      if (!matchedInvite) {
        return res.status(400).json({ 
          error: 'Invalid invite token' 
        });
      }

      // ✅ Check if invite has expired
      if (matchedInvite.expires_at && new Date(matchedInvite.expires_at) < new Date()) {
        return res.status(400).json({ 
          error: 'Invite token has expired' 
        });
      }

      // ✅ Set role to admin and save invite ID
      roleToSet = 'admin';
      matchedInviteId = matchedInvite.id;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, nationality, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, login, name, surname, gender, date_of_birth, nationality, role`,
      [email, login, name, surname, hashedPassword, gender, date_of_birth, nationality, roleToSet]
    );

    // ✅ If an invite was used, mark it as used
    if (matchedInviteId) {
      try {
        await pool.query(
          `UPDATE admin_invites 
           SET used_by = $1, used_at = NOW() 
           WHERE id = $2`,
          [newUser.rows[0].id, matchedInviteId]
        );
        console.log(`✅ Invite token marked as used by user ${newUser.rows[0].login}`);
      } catch (updateErr) {
        console.error('Failed to mark invite as used:', updateErr);
        // Don't fail registration if this fails
      }
    }

    res.status(201).json({
      ...newUser.rows[0],
      message: roleToSet === 'admin' ? 'Admin account created successfully' : 'Account created successfully'
    });
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
    res.status(500).json({ error: 'Server error during registration' });
  }
});


// Public endpoint to verify an invite token (used for client-side validation)
// Fixed /api/verify-invite endpoint
app.post('/api/verify-invite', async (req, res) => {
  const { token } = req.body || {};
  
  if (!token || !token.trim()) {
    return res.status(400).json({ 
      valid: false, 
      error: 'Token required' 
    });
  }

  try {
    const inviteRes = await pool.query(
      `SELECT id, token_hash, expires_at 
       FROM admin_invites 
       WHERE used_by IS NULL 
       AND (expires_at IS NULL OR expires_at > NOW())`
    );

    if (inviteRes.rows.length === 0) {
      return res.json({ 
        valid: false, 
        error: 'no_invites_available' 
      });
    }

    // Try to match against all valid invites
    for (const row of inviteRes.rows) {
      try {
        const isMatch = await bcrypt.compare(token.trim(), row.token_hash);
        if (isMatch) {
          // Check expiry
          if (row.expires_at && new Date(row.expires_at) < new Date()) {
            return res.json({ 
              valid: false, 
              error: 'expired' 
            });
          }
          return res.json({ 
            valid: true, 
            expires_at: row.expires_at || null 
          });
        }
      } catch (compareErr) {
        console.error('Error comparing token:', compareErr);
        continue;
      }
    }

    // No match found
    return res.json({ 
      valid: false, 
      error: 'invalid_token' 
    });
  } catch (err) {
    console.error('Error verifying invite token:', err);
    res.status(500).json({ 
      valid: false, 
      error: 'server_error' 
    });
  }
});

// Fixed /api/register endpoint
app.post('/api/register', async (req, res) => {
  const { email, login, name, surname, password, gender, date_of_birth, nationality } = req.body;

  // ✅ nationality is now optional — only require the rest
  if (!email || !login || !name || !surname || !password || !gender || !date_of_birth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Allow optional invite token for elevated roles (admin) using admin_invites
  const { invite_token } = req.body;
  let roleToSet = 'user';
  let matchedInviteId = null;

  try {
    if (invite_token && invite_token.trim()) {
      // ✅ FIXED: Get ALL unused, non-expired invites
      const inviteRes = await pool.query(
        `SELECT id, token_hash, expires_at 
         FROM admin_invites 
         WHERE used_by IS NULL 
         AND (expires_at IS NULL OR expires_at > NOW())`
      );

      if (inviteRes.rows.length === 0) {
        return res.status(400).json({ 
          error: 'No valid invite tokens available' 
        });
      }

      // Try to match the provided token against all valid invites
      let matchedInvite = null;
      for (const row of inviteRes.rows) {
        try {
          const isMatch = await bcrypt.compare(invite_token.trim(), row.token_hash);
          if (isMatch) {
            matchedInvite = row;
            break;
          }
        } catch (compareErr) {
          console.error('Error comparing invite token:', compareErr);
          continue;
        }
      }

      if (!matchedInvite) {
        return res.status(400).json({ 
          error: 'Invalid invite token' 
        });
      }

      // ✅ Check if invite has expired
      if (matchedInvite.expires_at && new Date(matchedInvite.expires_at) < new Date()) {
        return res.status(400).json({ 
          error: 'Invite token has expired' 
        });
      }

      // ✅ Set role to admin and save invite ID
      roleToSet = 'admin';
      matchedInviteId = matchedInvite.id;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, nationality, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, login, name, surname, gender, date_of_birth, nationality, role`,
      [email, login, name, surname, hashedPassword, gender, date_of_birth, nationality, roleToSet]
    );

    // ✅ If an invite was used, mark it as used
    if (matchedInviteId) {
      try {
        await pool.query(
          `UPDATE admin_invites 
           SET used_by = $1, used_at = NOW() 
           WHERE id = $2`,
          [newUser.rows[0].id, matchedInviteId]
        );
        console.log(`✅ Invite token marked as used by user ${newUser.rows[0].login}`);
      } catch (updateErr) {
        console.error('Failed to mark invite as used:', updateErr);
        // Don't fail registration if this fails
      }
    }

    res.status(201).json({
      ...newUser.rows[0],
      message: roleToSet === 'admin' ? 'Admin account created successfully' : 'Account created successfully'
    });
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
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// app.post('/api/login', async (req, res) => {
//   const { login, password } = req.body;

//   if (!login || !password) {
//     return res.status(400).json({ error: 'Login and password required' });
//   }

//   try {
//     const result = await pool.query(
//       `SELECT id, email, login, password_hash, name, surname, gender, date_of_birth, role
//        FROM users WHERE login = $1`,
//       [login]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const user = result.rows[0];
//     const validPassword = await comparePasswords(password, user.password_hash);

//     if (!validPassword) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     await pool.query(
//       `UPDATE users SET last_login = NOW() WHERE id = $1`,
//       [user.id]
//     );

//     const token = generateToken(user);
//     const { password_hash, ...safeUser } = user;

//     res.json({
//       message: 'Login successful',
//       user: safeUser,
//       token: token
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// ======================
// USER ROUTES
// ======================
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only access your own profile' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, login, name, surname, gender, date_of_birth, nationality, role, created_at, last_login
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
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const { name, surname, gender, date_of_birth, nationality } = req.body;

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
        nationality = COALESCE($5, nationality),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, email, login, name, surname, gender, date_of_birth, nationality, role, created_at, last_login
    `;
    const values = [name, surname, gender, date_of_birth, nationality, userId];
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/settings', authenticateToken, async (req, res) => {
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
});

app.get('/api/users/:id/nationality', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(
      'SELECT nationality FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ nationality: result.rows[0].nationality });
  } catch (err) {
    console.error('Error fetching nationality:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ======================
// ITEMS ROUTES
// ======================
// Admin: change a user's role (promote/demote)
app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || (role !== 'user' && role !== 'admin')) {
    return res.status(400).json({ error: "Invalid role. Use 'user' or 'admin'." });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, login, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Failed to load items" });
  }
});


// Replace your existing /api/items/:id route with this improved version:

app.get('/api/items/:id', async (req, res) => {
  let { id } = req.params;
  
  // Clean the ID: remove special chars, trailing hyphens, normalize
  id = id
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')     // Remove leading/trailing hyphens
    .toLowerCase();
  
  try {
    console.log('🔍 Looking for item with cleaned ID:', id);
    
    // STEP 1: Try exact ID match
    let result = await pool.query(
      `SELECT id, title, number, category, 
              series,
              exclusive, image_name as "imageName"
       FROM funko_items 
       WHERE LOWER(TRIM(id)) = $1`,
      [id]
    );
    
    // STEP 2: Try ID with various hyphen variations
    if (result.rows.length === 0) {
      console.log('⚠️ Exact match failed, trying variations...');
      
      // Remove all hyphens and try
      const idNoHyphens = id.replace(/-/g, '');
      result = await pool.query(
        `SELECT id, title, number, category, 
                series,
                exclusive, image_name as "imageName"
         FROM funko_items 
         WHERE LOWER(REPLACE(id, '-', '')) = $1`,
        [idNoHyphens]
      );
    }
    
    // STEP 3: Parse ID and try title + number match (FIXED - treat number as text)
    if (result.rows.length === 0) {
      console.log('⚠️ Variation match failed, trying title+number...');
      const idParts = id.split('-').filter(p => p.length > 0);
      const numberPart = idParts.find(part => /^\d+$/.test(part));
      const titleParts = idParts.filter(part => !/^\d+$/.test(part) && part.length > 0);
      const titlePart = titleParts.join(' ');
      console.log('🔍 Extracted - Title:', titlePart, 'Number:', numberPart);

      if (titlePart) {
        if (numberPart) {
          // Compare number as text, not integer
          result = await pool.query(
            `SELECT id, title, number, category, 
                    series,
                    exclusive, image_name as "imageName"
            FROM funko_items 
            WHERE LOWER(title) LIKE $1 AND number = $2
            LIMIT 1`,
            [`%${titlePart}%`, numberPart]
          );
        } else {
          // Search by title only
          result = await pool.query(
            `SELECT id, title, number, category, 
                    series,
                    exclusive, image_name as "imageName"
            FROM funko_items 
            WHERE LOWER(title) LIKE $1
            LIMIT 1`,
            [`%${titlePart}%`]
          );
        }
      }
    }
    
    // STEP 4: Try word-based fuzzy match
    if (result.rows.length === 0 && id.length > 5) {
      console.log('⚠️ Title+number failed, trying fuzzy word match...');
      
      const searchWords = id.split('-').filter(w => w.length > 2 && !/^\d+$/.test(w));
      
      if (searchWords.length > 0) {
        // Build a query that matches all words
        const likeConditions = searchWords.map((_, idx) => `LOWER(title) LIKE $${idx + 1}`).join(' AND ');
        const likeParams = searchWords.map(word => `%${word}%`);
        
        result = await pool.query(
          `SELECT id, title, number, category, 
                  series,
                  exclusive, image_name as "imageName"
           FROM funko_items 
           WHERE ${likeConditions}
           LIMIT 1`,
          likeParams
        );
      }
    }

    if (result.rows.length === 0) {
      console.log('❌ Item not found in database with ID:', id);
      return res.status(404).json({ error: 'Funko Pop not found' });
    }

    const item = {
      ...result.rows[0],
      series: result.rows[0].series || []
    };
    
    console.log('✅ Found item:', item.title, '#' + item.number);
    res.json(item);
  } catch (err) {
    console.error('Error fetching item:', err);
    res.status(500).json({ error: 'Failed to load item' });
  }
});

// Batch sync endpoint (for syncing multiple items)
// Add this route to your server.js (around line 300, after other item routes)

// Batch sync endpoint (for syncing multiple items)
app.post('/api/items/batch-sync', async (req, res) => {
  const { items } = req.body;
  
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array required' });
  }

  try {
    // Use UPSERT to avoid duplicates
    const values = items.map((item, idx) => {
      const id = `${item.title}-${item.number}`.replace(/\s+/g, '-').toLowerCase();
      const offset = idx * 6;
      return `(${offset + 1}, ${offset + 2}, ${offset + 3}, ${offset + 4}, ${offset + 5}, ${offset + 6})`;
    }).join(', ');

    const params = items.flatMap(item => [
      `${item.title}-${item.number}`.replace(/\s+/g, '-').toLowerCase(),
      item.title,
      item.number,
      item.series?.[0] || 'Unknown', // Use first series as category
      JSON.stringify(item.series || []),
      item.exclusive || false
    ]);

    await pool.query(
      `INSERT INTO funko_items (id, title, number, category, series, exclusive)
       VALUES ${values}
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         category = EXCLUDED.category,
         series = EXCLUDED.series,
         exclusive = EXCLUDED.exclusive`,
      params
    );

    res.json({ 
      message: 'Batch sync successful', 
      count: items.length 
    });
  } catch (err) {
    console.error('Batch sync error:', err);
    res.status(500).json({ error: 'Failed to sync items' });
  }
});

// Single item sync endpoint (for on-demand syncing)
  app.post('/api/items/sync-single', async (req, res) => {
    const { item } = req.body;
    
    if (!item || !item.title || !item.number) {
      return res.status(400).json({ error: 'Valid item with title and number required' });
    }

    try {
      const id = `${item.title}-${item.number}`.replace(/\s+/g, '-').toLowerCase();
      
      await pool.query(
        `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          number = EXCLUDED.number,
          category = EXCLUDED.category,
          series = EXCLUDED.series,
          exclusive = EXCLUDED.exclusive,
          image_name = EXCLUDED.image_name`,
        [
          id,
          item.title,
          item.number,
          item.category || item.series?.[0] || 'Unknown',
          JSON.stringify(item.series || []),
          item.exclusive || false,
          item.imageName || null
        ]
      );

      res.json({ 
        message: 'Item synced successfully',
        id: id
      });
    } catch (err) {
      console.error('Single sync error:', err);
      res.status(500).json({ error: 'Failed to sync item' });
    }
  });

// Single item sync endpoint (for on-demand syncing)
app.post('/api/items/sync-single', async (req, res) => {
  const { item } = req.body;
  
  if (!item || !item.title || !item.number) {
    return res.status(400).json({ error: 'Valid item with title and number required' });
  }

  try {
    const id = `${item.title}-${item.number}`.replace(/\s+/g, '-').toLowerCase();
    
    await pool.query(
      `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         category = EXCLUDED.category,
         series = EXCLUDED.series,
         exclusive = EXCLUDED.exclusive,
         image_name = EXCLUDED.image_name`,
      [
        id,
        item.title,
        item.number,
        item.category || item.series?.[0] || 'Unknown',
        JSON.stringify(item.series || []),
        item.exclusive || false,
        item.imageName || null
      ]
    );

    res.json({ 
      message: 'Item synced successfully',
      id: id
    });
  } catch (err) {
    console.error('Single sync error:', err);
    res.status(500).json({ error: 'Failed to sync item' });
  }
});
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
    console.error("Error searching items:", err);
    res.status(500).json({ error: "Failed to search items" });
  }
});

// ======================
// WISHLIST ROUTES
// ======================


app.delete('/api/wishlist/:funkoId', authenticateToken, async (req, res) => {
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
});

app.get('/api/wishlist/check/:funkoId', authenticateToken, async (req, res) => {
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
});

// ======================
// COLLECTION ROUTES
// ======================

app.delete('/api/collection/:funkoId', authenticateToken, async (req, res) => {
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
});


app.get('/api/collection/check/:funkoId', authenticateToken, async (req, res) => {
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
});
// ✅ Add item to user's collection
app.post('/api/collection', authenticateToken, async (req, res) => {
  const { funkoId, title, number, imageName } = req.body;
  const userId = req.user.id;

  if (!funkoId) {
    return res.status(400).json({ error: "Funko ID is required" });
  }

  try {
    // Ensure the Funko item exists in funko_items table
    await pool.query(
      `INSERT INTO funko_items (id, title, number, image_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         image_name = EXCLUDED.image_name`,
      [funkoId, title || null, number || null, imageName || null]
    );

    // Add to user's collection (with upsert to avoid duplicates)
    const result = await pool.query(
      `INSERT INTO collection (user_id, funko_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, funko_id) DO NOTHING
       RETURNING *`,
      [userId, funkoId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already in collection" });
    }

    // ✅ Award loyalty points
    await pool.query(
      `INSERT INTO loyalty_points_history (user_id, points_change, reason, action_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, LOYALTY_POINTS.collection_add, 'Added item to collection', 'collection_add']
    );
    await pool.query(
      'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
      [LOYALTY_POINTS.collection_add, userId]
    );

    // ✅ Check achievements
    const unlockedAchievements = await checkAndUnlockAchievements(userId);

    res.status(201).json({
      message: "Added to collection",
      funkoId,
      pointsAwarded: LOYALTY_POINTS.collection_add,
      newAchievements: unlockedAchievements
    });
  } catch (err) {
    console.error("Error adding to collection:", err);
    res.status(500).json({ error: "Failed to add to collection" });
  }
});
app.post('/api/collection/share', authenticateToken, async (req, res) => {
  const { is_public } = req.body;
  const userId = req.user.id;

  try {
    const crypto = await import('crypto');
    const shareToken = crypto.randomBytes(16).toString('hex');

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

// ======================
// ITEM REQUESTS ROUTES
// ======================
app.post('/api/requests', authenticateToken, async (req, res) => {
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
});

// ======================
// FRIENDS ROUTES
// ======================
app.post('/api/friends/request', authenticateToken, async (req, res) => {
  const { friendLogin } = req.body;
  const userId = req.user.id;

  try {
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

app.patch('/api/friends/accept/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
    // Aktualizuj status przyjaźni
    await pool.query(
      `UPDATE friendships 
       SET status = 'accepted' 
       WHERE user_id = $1 AND friend_id = $2`,
      [friendId, userId]
    );

    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [userId, friendId]
    );

    // ✅ DODAJ: Przyznaj punkty OBOIM użytkownikom
    await pool.query(
      'SELECT award_loyalty_points($1, $2, $3, $4)',
      [userId, LOYALTY_POINTS.friend_add, 'Accepted friend request', 'friend_add']
    );
    
    await pool.query(
      'SELECT award_loyalty_points($1, $2, $3, $4)',
      [friendId, LOYALTY_POINTS.friend_add, 'Friend request was accepted', 'friend_add']
    );

    // ✅ DODAJ: Sprawdź osiągnięcia dla obu użytkowników
    await checkAndUnlockAchievements(userId);
    await checkAndUnlockAchievements(friendId);

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error accepting friend:', err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

app.delete('/api/friends/request/:friendshipId', authenticateToken, async (req, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  try {
    const friendship = await pool.query(
      'SELECT user_id, friend_id FROM friendships WHERE id = $1',
      [friendshipId]
    );

    if (friendship.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { user_id, friend_id } = friendship.rows[0];
    
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

app.delete('/api/friends/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  try {
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

app.get('/api/friends', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const friends = await pool.query(`
      SELECT 
        u.id, 
        u.login, 
        u.name, 
        u.surname,
        f.status, 
        f.created_at,
        (SELECT COUNT(*)::integer 
        FROM collection c 
        JOIN funko_items fi ON c.funko_id = fi.id 
        WHERE c.user_id = u.id) as collection_size
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1 AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `, [userId]);

    console.log("✅ Friends list with collection counts:", friends.rows);
    res.json(friends.rows);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// ======================
// FRIEND PROFILE ROUTES
// ======================
app.get('/api/users/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  console.log("🔍 Public profile request:", { currentUserId, targetUserId: userId });

  try {
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      console.log("❌ Not friends, access denied");
      return res.status(403).json({ error: 'You can only view profiles of your friends' });
    }

    const user = await pool.query(
      `SELECT id, login, name, surname, created_at, loyalty_score, nationality
       FROM users WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      console.log("❌ User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    console.log("✅ Profile data sent:", user.rows[0].login);
    res.json(user.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching public profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/collection/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  console.log("🔍 Collection access request:", { currentUserId, targetUserId: userId });

  try {
    if (!userId || userId === 'undefined') {
      console.log("❌ Invalid userId provided");
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      console.log("❌ Not friends, access denied");
      return res.status(403).json({ error: 'You can only view collections of your friends' });
    }

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

    console.log("✅ Collection fetched:", collection.rows.length, "items");

    const items = collection.rows.map(item => ({
      ...item,
      series: item.series ? (typeof item.series === 'string' ? JSON.parse(item.series) : item.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching public collection:', err);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

app.get('/api/wishlist/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  console.log("🔍 Wishlist access request:", { currentUserId, targetUserId: userId });

  try {
    if (!userId || userId === 'undefined') {
      console.log("❌ Invalid userId provided");
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, userId]
    );

    if (friendship.rows.length === 0) {
      console.log("❌ Not friends, access denied");
      return res.status(403).json({ error: 'You can only view wishlists of your friends' });
    }

    const wishlist = await pool.query(
      `SELECT 
        fi.id,
        fi.title,
        fi.number,
        fi.image_name,
        fi.series,
        w.added_at as added_date
       FROM wishlist w
       JOIN funko_items fi ON w.funko_id = fi.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    console.log("✅ Wishlist fetched:", wishlist.rows.length, "items");

    const items = wishlist.rows.map(item => ({
      ...item,
      series: item.series ? (typeof item.series === 'string' ? JSON.parse(item.series) : item.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching public wishlist:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

app.get('/api/friends/:friendId/stats', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const currentUserId = req.user.id;

  console.log("🔍 Friend stats request:", { currentUserId, friendId });

  try {
    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [currentUserId, friendId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: 'You can only view stats of your friends' });
    }

    const collectionCount = await pool.query(
      'SELECT COUNT(*) as count FROM collection WHERE user_id = $1',
      [friendId]
    );

    const wishlistCount = await pool.query(
      'SELECT COUNT(*) as count FROM wishlist WHERE user_id = $1',
      [friendId]
    );

    const uniqueSeries = await pool.query(
      `SELECT COUNT(DISTINCT elem) as count
       FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       CROSS JOIN LATERAL jsonb_array_elements_text(fi.series) elem
       WHERE c.user_id = $1`,
      [friendId]
    );

    const recentItems = await pool.query(
      `SELECT fi.title, fi.number, c.purchase_date as added_date
       FROM collection c
       JOIN funko_items fi ON c.funko_id = fi.id
       WHERE c.user_id = $1
       ORDER BY c.purchase_date DESC
       LIMIT 5`,
      [friendId]
    );

    console.log("✅ Friend stats sent");

    res.json({
      collection_count: parseInt(collectionCount.rows[0].count),
      wishlist_count: parseInt(wishlistCount.rows[0].count),
      unique_series: parseInt(uniqueSeries.rows[0].count || 0),
      recent_additions: recentItems.rows
    });
  } catch (err) {
    console.error('❌ Error fetching friend stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ======================
// CHAT ROUTES
// ======================
app.get('/api/chat/conversation/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  if (userId == friendId) {
    return res.status(400).json({ error: "Cannot chat with yourself" });
  }

  try {
    const users = await pool.query(
      'SELECT id, nationality FROM users WHERE id = $1 OR id = $2',
      [userId, friendId]
    );
    if (users.rows.length < 2) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [userId, friendId]
    );

    if (friendship.rows.length === 0) {
      return res.status(403).json({ error: "You must be friends to chat" });
    }

    let conv = await pool.query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [userId, friendId]
    );

    if (conv.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO conversations (user1_id, user2_id) 
         VALUES ($1, $2) RETURNING id`,
        [Math.min(userId, friendId), Math.max(userId, friendId)]
      );
      conv = result;
    }

    const friendData = users.rows.find(u => u.id == friendId);

    res.json({ 
      conversation_id: conv.rows[0].id,
      friend_nationality: friendData?.nationality || null
    });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

app.post('/api/chat/conversation/:conversation_id/messages', authenticateToken, async (req, res) => {
  const { conversation_id } = req.params;
  const { content } = req.body;
  const sender_id = req.user.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
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
});

app.get('/api/chat/conversation/:conversation_id/messages', authenticateToken, async (req, res) => {
  const { conversation_id } = req.params;
  const userId = req.user.id;

  try {
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
      `SELECT m.*, u.login as sender_login, u.nationality as sender_nationality
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
});

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

app.patch('/api/chat/conversation/:conversation_id/read', authenticateToken, async (req, res) => {
  const { conversation_id } = req.params;
  const userId = req.user.id;

  try {
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

// ======================
// COMMENTS ROUTES
// ======================
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

// ======================
// ACTIVITY & LOYALTY ROUTES
// ======================
app.post('/api/activity/log', authenticateToken, async (req, res) => {
  const { action_type, action_details, session_duration } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      `INSERT INTO user_activity_log (user_id, action_type, action_details, session_duration)
       VALUES ($1, $2, $3, $4)`,
      [userId, action_type, JSON.stringify(action_details || {}), session_duration]
    );

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

app.post('/api/loyalty/calculate', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
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
    
    const accountAge = Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24));
    const loyaltyScore = Math.min(100, 
      (data.active_days * 2) + 
      (data.wishlist_count * 0.5) + 
      (data.collection_count * 1) + 
      (Math.min(accountAge, 365) * 0.1) +
      (data.total_actions * 0.1)
    );

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

// 🎯 POST /api/loyalty/achievements/check - Force check and unlock achievements
app.post('/api/loyalty/achievements/check', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const unlocked = await checkAndUnlockAchievements(userId);
    res.json({
      message: 'Achievements checked and unlocked',
      unlockedCount: unlocked.length,
      unlocked: unlocked
    });
  } catch (err) {
    console.error('Error checking achievements:', err);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

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

// ======================
// ADMIN ROUTES
// ======================
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
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
});

app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const { email, login, name, surname, password, gender, date_of_birth, role = 'user' } = req.body;
  
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
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
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
});

app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ 
      error: 'Invalid role. Only "user" or "admin" allowed.' 
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: `User role updated to ${role}.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/admin/items', authenticateToken, isAdmin, async (req, res) => {
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

    res.json({ items, totalItems, totalPages });
  } catch (err) {
    console.error("Error fetching admin items:", err);
    res.status(500).json({ error: "Failed to load items" });
  }
});

app.get('/api/admin/items/search', authenticateToken, isAdmin, async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
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
    
    const items = result.rows.map(item => ({
      ...item,
      series: item.series ? JSON.parse(item.series) : []
    }));
    
    res.json(items);
  } catch (err) {
    console.error('Error searching items:', err);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

app.post('/api/admin/items', authenticateToken, isAdmin, async (req, res) => {
  const { title, number, category, series, exclusive, imageName } = req.body;

  if (!title || !number || !category) {
    return res.status(400).json({ error: 'Title, number, and category are required.' });
  }

  try {
    const id = `${title}-${number}`.replace(/\s+/g, '-').toLowerCase();

    const result = await pool.query(
      `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         number = EXCLUDED.number,
         category = EXCLUDED.category,
         series = EXCLUDED.series,
         exclusive = EXCLUDED.exclusive,
         image_name = EXCLUDED.image_name
       RETURNING *`,
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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ error: 'Failed to add item.' });
  }
});

app.get('/api/admin/requests', authenticateToken, isAdmin, async (req, res) => {
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
});

app.get('/api/admin/requests/count', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM item_requests WHERE status = 'pending'`
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error fetching requests count:', err);
    res.status(500).json({ error: 'Failed to load requests count.' });
  }
});

app.patch('/api/admin/requests/:id/status', authenticateToken, isAdmin, async (req, res) => {
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
});

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
      pool.query('SELECT COUNT(*) AS count FROM users'),
      pool.query('SELECT COUNT(*) AS count FROM funko_items'),
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\''),
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''),
      pool.query('SELECT COUNT(*) AS count FROM users WHERE last_login >= NOW() - INTERVAL \'24 hours\''),
      pool.query('SELECT COUNT(*) AS count FROM funko_items WHERE created_at >= NOW() - INTERVAL \'7 days\''),
      pool.query('SELECT COUNT(*) AS count FROM funko_items WHERE created_at >= NOW() - INTERVAL \'30 days\''),
    ]);

    let avgUsersPerDay = 0;
    const firstUser = await pool.query('SELECT MIN(created_at) AS first_date FROM users');
    const firstDate = firstUser.rows[0]?.first_date;
    if (firstDate) {
      const daysSinceStart = Math.max(1, Math.floor((new Date() - new Date(firstDate)) / (1000 * 60 * 60 * 24)));
      avgUsersPerDay = Math.round(parseInt(totalUsersRes.rows[0].count) / daysSinceStart);
    }

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

    const stats = {
      totalUsers: parseInt(totalUsersRes.rows[0].count),
      totalItems: parseInt(totalItemsRes.rows[0].count),
      newUsersLast7Days: parseInt(newUsers7DaysRes.rows[0].count),
      newUsersLast30Days: parseInt(newUsers30DaysRes.rows[0].count),
      activeUsersLast24Hours: parseInt(activeUsers24hRes.rows[0].count),
      totalVisits: 0,
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

app.get('/api/admin/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const engagement = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        AVG(session_duration) as avg_session,
        COUNT(*) as total_actions
      FROM user_activity_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    const topActions = await pool.query(`
      SELECT action_type, COUNT(*) as count
      FROM user_activity_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `);

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
// DEBUG ROUTES
// ======================
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
// LOYALTY REWARDS SYSTEM ROUTES
// ======================

// Definicja punktów za akcje
const LOYALTY_POINTS = {
  item_view: 1 ,
  daily_login: 5,
  collection_add: 10,
  wishlist_add: 5,
  friend_add: 15,
  chat_message: 2,
  profile_update: 10,
  item_comment: 20,
  streak_bonus_7: 50,
  streak_bonus_30: 200
};

// Middleware do aktualizacji streak
const updateLoginStreak = async (userId) => {
  try {
    const user = await pool.query(
      'SELECT last_streak_date, current_streak, longest_streak FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) return;

    const { last_streak_date, current_streak, longest_streak } = user.rows[0];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = current_streak || 0;
    let pointsAwarded = 0;

    if (!last_streak_date || last_streak_date === yesterday) {
      newStreak += 1;
      pointsAwarded = LOYALTY_POINTS.daily_login;

      // Bonusy za streak
      if (newStreak === 7) pointsAwarded += LOYALTY_POINTS.streak_bonus_7;
      if (newStreak === 30) pointsAwarded += LOYALTY_POINTS.streak_bonus_30;

      await pool.query(
        `UPDATE users 
         SET current_streak = $1, 
             longest_streak = GREATEST(longest_streak, $1),
             last_streak_date = $2,
             loyalty_points = loyalty_points + $3
         WHERE id = $4`,
        [newStreak, today, pointsAwarded, userId]
      );

      if (pointsAwarded > 0) {
        await pool.query(
          `INSERT INTO loyalty_points_history (user_id, points_change, reason, action_type)
           VALUES ($1, $2, $3, $4)`,
          [userId, pointsAwarded, `Daily login streak: ${newStreak} days`, 'daily_login']
        );
      }
    } else if (last_streak_date !== today) {
      // Reset streak jeśli przerwa dłuższa niż 1 dzień
      await pool.query(
        'UPDATE users SET current_streak = 1, last_streak_date = $1 WHERE id = $2',
        [today, userId]
      );
    }

    // Sprawdź i odblokuj osiągnięcia
    await checkAndUnlockAchievements(userId);
  } catch (err) {
    console.error('Error updating streak:', err);
  }
};

// Funkcja do sprawdzania osiągnięć
// Replace the checkAndUnlockAchievements function in your server.js

// Replace the checkAndUnlockAchievements function in your server.js

const checkAndUnlockAchievements = async (userId) => {
  try {
    const result = await pool.query('SELECT * FROM check_and_unlock_achievements($1)', [userId]);
    
    if (result.rows && result.rows.length > 0) {
      // Award points for each unlocked achievement
    for (const achievement of result.rows) {
    if (achievement.points_reward) {
      await pool.query(
        `INSERT INTO loyalty_points_history (user_id, points_change, reason, action_type)
        VALUES ($1, $2, $3, $4)`,
        [
          userId, 
          achievement.points_reward, 
          `Achievement unlocked: ${achievement.name || achievement.achievement_id}`, 
          'achievement'
        ]
      );
      await pool.query(
        'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
        [achievement.points_reward, userId]
      );
    }
    }
      
      return result.rows;
    }
    
    return [];
  } catch (err) {
    console.error('Error checking achievements:', err);
    return [];
  }
};


// Update the loyalty dashboard route to include requirement_value
app.get('/api/loyalty/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userData = await pool.query(`
      SELECT 
        u.loyalty_points,
        u.loyalty_level,
        u.current_streak,
        u.longest_streak,

        u.active_title,
        u.active_theme,
        u.active_badge,
        u.active_avatar,
        u.active_background,
        COALESCE(ll.level_name, 'Beginner') AS level_name,
        COALESCE(ll.badge_emoji, '🌱') AS badge_emoji,
        COALESCE(ll.min_points, 0) AS current_level_min,
        (SELECT min_points FROM loyalty_levels WHERE level_number = u.loyalty_level + 1) AS next_level_min
      FROM users u
      LEFT JOIN loyalty_levels ll ON u.loyalty_level = ll.level_number
      WHERE u.id = $1
    `, [userId]);

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userData.rows[0];

    let levelProgress = 100;
    let nextLevelPoints = null;

    if (user.next_level_min !== null && user.next_level_min > user.current_level_min) {
      const diff = user.next_level_min - user.current_level_min;
      const earned = user.loyalty_points - user.current_level_min;
      levelProgress = Math.min(100, Math.max(0, (earned / diff) * 100));
      nextLevelPoints = user.next_level_min - user.loyalty_points;
    }

    // ✅ Include requirement_value in achievements query
    const achievements = await pool.query(`
      SELECT 
        a.achievement_id,
        a.name,
        a.description,
        a.category,
        a.emoji,
        a.points_reward,
        a.requirement_value,
        ua.unlocked_at,
        ua.is_new,
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
      ORDER BY 
        CASE WHEN ua.id IS NOT NULL THEN 0 ELSE 1 END,
        a.category,
        a.points_reward DESC
    `, [userId]);

    const progress = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM collection WHERE user_id = $1) as collection_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = $1) as wishlist_count,
        (SELECT COUNT(*) FROM friendships 
         WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted') as friend_count
    `, [userId]);

    const pointsHistory = await pool.query(`
      SELECT points_change, reason, action_type, created_at
      FROM loyalty_points_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    const rewards = await pool.query(`
      SELECT reward_type, reward_id, unlocked_at
      FROM user_rewards
      WHERE user_id = $1
      ORDER BY unlocked_at DESC
    `, [userId]);

    res.json({
      user: {
        loyaltyPoints: user.loyalty_points || 0,
        level: user.loyalty_level || 1,
        levelName: user.level_name,
        badgeEmoji: user.badge_emoji,
        levelProgress: Math.round(levelProgress),
        nextLevelPoints: nextLevelPoints,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        profileBadge: user.profile_badge,
        activeTitle: user.active_title,
        activeTheme: user.active_theme,
        activeBadge: user.active_badge,
        activeAvatar: user.active_avatar,
        activeBackground: user.active_background
      },
      achievements: achievements.rows,
      progress: progress.rows[0],
      pointsHistory: pointsHistory.rows,
      rewards: rewards.rows
    });
  } catch (err) {
    console.error('Error fetching loyalty dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch loyalty data' });
  }
});

// Update the collection add route to check achievements
// ✅ GET /api/collection – Fetch user's full collection
app.get('/api/collection', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT 
        fi.id,
        fi.title,
        fi.number,
        fi.image_name,
        fi.series,
        c.condition,
        c.purchase_date,
        c.purchase_price,
        c.notes
      FROM collection c
      JOIN funko_items fi ON c.funko_id = fi.id
      WHERE c.user_id = $1
      ORDER BY c.purchase_date DESC
    `, [userId]);

    const items = result.rows.map(row => ({
      ...row,
      series: row.series ? (typeof row.series === 'string' ? JSON.parse(row.series) : row.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({ error: 'Failed to load collection' });
  }
});

// ✅ GET /api/wishlist – Fetch user's full wishlist
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT 
        fi.id,
        fi.title,
        fi.number,
        fi.image_name,
        fi.series,
        w.added_at,
        w.priority,
        w.max_price,
        w.target_condition,
        w.notes
      FROM wishlist w
      JOIN funko_items fi ON w.funko_id = fi.id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC
    `, [userId]);

    const items = result.rows.map(row => ({
      ...row,
      series: row.series ? (typeof row.series === 'string' ? JSON.parse(row.series) : row.series) : []
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'Failed to load wishlist' });
  }
});

// Update the wishlist add route to check achievements
app.post('/api/wishlist', authenticateToken, async (req, res) => {
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

    // ✅ Award points for adding to wishlist
    await pool.query(
      `INSERT INTO loyalty_points_history (user_id, points_change, reason, action_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, LOYALTY_POINTS.wishlist_add, 'Added item to wishlist', 'wishlist_add']
    );
    
    await pool.query(
      'UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2',
      [LOYALTY_POINTS.wishlist_add, userId]
    );

    // ✅ Check and unlock achievements
    const unlockedAchievements = await checkAndUnlockAchievements(userId);

    res.status(201).json({
      message: "Added to wishlist",
      item: { id: funkoId, title, number, imageName },
      pointsAwarded: LOYALTY_POINTS.wishlist_add,
      newAchievements: unlockedAchievements
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update the loyalty dashboard route to include requirement_value

// 📊 GET /api/loyalty/dashboard - Pełny dashboard lojalności
// app.get('/api/loyalty/dashboard', authenticateToken, async (req, res) => {
//   const userId = req.user.id;
//   try {
//     const userData = await pool.query(`
//       SELECT 
//         u.loyalty_points,
//         u.loyalty_level,
//         u.current_streak,
//         u.longest_streak,
//         u.profile_badge,
//         u.active_title,
//         u.active_theme,
//         COALESCE(ll.level_name, 'Beginner') AS level_name,
//         COALESCE(ll.badge_emoji, '🌱') AS badge_emoji,
//         COALESCE(ll.min_points, 0) AS current_level_min,
//         (SELECT min_points FROM loyalty_levels WHERE level_number = u.loyalty_level + 1) AS next_level_min
//       FROM users u
//       LEFT JOIN loyalty_levels ll ON u.loyalty_level = ll.level_number
//       WHERE u.id = $1
//     `, [userId]);

//     if (userData.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const user = userData.rows[0];

//     let levelProgress = 100;
//     let nextLevelPoints = null;

//     if (user.next_level_min !== null && user.next_level_min > user.current_level_min) {
//       const diff = user.next_level_min - user.current_level_min;
//       const earned = user.loyalty_points - user.current_level_min;
//       levelProgress = Math.min(100, Math.max(0, (earned / diff) * 100));
//       nextLevelPoints = user.next_level_min;
//     }

//     const achievements = await pool.query(`
//       SELECT 
//         a.achievement_id,
//         a.name,
//         a.description,
//         a.category,
//         a.emoji,
//         a.points_reward,
//         ua.unlocked_at,
//         ua.is_new,
//         CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked
//       FROM achievements a
//       LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
//       ORDER BY 
//         CASE WHEN ua.id IS NOT NULL THEN 0 ELSE 1 END,
//         a.points_reward DESC
//     `, [userId]);

//     const progress = await pool.query(`
//       SELECT 
//         (SELECT COUNT(*) FROM collection WHERE user_id = $1) as collection_count,
//         (SELECT COUNT(*) FROM wishlist WHERE user_id = $1) as wishlist_count,
//         (SELECT COUNT(*) FROM friendships WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted') as friend_count
//     `, [userId]);

//     const pointsHistory = await pool.query(`
//       SELECT points_change, reason, action_type, created_at
//       FROM loyalty_points_history
//       WHERE user_id = $1
//       ORDER BY created_at DESC
//       LIMIT 10
//     `, [userId]);

//     const rewards = await pool.query(`
//       SELECT reward_type, reward_id, unlocked_at
//       FROM user_rewards
//       WHERE user_id = $1
//       ORDER BY unlocked_at DESC
//     `, [userId]);

//     res.json({
//       user: {
//         loyaltyPoints: user.loyalty_points || 0,
//         level: user.loyalty_level || 1,
//         levelName: user.level_name,
//         badgeEmoji: user.badge_emoji,
//         levelProgress: Math.round(levelProgress),
//         nextLevelPoints: nextLevelPoints,
//         currentStreak: user.current_streak || 0,
//         longestStreak: user.longest_streak || 0,
//         profile_Badge: user.profile_badge,
//         activeTitle: user.active_title,
//         activeTheme: user.active_theme
//       },
//       achievements: achievements.rows,
//       progress: progress.rows[0],
//       pointsHistory: pointsHistory.rows,
//       rewards: rewards.rows
//     });
//   } catch (err) {
//     console.error('Error fetching loyalty dashboard:', err);
//     res.status(500).json({ error: 'Failed to fetch loyalty data' });
//   }
// });

// 🎁 POST /api/loyalty/award-points - Przyznaj punkty za akcję
app.post('/api/loyalty/award-points', authenticateToken, async (req, res) => {
  const { actionType, details } = req.body;
  const userId = req.user.id;

  const points = LOYALTY_POINTS[actionType];
  if (!points) {
    return res.status(400).json({ error: 'Invalid action type' });
  }

  try {
    await pool.query(
      'SELECT award_loyalty_points($1, $2, $3, $4)',
      [userId, points, details || `Action: ${actionType}`, actionType]
    );

    await checkAndUnlockAchievements(userId);

    res.json({ 
      message: 'Points awarded', 
      points,
      actionType 
    });
  } catch (err) {
    console.error('Error awarding points:', err);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

// 🏆 GET /api/loyalty/achievements - Wszystkie osiągnięcia użytkownika
app.get('/api/loyalty/achievements', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const achievements = await pool.query(`
      SELECT 
        a.*,
        ua.unlocked_at,
        ua.is_new,
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
      ORDER BY unlocked DESC, a.points_reward DESC
    `, [userId]);

    res.json(achievements.rows);
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// ✅ POST /api/loyalty/achievements/:id/mark-seen - Oznacz osiągnięcie jako zobaczone
app.post('/api/loyalty/achievements/:id/mark-seen', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.query(
      'UPDATE user_achievements SET is_new = FALSE WHERE user_id = $1 AND achievement_id = $2',
      [userId, id]
    );

    res.json({ message: 'Achievement marked as seen' });
  } catch (err) {
    console.error('Error marking achievement:', err);
    res.status(500).json({ error: 'Failed to mark achievement' });
  }
});

// 🎨 GET /api/loyalty/rewards - Dostępne nagrody do odblokowania
app.get('/api/loyalty/rewards', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await pool.query(
      'SELECT loyalty_level FROM users WHERE id = $1',
      [userId]
    );

    const level = user.rows[0].loyalty_level;

    // Definicja wszystkich nagród
    const allRewards = {
    badges: [
      { 
        id: 'bronze', 
        name: 'Bronze Badge', 
        reqLevel: 1, 
        imageUrl: '/assets/badges/bronze.png'
      },
      { 
        id: 'silver', 
        name: 'Silver Badge', 
        reqLevel: 2, 
        imageUrl: '/assets/badges/silver.png'
      },
      { 
        id: 'gold', 
        name: 'Gold Badge', 
        reqLevel: 3, 
        imageUrl: '/assets/badges/gold.png'
      },
      { 
        id: 'platinum', 
        name: 'Platinum Badge', 
        reqLevel: 4, 
        imageUrl: '/assets/badges/platinum.png'
      },
      { 
        id: 'diamond', 
        name: 'Diamond Badge', 
        reqLevel: 5, 
        imageUrl: '/assets/badges/diamond.png'
      }
    ],
    titles: [
      { id: 'newbie', text: 'Newbie Collector', reqLevel: 1 },
      { id: 'enthusiast', text: 'Funko Enthusiast', reqLevel: 2 },
      { id: 'expert', text: 'Collection Expert', reqLevel: 3 },
      { id: 'master', text: 'Funko Master', reqLevel: 4 },
      { id: 'legend', text: 'Pop! Legend', reqLevel: 5 }
    ],
    themes: [
      { 
        id: 'default', 
        name: 'Default', 
        reqLevel: 1, 
        imageUrl: '/assets/themes/default.jpg'
      },
      { 
        id: 'ocean', 
        name: 'Ocean Blue', 
        reqLevel: 2, 
        reqPoints: 500,
        imageUrl: '/assets/themes/ocean-blue.jpg'
      },
      { 
        id: 'sunset', 
        name: 'Sunset Orange', 
        reqLevel: 3, 
        reqPoints: 1000,
        imageUrl: '/assets/themes/sunset-orange.jpg'
      },
      { 
        id: 'galaxy', 
        name: 'Galaxy Purple', 
        reqLevel: 4, 
        reqPoints: 2000,
        imageUrl: '/assets/themes/galaxy-purple.jpg'
      },
      { 
        id: 'emerald', 
        name: 'Emerald Green', 
        reqLevel: 5, 
        reqPoints: 3000,
        imageUrl: '/assets/themes/emerald-green.jpg'
      }
    ],
    avatars: [
      { 
        id: "ava_01", 
        name: "Cosmic Explorer", 
        imageUrl: "/assets/avatars/cosmic.png", 
        reqLevel: 1, 
        reqPoints: 1000 
      }
    ],
    backgrounds: [
      { 
        id: "bg_01", 
        name: "Nebula Sky", 
        imageUrl: "/assets/backgrounds/nebula.jpg", 
        reqLevel: 7, 
        reqPoints: 2000 
      }
    ]
  };

    // Odblokowane nagrody
    const unlocked = await pool.query(
      'SELECT reward_type, reward_id FROM user_rewards WHERE user_id = $1',
      [userId]
    );

    const unlockedSet = new Set(unlocked.rows.map(r => `${r.reward_type}:${r.reward_id}`));

    const available = {
      badges: allRewards.badges.filter(f => f.reqLevel <= level).map(f => ({
        ...f,
        unlocked: unlockedSet.has(`badge:${f.id}`)
      })),
      titles: allRewards.titles.filter(t => t.reqLevel <= level).map(t => ({
        ...t,
        unlocked: unlockedSet.has(`title:${t.id}`)
      })),
      themes: allRewards.themes.filter(t => t.reqLevel <= level).map(t => ({
        ...t,
        unlocked: unlockedSet.has(`theme:${t.id}`)
      })),
      badges: allRewards.badges?.filter(b => b.reqLevel <= level).map(b => ({
        ...b,
        unlocked: unlockedSet.has(`badge:${b.id}`)
      })) || [],
      avatars: allRewards.avatars?.filter(a => a.reqLevel <= level).map(a => ({
        ...a,
        unlocked: unlockedSet.has(`avatar:${a.id}`)
      })) || [],
      backgrounds: allRewards.backgrounds?.filter(bg => bg.reqLevel <= level).map(bg => ({
        ...bg,
        unlocked: unlockedSet.has(`background:${bg.id}`)
      })) || []
    };

    res.json(available);
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// 🔓 POST /api/loyalty/rewards/unlock - Odblokuj nagrodę
app.post('/api/loyalty/rewards/unlock', authenticateToken, async (req, res) => {
  const { rewardType, rewardId } = req.body;
  const userId = req.user.id;

  if (!['badge', 'title', 'theme'].includes(rewardType)) {
    return res.status(400).json({ error: 'Invalid reward type' });
  }

  try {
    await pool.query(
      `INSERT INTO user_rewards (user_id, reward_type, reward_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, reward_type, reward_id) DO NOTHING`,
      [userId, rewardType, rewardId]
    );

    res.json({ message: 'Reward unlocked', rewardType, rewardId });
  } catch (err) {
    console.error('Error unlocking reward:', err);
    res.status(500).json({ error: 'Failed to unlock reward' });
  }
});

// 🎨 PATCH /api/loyalty/rewards/activate - Aktywuj nagrodę (ustaw jako aktywną)
app.patch('/api/loyalty/rewards/activate', authenticateToken, async (req, res) => {
  const { rewardType, rewardId } = req.body;
  const userId = req.user.id;

  try {
    const column = rewardType === 'badge' ? 'profile_badge' 
                 : rewardType === 'title' ? 'active_title'
                 : 'active_theme';

    await pool.query(
      `UPDATE users SET ${column} = $1 WHERE id = $2`,
      [rewardId, userId]
    );

    res.json({ message: 'Reward activated', rewardType, rewardId });
  } catch (err) {
    console.error('Error activating reward:', err);
    res.status(500).json({ error: 'Failed to activate reward' });
  }
});

// 🔥 GET /api/loyalty/streak - Informacje o streak
app.get('/api/loyalty/streak', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await updateLoginStreak(userId);

    const streak = await pool.query(
      'SELECT current_streak, longest_streak, last_streak_date FROM users WHERE id = $1',
      [userId]
    );

    res.json(streak.rows[0]);
  } catch (err) {
    console.error('Error fetching streak:', err);
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// 📈 GET /api/loyalty/leaderboard - Ranking lojalności (zaktualizowany)
app.get('/api/loyalty/leaderboard', authenticateToken, async (req, res) => {
  const { filter = 'all' } = req.query;

  try {
    let timeFilter = '';
    if (filter === 'weekly') {
      timeFilter = `AND lph.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (filter === 'monthly') {
      timeFilter = `AND lph.created_at >= NOW() - INTERVAL '30 days'`;
    }

    const leaderboard = await pool.query(`
      SELECT 
        u.id,
        u.login,
        u.loyalty_points,
        u.loyalty_level,
        ll.badge_emoji,
        ll.level_name,
        (SELECT COUNT(*) FROM collection WHERE user_id = u.id) as collection_size,
        COALESCE(SUM(lph.points_change), 0) as period_points
      FROM users u
      JOIN loyalty_levels ll ON u.loyalty_level = ll.level_number
      LEFT JOIN loyalty_points_history lph ON u.id = lph.user_id ${timeFilter}
      WHERE u.loyalty_points > 0
      GROUP BY u.id, u.login, u.loyalty_points, u.loyalty_level, ll.badge_emoji, ll.level_name
      ORDER BY ${filter === 'all' ? 'u.loyalty_points' : 'period_points'} DESC
      LIMIT 50
    `);

    res.json(leaderboard.rows);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Dodaj updateLoginStreak do logowania
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, login, password_hash, name, surname, gender, date_of_birth, role, nationality
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

    // ✅ Aktualizuj streak przy logowaniu
    await updateLoginStreak(user.id);

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
});


// ======================
// SERVER STARTUP
// ======================
const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    await seedDatabase();
    await ensureAdminTables();
    // Ensure any existing invites have a persistent display_code
    const backfillDisplayCodes = async () => {
      try {
        const rows = await pool.query(`SELECT id, created_at FROM admin_invites WHERE display_code IS NULL OR display_code = ''`);
        if (rows.rows.length === 0) return;
        console.log(`ℹ️ Backfilling ${rows.rows.length} invite display_code(s)`);

        for (const r of rows.rows) {
          let attempts = 0;
          while (attempts < 5) {
            attempts += 1;
            const code = `INV-${String(r.id).padStart(3,'0')}-${Date.now().toString(36).toUpperCase().slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
            try {
              const upd = await pool.query(`UPDATE admin_invites SET display_code = $1 WHERE id = $2 AND (display_code IS NULL OR display_code = '') RETURNING id`, [code, r.id]);
              if (upd.rows.length > 0) break; // success
            } catch (err) {
              // unique violation or other conflict, retry with a new code
              console.warn(`Retrying display_code for invite ${r.id} (attempt ${attempts})`);
            }
          }
        }
      } catch (err) {
        console.error('Error backfilling display_code for invites:', err);
      }
    };

    await backfillDisplayCodes();

    await createInitialAdminIfNeeded();
    
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};


startServer();