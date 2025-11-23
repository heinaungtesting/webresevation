import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Sentry error tracking is working
 * Visit /api/test-sentry to trigger a test error
 */
export async function GET(request: NextRequest) {
  try {
    // Log a test message
    console.log('Testing Sentry integration...');

    // Capture a test message
    Sentry.addBreadcrumb({
      message: 'Test Sentry endpoint called',
      level: 'info',
    });

    // Intentionally throw an error to test Sentry
    throw new Error('This is a test error for Sentry - ignore this');

  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);

    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry successfully!',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      instructions: 'Check your Sentry dashboard to see if the error was captured'
    }, { status: 200 });
  }
}

/**
 * Test success case - no error thrown
 */
export async function POST(request: NextRequest) {
  // Add a breadcrumb for successful operation
  Sentry.addBreadcrumb({
    message: 'Test Sentry success endpoint called',
    level: 'info',
  });

  // Capture a custom message
  Sentry.captureMessage('Test message from Sentry integration test', 'info');

  return NextResponse.json({
    success: true,
    message: 'Test message sent to Sentry successfully!',
    timestamp: new Date().toISOString(),
    instructions: 'Check your Sentry dashboard to see if the message was captured'
  });
}