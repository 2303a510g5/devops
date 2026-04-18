const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'hospital_db',
  max: 10,
});


async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅  PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌  PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
}

async function query(sql, params = []) {
  // convert ? to $1, $2 dynamically for postgres parameter binding
  let i = 1;
  const pgSql = sql.replace(/\?/g, () => '$' + (i++));
  
  // Append RETURNING id to inserts so we can mimic mysql2 insertId behavior
  let finalSql = pgSql;
  const isInsert = finalSql.trim().toUpperCase().startsWith('INSERT INTO');
  if (isInsert && !finalSql.toUpperCase().includes('RETURNING')) {
    finalSql += ' RETURNING id';
  }

  const res = await pool.query(finalSql, params);
  
  // Return something shaped exactly like mysql2 for drop-in compatibility
  if (res.command === 'INSERT' || res.command === 'UPDATE' || res.command === 'DELETE') {
    return { 
      affectedRows: res.rowCount,
      insertId: (res.rows && res.rows[0] && res.rows[0].id) ? res.rows[0].id : null
    };
  }
  
  return res.rows;
}

module.exports = { pool, query, testConnection };
