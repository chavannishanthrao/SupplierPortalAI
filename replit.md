# Overview

This is a multi-tenant Advanced Supplier Portal designed to streamline supplier relationships for both manufacturing and service-based companies. The application provides a comprehensive platform for managing purchase orders, invoices, documents, messaging, and supplier profiles with role-based access control and tenant isolation.

The system features a modern React frontend with TypeScript and a Node.js/Express backend, utilizing PostgreSQL for data persistence with Drizzle ORM. The architecture supports multi-tenancy through row-level security and tenant-specific data isolation.

# User Preferences

Preferred communication style: Simple, everyday language.
Form design preference: Professional, beautiful forms on separate pages rather than modals.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer middleware for document handling
- **API Design**: RESTful endpoints with standardized error handling

## Database Design
- **Primary Database**: PostgreSQL with row-level security for tenant isolation
- **Schema Management**: Drizzle migrations for version control
- **Multi-tenancy**: Tenant-based data separation using tenant_id columns
- **Key Tables**: 
  - Users and authentication sessions
  - Tenants (buyer organizations)
  - Supplier profiles with company type differentiation
  - Purchase orders with line items
  - Invoices and documents
  - Messages and performance metrics
  - Vendor invitations with comprehensive contact details, entity selection, and email templates
  - Email templates for automated communications
  - Reminder settings for invitation follow-ups

## Authentication & Authorization
- **Primary Auth**: Replit OIDC with OAuth2/JWT tokens
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Multi-tenant Access**: Role-based permissions per tenant
- **Security**: Automatic redirect handling for unauthorized access

## Component Architecture
- **Layout System**: AppShell with responsive sidebar and header
- **UI Components**: Reusable shadcn/ui components with custom styling
- **Forms**: Standardized form components with validation
- **Modals**: Dialog-based modals for notifications and actions
- **Responsive Design**: Mobile-first approach with breakpoint handling
- **Vendor Onboarding**: Multi-step invitation form with comprehensive fields and professional design

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives for component library
- **wouter**: Lightweight routing library

## Authentication & Security
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware framework
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session management middleware

## Development & Build Tools
- **vite**: Frontend build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime type validation

## File Handling & Utilities
- **multer**: File upload middleware
- **date-fns**: Date manipulation and formatting
- **clsx/tailwind-merge**: CSS class management
- **nanoid**: Unique ID generation

## Database & Migration Tools
- **drizzle-kit**: Database migration and introspection tools
- **@types/node**: Node.js type definitions
- **ws**: WebSocket implementation for database connections