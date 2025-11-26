# Attendance Controller

## Endpoints

### Get Attendance Records
- **URL**: `/api/attendance/:userId`
- **Method**: `GET`
- **Request Parameters**:
  - `userId` (path parameter): ID of the user whose attendance records are to be fetched.
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "user_id": "ObjectId",
          "attendance_date": "Date",
          "time_entries": [
            {
              "type": "String",
              "timestamp": "Date",
              "task_description": "String",
              "check_in_status": "String",
              "late_reason": "String"
            }
          ],
          "total_work_duration": "Number",
          "total_break_duration": "Number"
        }
      ]
    }
    ```
  - **Error (400)**:
    ```json
    {
      "success": false,
      "message": "User ID is required"
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "No attendance records found"
    }
    ```

### Mark Attendance
- **URL**: `/api/attendance`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_id": "ObjectId",
    "attendance_date": "Date",
    "time_entries": [
      {
        "type": "String",
        "timestamp": "Date",
        "task_description": "String",
        "check_in_status": "String",
        "late_reason": "String"
      }
    ],
    "total_work_duration": "Number",
    "total_break_duration": "Number"
  }
  ```
- **Response**:
  - **Success (201)**:
    ```json
    {
      "success": true,
      "message": "Attendance marked successfully",
      "data": {
        "user_id": "ObjectId",
        "attendance_date": "Date",
        "time_entries": [...],
        "total_work_duration": "Number",
        "total_break_duration": "Number"
      }
    }
    ```
  - **Error (400)**:
    ```json
    {
      "success": false,
      "message": "User ID and Attendance Date are required"
    }
    ```

### Update Attendance
- **URL**: `/api/attendance/:id`
- **Method**: `PUT`
- **Request Parameters**:
  - `id` (path parameter): ID of the attendance record to update.
- **Request Body**: (same as Mark Attendance)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Attendance record updated successfully",
      "data": { ... }
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Attendance record not found"
    }
    ```

### Delete Attendance
- **URL**: `/api/attendance/:id`
- **Method**: `DELETE`
- **Request Parameters**:
  - `id` (path parameter): ID of the attendance record to delete.
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "Attendance record deleted successfully"
    }
    ```
  - **Error (404)**:
    ```json
    {
      "success": false,
      "message": "Attendance record not found"
    }
    ```