# Authentication Documentation

## Overview
This document outlines the authentication system implementation, including routes, middleware, and controllers.

## Authentication Endpoints

### Login
Authenticates a user and returns a JWT token.

**Route:** `POST /api/auth/login`

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Success Response (200):**
```json
{
    "token": "JWT_TOKEN_STRING",
    "userId": "USER_ID",
    "role": "USER_ROLE",
    "message": "Login successful"
}
```

**Error Responses:**
- `400 Bad Request`:
```json
{
    "message": "Invalid credentials"
}
```
- `500 Server Error`:
```json
{
    "message": "Server error"
}
```

## Authentication Middleware

### Token Verification
Middleware to verify JWT tokens and protect routes.

**Usage:**
```javascript
router.get('/protected-route', verifyToken, routeHandler);
```

**Header Required:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success:**
- Adds user object to request:
```javascript
req.user = {
    _id: "USER_ID",
    role: "USER_ROLE"
}
```

**Error Responses:**
- `401 Unauthorized`:
```json
{
    "message": "Access Denied. No token provided."
}
```
- `403 Forbidden`:
```json
{
    "message": "Invalid token"
}
```

### Admin Authorization
Middleware to restrict routes to admin users only.

**Usage:**
```javascript
router.get('/admin-route', verifyToken, isAdmin, routeHandler);
```

**Error Response (403):**
```json
{
    "message": "Access Denied. Admins only!"
}
```

## JWT Token Structure

**Payload:**
```json
{
    "userId": "USER_ID",
    "role": "USER_ROLE",
    "exp": "EXPIRATION_TIMESTAMP"
}
```

**Configuration:**
- Token Expiration: 1 hour
- Secret Key: Stored in `JWT_SECRET` environment variable

## Initial Setup

### Admin Initialization
- System automatically checks for admin user on startup
- Creates default admin if none exists:
  - Username: "admin"
  - Password: "admin123"
  - Role: "Admin"

## Security Considerations

1. **Password Security:**
   - Passwords are hashed using bcrypt
   - Plain text passwords are never stored

2. **Token Security:**
   - JWT tokens are signed with a secret key
   - Tokens expire after 1 hour
   - Bearer token authentication scheme

3. **Authorization Flow:**
   - Token verification
   - Role-based access control
   - Separate admin privileges

## Environment Variables Required

```plaintext
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_connection_string
PORT=5000 (default)
```

## Dependencies

- jsonwebtoken: JWT token generation and verification
- bcryptjs: Password hashing
- dotenv: Environment variable management
```

This documentation provides a comprehensive overview of the authentication system. It includes all the necessary information for developers to understand and implement the authentication flow in the application.