# Agency Applications API Documentation

## Overview
This API documentation covers the rejected applications endpoints for the ETD DGIP system.

## Rejected Applications API Endpoints

### 1. Get All Rejected Applications

**Endpoint:** `GET /applications/rejected`

**Description:** Retrieve all rejected applications with pagination and search functionality.

**Access Control:** 
- **Roles:** ADMIN
- **Authentication:** Required (JWT Bearer Token)

**Query Parameters:**
```typescript
{
  page?: number;        // Page number for pagination (default: 1)
  limit?: number;       // Number of items per page (default: 10)
  search?: string;      // Search term for application ID, name, or citizen ID
}
```

**Example Request:**
```bash
GET /applications/rejected?page=1&limit=20&search=1234567890123
Authorization: Bearer <jwt_token>
```

**Response Type:**
```typescript
{
  data: RejectedApplication[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**RejectedApplication Type:**
```typescript
{
  application_id: string;           // Primary key (e.g., "10000000000E")
  citizen_id: string;               // Citizen ID (e.g., "1234567890123")
  first_name: string;               // First name (e.g., "John")
  last_name: string;                // Last name (e.g., "Doe")
  father_name: string;              // Father's name (e.g., "Robert")
  mother_name: string;              // Mother's name (e.g., "Jane")
  pakistan_city: string;            // City in Pakistan (e.g., "Karachi")
  date_of_birth: Date;              // Date of birth (e.g., "1990-01-01")
  birth_country: string;            // Birth country (e.g., "Pakistan")
  birth_city: string;               // Birth city (e.g., "Lahore")
  profession: string;               // Profession (e.g., "Software Engineer")
  pakistan_address: string;         // Address in Pakistan
  height: string;                   // Height (e.g., "5.9")
  color_of_hair: string;            // Hair color (e.g., "Black")
  color_of_eyes: string;            // Eye color (e.g., "Brown")
  departure_date: Date;             // Departure date
  gender: string;                   // Gender (e.g., "Male")
  transport_mode: string;           // Transport mode (e.g., "Air")
  investor: string;                 // Investor status (e.g., "Yes")
  requested_by: string;             // Requested by (e.g., "Ministry of Interior")
  reason_for_deport: string;        // Reason for deportation
  amount: number;                   // Amount (e.g., 50000)
  currency: string;                 // Currency (e.g., "USD")
  rejection_reason: string;         // Reason for rejection
  verification_completed_at: Date;  // Verification completion timestamp
  image: string;                    // Image URL
  agency_remarks: {                 // Agency remarks array
    agency: string;
    remarks: string;
    attachment_url: string;
    submitted_at: Date;
  }[];
  status: "REJECTED";               // Always "REJECTED"
  created_by_id: number;            // User ID who created the application
  reviewed_by_id: number;           // User ID who reviewed/rejected
  reviewed_at: Date;                // Review timestamp
  etd_issue_date: Date;             // ETD issue date
  etd_expiry_date: Date;            // ETD expiry date
  createdAt: Date;                  // Original creation timestamp
  updatedAt: Date;                  // Last update timestamp
  rejected_at: Date;                // Rejection timestamp
  original_application_created_at: Date; // Original application creation timestamp
}
```

**Example Response:**
```json
{
  "data": [
    {
      "application_id": "10000000000E",
      "citizen_id": "1234567890123",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert",
      "mother_name": "Jane",
      "pakistan_city": "Karachi",
      "date_of_birth": "1990-01-01",
      "birth_country": "Pakistan",
      "birth_city": "Lahore",
      "profession": "Software Engineer",
      "pakistan_address": "123 Main St, Karachi",
      "height": "5.9",
      "color_of_hair": "Black",
      "color_of_eyes": "Brown",
      "departure_date": "2024-12-01",
      "gender": "Male",
      "transport_mode": "Air",
      "investor": "Yes",
      "requested_by": "Ministry of Interior",
      "reason_for_deport": "Business visa",
      "amount": 50000,
      "currency": "USD",
      "rejection_reason": "Incomplete documentation",
      "verification_completed_at": "2024-01-15T10:30:00Z",
      "image": "https://example.com/photos/passport-photo.jpg",
      "agency_remarks": [
        {
          "agency": "INTELLIGENCE_BUREAU",
          "remarks": "Document verification failed",
          "attachment_url": "https://example.com/attachments/verification.pdf",
          "submitted_at": "2024-01-15T10:30:00Z"
        }
      ],
      "status": "REJECTED",
      "created_by_id": 1,
      "reviewed_by_id": 2,
      "reviewed_at": "2024-01-15T11:00:00Z",
      "etd_issue_date": null,
      "etd_expiry_date": null,
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "rejected_at": "2024-01-15T11:00:00Z",
      "original_application_created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Successfully retrieved rejected applications
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 2. Get Specific Rejected Application

**Endpoint:** `GET /applications/rejected/:id`

**Description:** Retrieve a specific rejected application by its ID.

**Access Control:** 
- **Roles:** MINISTRY, AGENCY, MISSION_OPERATOR
- **Authentication:** Required (JWT Bearer Token)

**Path Parameters:**
```typescript
{
  id: string;  // Rejected Application ID (e.g., "10000000000E")
}
```

**Example Request:**
```bash
GET /applications/rejected/10000000000E
Authorization: Bearer <jwt_token>
```

**Response Type:**
```typescript
RejectedApplication;  // Single rejected application object
```

**Example Response:**
```json
{
  "application_id": "10000000000E",
  "citizen_id": "1234567890123",
  "first_name": "John",
  "last_name": "Doe",
  "father_name": "Robert",
  "mother_name": "Jane",
  "pakistan_city": "Karachi",
  "date_of_birth": "1990-01-01",
  "birth_country": "Pakistan",
  "birth_city": "Lahore",
  "profession": "Software Engineer",
  "pakistan_address": "123 Main St, Karachi",
  "height": "5.9",
  "color_of_hair": "Black",
  "color_of_eyes": "Brown",
  "departure_date": "2024-12-01",
  "gender": "Male",
  "transport_mode": "Air",
  "investor": "Yes",
  "requested_by": "Ministry of Interior",
  "reason_for_deport": "Business visa",
  "amount": 50000,
  "currency": "USD",
  "rejection_reason": "Incomplete documentation",
  "verification_completed_at": "2024-01-15T10:30:00Z",
  "image": "https://example.com/photos/passport-photo.jpg",
  "agency_remarks": [
    {
      "agency": "INTELLIGENCE_BUREAU",
      "remarks": "Document verification failed",
      "attachment_url": "https://example.com/attachments/verification.pdf",
      "submitted_at": "2024-01-15T10:30:00Z"
    }
  ],
  "status": "REJECTED",
  "created_by_id": 1,
  "reviewed_by_id": 2,
  "reviewed_at": "2024-01-15T11:00:00Z",
  "etd_issue_date": null,
  "etd_expiry_date": null,
  "createdAt": "2024-01-10T09:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  "rejected_at": "2024-01-15T11:00:00Z",
  "original_application_created_at": "2024-01-10T09:00:00Z"
}
```

**HTTP Status Codes:**
- `200 OK`: Successfully retrieved rejected application
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Rejected application not found
- `500 Internal Server Error`: Server error

---

### 3. Get Rejected Applications Statistics

**Endpoint:** `GET /applications/rejected/stats`

**Description:** Retrieve statistics about rejected applications including total count, today's count, and this month's count.

**Access Control:** 
- **Roles:** MINISTRY, AGENCY, MISSION_OPERATOR
- **Authentication:** Required (JWT Bearer Token)

**Example Request:**
```bash
GET /applications/rejected/stats
Authorization: Bearer <jwt_token>
```

**Response Type:**
```typescript
{
  total: number;        // Total number of rejected applications
  today: number;        // Number of applications rejected today
  thisMonth: number;    // Number of applications rejected this month
}
```

**Example Response:**
```json
{
  "total": 25,
  "today": 3,
  "thisMonth": 15
}
```

**HTTP Status Codes:**
- `200 OK`: Successfully retrieved statistics
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

## Error Response Format

All endpoints return errors in the following format:

```typescript
{
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
}
```

**Example Error Response:**
```json
{
  "statusCode": 404,
  "message": "Rejected application not found",
  "error": "Not Found",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/applications/rejected/10000000000E"
}
```

---

## Authentication

All endpoints require JWT Bearer token authentication:

```bash
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Headers:** Rate limit information is included in response headers

## Notes

1. **Pagination:** The list endpoint supports pagination with `page` and `limit` parameters
2. **Search:** The search parameter searches across application_id, first_name, last_name, and citizen_id fields
3. **Timestamps:** All timestamps are in ISO 8601 format (UTC)
4. **Data Movement:** Rejected applications are moved from the main `applications` table to the `rejected_applications` table when their status is set to "REJECTED"
5. **Additional Fields:** Rejected applications include `rejected_at` and `original_application_created_at` fields for tracking purposes
