# Refactoring Plan: Unify Frontend Forms

**Objective:** To refactor the "add" and "edit" pages for Users, Routers, Packages, and Devices by creating single, reusable form components for each entity. This will eliminate significant code duplication, ensure a consistent user experience, and make future maintenance easier.

---

## 1. Analysis of the Problem

Currently, the frontend has separate, duplicated, or inconsistent components for handling the creation and updating of several key entities:
- **Mikrotik Users:** `.../users/new/page.tsx` and `.../users/[id]/page.tsx`.
- **Mikrotik Routers:** `.../routers/new/page.tsx` and `.../routers/[id]/page.tsx`.
- **Packages:** `.../packages/new/page.tsx` and `.../packages/[id]/page.tsx`.
- **Devices:** `.../devices/new/page.tsx` uses its own logic, while `.../devices/edit/[id]/page.tsx` uses a reusable component.

This has led to several issues:
- **Massive Code Duplication:** The UI structure and state management are copied across multiple files.
- **Inconsistent UI/UX:** The "add" pages are often more modern and feature-rich than their "edit" counterparts, or vice-versa.
- **Maintenance Overhead:** Any change to a form requires updating multiple separate, complex files.
- **Bugs:** The duplicated forms have been prone to data-loading bugs where fields do not pre-populate correctly.

---

## 2. The Solution: Reusable Form Components

The solution is to create or consolidate into a single, reusable component for each entity that encapsulates the entire form logic and UI.

**Key Implementation Principle:** To prevent data loading bugs, the reusable form components **must** initialize their state directly from the `initialData` prop, not via a `useEffect` hook. For example: `const [name, setName] = useState(initialData?.name || "");`.

---

## 3. Detailed Refactoring Roadmap

### Part 1: Unify Mikrotik User Forms [COMPLETED]

- **Status:** This refactor has been successfully completed.
- **Component Created:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`.
- **Outcome:** The "add" and "edit" user pages now use a single, consistent, and robust form component.

### Part 2: Unify Mikrotik Router Forms [COMPLETED]

- **Status:** This refactor has been successfully completed.
- **Component Created:** `frontend/src/components/mikrotik/MikrotikRouterForm.tsx`.
- **Outcome:** The "add" and "edit" router pages now use a single, consistent form component.

### Part 3: Unify Package Forms [COMPLETED]

- **Status:** This refactor has been successfully completed.
- **Component Created:** `frontend/src/components/mikrotik/MikrotikPackageForm.tsx`.
- **Outcome:** The "add" and "edit" package pages now use a single, consistent form component.

### Part 4: Unify Device Forms [NEXT]

1.  **Analysis:**
    -   A reusable component already exists at `frontend/src/components/devices/DeviceForm.tsx`.
    -   The "edit" page (`.../devices/edit/[id]/page.tsx`) already uses this component.
    -   The "add" page (`.../devices/new/page.tsx`) contains duplicated logic and needs to be refactored.

2.  **Refactor Page Component:**
    -   **`.../devices/new/page.tsx`:** Gut the old form logic and render the existing `<DeviceForm isEditMode={false} ... />`. The page will handle the `POST` submission logic and pass it as the `onSubmit` prop.

---

## 4. Overall Expected Outcome

-   **DRY Principle:** All form logic will exist in only one place per entity.
-   **Consistency:** The "add" and "edit" experiences will be identical across the application.
-   **Maintainability:** Future updates to forms will be simple and centralized.
-   **Robustness:** The direct state initialization from props will prevent a whole class of data-loading bugs.
