const { createClient } = require('@libsql/client');

async function main() {
  const libsql = createClient({ url: 'file:./dev.db' });
  try {
    const res = await libsql.execute('SELECT * FROM User');
    console.log("LIBSQL RES:", res.rows);
  } catch (e) {
    console.error("error:", e);
  }
}
main();
