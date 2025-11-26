# Client Controller

## Endpoints

### Get All Clients
- **URL**: `/api/clients`
- **Method**: `GET`
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Clients fetched successfully",
      "data": [
        {
          "client_name": "String",
          "client_contact": {
            "phone": "String",
            "email": "String"
          },
          "projects": ["ObjectId"]
        }
      ]
    }
    ```
  - **Error (500)**:
    ```json
    {
      "success": false,
      "message": "Error fetching clients",
      "error": "String"
    }
    ```

### Create Client
- **URL**: `/api/clients`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "client_name": "String",
    "client_contact": {
      "phone": "String",
      "email": "String"
    }
  }
  ```
- **Response**:
  - **Success (201)**:
    ```json
    {
      "success": true,
      "message": "Client created successfully",
      "data": { ... }
    }
    ```
  - **Error (400)**:
    ```json
    {
      "success": false,
      "message": "Missing required fields: client_name, phone, or email."
    }
    ```

### Update Client
- **URL**: `/api/clients/:id`
- **Method**: `PUT`
- **Request Parameters**:
  - `id` (path parameter): ID of the client to update.
- **Request Body**: (same as Create Client)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Client updated successfully",
      "data": { ... }
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Client not found"
    }
    ```

### Delete Client
- **URL**: `/api/clients/:id`
- **Method**: `DELETE`
- **Request Parameters**:
  - `id` (path parameter): ID of the client to delete.
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Client deleted successfully"
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Client not found"
    }
    ```