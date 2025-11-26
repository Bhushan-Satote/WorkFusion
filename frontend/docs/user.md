To document the API endpoints in your `user.md` file, you can include sample requests and responses for each endpoint. Below is a suggested format for the documentation, including the HTTP method, endpoint, request body, and expected response.

```markdown
# User API Endpoints

## 1. Register User
- **Endpoint:** `POST /register`
- **Request Body:**
```json
{
  "username": "exampleUser",
  "name": "Example Name",
  "contact_number": "1234567890",
  "email": "example@example.com",
  "password": "securePassword",
  "role": "User"
}
```
- **Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "credentialId": "60d5ec49f1b2c8b1f8e4e1a1",
    "name": "Example Name",
    "email": "example@example.com"
  }
}
```

## 2. Login User
- **Endpoint:** `POST /login`
- **Request Body:**
```json
{
  "username": "exampleUser",
  "password": "securePassword"
}
```
- **Response:**
```json
{
  "token": "jwt.token.here",
  "message": "Login successful"
}
```

## 3. Get All Users
- **Endpoint:** `GET /`
- **Headers:**
```http
Authorization: Bearer <token>
```
- **Response:**
```json
[
  {
    "credentialId": "60d5ec49f1b2c8b1f8e4e1a1",
    "name": "Example Name",
    "email": "example@example.com",
    "contact_number": "1234567890"
  },
  // ... other users
]
```

## 4. Get User by ID
- **Endpoint:** `GET /:id`
- **Headers:**
```http
Authorization: Bearer <token>
```
- **Response:**
```json
{
  "credentialId": "60d5ec49f1b2c8b1f8e4e1a1",
  "name": "Example Name",
  "email": "example@example.com",
  "contact_number": "1234567890"
}
```

## 5. Create User
- **Endpoint:** `POST /create`
- **Headers:**
```http
Authorization: Bearer <token>
```
- **Request Body:**
```json
{
  "username": "newUser",
  "password": "newPassword",
  "role": "User",
  "name": "New User",
  "email": "newuser@example.com",
  "contact_number": "0987654321",
  "address": "123 New St",
  "skills": ["JavaScript", "Node.js"],
  "preferences": {
    "languages": ["English", "Spanish"]
  }
}
```
- **Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "credentialId": "60d5ec49f1b2c8b1f8e4e1a2",
    "name": "New User",
    "email": "newuser@example.com"
  }
}
```

## 6. Update User
- **Endpoint:** `PUT /:id`
- **Headers:**
```http
Authorization: Bearer <token>
```
- **Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "contact_number": "1231231234",
  "address": "456 Updated St",
  "skills": ["Python", "Django"],
  "preferences": {
    "languages": ["English"]
  }
}
```
- **Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "credentialId": "60d5ec49f1b2c8b1f8e4e1a1",
    "name": "Updated Name",
    "email": "updated@example.com"
  }
}
```

## 7. Delete User
- **Endpoint:** `DELETE /:id`
- **Headers:**
```http
Authorization: Bearer <token>
```
- **Response:**
```json
{
  "message": "User deleted successfully"
}
```
```

This format provides a clear and concise overview of each endpoint, making it easy for users to understand how to interact with your API. You can add this content to your `user.md` file.
