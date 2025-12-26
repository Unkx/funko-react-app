const { Pool } = require('pg');
require('dotenv').config();

const adminPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: 'postgres',  // Connect to default postgres database first
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'Web-AppDB';
  
  try {
    console.log(`🔍 Checking if database '${dbName}' exists...`);
    
    // Check if database exists
    const checkResult = await adminPool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (checkResult.rows.length === 0) {
      console.log(`📦 Creating database '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database '${dbName}' created`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }
    
    // Now connect to the actual database
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'postgres',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });
    
    // Create tables
    console.log('🔧 Creating tables...');
    
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        login VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(100),
        surname VARCHAR(100),
        gender VARCHAR(20),
        date_of_birth DATE,
        role VARCHAR(50) DEFAULT 'user',
        nationality VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS funko_items (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        number VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        series JSONB,
        exclusive BOOLEAN DEFAULT FALSE,
        image_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS collection (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        funko_id VARCHAR(255) REFERENCES funko_items(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, funko_id)
      );
    `);
    
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        funko_id VARCHAR(255) REFERENCES funko_items(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, funko_id)
      );
    `);
    
    console.log('✅ Database setup complete');
    await appPool.end();
    await adminPool.end();
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    process.exit(1);
  }
}

ensureDatabaseExists();