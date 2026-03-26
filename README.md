# 🦀 Rust Training — Microsoft

A modern web reader for [Microsoft's Rust Training](https://github.com/microsoft/RustTraining) books. Seven free books that meet you where you are — from C++, C#, Python bridges to async deep dives and type-driven design.

**Live site →** [https://rust.learningz.xyz/](https://rust.learningz.xyz/)

## Features

- **7 Rust books** with chapter-by-chapter navigation and syntax highlighting
- **Offline support** — PWA with automatic chapter caching
- **Reading progress** — auto-tracked per chapter with visual progress bars
- **Bookmarks** — bookmark any heading in any chapter for quick access
- **Cloud sync** — sign in with GitHub to sync progress, bookmarks, and preferences across devices
- **Customizable reading** — 5 font families, 4 size options, dark/light theme
- **Full-text search** — fuzzy search across all books via `⌘K`
- **Mobile-friendly** — responsive design with collapsible sidebar and mobile nav

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, SSG)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Auth:** [Better Auth](https://better-auth.com) (GitHub OAuth)
- **Database:** [Turso](https://turso.tech) (libSQL) + [Kysely](https://kysely.dev) migrations
- **Offline:** Custom service worker + IndexedDB
- **Search:** [FlexSearch](https://github.com/nicxleo/flexsearch)
- **Markdown:** react-markdown + remark-gfm + rehype-highlight

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io)

### Setup

```bash
# Clone the repo
git clone https://github.com/ruhankhandakar/rust-learning-microsoft.git
cd rust-learning-microsoft

# Install dependencies
pnpm install

# Copy env template and fill in your values
cp .env.example .env.local
```

### Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Same as above |
| `TURSO_DATABASE_URL` | Turso database URL | [Turso Dashboard](https://turso.tech) |
| `TURSO_AUTH_TOKEN` | Turso auth token | Same as above |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL of your app | `http://localhost:3000` for dev |

> **Note:** The app works without these env vars — you just won't have cloud sync / GitHub login. All features (reading, bookmarks, progress, fonts) work locally via IndexedDB and localStorage.

### Database Setup

```bash
# Run migrations (creates better-auth tables + reading_progress + user_preferences + bookmarks)
pnpm db:migrate
```

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
app/
├── page.tsx                          # Homepage
├── books/[bookSlug]/page.tsx         # Book landing page
├── books/[bookSlug]/[chapterSlug]/   # Chapter reading page
├── api/auth/[...all]/                # Better Auth handler
├── api/progress/                     # Reading progress API
├── api/preferences/                  # User preferences API
├── api/bookmarks/                    # Bookmarks API
├── api/search/                       # Search index API
├── manifest.ts                       # PWA manifest
├── globals.css                       # Tailwind + theme
├── layout.tsx                        # Root layout with providers

components/
├── settings-dropdown.tsx             # Unified settings (theme, font, auth, bookmarks)
├── bookmark-provider.tsx             # Bookmark context + IndexedDB + cloud sync
├── font-provider.tsx                 # Font context + cloud sync
├── theme-provider.tsx                # Theme context + cloud sync
├── progress-provider.tsx             # Reading progress context + cloud sync
├── markdown-renderer.tsx             # Markdown with copy buttons + bookmark-able headings
├── search-dialog.tsx                 # ⌘K search
└── ...

db/
├── index.ts                          # Kysely instance + types
├── migrate.ts                        # Migration runner
└── migrations/                       # Kysely migrations

lib/
├── books.ts                          # Book metadata
├── content.ts                        # SUMMARY.md parser + markdown reader
├── auth.ts                           # Better Auth server config
├── auth-client.ts                    # Better Auth client
├── preferences.ts                    # Preferences API helpers
├── bookmarks-db.ts                   # IndexedDB for bookmarks
├── progress-db.ts                    # IndexedDB for progress
└── version.ts                        # App version from package.json

public/
├── sw.js                             # Service worker
└── icons/                            # PWA icons
```

## Versioning

`package.json` is the single source of truth for the app version. The build script auto-syncs it to the service worker cache name.

```bash
pnpm version:patch   # 1.0.0 → 1.0.1
pnpm version:minor   # 1.0.0 → 1.1.0
pnpm version:major   # 1.0.0 → 2.0.0
```

## License

MIT — see [LICENSE](./LICENSE).

Training content is from [microsoft/RustTraining](https://github.com/microsoft/RustTraining) under MIT & CC BY 4.0.
