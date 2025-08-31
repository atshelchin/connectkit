# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ConnectKit is a Svelte 5 component library project using SvelteKit for development and packaging. The library code resides in `src/lib/` while `src/routes/` serves as a showcase/preview application.

## Common Commands

### Development

```bash
npm run dev          # Start development server
npm run dev -- --open # Start dev server and open browser
```

### Building

```bash
npm run build        # Build library and run prepack
npm run prepack      # Sync SvelteKit, package library, and run publint
npm run preview      # Preview production build
```

### Testing

```bash
npm run test         # Run all tests (unit + e2e)
npm run test:unit    # Run unit tests with Vitest
npm run test:e2e     # Run E2E tests with Playwright
```

### Code Quality

```bash
npm run check        # Type-check with svelte-check
npm run check:watch  # Type-check in watch mode
npm run lint         # Check formatting and lint
npm run format       # Auto-format code with Prettier
```

## Architecture

### Test Structure

- **Unit Tests**: Vitest with two environments:
  - Client tests: `*.svelte.{test,spec}.{js,ts}` - Run in browser with Playwright
  - Server tests: `*.{test,spec}.{js,ts}` (excluding Svelte tests) - Run in Node
- **E2E Tests**: Playwright tests in `e2e/` directory

### Build Configuration

- Uses Vite with SvelteKit plugin
- TypeScript with strict mode enabled
- MDsveX for Markdown support in Svelte components
- Cloudflare adapter for deployment

### Library Packaging

- Library exports from `src/lib/index.ts`
- Built files go to `dist/` directory
- Package entry points configured for Svelte components
