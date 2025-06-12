import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json()); // Parses JSON body for all requests

// Enable CORS for all routes (important for development)
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Web-AppDB',
  port: 5432,
});

// Test DB connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});

// Root endpoint for testing API
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

    // Use correct column names matching your DB schema
    const newUser = await pool.query(
      `INSERT INTO users (email, login, name, surname, password_hash, gender, date_of_birth) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, login, name, surname, gender, date_of_birth`,
      [email, login, name, surname, hashedPassword, gender, date_of_birth]
    );

    res.status(201).json(newUser.rows[0]);

  } catch (err) {
    if (err.code === '23505') {
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
    // Fetch columns using correct names (aliased for response)
    const result = await pool.query(
      `SELECT id, email, login, password_hash, 
              name, 
              surname, 
              gender, date_of_birth 
       FROM users 
       WHERE login = $1`,
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

    // Remove password_hash before sending response
    const { password_hash, ...safeUser } = user;
    res.json({ 
      message: 'Login successful', 
      user: safeUser 
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
