# Client Management API Documentation

This document outlines the client management endpoints and their usage for the backend API.

## Base URL
```
http://localhost:3000/api/clients
```

## Endpoints

### 1. Get All Clients
Retrieves all clients and their associated projects.

**Endpoint:** `/`
**Method:** `GET`
**Content-Type:** `application/json`

#### Successful Response (200 OK)
```json
{
  "success": true,
  "message": "Clients fetched successfully",
  "data": [
    {
      "_id": "string",
      "client_name": "string",
      "client_contact": {
        "phone": "string",
        "email": "string"
      },
      "projects": [
        {
          // Project details
        }
      ]
    }
  ]
}
```

### 2. Get Client by ID
Retrieves a specific client's details including their projects.

**Endpoint:** `/:id`
**Method:** `GET`
**Content-Type:** `application/json`

#### Successful Response (200 OK)
```json
{
  "success": true,
  "message": "Client fetched successfully",
  "data": {
    "_id": "string",
    "client_name": "string",
    "client_contact": {
      "phone": "string",
      "email": "string"
    },
    "projects": [
      {
        // Project details
      }
    ]
  }
}
```

### 3. Create Client
Creates a new client record.

**Endpoint:** `/`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request Body
```json
{
  "client_name": "string",
  "client_contact": {
    "phone": "string",
    "email": "string"
  }
}
```

#### Successful Response (201 Created)
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "_id": "string",
    "client_name": "string",
    "client_contact": {
      "phone": "string",
      "email": "string"
    }
  }
}
```

### 4. Update Client
Updates an existing client's information.

**Endpoint:** `/:id`
**Method:** `PATCH`
**Content-Type:** `application/json`

#### Request Body
```json
{
  "client_name": "string (optional)",
  "client_contact": {
    "phone": "string (optional)",
    "email": "string (optional)"
  }
}
```

#### Successful Response (200 OK)
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "_id": "string",
    "client_name": "string",
    "client_contact": {
      "phone": "string",
      "email": "string"
    }
  }
}
```

### 5. Delete Client
Removes a client from the system.

**Endpoint:** `/:id`
**Method:** `DELETE`

#### Successful Response (200 OK)
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

## Error Responses

### Common Error Formats
```json
{
  "success": false,
  "message": "string",
  "error": "string (optional)"
}
```

### Specific Error Cases

#### Not Found (404)
```json
{
  "success": false,
  "message": "Client not found"
}
```

#### Bad Request (400)
```json
{
  "success": false,
  "message": "Missing required fields: client_name, phone, or email."
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Error fetching clients",
  "error": "error details"
}
```

### Status Codes
- `200`: Successful request
- `201`: Resource created
- `400`: Bad request / Validation error
- `404`: Resource not found
- `500`: Server error

## Sample Usage (Frontend)

### Create Client Example
```javascript
const createClient = async (clientData) => {
  try {
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    return data;
  } catch (error) {
    throw error;
  }
};
```

### Update Client Example
```javascript
const updateClient = async (clientId, updates) => {
  try {
    const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
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
- All responses follow a consistent format with `success`, `message`, and optional `data`/`error` fields
- Client creation requires both `client_name` and `client_contact` information
- The API supports partial updates using PATCH method
- Clients can have associated projects which are populated in GET requests

## Project Relations

When retrieving clients, their associated projects are automatically populated. The projects array in the client response will contain references to all projects associated with that client:

```json
{
  "success": true,
  "data": {
    "_id": "string",
    "client_name": "string",
    "client_contact": {
      "phone": "string",
      "email": "string"
    },
    "projects": [
      {
        "_id": "string",
        "project_details": {
          // Project specific details
        }
      }
    ]
  }
}
```


### Project Management
- When a project is created, it's automatically added to the client's projects array
- When a project is deleted, it's automatically removed from the client's projects array
- When a project's client is changed, the project is removed from the old client's projects array and added to the new client's projects array
```
