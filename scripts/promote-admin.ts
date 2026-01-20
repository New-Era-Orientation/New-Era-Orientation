// Script to promote a user to ADMIN role
// Run with: npx tsx scripts/promote-admin.ts <email>

import { db } from '../src/server/db';

async function promoteToAdmin(email: string) {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);

      // List all users
      const users = await db.user.findMany({
        select: { email: true, name: true, role: true }
      });

      console.log('\n📋 Available users:');
      users.forEach((u: any) => {
        console.log(`  - ${u.email} (${u.name || 'No name'}) - Role: ${u.role}`);
      });

      return;
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ User "${email}" is already an ADMIN`);
      return;
    }

    // Promote to ADMIN
    const updated = await db.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ Successfully promoted "${updated.email}" to ADMIN!`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Role: ${updated.role}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/promote-admin.ts <email>');
  console.log('');
  console.log('Listing all users...');

  db.user.findMany({
    select: { email: true, name: true, role: true }
  }).then((users: any) => {
    console.log('\n📋 All users:');
    if (users.length === 0) {
      console.log('  No users found');
    } else {
      users.forEach((u: any) => {
        const roleIcon = u.role === 'ADMIN' ? '👑' : '👤';
        console.log(`  ${roleIcon} ${u.email} (${u.name || 'No name'}) - ${u.role}`);
      });
    }
    process.exit(0);
  });
} else {
  promoteToAdmin(email).then(() => process.exit(0));
}
