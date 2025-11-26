# User Management API Documentation

This document outlines the user management endpoints and their usage for the backend API.

## Base URL
```
http://localhost:3000/api/users
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Register User (Public)
Creates a new user account.

**Endpoint:** `/register`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request Body
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "contact_number": "string (optional)"
}
```

#### Successful Response (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "credentialId": "string",
    "name": "string",
    "email": "string"
  }
}
```

### 2. Login User (Public)
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
  "message": "Login successful"
}
```

### 3. Get All Users (Protected)
Retrieves all users in the system.

**Endpoint:** `/`
**Method:** `GET`
**Authentication:** Required

#### Successful Response (200 OK)
```json
[
  {
    "credentialId": {
      "username": "string",
      "role": "string"
    },
    "name": "string",
    "email": "string",
    "contact_number": "string",
    "address": "string",
    "skills": ["string"],
    "preferences": {},
    "profile_picture": {
      "url": "string",
      "upload_date": "date"
    }
  }
]
```

### 4. Get User by ID (Protected)
Retrieves a specific user's details.

**Endpoint:** `/:id`
**Method:** `GET`
**Authentication:** Required

#### Successful Response (200 OK)
```json
{
  "credentialId": {
    "username": "string",
    "role": "string"
  },
  "name": "string",
  "email": "string",
  "contact_number": "string",
  "address": "string",
  "skills": ["string"],
  "preferences": {},
  "profile_picture": {
    "url": "string",
    "upload_date": "date"
  }
}
```

### 5. Create User (Protected/Admin)
Creates a new user by an administrator.

**Endpoint:** `/create`
**Method:** `POST`
**Authentication:** Required
**Content-Type:** `application/json`

#### Request Body
```json
{
  "username": "string",
  "password": "string",
  "role": "string",
  "name": "string",
  "email": "string"
}
```

#### Successful Response (201 Created)
```json
{
  "message": "User created successfully. User can login to complete their profile.",
  "user": {
    "credentialId": "string",
    "name": "string",
    "email": "string",
    "contact_number": "",
    "address": "",
    "skills": [],
    "preferences": {},
    "profile_picture": null
  }
}
```

### 6. Update User (Protected)
Updates user information.

**Endpoint:** `/:id`
**Method:** `PATCH`
**Authentication:** Required
**Content-Type:** `application/json`

#### Request Body
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "contact_number": "string (optional)",
  "address": "string (optional)",
  "skills": ["string"] (optional),
  "profile_picture": {
    "url": "string"
  },
  "preferences": {
    "languages": ["string"]
  }
}
```

#### Successful Response (200 OK)
```json
{
  "message": "User updated successfully",
  "user": {
    // Updated user object
  }
}
```

### 7. Delete User (Protected/Admin)
Deletes a user and their credentials.

**Endpoint:** `/:id`
**Method:** `DELETE`
**Authentication:** Required

#### Successful Response (200 OK)
```json
{
  "message": "User deleted successfully"
}
```

## Error Responses

### Common Error Formats
```json
{
  "message": "string",
  "error": "string (optional)"
}
```

### Status Codes
- `200`: Successful request
- `201`: Resource created
- `400`: Bad request / Validation error
- `401`: Unauthorized
- `404`: Resource not found
- `500`: Server error

## Sample Usage (Frontend)

### Create User Example
```javascript
const createUser = async (userData, token) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  } catch (error) {
    throw error;
  }
};
```

## Notes
- All protected routes require JWT authentication
- Passwords are hashed using bcrypt
- Email addresses must be unique
- Profile pictures are stored as URLs
- User preferences can be extended based on requirements
```

This documentation provides a comprehensive overview of all user-related endpoints, including authentication requirements, request/response formats, and error handling. You can use this as a reference when implementing the frontend user management features.