# Auth Controller

## Endpoints

### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "String",
    "password": "String"
  }
  ```
- **Response**:
  - **Success (200)**:
    ```json
    {
      "token": "String",
      "role":"Admin",
      "userId":"nnkaka"
      "message": "Login successful"
    }
    ```
  - **Error (400)**:
    ```json
    {
      "message": "Invalid credentials"
    }
    ```
  - **Error (500)**:
    ```json
    {
      "message": "Server error"
    }
    ```

### Admin Initialization
- **URL**: Not directly accessible via an endpoint, called during server initialization.
- **Response**: Logs to console if admin credentials are created.