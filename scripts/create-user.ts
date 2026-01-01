// Script to create a new user account
// Run: npx tsx scripts/create-user.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔐 Create New User Account\n');

  const email = await question('Email: ');
  const password = await question('Password: ');
  const name = await question('Name (optional): ');
  const roleInput = await question('Role (user/admin) [default: user]: ');

  const role = roleInput.toLowerCase() === 'admin' ? 'admin' : 'user';

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.error(`\n❌ User with email ${email} already exists!`);
    rl.close();
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      role,
    },
  });

  console.log('\n✅ User created successfully!');
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  });

  rl.close();
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
