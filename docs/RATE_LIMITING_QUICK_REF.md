# 🔒 Rate Limiting - Quick Reference

## ✅ Protected Endpoints

### 🔐 Authentication (STRICT)
- **Login**: 5 attempts / 15 menit
- **Register**: 3 attempts / 15 menit

### 📁 File Operations
- **Upload (POST)**: 50 uploads / 30 menit
- **Delete (DELETE)**: ❌ Tidak dibatasi

### 📝 Content Management
- **Create Submission**: 10 submissions / 1 jam
- **Create Instruction**: 20 instructions / 1 jam

## 🚫 Response Ketika Rate Limited

```json
{
  "error": "Pesan error dalam Bahasa Indonesia",
  "retryAfter": 1800,
  "retryAfterMinutes": 30
}
```

HTTP Status: **429 Too Many Requests**

## 🛠️ Cara Mengubah Limit

Edit file: `lib/rate-limit.ts`

```typescript
export const RATE_LIMITS = {
  FILE_UPLOAD: {
    limit: 50,  // ← Ubah angka ini
    window: 30 * 60 * 1000,  // ← Atau durasi ini
    message: 'Pesan error...', 
  },
}
```

Restart server setelah perubahan.

## 📊 Monitor Usage

```typescript
const usage = rateLimiters.fileUpload.getUsage(identifier);
console.log(usage);
// { current: 45, limit: 50, remaining: 5 }
```

## 🔄 Reset Manual (Debugging)

```typescript
rateLimiters.fileUpload.reset(identifier);
```

## 📖 Full Documentation

Lihat: `docs/RATE_LIMITING.md`
