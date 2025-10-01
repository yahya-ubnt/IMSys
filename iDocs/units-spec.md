# Units Module Specification

## Purpose
To manage individual units within buildings, including tracking their status for door-to-door campaigns.

---

## 1. Sidebar Navigation
The "Units" module in the sidebar will have the following structure:
- **Units**
  - **View All Units**: Navigates to the main units management page.
  - **Add New Unit**: Navigates to the form for creating a new unit.

---

## 2. View All Units
**Purpose:** To provide a centralized view for managing units by building. This page allows users to select a building and see all associated units in a table.

### 2.1. Building Selection
**Display:** A grid or list of building cards, identical to the "View All Buildings" page. Each card will display:
- Building Name
- Address / Location
- Total Units
- **Actions**: A "Manage Units" button.

**Functionality:**
- The list of buildings can be searched and filtered by name or location.
- Clicking the "Manage Units" button on a building card will populate the table below with the units for that specific building.

### 2.2. Units Table
**Purpose:** To display the units of the building selected via the "Manage Units" button.

**Display:** A table that is initially empty. When a building is selected, it is populated with the following columns for each unit:
- **Unit Label/Number** (`label`)
- **Visit Status** (`visitStatus`)
- **Provider** (`provider`)
- **Comments** (`comments`)
- **Date Created** (`createdAt`)
- **Actions**: Edit | Delete

**Functionality:**
- The table should be searchable and sortable.
- The "Edit" action will likely open a modal or navigate to a separate edit page for that unit.
- The "Delete" action will remove the unit after confirmation.

---

## 3. Add New Unit
**Purpose:** To create a new unit and associate it with a building.

**Display:** A form with the following fields:
- **Select Building** — `Building` (dropdown/searchable list) — *required*. This will associate the new unit with a building.
- **Unit Label/Number** — `string` (`label`) — *required* (e.g., A1, 101, "First Floor Office").
- **Visit Status** — `string` (`visitStatus`) (dropdown: Visited, Not Visited) — *optional, defaults to 'Not Visited'*.
- **Current Provider** — `string` (`provider`) — *optional*.
- **Client Name** — `string` (`clientName`) — *optional*.
- **Client Phone** — `string` (`phone`) — *optional*.
- **Next Billing Date** — `date` (`nextBillingDate`) (date picker) — *optional*.
- **Comments** — `string` (`comments`) (textarea) — *optional*.

**Save Action:**
- On submission, a `POST` request is sent to `/api/units`.
- The new unit is created and associated with the selected `buildingId`.
- After successful creation, the user could be redirected to the "View All Units" page with the parent building of the newly created unit automatically selected, showing the new unit in the table.

**Validation:**
- `buildingId` and `label` are required fields.

---

## API Endpoints (Units)
- `GET /api/units?buildingId=:id` → Get all units for a specific building.
- `POST /api/units` → Add a new unit.
- `GET /api/units/:id` → Get a single unit by ID.
- `PUT /api/units/:id` → Update a single unit by ID.
- `DELETE /api/units/:id` → Delete a unit by ID.

---

## Data Model (Unit)
```json
{
  "_id": "unit_123",
  "buildingId": "bld_abc",
  "label": "A1",
  "visitStatus": "Visited",
  "provider": "Mediatek",
  "clientName": "John Doe",
  "phone": "254712345678",
  "nextBillingDate": "2025-09-15T00:00:00Z",
  "comments": "Customer interested in 10Mbps package.",
  "active": true,
  "createdAt": "2025-08-16T10:00:00Z"
}
```
