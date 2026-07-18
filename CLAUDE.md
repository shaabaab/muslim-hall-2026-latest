# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Laravel 10 (PHP ^8.1) + Inertia.js + React 18 (JSX) + Vite + Tailwind CSS + Ant Design + MySQL. Auth scaffolding is Laravel Breeze; roles/permissions via spatie/laravel-permission.

## Commands

Development requires two processes plus a local MySQL server (database `muslim_hall`, user `root`, no password — see `.env`):

```
php artisan serve      # backend at http://127.0.0.1:8000
npm run dev            # Vite dev server (HMR for React/Tailwind)
```

- Install: `composer install` and `npm install`
- Migrate: `php artisan migrate` (add `--seed` for seed data)
- Production asset build: `npm run build`
- Tests: `php artisan test` — single test: `php artisan test --filter=MethodOrClassName` or `php artisan test tests/Feature/ProfileTest.php`
- Formatting: `vendor/bin/pint`
- Queue: `QUEUE_CONNECTION=sync` locally; production runs `php artisan queue:work` under supervisor (`supervisor-muslimhall.conf`)

## Deployment (important)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into an aaPanel VPS (AWS Lightsail) and runs: `git pull`, `composer install --no-dev`, `php artisan migrate --force`, `npm install && npm run build`, then `artisan optimize:clear`. PHP binary on the server is `/www/server/php/83/bin/php`.

- **The SSH script does not stop on error** — the Actions run shows ✅ even if a step (e.g., migrations) failed. Always check the "Running migrations" section of the deploy log.
- Branch workflow: PHP developers commit to `development-v2`; changes are merged through `copy-of-main*` branches into `main`. Only `main` deploys.

## Migration convention

The production database contains tables that were created outside Laravel's migration tracking. New `create` migrations must be guarded with `if (Schema::hasTable(...)) return;` (see `database/migrations/2026_07_05_000001_create_missing_post_media_tables.php` for the pattern), otherwise `migrate --force` aborts on the VPS and all later migrations silently never run.

## Architecture

This is a content platform with several parallel content domains: **Posts**, **Contests** (entries, votes, prizes, winners, fees, sponsors), **Exhibitions** (plus exhibition boards with member approval workflow), **Communities**, **Islamic Zone**, **Books**, and **Subscriptions/Plans**. Each content domain repeats the same structure:

- A main model plus child media models per type (`PostVideo`, `PostPdf`, `PostAudio`, `PostImage`; same trio for `IslamicZone*`, `Exhibition*`, `Community*`), plus per-domain comment and reaction models.
- Controllers exist in up to three flavors: public read (`FrontendController` handles most public pages), admin CRUD (`app/Http/Controllers/admin/`), and user-owned CRUD (`app/Http/Controllers/user/`). Matching Inertia page trees live under `resources/js/Pages/<Domain>/` (admin) and `resources/js/Pages/User/<Domain>/`.

### Routing & authorization

- `routes/web.php` — public routes + the admin panel under `Route::middleware(['auth','verified','admin'])->prefix('admin')`, with spatie `permission:*` middleware on subgroups.
- `routes/user.php` — logged-in user area under `prefix('user')` (dashboard, own posts/contests/exhibitions, subscriptions, comments/reactions).
- `routes/auth.php` — Breeze auth; social login via `SocialiteController`.
- Policies in `app/Policies/` cover most domain models; `CheckAdmin` and `CheckPermission` middleware gate the admin side. Ziggy exposes named routes to React (`route('...')` in JSX).

### File uploads (the most intricate subsystem)

Large media (video up to 2 GB) is core to the app:

- Validation rules are centralized in `app/Support/UploadRules.php` — use `UploadRules::video()`, `::audio()`, `::image()`, `::document()` in Form Requests instead of inline mime/size strings.
- Frontend uploads go in 5 MB chunks to `POST /upload/chunk` (`ChunkUploadController`), driven by `resources/js/Utils/s3Helpers.js` and `BackgroundUploadContext` / `BackgroundUploadIndicator` for background progress. After long uploads the client refreshes its CSRF token via `GET /csrf-token` to avoid 419s.
- `app/Services/ServiceClass.php` is the central media utility (storage, optimization via Intervention Image, `ProcessFileUpload` job). It forces the `s3` disk and can delegate to an external "AWS Media API" (`AWS_MEDIA_API_BASE_URL` in `.env`). The `/local-s3-proxy/{path}` route serves local `storage/app/public` files and falls back to the S3 bucket URL.

### Conventions & quirks

- `app/Helpers/helpers.php` is composer-autoloaded (global helper functions).
- The lowercase `admin/` and `user/` controller directories violate PSR-4 casing; composer prints "Skipping" warnings for a few classes but they still load. Match the existing namespace casing (`App\Http\Controllers\admin\...`) when adding files there.
- Files suffixed `Old` (`ServiceClassOld`, `OldEntryService`, `CreateOld.jsx`, `PostDetail` vs `PostDetails`) are retained legacy versions — extend the non-`Old` variants.
- `README.md`, `folder-overview.md`, and `folder-structure.md` contain a generated directory/model inventory; `LEARNING-ROADMAP.md` is a learning doc, not project guidance.
- Test coverage is only the Breeze defaults (`tests/Feature/Auth`, `ProfileTest`); there are no tests for the domain logic.
