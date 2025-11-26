# Leave Controller

## Endpoints

### Get All Leaves
- **URL**: `/api/leaves`
- **Method**: `GET`
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "user_id": "ObjectId",
          "from_date": "Date",
          "to_date": "Date",
          "leave_type": "String",
          "reason": "String",
          "status": "String",
          "date_of_request": "Date",
          "admin_remarks": "String",
          "status_updated_at": "Date"
        }
      ]
    }
    ```
  - **Error (500)**:
    ```json
    {
      "success": false,
      "message": "Failed to fetch leave requests"
    }
    ```

### Create Leave
- **URL**: `/api/leaves`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_id": "ObjectId",
    "from_date": "Date",
    "to_date": "Date",
    "leave_type": "String",
    "reason": "String"
  }
  ```
- **Response**:
  - **Success (201)**:
    ```json
    {
      "success": true,
      "message": "Leave request submitted",
      "data": { ... }
    }
    ```
  - **Error (400)**:
    ```json
    {
      "success": false,
      "message": "Failed to submit leave request"
    }
    ```

### Update Leave
- **URL**: `/api/leaves/:id`
- **Method**: `PUT`
- **Request Parameters**:
  - `id` (path parameter): ID of the leave request to update.
- **Request Body**: (same as Create Leave)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Leave request updated",
      "data": { ... }
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Leave request not found"
    }
    ```

### Delete Leave
- **URL**: `/api/leaves/:id`
- **Method**: `DELETE`
- **Request Parameters**:
  - `id` (path parameter): ID of the leave request to delete.
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Leave request deleted successfully"
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Leave request not found"
    }
    ```