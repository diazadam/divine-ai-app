# Divine AI - AI-Powered Pastoral Ministry Platform

## Overview

Divine AI is a comprehensive web application designed to revolutionize pastoral ministry through cutting-edge AI technology. The platform enables pastors and church leaders to create compelling sermons, generate stunning visuals, transform sermons into professional podcasts, and engage their congregations with enhanced biblical resources. Built with modern web technologies, it features AI-powered content generation, scripture search capabilities, media creation tools, and podcast production functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **React-based Single Page Application (SPA)** architecture with TypeScript for type safety. The frontend is built using Vite as the build tool and development server, providing fast hot-module replacement and optimized builds. The UI leverages **shadcn/ui components** built on top of Radix UI primitives, styled with **Tailwind CSS** for consistent, responsive design. The component architecture follows a modular approach with reusable UI components and feature-specific components organized by functionality.

**State Management**: Uses **React Query (@tanstack/react-query)** for server state management, providing automatic caching, background updates, and synchronization. Local state is managed through React hooks (useState, useContext) with custom hooks for shared logic.

**Routing**: Implements client-side routing using **wouter**, a lightweight routing library that provides declarative routing without the overhead of React Router.

### Backend Architecture
The backend follows a **REST API architecture** built with **Express.js** and TypeScript. The server implements a modular route structure with separate service layers for business logic. Key architectural decisions include:

**API Design**: RESTful endpoints organized by resource type (sermons, podcasts, scripture, media) with consistent response formats and error handling.

**Middleware Stack**: Custom request logging, error handling, and development-only Vite integration for seamless full-stack development.

**Service Layer Pattern**: Business logic is encapsulated in service classes (BibleApiService, AudioProcessorService) to maintain separation of concerns and enable easy testing.

### Data Storage Solutions
**Database**: Uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations and migrations. The database schema supports multi-tenant architecture with user-based data isolation.

**Schema Design**: Relational database design with tables for users, sermons, podcasts, scripture collections, generated images, and voice recordings. Uses UUID primary keys and proper foreign key relationships.

**File Storage**: Audio files and generated images are stored in a local file system with structured directory organization. Supports future migration to cloud storage solutions.

### Authentication and Authorization
Currently implements a **mock authentication system** for development purposes with a single mock user. The architecture is designed to easily integrate with proper authentication providers (OAuth, JWT) in production. User sessions are managed through the storage layer with user-based data access control.

### External Service Integrations

**AI Services**:
- **Google Gemini AI**: Integrated for text generation, sermon assistance, and content analysis using the @google/genai SDK
- **Image Generation**: Placeholder implementation for AI-powered visual content creation

**Bible API Integration**: 
- **API.Bible**: External Bible API for scripture search, cross-references, and verse lookup functionality
- Supports multiple Bible versions and comprehensive search capabilities

**Audio Processing**: 
- Local audio processing service for podcast generation from sermon content
- Supports noise reduction, intro/outro addition, and metadata extraction

### Build and Development Architecture
**Development Environment**: Uses Vite with HMR for fast development cycles, integrated with Express server for full-stack development experience.

**Build Process**: 
- Frontend: Vite builds React application to static assets
- Backend: esbuild compiles TypeScript server code for production
- Database: Drizzle Kit handles schema migrations and database setup

**Deployment Strategy**: Configured for cloud deployment with environment-based configuration and proper asset serving through Express static middleware.

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with modern hooks and concurrent features
- **Express.js**: Node.js web framework for REST API implementation
- **TypeScript**: Type-safe development across frontend and backend
- **Vite**: Fast build tool and development server

### Database and ORM
- **PostgreSQL**: Primary database (configured via Drizzle)
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **@neondatabase/serverless**: PostgreSQL driver for serverless environments

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **@tanstack/react-query**: Server state management with caching and synchronization
- **wouter**: Lightweight client-side routing

### External APIs and Services
- **@google/genai**: Google Gemini AI SDK for content generation
- **API.Bible**: Bible scripture API for verse lookup and cross-references
- **Multer**: File upload handling middleware

### Development and Build Tools
- **esbuild**: Fast JavaScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind CSS integration
- **Drizzle Kit**: Database migration and introspection tools