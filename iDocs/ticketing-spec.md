## Detailed Specification: ISP Management System - Billing Ticketing Feature

### 1. Feature Name: Client Billing Issue Ticketing System

### 2. Introduction/Goal

This feature aims to streamline the process of managing client complaints related to billing within the ISP management system. It provides administrators with the tools to efficiently log, track, and resolve billing-related issues, while keeping clients informed of their ticket's progress. The primary goal is to improve customer service by providing a structured approach to issue resolution and transparent communication.

### 3. User Stories

**As an Admin:**
*   **US-A-001:** I want to create a new billing ticket for a client when they report an issue (e.g., via phone call), so that I can formally log and track the complaint.
*   **US-A-002:** I want to assign a unique reference number to each new ticket, so that both the client and I can easily identify and refer to the ticket.
*   **US-A-003:** I want to view a list of all open billing tickets, so that I can monitor outstanding issues.
*   **US-A-004:** I want to view the details of a specific billing ticket, including client information, issue description, and history, so that I have all necessary context for resolution.
*   **US-A-005:** I want to update the status of a billing ticket (e.g., to "Fixed"), so that I can reflect the current state of the issue.
*   **US-A-006:** I want to optionally assign a technician to a ticket, so that I can dispatch personnel for issues requiring on-site intervention.
*   **US-A-007:** I want to add internal notes or comments to a ticket, so that I can keep a record of communication or actions taken.

**As a Client:**
*   **US-C-001:** I want to receive an SMS notification when a new billing ticket is created for my issue, so that I am immediately informed and have a reference number.
*   **US-C-002:** I want to receive an SMS notification when my billing ticket's status is updated (e.g., to "Fixed"), so that I am aware of the resolution.

### 4. Functional Requirements

#### 4.1. Ticket Creation
*   **FR-TC-001:** The system SHALL provide an interface for Admins to create new billing tickets.
*   **FR-TC-002:** Each new ticket SHALL automatically be assigned a unique, alphanumeric reference number (e.g., `BILL-YYYYMMDD-XXXX`).
*   **FR-TC-003:** Admins SHALL be able to input the following information when creating a ticket:
    *   Client Name (text input, potentially auto-suggest from existing client database)
    *   Client Contact (Phone Number, Email - text input, potentially auto-suggest)
    *   Client Account/Service ID (text input, optional)
    *   Issue Type (dropdown: e.g., "Incorrect Bill", "Payment Not Reflected", "Service Suspension", "Other")
    *   Issue Description (multiline text area)
    *   Initial Status (default to "New" or "Open")
    *   Priority (dropdown: e.g., "Low", "Medium", "High", "Urgent")
*   **FR-TC-004:** The system SHALL record the Admin who created the ticket and the creation timestamp.

#### 4.2. Client Notification
*   **FR-CN-001:** Upon successful creation of a new billing ticket, the system SHALL send an SMS notification to the client's registered phone number.
*   **FR-CN-002:** The SMS notification for ticket creation SHALL include:
    *   Confirmation that a ticket has been logged.
    *   The unique ticket reference number.
    *   A brief description of the issue (truncated if too long).
    *   Instructions on how to check status (if applicable in future, e.g., "Reply STATUS [RefNum]").
*   **FR-CN-003:** Upon successful update of a ticket's status to "Fixed", the system SHALL send an SMS notification to the client.
*   **FR-CN-004:** The SMS notification for ticket resolution SHALL include:
    *   Confirmation that the ticket (with reference number) has been resolved.
    *   A brief message indicating the issue is fixed.

#### 4.3. Technician Management (Optional for V1, but considered for future)
*   **FR-TM-001:** Admins SHALL be able to select and assign an existing Technician user to a ticket.
*   **FR-TM-002:** The system SHALL record the assigned Technician and the assignment timestamp.
*   **FR-TM-003:** (Future) Technicians SHALL be notified (e.g., via SMS/email) when a ticket is assigned to them.

#### 4.4. Ticket Status Management
*   **FR-TSM-001:** Admins SHALL be able to update the status of any open ticket.
*   **FR-TSM-002:** The available ticket statuses SHALL include: "New", "Open", "In Progress", "Dispatched" (if technician assigned), "Fixed", "Closed" (manual closure by Admin after "Fixed").
*   **FR-TSM-003:** The system SHALL record the Admin who updated the status and the timestamp of the status change.
*   **FR-TSM-004:** (Future) The system SHALL prevent certain status transitions (e.g., directly from "New" to "Closed" without "Fixed").

#### 4.5. Ticket Viewing and Reporting
*   **FR-TVR-001:** Admins SHALL be able to view a paginated list of all tickets.
*   **FR-TVR-002:** The ticket list SHALL be sortable by: Reference Number, Creation Date, Last Updated, Status, Priority.
*   **FR-TVR-003:** The ticket list SHALL be filterable by: Status, Issue Type, Assigned Technician, Date Range.
*   **FR-TVR-004:** Admins SHALL be able to search tickets by: Client Name, Client Phone Number, Reference Number, Issue Description keywords.
*   **FR-TVR-005:** Admins SHALL be able to view a detailed page for each ticket, displaying all recorded information and a history of status changes/notes.

