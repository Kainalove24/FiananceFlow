# Design Guidelines: Personal Finance Webapp

## Design Approach
**Design System: Material Design 3 with Modern Dashboard Influences**

This utility-focused financial application prioritizes data clarity, efficient workflows, and consistent interaction patterns. Drawing from Material Design's robust component library and information hierarchy principles, with refinements inspired by modern fintech dashboards (Stripe, Mercury, Linear).

## Typography System

**Font Family:** 
- Primary: Inter (Google Fonts) for UI elements, data tables, and body text
- Monospace: JetBrains Mono for numerical data and amounts

**Hierarchy:**
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium
- Helper Text: text-xs font-normal
- Data Values: text-2xl font-bold (for key metrics)
- Table Headers: text-sm font-semibold uppercase tracking-wide

## Layout & Spacing System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8
- Grid gaps: gap-4
- Form field spacing: space-y-4
- Tight spacing (icons, chips): gap-2

**Layout Structure:**
- Sidebar Navigation: Fixed left sidebar, w-64, full height
- Main Content Area: Flexible width with max-w-7xl container, px-8 py-6
- Dashboard Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for metric cards
- Tables: Full width within container
- Forms: max-w-2xl for optimal data entry

## Component Library

### Navigation
- **Sidebar:** Fixed vertical navigation with icon + label items, active state with border-l-4 indicator
- **Top Bar:** Breadcrumb navigation, page title, action buttons aligned right
- **Nav Items:** h-12, px-4, rounded-r-lg for active states

### Data Display
- **Metric Cards:** Rounded corners (rounded-lg), shadow-sm, p-6, metric value prominent at top, label below, trend indicator (↑/↓) with percentage
- **Tables:** Striped rows for readability, sticky headers, sortable columns with icon indicators, hover states on rows, actions column (right-aligned)
- **Charts:** Contained in cards with p-6, title at top, chart fills remaining space (h-64 to h-80)
- **Progress Bars:** h-2 rounded-full with percentage label above

### Forms & Inputs
- **Input Fields:** h-10, px-3, rounded-md, border thickness 1px, focus ring-2
- **Labels:** mb-2, text-sm font-medium
- **Select Dropdowns:** Same height as inputs (h-10)
- **Buttons:** h-10, px-6, rounded-md, font-medium
  - Primary: Full solid fill
  - Secondary: Border with transparent background
  - Danger: For delete actions
- **Date Pickers:** Integrated calendar dropdown
- **Filter Panels:** Horizontal layout with gap-4, filters in row on desktop, stack on mobile

### Overlays
- **Modals:** max-w-2xl, centered, rounded-xl, p-6, backdrop blur
- **Dialogs:** For confirmations, max-w-md
- **Toasts:** Fixed top-right, slide-in animation, auto-dismiss

### Status & Feedback
- **Badges:** px-3 py-1 rounded-full text-xs font-medium (for transaction types, installment status)
- **Icons:** 20px (w-5 h-5) for UI elements, 24px (w-6 h-6) for prominent actions
- **Loading States:** Skeleton loaders for tables/cards, spinner for buttons
- **Empty States:** Centered content with icon (w-16 h-16), message, and CTA button

## Page-Specific Layouts

### Dashboard Page
- Header with total balance card (full width, prominent)
- 3-column grid for key metrics: Income, Expenses, Remaining Budget
- 2-column grid below: Category Pie Chart (left), Monthly Spending Line Graph (right)
- Active Installments list (full width card with table)
- Account balances as compact cards in 4-column grid

### Transactions Page
- Filter bar at top (horizontal row): Date range, Category dropdown, Account dropdown, Search
- Action button: "Add Transaction" (top right)
- Table below: Columns for Date, Description, Category, Account, Amount, Actions
- Pagination controls at bottom

### Budget Planner Page
- Two-column layout: Input form (left, max-w-md), Calculations preview (right)
- Form: Salary input, fixed expenses, installments (auto-populated)
- Right panel: Visual breakdown with progress bars for each category
- Save button at bottom of form

### Installments Page
- "Add Installment" button (top right)
- Cards in grid layout (grid-cols-1 md:grid-cols-2)
- Each card: Name, monthly amount, progress bar, months remaining/total, status badge

### Accounts Page
- Cards in 2-column grid (md:grid-cols-2)
- Each card: Account name, type badge, balance (large), credit limit (if applicable), edit icon button

### Goals Page
- Cards in 2-column grid
- Each card: Goal name, target amount, progress bar with current/target, deadline date, "Deposit" button

## Icons
**Library:** Heroicons (via CDN)
- Navigation: home, credit-card, calendar, target, cog
- Actions: plus, pencil, trash, check, x-mark
- Data: chart-bar, chart-pie, arrow-trending-up, arrow-trending-down
- Accounts: banknotes, building-library, credit-card, wallet

## Accessibility
- All form inputs with associated labels
- Focus indicators on all interactive elements (ring-2)
- Sufficient contrast ratios for text (ensure readability)
- Table headers with proper scope
- Button states clearly differentiated
- Error messages positioned below relevant fields

## Animation Principles
**Minimal, purposeful motion only:**
- Sidebar active state transitions: transition-all duration-200
- Modal fade-in: fade + scale from 95% to 100%
- Toast slide-in from right
- No scroll-triggered animations
- No decorative motion

## Responsive Behavior
- **Mobile (< 768px):** Sidebar collapses to hamburger menu, tables horizontal scroll, single column layouts
- **Tablet (768px - 1024px):** 2-column grids, sidebar visible
- **Desktop (> 1024px):** Full 3-4 column layouts where specified

This design prioritizes data density, scanning efficiency, and rapid task completion—essential for a personal finance management tool.