# CodeRabbit Review Report v2: Frontend Core
Date: 2026-02-03
Status: 🟡 Improvements Needed (Security & Architecture)

## Summary of Audit
The frontend has a solid foundation for route protection and multi-tenant state management. However, there are "shortcut" implementations in the middleware and API layer that present security risks and architectural debt.

## Analysis of Issues

### 🔴 Critical Issues
- **Hardcoded JWT Secret Fallback**: **CRITICAL**. In `frontend/middleware.ts`, the `JWT_SECRET` has a hardcoded fallback (`YOUR_VERY_STRONG_SECRET_KEY`). If the environment variable is not correctly passed to the Next.js Edge Runtime, the middleware will "silently" fail over to this known key, allowing potential token forgery.
- **Scattered API Calls**: The frontend appears to use direct `fetch` calls in components (e.g., `page.tsx`) rather than a centralized API utility (like an `api.ts` or `axios` instance). This makes it impossible to implement global error handling (e.g., auto-logout on 401) or interceptors for headers consistently.

### 🛡️ Security & Integrity
- **RBAC Enforcement**: **GOOD**. The middleware correctly blocks access to `/superadmin/*` routes for users who do not have the `SUPER_ADMIN` role in their JWT.
- **Route Protection**: **GOOD**. The `ProtectedLayout` prevents "flicker" of authenticated content for guest users by returning `null` until the auth state is confirmed.

### 🟡 Suggestions & Improvements
- **Centralized API Utility**: Create a `src/lib/api.ts` to wrap all fetch calls. This will simplify error handling, base URL management, and token injection.
  *NOTE: The utility has been created and integrated into core authentication flows, but a full refactoring of all fetch calls will be revisited.*
- **Middleware Secret**: Ensure `JWT_SECRET` is properly exposed to the Next.js build/runtime and remove the hardcoded fallback immediately.
- **XSS Audit**: While React/Next.js escapes data by default, a thorough check for `dangerouslySetInnerHTML` should be performed on any component rendering dynamic content (like SMS templates or reports).
  *NOTE: This audit will be revisited.*

## Conclusion
The frontend correctly enforces the multi-tenant and role-based access rules. However, the security of the JWT verification in middleware and the maintainability of the API interaction layer need urgent attention.
