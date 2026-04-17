require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

// Set up the Prisma adapter
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});

// Initialize Prisma Client with the adapter (REQUIRED for Prisma 7+)
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
