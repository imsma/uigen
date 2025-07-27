# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator that allows users to create React components through natural language descriptions. It features live preview, virtual file system, and component persistence for registered users.

## Architecture

### Core Technologies
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI Integration**: Anthropic Claude AI via Vercel AI SDK
- **Code Execution**: Browser-based JSX transformation using @babel/standalone
- **Testing**: Vitest with React Testing Library
- **vitest config is in vitest.config.mts**

### Key Components

#### 1. Virtual File System (`src/lib/file-system.ts`)
- In-memory file system for managing React components
- Provides file operations: create, read, update, delete, rename
- Supports directories and file nesting
- Serializes/deserializes to JSON for persistence

#### 2. AI Integration (`src/app/api/chat/route.ts`)
- Stream-based AI responses using Vercel AI SDK
- Tool-based file manipulation via `str_replace_editor` and `file_manager`
- Project persistence for authenticated users
- Mock responses when no API key is provided

#### 3. Live Preview System (`src/lib/transform/jsx-transformer.ts`)
- Real-time JSX to JavaScript transformation
- Dynamic import mapping for third-party packages (via esm.sh)
- CSS processing and bundling
- Error boundary handling for runtime errors

#### 4. Project Management
- **Anonymous**: Temporary sessions with local storage
- **Authenticated**: Persistent projects via Prisma/SQLite
- Project routing via `/[projectId]` dynamic routes

## Development Commands

### Setup & Installation
```bash
# Initial setup (install deps + DB setup)
npm run setup

# Development server
npm run dev

# Production build
npm run build
npm run start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/components/chat/__tests__/ChatInterface.test.tsx
```

### Database
```bash
# Reset database (destructive)
npm run db:reset

# Manual Prisma commands
npx prisma migrate dev
npx prisma generate
```

### Linting
```bash
npm run lint
```

## File Structure

```
src/
├── actions/           # Server actions for project management
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── chat/        # Chat interface components
│   ├── editor/      # Code editor and file tree
│   ├── preview/     # Live preview iframe
│   └── ui/          # Radix UI components
├── lib/             # Core business logic
│   ├── contexts/    # React contexts
│   ├── prompts/     # AI system prompts
│   ├── tools/       # AI tool implementations
│   └── transform/   # JSX transformation logic
└── generated/       # Prisma client (auto-generated)
```

## Key Workflows

### Adding New Components
1. Create component in appropriate directory under `src/components/`
2. Add TypeScript types if needed
3. Write tests in `__tests__/` directory
4. Use existing UI components from `@/components/ui/`

### AI Tool Development
- Tools are defined in `src/lib/tools/` directory
- Each tool returns structured responses for AI consumption
- Tools operate on the virtual file system
- Map tool responses to file system operations

### Database Schema Changes
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data store.
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Run `npx prisma generate`
4. Update type definitions in consuming code

## Environment Configuration

Create `.env` file for optional API key:
```
ANTHROPIC_API_KEY=your-api-key-here
```

## Testing Patterns

- Unit tests use Vitest with React Testing Library
- Mock file system operations in tests
- Test both happy path and error scenarios
- Use `@testing-library/user-event` for user interactions

## Important Conventions

- **File paths**: Always use absolute paths starting with `/` in virtual file system
- **Imports**: Use `@/` alias for root-relative imports in generated code
- **Entry point**: All projects must have `/App.jsx` as the root component
- **Styling**: Use Tailwind CSS classes, avoid inline styles
- **TypeScript**: Prefer TypeScript for new components (.tsx/.ts)
- **Comments**: Use comments sparingly. Only comment complex code.