# Refactoring Plan: Unify Mikrotik User Forms

**Objective:** To refactor the "Add New Mikrotik User" and "Edit Mikrotik User" pages by creating a single, reusable form component. This will eliminate significant code duplication, ensure a consistent user experience, and make future maintenance easier.

---

## 1. Analysis of the Problem

Currently, the frontend has two separate, large components for handling user creation and updates:
- `frontend/src/app/mikrotik/users/new/page.tsx` (The modern, "add" page)
- `frontend/src/app/mikrotik/users/[id]/page.tsx` (The outdated, "edit" page)

This has led to several issues:
- **Massive Code Duplication:** The UI structure, state management (`useState` hooks for every field), and helper functions are copied across both files.
- **Inconsistent UI/UX:** The "add" page has a superior two-column layout, a dialog for creating new buildings, and other UX enhancements that are missing from the "edit" page.
- **Maintenance Overhead:** Any change to a user field requires updating two separate, complex files, increasing the risk of bugs and inconsistencies.

---

## 2. Proposed Solution: The `MikrotikUserForm` Component

The solution is to create a single, reusable component that encapsulates the entire form logic and UI.

**File to be Created:** `frontend/src/components/mikrotik/MikrotikUserForm.tsx`

This new component will be responsible for rendering the form and will be used by both the "add" and "edit" pages.

---

## 3. Detailed Refactoring Roadmap

### Phase 1: Create the Reusable `MikrotikUserForm` Component

1.  **Create the File:**
    -   Create a new file at `frontend/src/components/mikrotik/MikrotikUserForm.tsx`.

2.  **Define Component Props:**
    -   The component will accept the following props:
        ```typescript
        interface MikrotikUserFormProps {
          isEditMode: boolean;
          initialData?: Partial<MikrotikUser>; // For pre-filling the form in edit mode
          onSubmit: (data: any) => Promise<void>; // The submission handler function
          routers: MikrotikRouter[];
          packages: Package[];
          buildings: Building[];
          stations: Device[];
        }
        ```

3.  **Migrate Logic from `NewMikrotikUserPage`:**
    -   **Move State Management:** Transfer all the `useState` hooks for form fields (e.g., `username`, `packageId`, etc.) from `NewMikrotikUserPage` into `MikrotikUserForm`.
    -   **Move UI (JSX):** Copy the entire JSX for the two-step form, including the `Card`, `StepIndicator`, `motion.div` elements, and all `Input`/`Select` fields, into the new component.
    -   **Move Helper Functions:** Relocate UI-specific helper functions like `generateValue` into the new component.

### Phase 2: Adapt the Form for Both "Add" and "Edit" Modes

1.  **Conditional Rendering:**
    -   Use the `isEditMode` prop to conditionally render parts of the UI:
        -   **Page Title:** "Add New Mikrotik User" vs. "Edit: {initialData.officialName}".
        -   **Submit Button Text:** "Save User" vs. "Save Changes".
        -   **API Logic:** The `onSubmit` prop will allow each page to provide its own submission logic (i.e., `POST` for create, `PUT` for update).

2.  **Handle `initialData`:**
    -   In the `MikrotikUserForm` component, use a `useEffect` hook to populate the form fields from the `initialData` prop when in edit mode.

3.  **Disable Fields in Edit Mode:**
    -   Wrap the `username` input field to be disabled if `isEditMode` is `true`, as this field should not be changed after creation.

### Phase 3: Refactor the Page Components to Use the New Form

1.  **Refactor `NewMikrotikUserPage` (`.../new/page.tsx`):**
    -   Remove all the duplicated form UI and state logic.
    -   The page will now primarily be responsible for fetching the necessary data (routers, packages, etc.).
    -   Render the new `<MikrotikUserForm />` component.
    -   Pass the following props:
        -   `isEditMode={false}`
        -   The fetched data (routers, packages, etc.).
        -   An `onSubmit` function that contains the `fetch` call to the `POST /api/mikrotik/users` endpoint.

2.  **Refactor `EditMikrotikUserPage` (`.../[id]/page.tsx`):**
    -   Remove all its duplicated form UI and state logic.
    -   This page will fetch all necessary data *and* the specific user's data.
    -   Render the new `<MikrotikUserForm />` component.
    -   Pass the following props:
        -   `isEditMode={true}`
        -   `initialData={userData}`
        -   The fetched data (routers, packages, etc.).
        -   An `onSubmit` function that contains the `fetch` call to the `PUT /api/mikrotik/users/[id]` endpoint.

---

## 4. Expected Outcome

-   **DRY Principle:** The form logic and UI will exist in only one place (Don't Repeat Yourself).
-   **Consistency:** The "add" and "edit" experiences will be identical, using the best, most modern version of the form.
-   **Maintainability:** Future updates to the form (e.g., adding a new field) will only require changes to the single `MikrotikUserForm.tsx` file.
-   **Improved Code Quality:** The page components will become much cleaner and more focused on their primary responsibility: fetching data and handling submission logic.
