const { Client } = require('pg');

const passwords = ["postgres", "1234", "12345", "123456", "root", "admin", "password", "sachin", "Sachin", "Sachin@123", "sachin123", ""];
const user = "postgres";
const host = "localhost";
const database = "postgres"; // Connect to default postgres db first instead of realestate
const port = 5432;

async function attempt(password) {
  const client = new Client({ user, host, database, password, port });
  try {
    await client.connect();
    console.log(`SUCCESS: ${password}`);
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  for (const pwd of passwords) {
    if (await attempt(pwd)) {
      console.log(`FOUND_PASSWORD_MATCH=${pwd}`);
      process.exit(0);
    }
  }
  console.log("FAILED_ALL");
  process.exit(1);
}

main();
