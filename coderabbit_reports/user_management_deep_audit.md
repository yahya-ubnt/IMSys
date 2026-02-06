# CodeRabbit Deep Audit: User Management & RBAC

**Review Date:** Saturday, January 31, 2026
**Target Files:**
- `backend/models/User.js`
- `backend/controllers/userController.js`
- `backend/middlewares/protect.js`
- `backend/routes/userRoutes.js`
- `frontend/src/components/auth-provider.tsx`

---

## 1. Critical Finding: Schema & Controller Mismatch
**Severity: CRITICAL**

### The Bug
In `backend/controllers/userController.js`, the `createTenantUser` function defaults roles to `['USER']`.

```javascript
// backend/controllers/userController.js
const createTenantUser = asyncHandler(async (req, res) => {
    // ...
    const user = await User.create({
        // ...
        roles: roles || ['USER'], // BUG: 'USER' is not in the model enum
        tenant: req.user.tenant,
    });
});
```

### The Conflict
The `User` model (`backend/models/User.js`) defines the allowed roles as:
`enum: ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'SUPPORT']`.

### Impact
Any attempt to create a standard tenant user without specifying a role will trigger a Mongoose `ValidationError`, causing the API request to fail with a 400 or 500 error. The system also lacks a `STAFF` role which is required for general tenant employees.

---

## 2. Multi-tenancy Implementation Analysis
**Severity: HIGH (Security Risk)**

### Findings
Multi-tenancy is enforced manually at the controller level:
- **Hydration:** `protect.js` correctly attaches the `tenant` ID to `req.user`.
- **Filtering:** Controllers manually add `{ tenant: req.user.tenant }` to queries.

### Risks
- **Human Error:** This "Compliance by Memory" pattern is fragile. Forgetting the filter in a single new endpoint will result in a cross-tenant data leak.
- **Inconsistency:** Some routes (like `getUsers`) are restricted to `SUPER_ADMIN` and don't filter by tenant (which is correct for SuperAdmins), but there is no middle-ground "Global Admin" protection that automatically scopes to a tenant.

---

## 3. RBAC (Role-Based Access Control)
**Severity: MEDIUM**

### Findings
- The middleware in `protect.js` only provides `isSuperAdmin` and `isAdmin`.
- Roles like `TECHNICIAN` and `SUPPORT` are defined in the schema but have **no corresponding middleware** to protect routes.

### Recommendations
- Implement `isTechnician`, `isSupport`, and `isStaff` middlewares.
- Refactor `protect.js` to use a role-based factory pattern for better scalability.

---

## 4. Frontend Auth Context Safety
**Severity: MEDIUM**

### Findings
- `frontend/src/components/auth-provider.tsx` lacks a guard clause in the `useAuth` hook.
- Using `useAuth()` outside of the `AuthProvider` component will return `undefined`, leading to cryptic "cannot read property of undefined" runtime crashes.

---

## Action Plan & Remediation

### Backend Fixes
1. **Update User Model**: Add `'STAFF'` to the `roles` enum in `backend/models/User.js`.
2. **Update User Controller**: Change the default role in `createTenantUser` from `['USER']` to `['STAFF']`.
3. **Enhance Middleware**: Add missing role guards to `backend/middlewares/protect.js`.

### Frontend Fixes
1. **Harden Hook**: Add a check to `useAuth` to throw an error if the context is undefined.
2. **Role Helpers**: Add `isStaff` and `isTechnician` booleans to the Auth Context.
