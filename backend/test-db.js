# Create the test file
@"
const { Pool } = require('pg');

console.log('🔍 Testing database connection to Web-AppDB...');
console.log('📋 Environment variables:');
console.log('- DB_HOST:', process.env.DB_HOST || 'postgres');
console.log('- DB_NAME:', process.env.DB_NAME || 'Web-AppDB');
console.log('- DB_USER:', process.env.DB_USER || 'postgres');
console.log('- DB_PORT:', process.env.DB_PORT || 5432);

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'Web-AppDB',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log('\n🚀 Attempting to connect...');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check current database
    const dbResult = await client.query('SELECT current_database() as db');
    console.log('📊 Current database:', dbResult.rows[0].db);
    
    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('🔄 PostgreSQL version:', versionResult.rows[0].version.split('\n')[0]);
    
    // List tables in database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }
    
    client.release();
    console.log('\n🎉 SUCCESS! Database connection test passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR DETAILS:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack ? error.stack.split('\n')[0] : 'No stack');
    
    // Common error diagnostics
    if (error.code === '3D000') {
      console.error('\n💡 SUGGESTION: Database "Web-AppDB" does not exist.');
      console.error('   Run: docker-compose exec postgres psql -U postgres -c \"CREATE DATABASE \\\"Web-AppDB\\\";\"');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 SUGGESTION: Cannot connect to PostgreSQL. Is it running?');
      console.error('   Run: docker-compose ps');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('\n💡 SUGGESTION: Cannot resolve host "postgres". Network issue?');
      console.error('   Run: docker-compose run --rm backend ping postgres');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();
"@ | Set-Content backend\test-db.js -Encoding UTF8