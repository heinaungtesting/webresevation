#!/usr/bin/env node

/**
 * Database Baseline Script
 *
 * Handles baselining an existing database that has schema but no migration history.
 * This marks the baseline migration as already applied without running it.
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

function main() {
  console.log('🔧 Database Baseline Tool');
  console.log('=========================');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('📋 This will mark the baseline migration as already applied.');
  console.log('   Use this when your database already has the schema but no migration history.');
  console.log('');

  // Mark the baseline migration as applied
  const result = runCommand(
    'npx prisma migrate resolve --applied 20241124000000_baseline',
    'Marking baseline migration as applied'
  );

  if (!result.success) {
    console.log('');
    console.log('💡 Alternative approaches:');
    console.log('   1. Use `npx prisma db push` to sync schema without migrations');
    console.log('   2. Use `npx prisma migrate reset` to start fresh (⚠️ DESTROYS DATA)');
    console.log('   3. Manually baseline: https://pris.ly/d/migrate-baseline');
    process.exit(1);
  }

  // Verify migration status
  console.log('');
  const statusResult = runCommand(
    'npx prisma migrate status',
    'Checking migration status'
  );

  if (statusResult.success) {
    console.log('');
    console.log('🎉 Database baseline completed successfully!');
    console.log('   You can now use `npx prisma migrate deploy` for future migrations.');
  }
}

if (require.main === module) {
  main();
}