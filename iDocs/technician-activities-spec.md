## Technician Activities Module: System Design Specification

### 1. Overview

This module will track support and installation activities performed by technicians. It aims to provide a clear record of "who did what" for which client, including details about the service provided and any changes made.

### 2. Database Schema (MongoDB)

#### 2.1. `TechnicianActivity` Model

This model will record each individual support or installation activity.

```javascript
// backend/models/TechnicianActivity.js
const mongoose = require('mongoose');

const TechnicianActivitySchema = mongoose.Schema(
  {
    technician: {
      type: String,
      required: true,
    },
    activityType: {
      type: String,
      enum: ['Installation', 'Support'],
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    clientPhone: {
      type: String,
      required: true,
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Please add a valid phone number'],
    },
    activityDate: {
      type: Date,
      required: true,
    },
    description: { // General description of the activity
      type: String,
      required: true,
    },
    // Fields specific to Installation
    installedEquipment: { // e.g., "Router X, ONU Y"
      type: String,
      required: function() { return this.activityType === 'Installation'; }
    },
    installationNotes: {
      type: String,
      required: function() { return this.activityType === 'Installation'; }
    },
    // Fields specific to Support
    supportCategory: {
      type: String,
      enum: ['Client Problem', 'Building Issue'],
      required: function() { return this.activityType === 'Support'; }
    },
    issueDescription: { // What was the client's reported issue?
      type: String,
      required: function() { return this.activityType === 'Support'; }
    },
    solutionProvided: { // What was done to resolve the issue?
      type: String,
      required: function() { return this.activityType === 'Support'; }
    },
    partsReplaced: { // e.g., "Faulty PSU, Cable"
      type: String,
    },
    configurationChanges: { // e.g., "Changed Wi-Fi password, updated router firmware"
      type: String,
    },
    // Optional: Link to a Unit or Building if applicable (for CRM context)
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TechnicianActivity', TechnicianActivitySchema);
```

**Note on Schema:**
*   `technician` field links to the `User` model. This implies that technicians are managed as users, possibly with an `isTechnician` flag or a `role` field in the `User` model. We'll need to ensure the `User` model supports this.
*   Conditional `required` fields ensure that installation-specific fields are only required for 'Installation' activities, and support-specific fields for 'Support' activities.
*   Added optional links to `Unit` and `Building` for better CRM integration and context.

### 3. Backend Design

#### 3.1. API Endpoints

All endpoints will be protected by authentication middleware (`protect`). Access will likely be restricted to `admin` and `technician` roles.

*   **`POST /api/technician-activities`**: Record a new technician activity.
    *   **Request Body**: `{ technician, activityType, clientName, clientPhone, activityDate, description, ... (type-specific fields) }`
    *   **Response**: Newly created `TechnicianActivity` object.
*   **`GET /api/technician-activities`**: Get a list of technician activities.
    *   **Query Params**: `?technicianId=<id>&activityType=<type>&startDate=<date>&endDate=<date>&clientName=<name>&clientPhone=<phone>`
    *   **Response**: Array of `TechnicianActivity` objects.
*   **`GET /api/technician-activities/:id`**: Get a single technician activity by ID.
    *   **Response**: `TechnicianActivity` object.
*   **`PUT /api/technician-activities/:id`**: Update an existing technician activity.
    *   **Request Body**: `{ ... (fields to update) }`
    *   **Response**: Updated `TechnicianActivity` object.
*   **`DELETE /api/technician-activities/:id`**: Delete a technician activity.
    *   **Response**: Success message.

#### 3.2. Controllers (`backend/controllers/technicianActivityController.js`)

*   **`createTechnicianActivity`**:
    *   Validate input based on `activityType`.
    *   Assign `req.user._id` as `technician` if the logged-in user is the technician performing the activity, or validate `technician` ID if an admin is creating it.
    *   Create new `TechnicianActivity` document.
*   **`getTechnicianActivities`**:
    *   Filter activities based on query parameters.
    *   Populate `technician`, `unit`, `building` fields for display.
*   **`getTechnicianActivityById`**:
    *   Find activity by `id`.
    *   Populate related fields.
*   **`updateTechnicianActivity`**:
    *   Find activity by `id`.
    *   Validate ownership/permissions.
    *   Update fields.
*   **`deleteTechnicianActivity`**:
    *   Find and delete activity by `id`.
    *   Validate ownership/permissions.

#### 3.3. Routes (`backend/routes/technicianActivityRoutes.js`)

*   Define routes and link to controller functions.
*   Apply `protect` middleware. Consider `admin` middleware for certain operations (e.g., deleting any activity, or creating activities for other technicians).

### 4. Frontend Design

#### 4.1. Sidebar Navigation (`frontend/src/components/app-sidebar.tsx`)

*   Add a new top-level item for "TECHNICIAN ACTIVITIES" with an appropriate icon (e.g., `Tool` or `Wrench`).
*   Under "TECHNICIAN ACTIVITIES", create two direct submenus:
    *   **Installations**: Navigates to "View All Installations" (`/technician-activities/installations`)
    *   **Support**: Navigates to "View All Support Activities" (`/technician-activities/support`)
*   Each of these pages will have an "Add New" button.

#### 4.2. Pages

*   **`frontend/src/app/technician-activities/installations/page.tsx`**: View All Installations
    *   Table to display installation activities.
    *   Filters: Technician, Date Range, Client Name/Phone.
    *   "Add New Installation" button (`/technician-activities/installations/new`).
    *   Actions: View Details, Edit, Delete.
*   **`frontend/src/app/technician-activities/support/page.tsx`**: View All Support Activities
    *   Table to display support activities.
    *   Filters: Technician, Date Range, Client Name/Phone.
    *   "Add New Support Activity" button (`/technician-activities/support/new`).
    *   Actions: View Details, Edit, Delete.
*   **`frontend/src/app/technician-activities/installations/new/page.tsx`**: Add New Installation Form
    *   Input fields for Technician (dropdown of users with technician role), Client Name, Client Phone, Activity Date, Description, Installed Equipment, Installation Notes.
    *   `activityType` pre-filled as 'Installation'.
*   **`frontend/src/app/technician-activities/support/new/page.tsx`**: Add New Support Activity Form
    *   Input fields for Technician (dropdown), Client Name, Client Phone, Activity Date, Description, Issue Description, Solution Provided, Parts Replaced, Configuration Changes.
    *   `activityType` pre-filled as 'Support'.
*   **`frontend/src/app/technician-activities/[id]/page.tsx`**: View Technician Activity Details
    *   Read-only view of a single activity, matching existing detail page UI.
    *   Conditionally display fields based on `activityType`.
*   **`frontend/src/app/technician-activities/[id]/edit/page.tsx`**: Edit Technician Activity
    *   Form to edit activity details, conditionally displaying fields based on `activityType`.

#### 4.3. Components

*   **`frontend/src/lib/technicianActivityService.ts`**: API service functions (`create`, `get`, `getById`, `update`, `delete`).
*   **`frontend/src/types/technician-activity.d.ts`**: TypeScript type definition for the `TechnicianActivity` schema.
*   **`frontend/src/app/technician-activities/columns.tsx`**: Column definitions for `DataTable`.


