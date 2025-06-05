import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Web-AppDB',
  port: 5432,
});

// 👇 Add this:
app.get('/', (req, res) => {
  res.send('Welcome to the Funko React App Backend API!');
});

app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { email, login, password, gender, date_of_birth } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (email, login, password_hash, gender, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, login, hashedPassword, gender, date_of_birth] // 5 values
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
  if (!email || !login || !password || !gender || !date_of_birth) {
  return res.status(400).json({ error: 'Missing required fields' });
}
});
// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    // Find user by login (or email if needed)
    const result = await pool.query(
      'SELECT * FROM users WHERE login = $1',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid login or password' });
    }

    const user = result.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid login or password' });
    }

    // Success! Return user data
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        gender: user.gender,
        date_of_birth: user.date_of_birth
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));