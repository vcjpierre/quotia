# Freelance Billing Calculator

## Overview

This is a modern full-stack freelance billing calculator application built with React, Express.js, and PostgreSQL. The application allows freelancers to create professional quotes, calculate project costs, and export PDF receipts. It features a clean, responsive UI built with shadcn/ui components and supports both light and dark themes.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React hooks with custom useCalculator hook
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Data Fetching**: TanStack Query (React Query) for server state management

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Pattern**: RESTful API with JSON responses
- **Data Validation**: Zod schemas for request/response validation
- **Storage**: Abstracted storage interface (currently using in-memory storage with database schema ready)

### Key Design Decisions
1. **Monorepo Structure**: Client, server, and shared code in a single repository for easier development and deployment
2. **Shared Schema**: Database schemas and validation rules shared between client and server to ensure consistency
3. **Storage Abstraction**: IStorage interface allows switching between in-memory and database storage without changing business logic
4. **Component-Based UI**: Modular React components for reusability and maintainability

## Key Components

### Frontend Components
- **Calculator Page**: Main application interface combining all features
- **Rate Configuration**: Hourly rate and hours per day settings
- **Task Management**: Add, edit, and remove project tasks with templates
- **Cost Summary**: Real-time calculation display with export options
- **Receipt Preview**: Professional quote/invoice preview with client information
- **Theme Provider**: Light/dark mode support

### Backend Components
- **Routes**: RESTful API endpoints for quote CRUD operations
- **Storage Layer**: Abstracted data persistence with in-memory and database implementations
- **Schema Validation**: Shared Zod schemas for data validation

### Shared Components
- **Database Schema**: Drizzle ORM schema definitions for PostgreSQL
- **Type Definitions**: TypeScript types shared between client and server
- **Validation Schemas**: Zod schemas for request/response validation

## Data Flow

1. **Quote Creation**: User inputs project details → Validation via Zod schemas → Storage via API → Real-time UI updates
2. **Cost Calculation**: Task changes → Automatic recalculation → Summary update → Receipt preview refresh
3. **PDF Export**: Receipt preview → html2pdf.js conversion → File download
4. **Data Persistence**: API calls → Express routes → Storage abstraction → Database/memory storage

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Libraries**: Radix UI components, Lucide icons, shadcn/ui
- **Utilities**: TanStack Query, nanoid, date-fns, clsx, tailwind-merge
- **PDF Generation**: html2pdf.js for client-side PDF export

### Backend Dependencies
- **Database**: Drizzle ORM, @neondatabase/serverless, connect-pg-simple
- **Validation**: Zod for schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tools**: Vite, esbuild, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Development**: Replit integration plugins for enhanced development experience

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Deployment**: Node.js server serving both API and static files
- **Development**: Vite dev server with HMR for frontend, tsx for backend

### Production Considerations
- Static file serving from Express for frontend assets
- Database migrations managed through Drizzle Kit
- Error handling and logging for production monitoring
- CORS and security considerations for API endpoints

## Changelog

```
Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Added multi-currency support with 11 international currencies
- June 30, 2025. Added Bolivian Boliviano (BOB) currency support
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```