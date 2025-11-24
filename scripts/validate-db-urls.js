#!/usr/bin/env node

/**
 * Database URL Validation Script
 *
 * Validates DATABASE_URL and DIRECT_URL environment variables for proper format.
 * Helps debug Prisma connection issues.
 */

function validateDatabaseURL(url, name) {
  console.log(`\n🔍 Validating ${name}...`);

  if (!url) {
    console.log(`❌ ${name} is not set`);
    return false;
  }

  if (url.length < 10) {
    console.log(`❌ ${name} is too short: "${url}"`);
    return false;
  }

  // Check scheme
  if (!url.startsWith('postgresql://')) {
    console.log(`❌ ${name} must start with 'postgresql://'`);
    console.log(`   Current: ${url.substring(0, 20)}...`);
    return false;
  }

  // Basic URL parsing test
  try {
    const urlObj = new URL(url);
    console.log(`✅ ${name} format is valid`);
    console.log(`   Host: ${urlObj.hostname}`);
    console.log(`   Port: ${urlObj.port || 5432}`);
    console.log(`   Database: ${urlObj.pathname.substring(1) || 'postgres'}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} is not a valid URL: ${error.message}`);
    console.log(`   URL: ${url.substring(0, 50)}...`);
    return false;
  }
}

function main() {
  console.log('🔗 Database URL Validation Tool');
  console.log('================================');

  const DATABASE_URL = process.env.DATABASE_URL;
  const DIRECT_URL = process.env.DIRECT_URL;

  let isValid = true;

  isValid &= validateDatabaseURL(DATABASE_URL, 'DATABASE_URL');
  isValid &= validateDatabaseURL(DIRECT_URL, 'DIRECT_URL');

  console.log('\n' + '='.repeat(40));
  if (isValid) {
    console.log('✅ All database URLs are valid!');
    process.exit(0);
  } else {
    console.log('❌ Database URL validation failed!');
    console.log('\n💡 Common fixes:');
    console.log('   • Use postgresql:// (not postgres://)');
    console.log('   • URL-encode special characters in passwords');
    console.log('   • Check for missing @ or : characters');
    console.log('   • Ensure quotes around URLs with special chars');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateDatabaseURL };