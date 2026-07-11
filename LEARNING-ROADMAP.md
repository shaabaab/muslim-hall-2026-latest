# Learning Roadmap: MERN → This Stack (Laravel + Inertia + React)

## Context

You're a MERN developer about to build features (frontend + backend) in **Muslim Hall**, a
Laravel 10 + Inertia.js + React 18 + MySQL + S3 app. The hard part isn't React — you already
know that. The hard part is that the **backend language, the database model, and the
client-server contract are all different** from MERN. This roadmap maps each MERN concept you
already know onto its equivalent here, and points you at the exact files in this repo to learn
from. Goal: ship features confidently, fast — not a CS degree in PHP.

---

## The 3 mental shifts that matter most

These are where MERN intuition will actively mislead you. Internalize these first.

### 1. There is NO REST API. Inertia replaces it. (biggest shift)
In MERN you build Express routes that return JSON, and React `fetch`es them. **Here you do not
build an API.** A controller returns a *React page plus its props* in one round trip:

```php
return Inertia::render('Post/Index', ['posts' => $posts]);   // 'Post/Index' = resources/js/Pages/Post/Index.jsx
```

- The returned `props` become the page component's React props directly. No `useEffect`+`fetch`,
  no loading spinner, no `/api/posts` endpoint.
- Navigation uses Inertia's `<Link>` / `router.visit()` / `useForm()` instead of React Router +
  axios. Form submits POST to a Laravel route and you get a redirect back — not JSON.
- **Read to learn:** `resources/js/app.jsx` (how pages resolve), `app/Http/Controllers/admin/PostController.php`
  (controller → render), `resources/js/Pages/Post/Index.jsx` and `Create.jsx` (how props + `useForm` work).
- Mental map: Express route handler ≈ Laravel controller method; `res.json()` ≈ `Inertia::render()`;
  axios POST ≈ `useForm().post()`.

### 2. SQL + Eloquent ORM replaces MongoDB + Mongoose
Relational, not document. This is a real shift in how you model data.
- **Schema lives in migrations**, not in the code at runtime: `database/migrations/`. Each table =
  a migration file. You change schema by writing a *new* migration and running `php artisan migrate`.
- **Models are thin** (`app/Models/*.php`) — they declare relationships and `$fillable`, not the schema.
- **Relationships replace `.populate()`**: `hasMany`, `belongsTo`, `belongsToMany`. Eager-load with
  `Post::with('comments')->get()` (≈ Mongoose `.populate('comments')`). Avoid N+1 queries.
- **Read to learn:** `app/Models/Post.php`, `app/Models/Contest.php` (rich relationships), the matching
  files in `database/migrations/`. Compare a model's relations to how `EntryService` queries them.
- Mental map: collection ≈ table; document ≈ row; Mongoose schema ≈ migration + `$fillable`;
  `.populate()` ≈ `with()`; `Model.find()` ≈ `Model::find()`.

### 3. PHP is the backend language (Node is only for Vite)
You'll write PHP, not JS, on the server. `node`/`npm` here exist **only to build frontend assets**
(Vite). Practical PHP-for-JS-devs essentials:
- `$variable` (always `$`), `->` for method/property access, `::` for static/class access, `[]` arrays
  (both list and map), `function foo(): ReturnType`.
- Laravel is heavily "magic": facades (`Auth::id()`, `Storage::disk()`), Eloquent static calls,
  dependency injection in controller method signatures. Don't fight it — pattern-match from existing code.
- **Read to learn:** skim `app/Services/EntryService.php` — it's plain business logic and the best
  PHP-reading exercise in the repo.

---

## What to learn, in priority order (fast-track)

| # | Topic | Why it matters here | Where to look |
|---|-------|--------------------|---------------|
| 1 | **Inertia.js model** | The entire client-server contract | inertiajs.com docs (React) + `app.jsx`, any `Pages/*/Index.jsx` |
| 2 | **Laravel routing & controllers** | How a URL reaches your code | `routes/web.php`, `routes/user.php`, `app/Http/Controllers/` |
| 3 | **Eloquent (models, relations, migrations)** | All data access | `app/Models/`, `database/migrations/` |
| 4 | **Inertia forms (`useForm`)** | Every create/edit screen | `resources/js/Pages/Post/Create.jsx`, `Edit.jsx` |
| 5 | **Validation (Form Requests)** | Server-side input rules | `app/Http/Requests/`, inline `$request->validate()` in controllers |
| 6 | **Auth + permissions (spatie)** | Gating admin/member features | `app/Http/Middleware/CheckPermission.php`, `CheckAdmin.php`, `routes/web.php` admin group |
| 7 | **Shared Inertia props** | Global data (auth user, settings) on every page | `app/Http/Middleware/HandleInertiaRequests.php`, read via `usePage().props` |
| 8 | **Queues & Jobs** | Background work (uploads, notifications) | `app/Jobs/ProcessFileUpload.php`, `php artisan queue:work` |
| 9 | **File storage / S3** | Any media feature | `app/Http/Controllers/ChunkUploadController.php`, `Storage::disk(config('filesystems.default'))` |
| 10 | **Artisan & scheduling** | CLI generators + cron | `php artisan make:*`, `app/Console/Kernel.php`, `app/Console/Commands/` |

Topics 1–5 are enough to build a standard CRUD feature end to end. 6–10 you pull in as a given
feature needs them.

---

## How a feature flows end-to-end here (the template to copy)

For a typical "manage X" feature, the moving parts are:

1. **Migration** — `php artisan make:migration create_xs_table` → define columns → `php artisan migrate`.
2. **Model** — `app/Models/X.php` with `$fillable` + relationships.
3. **Route** — add to `routes/web.php` (admin) or `routes/user.php` (member), inside the right
   middleware group (`auth`, `admin`, `permission:x.index`).
4. **Controller** — `app/Http/Controllers/...` method returns `Inertia::render('X/Index', [...])`
   for GET, and `redirect()->back()->with('success', ...)` after a POST/PUT.
5. **Validation** — a Form Request in `app/Http/Requests/` or inline `$request->validate([...])`.
6. **React pages** — `resources/js/Pages/X/Index.jsx`, `Create.jsx`, `Edit.jsx`, using `useForm`,
   `<Link>`, and an Ant Design `Table`/`Form`. Wrap in the right layout from `resources/js/Layouts/`.
7. **(If media)** route the file through `ChunkUploadController` + `ProcessFileUpload`, not a plain
   form post — see `CLAUDE.md` "Large media uploads".

**Copy an existing vertical slice.** The cleanest full example to clone is **Posts** (admin
`PostController` + `Pages/Post/*`) or **Sponsor** (simpler). Read one slice top to bottom before
writing anything.

---

## Frontend specifics (you know React, but these are repo-specific)

- **Ant Design is the component library** (`antd`) — Tables, Forms, Modals, DatePickers come from it,
  themed in `app.jsx`. Learn `antd` `Form` and `Table` APIs; Tailwind is used for layout/spacing on top.
- **`useForm` from `@inertiajs/react`** is your form state + submit + validation-error handler in one.
- **`usePage().props`** gives you the shared globals (auth user, settings, flash messages) — don't refetch.
- **Layouts** wrap pages: `AuthenticatedLayout` (admin), `FrontAuthenticatedLayout` (member),
  `FrontEndLayout` (public), `GuestLayout` (auth) — pick the right shell.
- Rich text = `react-quill`; PDFs = `react-pdf`/`pdfjs-dist`; charts = `@ant-design/charts`/`recharts`.

---

## Suggested 1-week ramp (practical)

- **Day 1:** Inertia docs (React adapter) end to end + read `app.jsx` and one `Pages/*/Index.jsx`.
  Get `npm run dev` + `php artisan serve` + `php artisan queue:work` running together.
- **Day 2:** PHP syntax crash course + read `EntryService.php` and 2–3 controllers until they read easily.
- **Day 3:** Eloquent — models, relationships, migrations. Read `Post.php`/`Contest.php` + their migrations.
- **Day 4:** Trace ONE full vertical slice (Posts) from route → controller → page, noting every hop.
- **Day 5:** Build a tiny throwaway CRUD entity yourself (e.g. "Announcements") copying the Posts slice.
- **Day 6:** Auth/permissions + shared props + validation. Add `permission:` gating to your test entity.
- **Day 7:** Queues, jobs, and the S3 chunked-upload flow — read `ChunkUploadController` + `ProcessFileUpload`.

---

## Reference links

- Inertia.js (React): https://inertiajs.com
- Laravel 10 docs: https://laravel.com/docs/10.x (Routing, Eloquent, Validation, Queues, Filesystem)
- spatie/laravel-permission: https://spatie.be/docs/laravel-permission
- Ant Design React: https://ant.design/components/overview
- This repo's own `CLAUDE.md`, `README.md`, and `folder-overview.md` for the file map.

---

## Verification (how you'll know the learning stuck)

You're ready to build features when you can, without help:

1. Trace a URL from `routes/web.php` to the rendered `.jsx` page.
2. Explain why there's no `/api/` endpoint for app screens.
3. Write a migration + model + controller + Inertia page for a new entity.
4. Read `EntryService.php` and explain what it does.

The Day-5 throwaway CRUD entity is the concrete proof.
