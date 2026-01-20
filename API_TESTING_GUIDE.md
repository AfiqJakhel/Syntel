# Panduan Testing API Syntel dengan Postman

Pastikan server berjalan dengan `npm run dev` sebelum melakukan testing.

## 1. Login API

Endpoint ini memungkinkan user masuk menggunakan **NIP**, **Username**, atau **Email**.

- **URL**: `http://localhost:3000/api/auth/login`
- **Method**: `POST`
- **Body Type**: `raw` (JSON)

### Contoh Input (JSON)

**Menggunakan NIP:**
```json
{
  "identifier": "198501012010",
  "password": "password123"
}
```

**Menggunakan Username:**
```json
{
  "identifier": "ahmad.susanto",
  "password": "password123"
}
```

**Menggunakan Email:**
```json
{
  "identifier": "ahmad.susanto@telkom.co.id",
  "password": "password123"
}
```

### Response Sukses (200 OK)
```json
{
  "message": "Login berhasil",
  "user": {
    "nip": "198501012010",
    "firstName": "Ahmad",
    "lastName": "Susanto",
    "username": "ahmad.susanto",
    "email": "ahmad.susanto@telkom.co.id",
    "phone": "081234567801",
    "termsAccepted": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Response Gagal (401 Unauthorized)
```json
{
  "error": "Akun tidak ditemukan atau password salah"
}
```

---

## 2. Register API

Endpoint ini untuk mendaftarkan user baru.

- **URL**: `http://localhost:3000/api/auth/register`
- **Method**: `POST`
- **Body Type**: `raw` (JSON)

### Contoh Input (JSON)
```json
{
  "nip": "20240101001",
  "firstName": "Budi",
  "lastName": "Tester",
  "username": "budi.tester",
  "email": "budi.tester@telkom.co.id",
  "phone": "081234567890",
  "password": "passwordRaHasia!23",
  "termsAccepted": true
}
```

### Response Sukses (201 Created)
```json
{
  "message": "Registrasi berhasil",
  "user": {
    "nip": "20240101001",
    "firstName": "Budi",
    "lastName": "Tester",
    "username": "budi.tester",
    "email": "budi.tester@telkom.co.id",
    "...": "..."
  }
}
```

### Response Gagal (409 Conflict)
Jika NIP/Email/Username sudah ada:
```json
{
  "error": "NIP sudah terdaftar"
}
```
