# Refactoring Plan: Unify Frontend Forms

**Objective:** To refactor the "add" and "edit" pages for Users, Routers, and Packages by creating single, reusable form components for each entity. This will eliminate significant code duplication, ensure a consistent user experience, and make future maintenance easier.

---

## 1. Analysis of the Problem

Currently, the frontend has separate, duplicated components for handling the creation and updating of several key entities:
- **Mikrotik Users:** `.../users/new/page.tsx` and `.../users/[id]/page.tsx`.
- **Mikrotik Routers:** `.../routers/new/page.tsx` and `.../routers/[id]/page.tsx`.
- **Packages:** `.../packages/new/page.tsx` and `.../packages/[id]/page.tsx`.

This has led to several issues:
- **Massive Code Duplication:** The UI structure and state management are copied across multiple files.
- **Inconsistent UI/UX:** The "add" pages are often more modern and feature-rich than their "edit" counterparts.
- **Maintenance Overhead:** Any change to a form requires updating at least two separate, complex files.
- **Bugs:** The "edit" pages have been prone to data-loading bugs where form fields do not pre-populate correctly.

---

## 2. The Solution: Reusable Form Components

The solution is to create a single, reusable component for each entity that encapsulates the entire form logic and UI.

**Key Implementation Principle:** To prevent data loading bugs, the reusable form components **must** initialize their state directly from the `initialData` prop, not via a `useEffect` hook. For example: `const [name, setName] = useState(initialData?.name || "");`.

---

## 3. Detailed Refactoring Roadmap

### Part 1: Unify Mikrotik User Forms [COMPLETED]

- **Status:** This refactor has been successfully completed.
- **Component Created:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`.
- **Outcome:** The "add" and "edit" user pages now use a single, consistent, and robust form component.

### Part 2: Unify Mikrotik Router Forms [NEXT]

1.  **Create Reusable Component:**
    -   **File:** `frontend/src/components/mikrotik/MikrotikRouterForm.tsx`.
    -   **Props:**
        ```typescript
        interface MikrotikRouterFormProps {
          isEditMode: boolean;
          initialData?: Partial<MikrotikRouter>;
          onSubmit: (data: any) => Promise<void>;
          isSubmitting: boolean;
        }
        ```

2.  **Implement the Component:**
    -   Migrate the UI and state logic from `.../routers/new/page.tsx`.
    -   **Crucially, initialize all state from the `initialData` prop directly.**
    -   Adapt the UI (titles, buttons) based on the `isEditMode` prop.

3.  **Refactor Page Components:**
    -   **`.../routers/new/page.tsx`:** Gut the old form logic and render `<MikrotikRouterForm isEditMode={false} ... />`. The page will handle the `POST` submission.
    -   **`.../routers/[id]/page.tsx`:** Gut the old form logic and render `<MikrotikRouterForm isEditMode={true} ... />`. The page will fetch the router data to pass as `initialData` and will handle the `PUT` submission.

### Part 3: Unify Package Forms [PLANNED]

1.  **Create Reusable Component:**
    -   **File:** `frontend/src/components/mikrotik/MikrotikPackageForm.tsx`.
    -   **Props:**
        ```typescript
        interface MikrotikPackageFormProps {
          isEditMode: boolean;
          initialData?: Partial<Package>;
          onSubmit: (data: any) => Promise<void>;
          isSubmitting: boolean;
          routers: MikrotikRouter[]; // For the router selection dropdown
          pppProfiles: string[]; // For the profile dropdown
        }
        ```

2.  **Implement the Component:**
    -   Migrate the UI and state logic from `.../packages/new/page.tsx`.
    -   **Initialize all state from the `initialData` prop directly.**
    -   Adapt the UI based on the `isEditMode` prop.

3.  **Refactor Page Components:**
    -   **`.../packages/new/page.tsx`:** Gut the old form logic and render `<MikrotikPackageForm isEditMode={false} ... />`. The page will handle data fetching (routers) and the `POST` submission.
    -   **`.../packages/[id]/page.tsx`:** Gut the old form logic and render `<MikrotikPackageForm isEditMode={true} ... />`. The page will fetch all necessary data (package details, routers, profiles) and handle the `PUT` submission.

---

## 4. Overall Expected Outcome

-   **DRY Principle:** All form logic will exist in only one place per entity.
-   **Consistency:** The "add" and "edit" experiences will be identical across the application.
-   **Maintainability:** Future updates to forms will be simple and centralized.
-   **Robustness:** The direct state initialization from props will prevent a whole class of data-loading bugs.