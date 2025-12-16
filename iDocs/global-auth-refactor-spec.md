# Refactoring Plan: Enforce Global API Authentication

## 1. Objective

To improve the security and long-term maintainability of the API by refactoring the authentication mechanism. The goal is to establish a "secure by default" architecture where all API endpoints are protected globally, and public access is granted only to specific, explicitly defined routes.

## 2. Current State

Currently, authentication is handled on a per-route or per-router basis. The `protect` middleware is manually imported and applied to individual routes within files like `billRoutes.js`, `ticketRoutes.js`, etc.

This approach is functional but carries the risk of a developer accidentally creating a new sensitive endpoint and forgetting to apply the `protect` middleware, leaving it unintentionally exposed.

## 3. Proposed State

We will apply the `protect` middleware globally in `server.js` to all routes prefixed with `/api`. Public routes, such as user login and registration, will be explicitly mounted *before* the global middleware is applied.

This inverts the security model from "opt-in protection" to "opt-out protection," which is a more robust and secure standard.

## 4. Execution Plan

- [ ] **Step 1: Analyze and Refactor `userRoutes.js`**
  - [ ] Identify public endpoints (`/login`, `/logout`).
  - [ ] Restructure the file to separate public routes from private routes. This will likely involve creating and exporting two distinct router objects.

- [ ] **Step 2: Restructure `server.js`**
  - [ ] Mount the public routes from `userRoutes.js` first.
  - [ ] Apply the global `protect` middleware to the `/api` path: `app.use('/api', protect);`.
  - [ ] Mount all other private routes (including the private routes from `userRoutes.js`) after the global middleware.

- [ ] **Step 3: Clean Up Route Files**
  - [ ] Go through all private route files (`billRoutes.js`, `ticketRoutes.js`, `mikrotikUserRoutes.js`, etc.).
  - [ ] Remove the now-redundant `protect` middleware from every route definition, as it is now handled globally.

- [ ] **Step 4: Verification**
  - [ ] After the refactor, perform a full authentication test:
    - [ ] Clear browser cookies.
    - [ ] Confirm public routes like the login page are accessible.
    - [ ] Log in successfully.
    - [ ] Confirm access to a protected resource (e.g., viewing bills).
    - [ ] Log out successfully.
