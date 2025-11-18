# Personal Finance Manager

## Overview

This is a comprehensive personal finance management web application that helps users track expenses, manage budgets, monitor installments, maintain multiple accounts, and set financial goals. The application provides dashboard analytics with charts and visualizations to give users clear insights into their financial health.

The system is built as a full-stack JavaScript application with a React frontend and Express backend, using PostgreSQL for data persistence. It follows a modern monorepo structure with shared TypeScript schemas and type definitions.

## Recent Updates (November 2024)

1. **Budget Progress Tracking** - Budget category cards now display progress bars with color-coded indicators (green <80%, yellow 80-100%, red >100%) showing spending against budgeted amounts.

2. **Monthly Budget Cycle Management** - Manual "Close Month & Start New Budget" feature with:
   - Database transaction-based atomic operations ensuring data integrity
   - Allocation dialog requiring explicit choices for unused budget (carryover, transfer to account/goal/investment)
   - Server-side validation with automatic carryover defaults as safety fallback
   - Frontend validation with disabled submit button until all allocations are complete

3. **Monthly Reports Page** - Historical financial overview showing:
   - Financial summaries (income, expenses, net savings)
   - Budget details and utilization percentages
   - Allocation breakdowns (goals, investments, installments)
   - Category spending analysis
   - Month/year formatted displays with PHP peso currency

4. **Enhanced Dashboard** - Added comprehensive financial overview with:
   - Savings Rate metric card displaying current budget savings percentage
   - Goals Progress metric card showing aggregate progress across all active goals
   - Active Goals section with individual progress bars, deadlines, and amounts
   - Empty state handling for goals and installments sections
   - Reorganized 3+3 metric card layout for better visual balance

5. **Data Export & Import System** - Complete backup and restore functionality:
   - **JSON Export:** Lossless complete data backup including all records and relationships
   - **CSV Export:** Spreadsheet-ready format for external analysis
   - **JSON Import:** Intelligent import with automatic ID remapping:
     - Strips auto-generated fields (id, createdAt, updatedAt) to avoid collisions
     - Creates ID mapping tables (accountId, goalId, installmentId, investmentId)
     - Preserves all foreign key relationships through remapping
     - Correct import order respects referential integrity
     - Individual record validation using Zod schemas
     - Continues on individual failures without aborting entire import
     - Returns HTTP 400 if no records successfully imported
   - **Import Feedback:** Detailed results showing counts per category and error messages
   - **Safe Behavior:** Adds records without modifying or deleting existing data
   - **Data Integrity:** Validates all relationships and maintains database constraints

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- React Router (via Wouter) for client-side navigation
- Single-page application (SPA) architecture

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks
- No global state management library (Zustand mentioned in initial specs but not implemented)

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design 3 influenced design system as per design guidelines
- Typography: Inter font for UI, JetBrains Mono for numerical data
- Consistent spacing scale using Tailwind units (2, 4, 6, 8, 12, 16, 24)

**Data Visualization:**
- Recharts library for financial charts (line charts, pie charts)
- Dashboard with metric cards showing trends and KPIs
- Category-based spending analysis with pie charts
- Monthly income vs expenses with line charts

**Form Handling:**
- React Hook Form with Zod schema validation
- Integration with drizzle-zod for type-safe form schemas

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- RESTful API design pattern
- Middleware-based request processing

**Database Layer:**
- PostgreSQL as the primary database (via Neon serverless)
- Drizzle ORM for type-safe database queries
- WebSocket-based connection pooling for serverless environments
- Schema-first approach with migrations support

**API Structure:**
The backend implements a storage abstraction layer (`IStorage` interface) that provides standardized methods for all database operations:

- **Accounts API:** CRUD operations for financial accounts (bank, cash, credit card, e-wallet)
- **Transactions API:** Track income and expenses with filtering capabilities
- **Budgets API:** Manage monthly budget planning with salary and expense tracking
- **Installments API:** Monitor payment plans and track payment progress
- **Goals API:** Set and track financial savings goals
- **Investments API:** Manage investment portfolio with deposit tracking and performance monitoring

