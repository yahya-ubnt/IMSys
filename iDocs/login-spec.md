# Simple Login Page Specification

## Purpose
This document outlines the implementation of a very simple login page for the dashboard, intended for a single user with hardcoded credentials. This approach is for demonstration or extremely limited, non-sensitive use cases only.

**WARNING: This login method is highly insecure and is NOT suitable for production environments or any application handling sensitive data. Credentials are hardcoded and authentication occurs client-side, making it vulnerable to unauthorized access.**

---

## Core Features
- User authentication via hardcoded username and password.
- Redirect to dashboard upon successful login.
- Display error message for invalid credentials.
- Basic logout functionality.

---

## Credentials
- **Username:** `admin`
- **Password:** `Abuhureira12`

---

## UI Requirements (Frontend: `frontend/src/pages/Login.jsx`)

- **Fields:**
  - Username (text input)
  - Password (password input)
- **Button:** Login
- **Error Display:** A clear message area to show authentication errors.

---

## Authentication Logic (Frontend-only)

- When the Login button is clicked:
  1.  Retrieve values from the Username and Password fields.
  2.  Compare the entered username with `admin` (case-sensitive).
  3.  Compare the entered password with `Abuhureira12` (case-sensitive).
  4.  If both match:
      - Set a flag in `localStorage` (e.g., `isLoggedIn: 'true'`) to persist login status.
      - Redirect the user to the Dashboard (`/`).
  5.  If credentials do not match:
      - Display an error message (e.g., "Invalid username or password").

---

## Logout Logic

- When a Logout button is clicked:
  1.  Remove the `isLoggedIn` flag from `localStorage`.
  2.  Redirect the user to the Login page (`/login`).

---

## Routing & Protection (Frontend: `frontend/src/routes/AppRoutes.jsx`)

- The Dashboard (`/`) and other main application pages should be protected.
- If `isLoggedIn` is not `true` in `localStorage`, redirect to `/login`.

---

## Navigation (Frontend: `frontend/src/components/Navigation.jsx`)

- Display a Logout button when logged in.
- Display a Login link when not logged in.
