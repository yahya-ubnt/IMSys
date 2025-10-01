# UI/UX Modernization Specification

This document outlines the standardized design and user experience guidelines for the ISP Management System application. All new and existing pages will be updated to adhere to these standards to ensure a consistent, modern, and intuitive user experience.

## 1. Standardized Page Layout

Every main list/dashboard page will follow a consistent three-part structure:

### 1.1. Page Header
- **Title:** A large, prominent title with a `cyan-400` to `blue-500` gradient.
- **Description:** A brief, single-sentence description of the page's purpose in `zinc-400` text.
- **Primary Action Button:** A button for the page's main action (e.g., "Add New User," "Add Device"). It will have a `blue-600` to `cyan-500` gradient background with a subtle shadow and a `hover:scale-105` transition.

### 1.2. Main Content Card
- **Container:** All page content (stats, charts, tables) will be housed within a single, responsive `motion.div` card.
- **Styling:** The card will feature a "glassmorphism" effect:
    - `bg-zinc-900/50`
    - `backdrop-blur-lg`
    - `border-zinc-700`
    - `shadow-2xl shadow-blue-500/10`
    - `rounded-xl`
- **Structure:** The card will be internally divided into logical sections using `CardHeader`, `CardContent`, and `div`s with `border-t` or `border-b` as needed.

## 2. Consistent Components

### 2.1. Stat Cards
- **Purpose:** To display key metrics and statistics at the top of a page.
- **Layout:** Contained within the `CardHeader` of the main content card, typically in a responsive grid.
- **Styling:** Each stat card will be a `div` with `bg-zinc-800/50`, `p-3`, and `rounded-lg`. It will contain an icon and the metric's title and value. Text colors can be used to indicate status (e.g., `text-green-400` for "Online," `text-red-400` for "Offline").

### 2.2. Data Tables
- **Toolbar:** A toolbar will be placed directly above the data table for search and filtering operations. It will contain:
    - Filter buttons with `variant="outline"` for inactive states and `variant="default"` for the active state.
    - A search `Input` with an embedded `Search` icon.
- **Styling:** The `DataTable` component will have a consistent, dark-themed appearance. No borders between rows, with a `hover:bg-zinc-800` effect. Status badges will use the modern, subtle styling (`bg-green-500/20 text-green-400 border-green-500/30`).
- **Actions:** Row actions will be contained within a `DropdownMenu` triggered by a `MoreHorizontal` icon button.

### 2.3. Forms (Create/Edit)
- **Container:** All forms for creating and editing data will be presented within a dialog (`<Dialog>`).
- **Layout:** Forms will use a multi-step wizard interface, guided by a `StepIndicator` component.
- **Styling:** The form will adopt the same glassmorphism style as the main content card. Inputs and selects will use the standard dark theme (`bg-zinc-800`, `border-zinc-700`).
- **Spacing:** The content within each step of the wizard should be compact. The parent container for form elements should use `space-y-3` for consistent, minimal spacing. The `CardContent` holding the form steps should resize dynamically to fit the content of each step. The `motion.div` with the `layout` prop will handle this animation automatically.

### 2.4. Details Pages
- **Layout:** Pages displaying the details of a single item (e.g., a specific user or device) will use the single-card layout.
- **Structure:** Information will be organized into tabs (`<TabsPrimitive>`) within the main card. The header of the card will display key "at-a-glance" stats for the item.
- **Styling:** The tab triggers will have a `motion.div` indicator to highlight the active tab, creating a smooth, animated transition.

This specification will serve as the single source of truth for all UI development going forward.
