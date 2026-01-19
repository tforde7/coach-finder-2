# Agent Guidelines for Angular/pnpm Project

## Build, Lint, and Test Commands

```bash
# Development server
pnpm run dev

# Production build
pnpm run build

# Run linting
pnpm run lint

# Run all tests
pnpm run test

# Run single test file
pnpm run test -- --include="**/path/to/spec.ts"

# Run tests with coverage
pnpm run test -- --code-coverage

# Run e2e tests
pnpm run e2e

# Format code
pnpm run format
```

## Code Style Guidelines

### Modern Angular Patterns
- Use **Standalone Components** exclusively (no modules)
- Use **Signals** for reactive state management (ref, computed, effect)
- Use new **Control Flow syntax** (@if, @for, @switch) instead of *ngIf, *ngFor
- Use **standalone pipes** and **standalone directives**
- Prefer **functional components** over class-based decorators where applicable
- Use **inject()** function for dependency injection in constructors
- Use **toSignal()** to convert Observables to Signals where appropriate

### Imports
- Angular imports first, then third-party, then relative imports
- Use barrel files (index.ts) for cleaner imports
- Group imports with blank lines between groups
- Prefer specific imports over wildcard imports

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services';
```

### TypeScript & Types
- Use **interface** for object shapes that can be extended
- Use **type** for unions, intersections, and computed types
- Enable **strict mode** in tsconfig.json
- Use **readonly** for immutable properties
- Avoid **any** - use **unknown** or proper types instead
- Use **type guards** for type narrowing

### Naming Conventions
- Components: `PascalCase` (e.g., `UserProfileComponent`)
- Services: `PascalCase` with `Service` suffix (e.g., `UserService`)
- Pipes: `PascalCase` with `Pipe` suffix (e.g., `DatePipe`)
- Directives: `camelCase` with custom prefix (e.g., `appToggle`)
- Variables/Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case` (e.g., `user-profile.component.ts`)

### Component Architecture
- Single Responsibility: One component = one concern
- Use **Input()** signals for component inputs
- Use **Output()** with custom events or output signals
- Keep components under 300 lines
- Move complex logic to services
- Use **ChangeDetectionStrategy.OnPush** (default with signals)

### RxJS & Asynchronous Code
- Use **async pipe** for subscriptions in templates
- Prefer **operators** over imperative subscription handling
- Always **unsubscribe** from observables (takeUntil, async pipe, or take(1))
- Use **catchError** for error handling
- Use **switchMap** for cancelling previous requests
- Convert Observables to Signals with `toSignal()` where feasible

### Error Handling
- Use **try-catch** for synchronous errors
- Use **catchError** for Observable errors
- Implement global error handler with `ErrorHandler`
- Log errors appropriately (console.error for dev, service for prod)
- Show user-friendly error messages in UI

### SCSS Styling
- Use **SCSS only** - no CSS frameworks or libraries
- Use **BEM** or similar methodology for class naming
- Keep component-specific styles in component SCSS file
- Use **CSS custom properties** (variables) for theming
- Use **SCSS partials** with underscore prefix for shared styles
- Follow mobile-first responsive design
- Use modern CSS features (grid, flexbox, custom properties)
- Avoid overly nested selectors (max 3 levels deep)

### File Organization
```
src/
├── app/
│   ├── core/              # Singleton services
│   ├── features/          # Feature modules
│   ├── shared/            # Shared components/pipes
│   └── pages/             # Page/route components
├── assets/
├── environments/
└── styles/                # Global styles
```

### Additional Guidelines
- Write **descriptive commit messages** (conventional commits preferred)
- Add **JSDoc comments** for public APIs
- Keep **git history clean** with meaningful commits
- Use **environment variables** via environment files
- Implement **lazy loading** for routes
- Use **Angular DevTools** for debugging
- Write **unit tests** for services and complex logic
- Use **TestBed** for component testing with signals support
