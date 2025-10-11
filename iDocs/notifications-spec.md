# Notification System Specification

## 1. Overview

This document outlines the specification for a comprehensive notification system within the application. The system will be responsible for generating, storing, and displaying alerts and notifications to users in a timely and intuitive manner. The initial implementation will focus on in-app notifications, with provisions for future expansion to other channels like SMS, Email, and WhatsApp.

## 2. Data Model

A new Mongoose model, `Notification`, will be created to store notification data in the MongoDB database.

### `Notification` Model Schema

| Field | Type | Description | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the notification. | Yes | Auto-generated |
| `message` | String | The content of the notification message. | Yes | |
| `type` | String | The type of notification. Enum: `device_status`, `system`, `billing`, `ticket`. | Yes | `system` |
| `status` | String | The status of the notification. Enum: `read`, `unread`. | Yes | `unread` |
| `user` | ObjectId | A reference to the `User` model, for user-specific notifications. Can be null for system-wide notifications. | No | `null` |
| `createdAt` | Date | Timestamp of when the notification was created. | Yes | Auto-generated |
| `updatedAt` | Date | Timestamp of when the notification was last updated. | Yes | Auto-generated |

## 3. Backend Implementation

### 3.1. `alertingService.js` Modification

The existing `alertingService.js` will be updated to create and save a `Notification` document to the database instead of just logging to the console.

```javascript
const Notification = require('../models/Notification');

const sendAlert = async (device, status, user = null) => {
  const message = `ALERT: Device ${device.deviceName || device.macAddress} (${device.ipAddress}) is now ${status}.`;
  console.log(message); // Keep console log for debugging

  try {
    const notification = new Notification({
      message,
      type: 'device_status',
      user: user ? user._id : null,
    });
    await notification.save();
    // Emit a websocket event to notify the frontend
    // io.emit('new_notification', notification);
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

module.exports = { sendAlert };
```

### 3.2. `notificationController.js`

A new controller will be created to handle notification-related operations.

- **`getNotifications(req, res)`**: Fetches all notifications for the logged-in user, with pagination.
- **`markAsRead(req, res)`**: Marks a specific notification as read.
- **`markAllAsRead(req, res)`**: Marks all unread notifications for the logged-in user as read.
- **`deleteNotification(req, res)`**: Deletes a specific notification.

### 3.3. API Endpoints

New routes will be added to `backend/routes/`.

| Method | Endpoint | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | `getNotifications` | Get all notifications for the user. |
| `PUT` | `/api/notifications/:id/read` | `markAsRead` | Mark a single notification as read. |
| `PUT` | `/api/notifications/read/all` | `markAllAsRead` | Mark all notifications as read. |
| `DELETE`| `/api/notifications/:id` | `deleteNotification` | Delete a notification. |

### 3.4. WebSocket Integration (for Real-time Updates)

The `socket.io` library will be integrated into the backend to provide real-time notification updates.

- When a new notification is created, the server will emit a `new_notification` event to the relevant user(s).
- The frontend will listen for this event and update the notification center in real-time.

## 4. Frontend Implementation

### 4.1. Notification Center UI

- A bell icon will be added to the main navigation bar.
- A badge with the count of unread notifications will be displayed on the bell icon.
- Clicking the bell icon will open a dropdown panel showing a list of recent notifications.
- Unread notifications will have a distinct visual style (e.g., a blue dot or a different background color).
- The dropdown will have a "View All" link that navigates to a dedicated notifications page.

### 4.2. API Integration

- On application load, the frontend will make a `GET` request to `/api/notifications` to fetch the initial list of notifications.
- The notification count badge will be updated based on the number of unread notifications.
- When a user clicks on a notification, a `PUT` request will be sent to `/api/notifications/:id/read` to mark it as read.

### 4.3. Real-time Updates

- The frontend will establish a WebSocket connection with the server.
- A listener for the `new_notification` event will be set up.
- When a `new_notification` event is received, the frontend will:
  - Display a toast message with the notification.
  - Add the new notification to the notification list.
  - Update the unread notification count.

## 5. Future Enhancements

### 5.1. Multi-channel Notifications

- **Email:** Integrate an email service (e.g., Nodemailer) to send notifications via email for critical alerts.
- **SMS:** Integrate with an SMS gateway (like the existing `SmsProvider`) to send SMS notifications.
- **WhatsApp:** Integrate with the WhatsApp Business API to send notifications via WhatsApp.

### 5.2. User Preferences

- A new section in the user settings page will allow users to configure their notification preferences.
- Users will be able to choose which types of notifications they want to receive and on which channels (in-app, email, SMS, etc.).

### 5.3. Notification Grouping

- Similar notifications will be grouped together in the UI to avoid clutter. For example, multiple "device offline" notifications for the same device could be grouped into a single entry.

### 5.4. Snooze/Dismiss Actions

- Add actions to notifications to allow users to snooze them for a certain period or dismiss them permanently.
