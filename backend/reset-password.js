const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  const password = "password";
  const email = "sachinkumar86413@gmail.com";
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    console.log("Password reset successfully for:", email);
  } catch (e) {
    console.error(e);
  }
}

main();
