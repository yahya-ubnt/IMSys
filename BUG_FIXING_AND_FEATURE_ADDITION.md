# Bug Fixing and Feature Addition

This document tracks the bug fixes and feature additions for the ISP Management System.

## 1. Login Page
- [x] Add a "Forgot Password?" link on the login page.
- [x] Clicking "Forgot Password?" should show a "Recover Password" popup with an email field and a "Recover" button.
- [x] The "Recover Password" popup should also have an "Already have an account? Login" link to go back to the login page.

## 2. MikroTik Routers
- [x] The "location" field is missing when editing a MikroTik router.
- [x] The "location" field is also missing when creating a MikroTik router.
- [x] The "location" field should be visible on the "All Routers" page (`/mikrotik/routers`).

## 3. MikroTik Users (Static and PTA)
- [x] After creating a user, the new user appears at the bottom of the user list. It should appear at the top.

## 4. MikroTik User Creation/Editing Workflow Bug
- [x] When creating a user, if a new building is created and assigned to the user without linking the building to a station, it's impossible to edit the user later because the "station" field is mandatory on the edit page.
- [x] The "building" field is missing on the user edit page, so it can't be changed.

## 5. Apartment/House Number vs. Building
- [x] The old "Apartment/House Number" field is still visible during user creation. It should be replaced with the "Building" field.
- [x] The "Apartment/House Number" is also visible on the user's overview tab, it should be "Building".

## 6. Remote Address Field
- [x] The "Remote Address" field should be removed from all MikroTik user creation, editing, and update forms.

## 7. M-PESA Reference Number
- [x] The "M-PESA Reference Number" field is disabled on the user edit page. It should be editable.

## 8. Email Address Field
- [x] The "Email Address" field is missing on the user edit page. It should be there as well.

## 9. Automatic Station Assignment
- [x] When a station is created and linked to a building, automatically assign that station to all users in the building who do not have a station assigned.

## 10. Device Management
- [x] The "Parent Device (Uplink)" dropdown is missing from the device edit page.
- [x] The "Physical Location (Building)" dropdown is missing from the device edit page.
- [x] The "Additionally Serves" section is missing from the device edit page.
- [x] The "AP to connect to" dropdown should be removed from all device CRUD operations and replaced with the "Parent Device" dropdown.

## 11. Authentication
- [x] Fix an issue where opening a new tab would log the user out. This was caused by the client-side code being unable to read the `httpOnly` cookie. The fix was to rely on the browser to send the cookie automatically.