### 5. Non-Functional Requirements

*   **Security:**
    *   **NFR-SEC-001:** Only authenticated and authorized Admin users SHALL be able to create, update, and view tickets.
    *   **NFR-SEC-002:** Client phone numbers and sensitive information SHALL be handled securely (e.g., encrypted at rest).
*   **Performance:**
    *   **NFR-PERF-001:** Ticket creation and status updates SHALL complete within 2 seconds under normal load.
    *   **NFR-PERF-002:** Ticket list loading (first page) SHALL complete within 3 seconds for up to 1000 tickets.
*   **Usability:**
    *   **NFR-US-001:** The Admin interface for ticket management SHALL be intuitive and easy to navigate.
    *   **NFR-US-002:** Notifications to clients SHALL be clear, concise, and easy to understand.
*   **Scalability:**
    *   **NFR-SCAL-001:** The system SHALL be able to handle an increasing volume of tickets (e.g., up to 10,000 active tickets) without significant performance degradation.
*   **Maintainability:**
    *   **NFR-MAINT-001:** The code SHALL follow existing project conventions and be well-documented.
    *   **NFR-MAINT-002:** The system SHALL be easily extendable to add new issue types, notification methods (e.g., email, WhatsApp), or reporting features.

### 6. Technical Design Considerations (High-Level)

#### 6.1. Backend (Node.js/Express.js)

*   **Database Schema (MongoDB - `Ticket` Model):**
    *   `ticketRef` (String, Unique, Indexed): Auto-generated reference number.
    *   `clientName` (String)
    *   `clientPhone` (String)
    *   `clientEmail` (String, Optional)
    *   `clientAccountId` (String, Optional)
    *   `issueType` (String, Enum: "Incorrect Bill", "Payment Not Reflected", "Service Suspension", "Other")
    *   `description` (String)
    *   `status` (String, Enum: "New", "Open", "In Progress", "Dispatched", "Fixed", "Closed", Default: "New")
    *   `priority` (String, Enum: "Low", "Medium", "High", "Urgent", Default: "Medium")
    *   `assignedTo` (ObjectId, Ref: 'User', Optional): Reference to Technician user.
    *   `createdBy` (ObjectId, Ref: 'User'): Reference to Admin user.
    *   `statusHistory` (Array of Objects):
        *   `status` (String)
        *   `timestamp` (Date)
        *   `updatedBy` (ObjectId, Ref: 'User')
    *   `notes` (Array of Objects):
        *   `content` (String)
        *   `timestamp` (Date)
        *   `addedBy` (ObjectId, Ref: 'User')
    *   `createdAt` (Date, Indexed)
    *   `updatedAt` (Date, Indexed)

*   **API Endpoints:**
    *   `POST /api/tickets`: Create a new ticket (Admin only).
    *   `GET /api/tickets`: Get all tickets (Admin only, with filtering, sorting, pagination).
    *   `GET /api/tickets/:id`: Get single ticket details (Admin only).
    *   `PUT /api/tickets/:id`: Update ticket status/details/assign technician (Admin only).
    *   `POST /api/tickets/:id/notes`: Add a note to a ticket (Admin only).

*   **Integrations:**
    *   **SMS Service:** Utilize `backend/services/smsService.js` for sending notifications.
    *   **User Authentication:** Leverage existing `authMiddleware.js` for Admin authentication.
    *   **Client Data:** Potentially integrate with existing client models/services for auto-suggestion.

#### 6.2. Frontend (Next.js/React)

*   **Pages:**
    *   `/tickets/new`: Form for creating a new ticket.
    *   `/tickets`: List of all tickets (with filters, search, pagination).
    *   `/tickets/:id`: Detailed view of a single ticket.
    *   `/tickets/:id/edit`: Form for editing ticket details (status, assignment, notes).
*   **Components:**
    *   `TicketForm`: Reusable component for creating/editing tickets.
    *   `TicketTable`: Data table for displaying tickets.
    *   `TicketDetailsCard`: Component to display individual ticket details.
    *   `StatusDropdown`: UI component for updating ticket status.
    *   `TechnicianAssignmentDropdown`: UI component for assigning technicians.
*   **Services:**
    *   New frontend service (`ticketService.js`) to interact with backend ticket APIs.
*   **Notifications:**
    *   Display toast notifications for successful/failed operations.

### 7. Future Enhancements (Out of Scope for V1)

*   Client portal for viewing ticket status and adding comments.
*   Email notifications in addition to SMS.
*   Automated ticket assignment based on issue type or technician availability.
*   SLA (Service Level Agreement) tracking and alerts.
*   Advanced reporting and analytics (e.g., average resolution time, common issue types).
*   Integration with external communication platforms (e.g., WhatsApp).
*   File attachments to tickets.
*   Public knowledge base integration for common issues.
