import { LRUCache } from 'lru-cache';

// Rate limit tiers configuration
export const RATE_LIMITS = {
    // Authentication - Strict limits untuk prevent brute force
    AUTH_LOGIN: {
        limit: 5,
        window: 15 * 60 * 1000, // 15 menit
        message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
    },
    AUTH_REGISTER: {
        limit: 3,
        window: 15 * 60 * 1000, // 15 menit
        message: 'Terlalu banyak percobaan registrasi. Silakan coba lagi dalam 15 menit.',
    },

    // File Operations - Custom limit sesuai request
    FILE_UPLOAD: {
        limit: 50,
        window: 30 * 60 * 1000, // 30 menit
        message: 'Anda telah mencapai batas upload file (50 file per 30 menit). Silakan tunggu sebentar.',
    },
    FILE_DELETE: {
        limit: 30,
        window: 60 * 60 * 1000, // 1 jam
        message: 'Terlalu banyak operasi hapus file. Silakan coba lagi nanti.',
    },

    // Submissions & Instructions
    CREATE_SUBMISSION: {
        limit: 10,
        window: 60 * 60 * 1000, // 1 jam
        message: 'Batas pembuatan submission tercapai (10 per jam). Silakan tunggu sebentar.',
    },
    UPDATE_SUBMISSION: {
        limit: 30,
        window: 60 * 60 * 1000, // 1 jam
        message: 'Terlalu banyak update submission. Silakan coba lagi nanti.',
    },
    CREATE_INSTRUCTION: {
        limit: 20,
        window: 60 * 60 * 1000, // 1 jam
        message: 'Batas pembuatan instruksi tercapai (20 per jam). Silakan tunggu sebentar.',
    },

    // General API limits
    API_READ: {
        limit: 100,
        window: 60 * 1000, // 1 menit
        message: 'Terlalu banyak request. Silakan tunggu sebentar.',
    },
    API_WRITE: {
        limit: 30,
        window: 60 * 1000, // 1 menit
        message: 'Terlalu banyak operasi write. Silakan tunggu sebentar.',
    },
} as const;

type RateLimitConfig = {
    limit: number;
    window: number;
    message: string;
};

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig) {
    const cache = new LRUCache<string, number[]>({
        max: 500, // Maximum number of unique tokens to track
        ttl: config.window, // Time to live sama dengan window
    });

    return {
        /**
         * Check if the request is rate limited
         * @param identifier - Unique identifier (IP address, user ID, NIP, etc.)
         * @returns Promise that resolves if allowed, rejects if rate limited
         */
        check: async (identifier: string): Promise<{ success: true } | { success: false; retryAfter: number }> => {
            const tokenCount = cache.get(identifier) || [0];

            if (tokenCount[0] === 0) {
                cache.set(identifier, tokenCount);
            }

            tokenCount[0] += 1;
            const currentUsage = tokenCount[0];
            const isRateLimited = currentUsage > config.limit;

            if (isRateLimited) {
                // Calculate retry after in seconds
                const retryAfter = Math.ceil(config.window / 1000);
                return { success: false, retryAfter };
            }

            return { success: true };
        },

        /**
         * Get current usage for an identifier
         */
        getUsage: (identifier: string): { current: number; limit: number; remaining: number } => {
            const tokenCount = cache.get(identifier) || [0];
            const current = tokenCount[0];
            const remaining = Math.max(0, config.limit - current);

            return {
                current,
                limit: config.limit,
                remaining,
            };
        },

        /**
         * Reset limit for an identifier (useful for testing or manual override)
         */
        reset: (identifier: string): void => {
            cache.delete(identifier);
        },
    };
}

/**
 * Get client identifier from request
 * Priority: X-Forwarded-For > X-Real-IP > Connection Remote Address
 */
export function getClientIdentifier(request: Request): string {
    // Try to get IP from headers (for reverse proxy/load balancer)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs, get the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a default identifier
    return 'unknown';
}

/**
 * Get user-specific identifier (for authenticated requests)
 * This should be used when you want to rate limit per user instead of per IP
 */
export function getUserIdentifier(userNip: string): string {
    return `user:${userNip}`;
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(config: RateLimitConfig, retryAfter: number) {
    return new Response(
        JSON.stringify({
            error: config.message,
            retryAfter,
            retryAfterMinutes: Math.ceil(retryAfter / 60),
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': config.limit.toString(),
                'X-RateLimit-Window': (config.window / 1000).toString(),
            },
        }
    );
}

/**
 * Pre-configured rate limiters for easy use
 */
export const rateLimiters = {
    authLogin: createRateLimiter(RATE_LIMITS.AUTH_LOGIN),
    authRegister: createRateLimiter(RATE_LIMITS.AUTH_REGISTER),
    fileUpload: createRateLimiter(RATE_LIMITS.FILE_UPLOAD),
    fileDelete: createRateLimiter(RATE_LIMITS.FILE_DELETE),
    createSubmission: createRateLimiter(RATE_LIMITS.CREATE_SUBMISSION),
    updateSubmission: createRateLimiter(RATE_LIMITS.UPDATE_SUBMISSION),
    createInstruction: createRateLimiter(RATE_LIMITS.CREATE_INSTRUCTION),
    apiRead: createRateLimiter(RATE_LIMITS.API_READ),
    apiWrite: createRateLimiter(RATE_LIMITS.API_WRITE),
} as const;
