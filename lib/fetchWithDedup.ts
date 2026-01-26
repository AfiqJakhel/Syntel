// Utility for request deduplication and caching
// Prevents duplicate API calls within a short time window

interface CacheEntry {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 2000; // 2 seconds - prevents rapid duplicate calls
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Fetch with deduplication - prevents identical requests from being made
 * within a short time window. Also caches responses briefly.
 */
export async function fetchWithDedup<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const cacheKey = `${options?.method || 'GET'}:${url}`;
    const now = Date.now();

    // Check if we have a valid cached response
    const cached = cache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
    }

    // Check if there's already a pending request for this URL
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
        return pending as Promise<T>;
    }

    // Create new request
    const fetchPromise = fetch(url, options)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();

            // Cache the response
            cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
            });

            return data;
        })
        .finally(() => {
            // Remove from pending after completion
            pendingRequests.delete(cacheKey);
        });

    // Store as pending
    pendingRequests.set(cacheKey, fetchPromise);

    return fetchPromise as Promise<T>;
}

/**
 * Invalidate cache for a specific URL pattern
 */
export function invalidateCache(urlPattern?: string): void {
    if (!urlPattern) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.includes(urlPattern)) {
            cache.delete(key);
        }
    }

    // Also clear pending requests that match the pattern
    for (const key of pendingRequests.keys()) {
        if (key.includes(urlPattern)) {
            pendingRequests.delete(key);
        }
    }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    cache.clear();
    pendingRequests.clear();
}
