const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = require('./db');

async function main() {
  const password = "password";
  const email = "sachinkumar86413@gmail.com";
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const user = await prisma.user.create({
      data: {
        name: "Sachin Kumar",
        email: email,
        password: hashedPassword,
        role: "UPLOADER",
      },
    });
    console.log("Created user successfully:", user.email);
  } catch (e) {
    if (e.code === 'P2002') console.log("User already exists!");
    else console.error(e);
  }
  
  // also create one with 123456 just in case
  const hashedPassword2 = await bcrypt.hash("123456", salt);
  try {
     const user2 = await prisma.user.create({
      data: {
        name: "Sachin Kumar",
        email: "sachin@gmail.com",
        password: hashedPassword2,
        role: "UPLOADER",
      },
    });
    console.log("Created second user:", user2.email);
  } catch(e) {}
}

main();
