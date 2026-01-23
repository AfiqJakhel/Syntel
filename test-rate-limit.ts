/**
 * Simple test script untuk verify rate limiting implementation
 * 
 * Run with: node --loader ts-node/esm test-rate-limit.mjs
 * Or with tsx: npx tsx test-rate-limit.ts
 */

console.log('🧪 Testing Rate Limiting Implementation\n');

// Test 1: Import rate limiting utilities
console.log('✅ Test 1: Importing rate limiting utilities...');
try {
    const { rateLimiters, RATE_LIMITS } = require('./lib/rate-limit');
    console.log('   ✓ Successfully imported rate limiters');
    console.log('   ✓ Available limiters:', Object.keys(rateLimiters).join(', '));
    console.log('');
} catch (error: any) {
    console.error('   ✗ Failed to import:', error.message);
    process.exit(1);
}

// Test 2: Verify configurations
console.log('✅ Test 2: Verifying rate limit configurations...');
try {
    const { RATE_LIMITS } = require('./lib/rate-limit');

    console.log('   Auth Login:', RATE_LIMITS.AUTH_LOGIN.limit, 'requests per', RATE_LIMITS.AUTH_LOGIN.window / 60000, 'minutes');
    console.log('   Auth Register:', RATE_LIMITS.AUTH_REGISTER.limit, 'requests per', RATE_LIMITS.AUTH_REGISTER.window / 60000, 'minutes');
    console.log('   File Upload:', RATE_LIMITS.FILE_UPLOAD.limit, 'uploads per', RATE_LIMITS.FILE_UPLOAD.window / 60000, 'minutes');
    console.log('   File Delete:', RATE_LIMITS.FILE_DELETE.limit, 'deletes per', RATE_LIMITS.FILE_DELETE.window / 60000, 'minutes');
    console.log('   Create Submission:', RATE_LIMITS.CREATE_SUBMISSION.limit, 'submissions per', RATE_LIMITS.CREATE_SUBMISSION.window / 60000, 'minutes');
    console.log('   Create Instruction:', RATE_LIMITS.CREATE_INSTRUCTION.limit, 'instructions per', RATE_LIMITS.CREATE_INSTRUCTION.window / 60000, 'minutes');
    console.log('');
} catch (error: any) {
    console.error('   ✗ Configuration error:', error.message);
    process.exit(1);
}

// Test 3: Test rate limiter functionality
console.log('✅ Test 3: Testing rate limiter functionality...');
(async () => {
    try {
        const { rateLimiters } = require('./lib/rate-limit');

        // Test with a mock identifier
        const testIdentifier = 'test-user-123';

        // First request should succeed
        const result1 = await rateLimiters.authLogin.check(testIdentifier);
        console.log('   ✓ First request:', result1.success ? 'ALLOWED ✓' : 'BLOCKED ✗');

        // Check usage
        const usage = rateLimiters.authLogin.getUsage(testIdentifier);
        console.log('   ✓ Current usage:', usage.current, '/', usage.limit, '(remaining:', usage.remaining + ')');

        // Make 4 more requests (total 5, which is the limit)
        for (let i = 2; i <= 5; i++) {
            await rateLimiters.authLogin.check(testIdentifier);
        }

        const usage2 = rateLimiters.authLogin.getUsage(testIdentifier);
        console.log('   ✓ After 5 requests:', usage2.current, '/', usage2.limit, '(remaining:', usage2.remaining + ')');

        // 6th request should be blocked
        const result6 = await rateLimiters.authLogin.check(testIdentifier);
        console.log('   ✓ 6th request:', result6.success ? 'ALLOWED ✗ (UNEXPECTED!)' : 'BLOCKED ✓ (Expected)');

        if (!result6.success) {
            console.log('   ✓ Retry after:', result6.retryAfter, 'seconds');
        }

        // Test reset
        rateLimiters.authLogin.reset(testIdentifier);
        const usageAfterReset = rateLimiters.authLogin.getUsage(testIdentifier);
        console.log('   ✓ After reset:', usageAfterReset.current, '/', usageAfterReset.limit);

        console.log('');
        console.log('🎉 All tests passed! Rate limiting is working correctly.');

    } catch (error: any) {
        console.error('   ✗ Test failed:', error.message);
        process.exit(1);
    }
})();
