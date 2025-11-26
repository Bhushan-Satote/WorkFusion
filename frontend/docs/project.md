# Project Controller

## Endpoints

### Get All Projects
- **URL**: `/api/projects`
- **Method**: `GET`
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "client_id": "ObjectId",
          "project_details": {
            "name": "String",
            "description": "String",
            "start_date": "Date",
            "end_date": "Date",
            "status": "String",
            "priority": "String",
            "progress": "Number"
          },
          "kanban": { ... },
          "project_leads": ["ObjectId"],
          "attachments": [{ ... }],
          "additional_fields": { ... }
        }
      ]
    }
    ```
  - **Error (500)**:
    ```json
    {
      "success": false,
      "message": "Failed to fetch projects"
    }
    ```

### Create Project
- **URL**: `/api/projects`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "client_id": "ObjectId",
    "project_details": {
      "name": "String",
      "description": "String",
      "start_date": "Date",
      "end_date": "Date",
      "status": "String",
      "priority": "String",
      "progress": "Number"
    }
  }
  ```
- **Response**:
  - **Success (201)**:
    ```json
    {
      "success": true,
      "message": "Project created successfully",
      "data": { ... }
    }
    ```
  - **Error (400)**:
    ```json
    {
      "success": false,
      "message": "Failed to create project"
    }
    ```

### Update Project
- **URL**: `/api/projects/:id`
- **Method**: `PUT`
- **Request Parameters**:
  - `id` (path parameter): ID of the project to update.
- **Request Body**: (same as Create Project)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Project updated successfully",
      "data": { ... }
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Project not found"
    }
    ```

### Delete Project
- **URL**: `/api/projects/:id`
- **Method**: `DELETE`
- **Request Parameters**:
  - `id` (path parameter): ID of the project to delete.
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Project deleted successfully"
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Project not found"
    }
    ```