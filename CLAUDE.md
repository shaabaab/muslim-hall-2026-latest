# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Muslim Hall** is an Islamic community platform: contests (with paid entry, voting, prizes, sponsors), subscriptions/plans, posts with rich media, books, exhibitions, an Islamic Zone (audio/video/PDF content), and community feeds with reactions/comments.

Stack: **Laravel 10 (PHP 8.1+) · Inertia.js · React 18 (JSX) · Ant Design + Tailwind · Vite · MySQL · S3**.

## Commands

```bash
# Frontend dev server (Vite HMR) — run alongside `php artisan serve`
npm run dev
npm run build              # production asset build (also run by deploy)

php artisan serve          # local PHP server

# Tests (PHPUnit, configured via phpunit.xml)
php artisan test                                   # all suites
php artisan test --testsuite=Feature               # one suite (Unit | Feature)
php artisan test --filter=SomeTest                 # single test/class
vendor/bin/phpunit tests/Feature/ExampleTest.php   # single file

vendor/bin/pint            # PHP code style (Laravel Pint)

# Background work — REQUIRED for media uploads to complete (see below)
php artisan queue:work
php artisan schedule:work  # runs contest/subscription cron locally
```

There is **no `composer dev` / combined script**. Run `npm run dev`, `php artisan serve`, and `php artisan queue:work` in separate terminals.

## Architecture

### Inertia request flow (no separate API)
Controllers return `Inertia::render('Pages/...', $props)`, not JSON. Each page maps to a React component under `resources/js/Pages/` (resolved by `app.jsx` via `import.meta.glob`). There is **no REST API layer** for the app itself — `routes/api.php` is nearly empty. To add a screen: add a route → controller method returning `Inertia::render` → a `.jsx` page.

- **Routes are split by audience:** `routes/web.php` (public + admin, admin under `prefix('admin')->name('admin.')` guarded by `['auth','verified','admin']` and per-action `permission:*` middleware), `routes/user.php` (authenticated member area), `routes/auth.php` (Breeze auth).
- **Controllers mirror this:** `App\Http\Controllers\admin\*` for admin screens, `App\Http\Controllers\user\*` for member screens, root namespace for public/shared.
- **`HandleInertiaRequests::share()`** injects global props on every request: `auth.user` (with roles/permissions/subscriptions), `social`, `contactInfo`, `settings`, `flash`, and `storage_disk`. Frontend reads these via `usePage().props` — prefer them over refetching.

### Authorization
Uses **spatie/laravel-permission**. Middleware aliases (in `app/Http/Kernel.php`): `admin` (`CheckAdmin`), `permission` (`CheckPermission`, used as `permission:users.index`). The `User` model also has a legacy `role` column. Roles/permissions are managed via the Roles admin screens.

### Large media uploads (important, non-obvious)
Media is **not** uploaded through normal form posts. The flow is:
1. Frontend chunks the file (~5 MB chunks) and POSTs to `ChunkUploadController` (`routes`), which streams chunks into a temp file (supports up to ~5 GB).
2. The controller dispatches **`App\Jobs\ProcessFileUpload`** (queued), which moves the assembled temp file to S3 and updates the target record's column, then sends `FileProcessingCompleteNotification`.
3. Records sit in a `processing` state until the job finishes. `php artisan posts:reset-stuck` (scheduled every 2h) clears records stuck from aborted uploads.

Frontend side: `Contexts/BackgroundUploadContext.jsx` + `BackgroundUploadIndicator` track in-flight uploads globally (provider wraps the app in `app.jsx`). **Uploads only complete if a queue worker is running.**

### Contest / subscription domain
- `app/Services/EntryService.php` holds contest-entry business rules (one entry per user, payment/membership gating via `ContestFee` + subscriptions). Prefer the service over inlining this logic in controllers. (`*Old`/`OldEntry` service variants are dead — ignore.)
- `app/Services/PdfOcrService.php` (with `smalot/pdfparser`) extracts text from entry PDFs.
- Scheduled commands (`app/Console/Kernel.php`) drive the lifecycle: `cron:check-subscriptions`, `reminder:declare-winners`, `reminder:contest-ended`, `remainder:subscription-brdge` (all every minute). These require `schedule:work` (local) or a real cron in production.

### Storage / S3
Default disk is config-driven (`config('filesystems.default')`, shared to the frontend as `storage_disk`). Production uses S3 (`muslimhall.s3.ap-south-1.amazonaws.com`); `web.php` has a `local.s3.proxy` route that serves from local `public` disk and falls back to S3, so URLs work across environments. Use `Storage::disk(config('filesystems.default'))` rather than hardcoding a disk.

## Deployment

`.github/workflows/deploy.yml` auto-deploys on **push to `main`**: SSHes into the VPS, `git pull`, `npm install && npm run build`, then `artisan optimize:clear`. There is no staging gate — merging to `main` ships to production. `supervisor-muslimhall.conf` is the template for the production `queue:work` supervisor process.

## Conventions

- React pages are `.jsx`. UI uses **Ant Design** (`antd`, theme set in `app.jsx`) plus Tailwind utility classes; rich text via `react-quill`, PDF rendering via `react-pdf`/`pdfjs-dist`.
- `resources/js/Layouts/` provides the shells: `AuthenticatedLayout` (admin), `FrontAuthenticatedLayout` (member), `FrontEndLayout` (public), `GuestLayout` (auth).
- `folder-overview.md` and `folder-structure.md` are auto-generated, detailed inventories of every file — consult them to locate things, but they are not authoritative architecture docs.
