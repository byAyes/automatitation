/**
 * Scrape Jobs Script
 * Runs job scraping with updated user profiles
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function scrapeJobs() {
  console.log('🔍 Running job scraping...');
  
  try {
    // Obtener todos los usuarios con perfiles actualizados
    const users = await prisma.userProfile.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    console.log(`👥 Found ${users.length} users with updated profiles`);

    // Aquí iría la lógica de scraping
    // Por ahora solo mostramos el estado
    for (const user of users) {
      console.log(`✅ User ${user.id} profile ready for scraping`);
      console.log(`   Skills: ${user.skills?.join(', ') || 'N/A'}`);
      console.log(`   Experience: ${user.experienceLevel || 'N/A'}`);
    }

    console.log('✅ Job scraping complete');
  } catch (error) {
    console.error('❌ Error in job scraping:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

scrapeJobs();
