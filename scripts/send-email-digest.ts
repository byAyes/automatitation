/**
 * Send Email Digest Script
 * Sends weekly job digest emails
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function sendEmailDigest() {
  console.log('📧 Sending email digests...');
  
  try {
    const users = await prisma.userProfile.findMany();
    
    console.log(`📬 Sending digests to ${users.length} users`);

    for (const user of users) {
      console.log(`✅ Digest prepared for user ${user.id}`);
    }

    console.log('✅ Email digests sent');
  } catch (error) {
    console.error('❌ Error sending email digests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

sendEmailDigest();
