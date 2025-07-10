import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Web-AppDB',
    port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected at:', res.rows[0].now);
    }
});

// --- JWT Configuration ---
// IMPORTANT: In production, always set JWT_SECRET via environment variables.
// For development, ensure this string is consistent everywhere.
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
console.log(`Using JWT_SECRET (first 5 chars): ${JWT_SECRET.substring(0, 5)}...`); // Debug secret

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(`[AUTH] Received Authorization header: ${authHeader}`); // DEBUG 1

    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.error('[AUTH ERROR] No token provided.'); // DEBUG 2
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error(`[AUTH ERROR] JWT Verification Failed: ${err.message}`); // DEBUG 3
            // console.error('[AUTH ERROR] Malformed/Expired Token:', token); // Uncomment for deeper token debug
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        console.log(`[AUTH SUCCESS] Token decoded. User payload:`, req.user); // DEBUG 4 - Check 'role' here!
        next();
    });
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
    console.log(`[ADMIN CHECK] Middleware called. req.user:`, req.user); // DEBUG 5
    if (!req.user) {
        console.error('[ADMIN CHECK ERROR] req.user is missing. This should not happen if authenticateToken succeeded.');
        return res.status(403).json({ error: 'Forbidden: User data missing' });
    }
    console.log(`[ADMIN CHECK] User role from token: ${req.user.role}`); // DEBUG 6

    if (req.user.role !== 'admin') {
        console.error(`[ADMIN CHECK ERROR] Forbidden - User is not admin. Actual role: ${req.user.role}`); // DEBUG 7
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    console.log('[ADMIN CHECK SUCCESS] User is admin. Proceeding.'); // DEBUG 8
    next();
};

app.get('/', (req, res) => {
    res.send('Welcome to the Funko React App Backend API!');
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, login, name, surname, password, gender, date_of_birth } = req.body;

    if (!email || !login || !name || !surname || !password || !gender || !date_of_birth) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await pool.query(
            `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, email, login, name, surname, gender, date_of_birth, role`,
            [email, login, name, surname, hashedPassword, gender, date_of_birth, 'user'] // Assign 'user' role
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
            return res.status(409).json({ error: 'User already exists' });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Updated Login Endpoint
app.post('/api/login', async (req, res) => {
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
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await pool.query(
            `UPDATE users SET last_login = NOW() WHERE id = $1`,
            [user.id]
        );

        // Generate JWT
        // Ensure user.role is correctly pulled from the DB and included here!
        const token = jwt.sign(
            { id: user.id, login: user.login, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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

// User settings update endpoint (protected)
app.put('/api/users/:id/settings', authenticateToken, async (req, res) => {
    // Ensure the authenticated user can only update their own settings
    // Or, if admin, can update anyone's settings
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

const ACTIVE_THRESHOLD_MINUTES = 15;

// Admin endpoint to get all users (protected by authenticateToken and isAdmin)
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, login, name, surname, gender, date_of_birth, role, created_at, last_login,
                    NOW() - last_login < INTERVAL '${ACTIVE_THRESHOLD_MINUTES} minutes' AS is_active
             FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching users for admin:", err); // Specific error message
        res.status(500).json({ error: "Server error fetching user data" });
    }
});

// Admin endpoint to delete a user (protected by authenticateToken and isAdmin)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));