**Simulation Feature:**
The Purchase Simulator helps users make informed decisions about purchases:

- **Affordability Analysis:** Calculates monthly surplus from budget, installments, and goal commitments
- **Payment Recommendations:** Suggests optimal payment strategies (one-time or installment)
- **Installment Terms:** 
  - Range: 3-36 months
  - Recommended: 3-6 months (marked with "Recommended" badge)
  - Possible: 7-36 months (marked with "Possible" badge)
  - Three options: Best (shortest), Moderate (balanced), Longest (lowest monthly payment)
- **Budget Impact Visualization:** Recharts bar chart showing current vs. projected budget allocation
- **Quick Actions:** Convert simulations directly into goals or installments with pre-filled forms
- **Empty State Handling:** Prompts users to create a budget if none exists

**Request/Response Flow:**
1. Express routes define API endpoints
2. Routes call storage layer methods
3. Storage layer uses Drizzle ORM for database operations
4. Zod schemas validate incoming data
5. Responses return typed data matching shared schemas

### Database Schema

**Core Tables:**

1. **accounts** - Financial account management
   - Supports multiple account types (bank, credit_card, cash, ewallet)
   - Tracks balance and optional credit limits
   - Uses decimal precision (12,2) for monetary values

2. **transactions** - All financial movements
   - Links to accounts via foreign key
   - Categorized by type (income, fixed, variable, installment, goal)
   - Date-based tracking for historical analysis

3. **budgets** - Monthly budget planning
   - Stores salary, fixed expenses, and savings rate
   - Tracks total installment amounts
   - Supports budget updates over time

4. **installments** - Payment plan tracking
   - Monitors monthly payment amounts and terms
   - Tracks payment progress (months paid vs total term)
   - Status field for active/completed installments
   - Links to payment account

5. **goals** - Savings goal management
   - Target amounts and current progress
   - Deadline tracking
   - Links to dedicated savings accounts

6. **investments** - Investment portfolio tracking
   - Supports multiple investment types (stocks, bonds, mutual_funds, crypto, real_estate, etf, other)
   - Tracks initial amount, current value, and returns
   - Links to optional account for balance tracking
   - Deposit functionality creates transactions and updates account balances
   - **Liquidation System:** Prevents orphaned funds with three guided options:
     - Transfer to Account: Creates income transaction, updates account balance, deletes investment
     - Transfer to Investment: Adds current value to destination investment, deletes source
     - Mark as Lost: Creates loss transaction for record-keeping, deletes investment
   - Schema change: transactions.accountId is nullable to support investment-to-investment transfers
   - All liquidation flows handled atomically to ensure data integrity

**Data Types:**
- Serial IDs for all primary keys
- Decimal types with precision 12,2 for all monetary values (avoiding float precision issues)
- Timestamps for created/updated tracking
- Text fields for categories and descriptions

### External Dependencies

**Database:**
- Neon PostgreSQL serverless database
- WebSocket connection support for serverless environments
- Connection pooling via @neondatabase/serverless

**UI Component Library:**
- Radix UI primitives (@radix-ui/react-*) for accessible, unstyled components
- shadcn/ui configuration for component styling
- Extensive component catalog including dialogs, popovers, selects, calendars, tables

**Styling & Design:**
- Tailwind CSS with custom configuration
- Google Fonts (Inter, JetBrains Mono)
- Custom CSS variables for theming

**Data Visualization:**
- Recharts for chart components
- date-fns for date formatting and manipulation

**Development Tools:**
- tsx for TypeScript execution
- esbuild for production builds
- Drizzle Kit for database migrations
- Vite plugins for development experience (@replit/vite-plugin-*)

**Form & Validation:**
- react-hook-form for form state management
- Zod for runtime type validation
- @hookform/resolvers for schema integration

**Type Safety:**
- Shared TypeScript schemas between frontend and backend
- Drizzle Zod integration for automatic schema generation
- Path aliases (@/, @shared/) for clean imports