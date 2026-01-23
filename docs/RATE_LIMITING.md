# 🔒 Rate Limiting Implementation

## Overview

Aplikasi Syntel telah diproteksi dengan **Rate Limiting** menggunakan **LRU Cache** in-memory solution untuk mencegah abuse dan memastikan stabilitas sistem.

## 📊 Configured Limits

### Authentication Endpoints
| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/login` | 5 requests | 15 menit | Mencegah brute force attacks |
| `/api/auth/register` | 3 requests | 15 menit | Mencegah spam registrasi |

### File Operations
| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/archive/resources` (POST) | 50 uploads | 30 menit | Mengontrol resource usage |
| `/api/archive/resources` (DELETE) | No limit | - | Tidak dibatasi |

### Content Management
| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/staff/submissions` (POST) | 10 submissions | 1 jam | Mencegah spam submissions |
| `/api/officer/instructions` (POST) | 20 instructions | 1 jam | Mengontrol task creation |

### General API (Reserved for future use)
| Type | Limit | Window | Purpose |
|------|-------|--------|---------|
| Read Operations (GET) | 100 requests | 1 menit | Mencegah polling abuse |
| Write Operations (POST/PUT/PATCH) | 30 requests | 1 menit | Mengontrol mutations |

## 🛠️ Technical Details

### Implementation
- **Package**: `lru-cache` (in-memory caching)
- **Identifier**: IP address (dari `X-Forwarded-For` atau `X-Real-IP` headers)
- **Storage**: LRU Cache with automatic TTL cleanup
- **Scope**: Per-IP basis (bisa di-extend ke per-user basis)

### Response Format

#### Success Response
```json
{
  "message": "...",
  "data": { ... }
}
```

#### Rate Limited Response (HTTP 429)
```json
{
  "error": "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
  "retryAfter": 900,
  "retryAfterMinutes": 15
}
```

Response headers:
- `Retry-After`: Seconds until next attempt allowed
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Window`: Time window in seconds

## 📖 Usage Examples

### Using Rate Limiters in API Routes

```typescript
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
    // Get client identifier (IP address)
    const identifier = getClientIdentifier(request);
    
    // Check rate limit
    const rateLimitResult = await rateLimiters.authLogin.check(identifier);
    
    // If rate limited, return error response
    if (!rateLimitResult.success) {
        return createRateLimitResponse(RATE_LIMITS.AUTH_LOGIN, rateLimitResult.retryAfter);
    }
    
    // Continue with normal flow
    // ...
}
```

### Creating Custom Rate Limiter

```typescript
import { createRateLimiter } from "@/lib/rate-limit";

const customLimiter = createRateLimiter({
  limit: 100,
  window: 60 * 60 * 1000, // 1 hour
  message: "Pesan error custom Anda",
});

// Use it
const result = await customLimiter.check("user-123");
if (!result.success) {
  // Handle rate limit
}
```

### Getting Usage Stats

```typescript
const usage = rateLimiters.authLogin.getUsage(identifier);
console.log(usage);
// Output: { current: 3, limit: 5, remaining: 2 }
```

### Resetting a User's Limit (Admin only)

```typescript
rateLimiters.authLogin.reset(identifier);
```

## 🔄 Extending Rate Limiting

### Per-User Rate Limiting

Untuk rate limiting berdasarkan user (bukan IP):

```typescript
import { getUserIdentifier } from "@/lib/rate-limit";

// Di dalam POST handler, setelah authentication
const userIdentifier = getUserIdentifier(user.nip);
const rateLimitResult = await rateLimiters.createSubmission.check(userIdentifier);
```

### Adding to New Endpoints

1. Import utilities:
```typescript
import { rateLimiters, getClientIdentifier, RATE_LIMITS, createRateLimitResponse } from "@/lib/rate-limit";
```

2. Add check at the start of handler:
```typescript
const identifier = getClientIdentifier(request);
const rateLimitResult = await rateLimiters.apiWrite.check(identifier);

if (!rateLimitResult.success) {
    return createRateLimitResponse(RATE_LIMITS.API_WRITE, rateLimitResult.retryAfter);
}
```

3. Continue with normal logic

## ⚙️ Configuration

Semua konfigurasi ada di `lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  AUTH_LOGIN: {
    limit: 5,
    window: 15 * 60 * 1000,
    message: '...',
  },
  // ... more configs
}
```

Untuk mengubah limit, edit nilai di file tersebut dan restart server.

## 🚨 Monitoring & Debugging

### Development Mode
Rate limiting aktif di development mode. Untuk disable saat testing:

```typescript
// Temporary disable (not recommended for production)
if (process.env.NODE_ENV === 'development') {
  // Skip rate limit check
}
```

### Production Monitoring
Untuk production, consider:
1. Log rate limit hits ke monitoring service
2. Track patterns untuk adjust limits
3. Alert jika ada spike dalam rate limit hits

### Testing Rate Limits
```bash
# Test login rate limit (hit 6 times)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done
```

Expected: First 5 succeed, 6th returns 429.

## 🔐 Security Considerations

1. **IP Spoofing**: Rate limiting berdasarkan `X-Forwarded-For` header. Pastikan reverse proxy configured correctly.
2. **Distributed Attacks**: In-memory cache tidak shared across instances. Untuk multi-instance deployment, consider Upstash or Redis.
3. **User Feedback**: Error messages informatif dalam Bahasa Indonesia untuk UX yang baik.

## 🚀 Future Improvements

Consider untuk future:
- [ ] Migrate to Upstash Rate Limit untuk multi-instance support
- [ ] Add user-based rate limiting untuk authenticated endpoints
- [ ] Dashboard untuk monitoring rate limit metrics
- [ ] Dynamic rate limits berdasarkan user role (OFFICER vs STAFF)
- [ ] Whitelist untuk internal IPs

## 📞 Support

Jika ada issues dengan rate limiting:
1. Check console logs untuk rate limit hits
2. Verify client identifier is correct
3. Ensure LRU cache is working properly
4. Check if limits are appropriate for your use case
