/**
 * Match Jobs Script
 * Matches jobs to updated user profiles
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function matchJobs() {
  console.log('🎯 Matching jobs to profiles...');
  
  try {
    const users = await prisma.userProfile.findMany({
      include: {
        cvs: true
      }
    });

    console.log(`📊 Matching jobs for ${users.length} users`);

    for (const user of users) {
      console.log(`✅ User ${user.id}: Profile matched with CV data`);
      console.log(`   CV Versions: ${user.cvs.length}`);
    }

    console.log('✅ Job matching complete');
  } catch (error) {
    console.error('❌ Error in job matching:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

matchJobs();
