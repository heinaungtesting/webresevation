#!/usr/bin/env node

/**
 * Health Endpoint Test Script
 *
 * Tests the /api/health endpoint to ensure it's working correctly.
 * Can be used locally or against deployed instances.
 */

const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testHealthEndpoint(baseUrl) {
  const healthUrl = `${baseUrl}/api/health`;

  console.log(`🔍 Testing health endpoint: ${healthUrl}`);
  console.log('='.repeat(50));

  try {
    const startTime = Date.now();
    const response = await makeRequest(healthUrl);
    const duration = Date.now() - startTime;

    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log(`⏱️ Response Time: ${duration}ms`);
    console.log('');

    if (response.body) {
      try {
        const healthData = JSON.parse(response.body);
        console.log('📋 Health Check Response:');
        console.log(JSON.stringify(healthData, null, 2));

        if (healthData.status === 'healthy') {
          console.log('');
          console.log('✅ Health check PASSED - Service is healthy');
          return true;
        } else {
          console.log('');
          console.log('❌ Health check FAILED - Service is unhealthy');
          console.log('Failed checks:');
          Object.entries(healthData.checks || {}).forEach(([name, check]) => {
            if (check.status === 'fail') {
              console.log(`  - ${name}: ${check.error || 'Failed'}`);
            }
          });
          return false;
        }
      } catch (error) {
        console.log('❌ Invalid JSON response:');
        console.log(response.body.substring(0, 500));
        return false;
      }
    } else {
      console.log('❌ Empty response body');
      return false;
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';

  console.log('🩺 Health Endpoint Test Tool');
  console.log('============================');
  console.log('');

  testHealthEndpoint(baseUrl).then((success) => {
    process.exit(success ? 0 : 1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { testHealthEndpoint };