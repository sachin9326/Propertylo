const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => {
    console.log("Connected to PostgreSQL successfully.");
    return client.query("SELECT * FROM \"User\" LIMIT 1");
  })
  .then((res) => {
    console.log("Query success. Rows:", res.rows.length);
  })
  .catch(e => {
    console.error("Database connection/query error:", e.message);
  })
  .finally(() => {
    client.end();
  });
