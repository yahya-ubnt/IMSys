# Specification: Replacement of Building/Unit Modules with Location Fields

## 1. Objective

This document outlines the plan to replace the "Building" and "Unit" modules with a simpler, more direct location system. This involves removing the old database schemas and introducing new fields for location, then adapting the existing logic to use these new fields.

## 2. Motivation

The core business logic of the application has evolved, and the concepts of "Buildings" and "Units" are overly complex for the current needs. Replacing them with simple location fields will simplify the codebase, reduce maintenance overhead, and align the application with its new goals.

## 3. Scope of Changes

The changes will impact the entire stack. The following is a comprehensive list of items to be added, removed, or modified.

### 3.1. Backend

#### 3.1.1. Database Models (Mongoose)

-   **`MikrotikUser` Model (`backend/models/MikrotikUser.js`):**
    -   **Add:**
        -   `apartment_house_number` (String, optional)
        -   `door_number_unit_label` (String, optional)
    -   **Remove:**
        -   `buildingName`
        -   `unitLabel`
        -   `unitId`
-   **Models to be Deleted:**
    -   `backend/models/Building.js`
    -   `backend/models/Unit.js`
-   **`TechnicianActivity` Model (`backend/models/TechnicianActivity.js`):**
    -   **Remove:** `building` and `unit` fields and their references.
    -   **Modify:** The `supportCategory` enum will have "Building Issue" removed.

#### 3.1.2. API Controllers

-   **`mikrotikUserController.js`:**
    -   **Modify:** Update `create` and `update` functions to handle the new `apartment_house_number` and `door_number_unit_label` fields, and remove logic for the old fields.
-   **`smsController.js`:**
    -   **Modify:** Adapt the logic for sending SMS to a location to use the new `apartment_house_number` field instead of `buildingId`.
-   **Controllers to be Deleted:**
    -   `backend/controllers/buildingController.js`
    -   `backend/controllers/unitController.js`
-   **Other Controllers to be Modified:**
    -   `whatsappController.js`: Remove logic for sending WhatsApp messages based on location (building).
    -   `reportController.js`: Remove the location-based report (`getLocationReport`).
    -   `technicianActivityController.js`: Remove logic for "Building Issue" support category and any other dependencies on `Building` or `Unit`.

#### 3.1.3. API Routes

-   **Routes to be Deleted:**
    -   `backend/routes/buildingRoutes.js`
    -   `backend/routes/unitRoutes.js`
    -   `backend/routes/unitDirectRoutes.js`
-   **`server.js`:**
    -   **Modify:** Remove route mounting for `buildingRoutes`, `unitRoutes`, and `unitDirectRoutes`.
-   **Other Routes to be Modified:**
    -   `technicianActivityRoutes.js`: Remove validation related to `building`.
    -   `smsRoutes.js`: Modify validation to support `apartment_house_number` if needed, and remove validation for `buildingId`.

### 3.2. Frontend

#### 3.2.1. Pages (Next.js)

-   **`mikrotik/users` pages:**
    -   **Modify:** Add `apartment_house_number` and `door_number_unit_label` fields to the user creation and edit forms.
    -   **Modify:** Display the new location fields in the user details view.
-   **Pages to be Deleted:**
    -   The entire `frontend/src/app/buildings` directory.
    -   The entire `frontend/src/app/units` directory.
    -   `frontend/src/app/reports/location/page.tsx`
-   **Other Pages to be Modified:**
    -   `frontend/src/app/technician-activities/support/new/page.tsx`: Remove "Building Issue" from support categories.
    -   `frontend/src/app/sms/compose/page.tsx`: Update the UI to allow targeting users by `apartment_house_number`.
    -   `frontend/src/app/layout.tsx`: Update the application description.

#### 3.2.2. Components

-   **`app-sidebar.tsx`:**
    -   **Modify:** Remove "Buildings" and "Units" from the navigation menu.
-   **`topbar.tsx`:**
    -   **Modify:** Update the global search placeholder text.

#### 3.2.3. Services and Types

-   **Services and Types to be Deleted:**
    -   `frontend/src/lib/buildingService.ts`
    -   `frontend/src/lib/unitService.ts`
    -   `frontend/src/types/building.d.ts`
    -   `frontend/src/types/building.ts`
    -   `frontend/src/types/unit.d.ts`
-   **Types to be Modified:**
    -   `frontend/src/types/technician-activity.d.ts`: Remove `building` and `unit` fields.
    -   `frontend/src/types/caretaker-agent.d.ts`: Remove `assignedBuildings`.

### 3.3. Documentation

-   **To be Deleted:**
    -   `iDocs/buildings-spec.md`
    -   `iDocs/units-spec.md`
-   **To be Modified:**
    -   This document (`removal-of-building-unit-spec.md`) will serve as the primary specification for this change.
    -   Other documentation files will be updated to remove references to the old system.

## 4. Phased Implementation Plan

The replacement will be executed in the following phases:

1.  **Phase 1: Implement New Location Fields:**
    -   Add `apartment_house_number` and `door_number_unit_label` to the `MikrotikUser` model.
    -   Update the `mikrotikUserController` to handle the new fields.
    -   Update the frontend forms and views to include the new fields.
2.  **Phase 2: Adapt Dependent Functionality:**
    -   Modify the `smsController` and frontend SMS composition UI to use the new `apartment_house_number` field.
    -   Review and adapt or remove other functionalities (reports, technician activities) that depended on the old system.
3.  **Phase 3: Final Cleanup:**
    -   Once the new system is verified, proceed with the deletion of all old "Building" and "Unit" related files (routes, controllers, models, frontend pages, etc.).
    -   Clean up any remaining references in the documentation.

## 5. Verification

After the replacement is complete, the following steps will be taken to ensure the application is stable:

1.  **Build Project:** Ensure both the frontend and backend build successfully without any errors.
2.  **Manual Testing:**
    -   Verify that the new location fields can be added and updated for a `MikrotikUser`.
    -   Verify that the new location fields are displayed correctly on the user details page.
    -   Verify that the SMS functionality can correctly send messages to users based on `apartment_house_number`.
    -   Navigate through the application to ensure there are no broken links or visual glitches resulting from the removal of the old components.