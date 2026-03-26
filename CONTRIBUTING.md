# Contributing

Thanks for your interest in contributing!

## Local Setup

1. Fork and clone the repo
2. `pnpm install`
3. `cp .env.example .env.local` and fill in your values (see [README](./README.md#environment-variables))
4. `pnpm db:migrate` to set up the database
5. `pnpm dev` to start the dev server

## Making Changes

- Create a feature branch from `main`
- Keep PRs focused — one feature or fix per PR
- Run `pnpm build` before submitting to catch type errors
- Follow existing code patterns and naming conventions

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling (no inline styles except CSS custom properties)
- Server Components by default, `"use client"` only when needed
- No unnecessary comments — code should be self-documenting

## Commit Messages

Use concise, descriptive messages:

```
Add bookmark export feature
Fix font selector not persisting on reload
Update search index to include code blocks
```

## Reporting Issues

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS info
