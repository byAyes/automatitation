import { sendEmail } from '../src/lib/email';
import { formatJobDigest } from '../src/lib/email/template';

async function testEmail() {
  console.log('=== Testing Email Configuration ===\n');

  // Create a mock job for testing
  const mockJobs = [
    {
      id: 'test-job-1',
      title: 'Senior Software Engineer',
      company: 'Test Company',
      location: 'Remote',
      url: 'https://example.com/job/1',
      matchScore: 85,
      matchedSkills: ['JavaScript', 'React', 'Node.js'],
      matchedInterests: ['remote work', 'fullstack'],
      salary: '$120k - $150k'
    }
  ];

  const interests = ['remote work', 'javascript', 'react'];
  const emailBody = formatJobDigest(mockJobs, 'software engineer', interests);

  console.log('Attempting to send test email...\n');
  console.log('From: ' + process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_RECIPIENT);
  console.log('To: ' + process.env.GMAIL_RECIPIENT);
  console.log('Subject: Test Job Digest - Software Engineer Jobs');

  const result = await sendEmail(
    process.env.GMAIL_RECIPIENT || 'test@example.com',
    'Test Job Digest - Software Engineer Jobs',
    emailBody
  );

  if (result.success) {
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('Message ID: ' + result.messageId);
  } else {
    console.log('\n❌ FAILED to send email');
    console.log('Error: ' + result.error);
  }

  console.log('\n=== Test Complete ===');
}

testEmail().catch(console.error);
