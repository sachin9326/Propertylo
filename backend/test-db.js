const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  try {
    const prisma = new PrismaClient();
    console.log("Connecting...");
    const users = await prisma.user.findMany();
    console.log("Users:", users);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
}
main();
