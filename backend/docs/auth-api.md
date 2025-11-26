# Authentication API Documentation

This document outlines the authentication endpoints and their usage for the backend API.

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Login
Authenticates a user and returns a JWT token.

**Endpoint:** `/login`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

#### Successful Response (200 OK)
```json
{
  "token": "string",
  "userId": "string",
  "role": "string",
  "message": "Login successful"
}
```

#### Error Responses

**Invalid Credentials (400 Bad Request)**
```json
{
  "message": "Invalid credentials"
}
```

**Server Error (500 Internal Server Error)**
```json
{
  "message": "Server error"
}
```

## Authentication

### JWT Token
- The API uses JWT (JSON Web Token) for authentication
- Tokens expire after 1 hour
- Include the token in the Authorization header for protected routes:
```
Authorization: Bearer <token>
```

## User Roles
The system supports the following roles:
- `Admin`: Administrative access
- Additional roles can be added as needed

## Initial Setup
The system automatically creates an admin user on first run with the following credentials:
- Username: `admin`
- Password: `admin123`

> **Security Note:** It's recommended to change the default admin password after first login.

## Error Handling
All endpoints follow a consistent error response format:
```json
{
  "message": "string"
}
```

## Status Codes
- `200`: Successful request
- `400`: Bad request / Invalid credentials
- `500`: Server error

## Sample Usage (Frontend)

### Login Request Example
```javascript
const loginUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data; // Contains token, userId, role, and message
  } catch (error) {
    throw error;
  }
};
```

## Notes
- All responses are in JSON format
- Passwords are hashed using bcrypt before storage
- JWT tokens contain user ID and role information
- The API uses environment variables for sensitive data (JWT_SECRET)
```

This documentation provides a comprehensive overview of the authentication system. You can refer to this when implementing the frontend authentication logic. The documentation includes all necessary information about endpoints, request/response formats, authentication methods, and even includes a practical example for frontend implementation.

