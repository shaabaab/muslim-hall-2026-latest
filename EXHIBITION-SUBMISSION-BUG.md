# Exhibition submission failures — investigation notes & fix plan

**Status:** fixed on `exhibition-sep-26`, 2026-09-05, not yet deployed. See §11 for what
was changed and §12 for what is still outstanding. The investigation below is kept as the
record; every root cause in it was reproduced before being fixed.
**Branch at time of writing:** `exhibition-sep-26`

---

## 1. The reported symptom

Users submit an exhibition from their own account (`/user/exhibitions/create`).
Most submissions succeed. A few fail — the user reports "my exhibition is not submitting".

On inspection:

- The submitted **images ARE present in S3**, under the owner folder `exhibitions/images/<name>-<userId>/`.
- The matching row in the **`exhibitions` table does NOT exist** for that `user_id`.

So the upload half of the request completed and the database half did not.

---

## 2. Why S3 keeps the files when the row is never created

`app/Http/Controllers/user/ExhibitionController.php:233-237`

```php
$this->uploadMainFiles($request, $validated, null);   // 1. writes to S3 (synchronous)

unset($validated['board_mode'], ...);

$exhibition = Exhibition::create($validated);          // 2. DB insert
$this->syncExtraMedia($request, $exhibition);
```

- `uploadMainFiles()` (`ExhibitionController.php:300-349`) calls `ServiceClass::uploadFile()` for
  `image`, `sponsor_image`, every `gallery[]` entry, and `document_file`.
- `ServiceClass::uploadFile()` (`app/Services/ServiceClass.php:204-241`) performs a real synchronous
  `Storage::disk('s3')->put()` / `putFileAs()` and returns the stored key.
- There is **no `DB::transaction`** around the insert and **no cleanup of the already-written S3
  objects** if anything after the upload throws.

=> Any exception thrown by `Exhibition::create()` leaves the media in the bucket forever with no
database row pointing at it. This is the mechanism behind the orphaned S3 folders.

The same ordering problem exists in `update()` (`ExhibitionController.php:437-439`).

---

## 3. Root cause #1 — `link` column is INTEGER but the form submits a URL  ← primary suspect

| Layer | Value |
|---|---|
| Migration | `database/migrations/2025_10_13_195338_create_exhibitions_table.php:32` → `$table->integer('link')->nullable();` |
| Actual column type | `link  int  YES  NULL` |
| Validation | `ExhibitionController.php:213` → `'link' => 'nullable|string|max:1000'` |
| Frontend | `resources/js/Pages/User/Exhibition/Create.jsx:936-950` — plain `<Input>` labelled **External Link**, placeholder `https://example.com` |
| MySQL mode | `config/database.php:59` → `'strict' => true` |

A user who fills in the External Link field sends a string into an `int` column. Under strict mode
MySQL rejects it:

```
SQLSTATE[HY000]: General error: 1366 Incorrect integer value: 'https://...' for column 'link' at row 1
```

Images are already in S3 by then → exception → no row.
A user who leaves External Link empty submits successfully.

**This exactly matches "most submissions succeed, a few do not."**

---

## 4. Root cause #2 — `title` is VARCHAR(255) but validated to 5000 and fed by a rich-text editor

| Layer | Value |
|---|---|
| Actual column type | `title  varchar(255)  NOT NULL` |
| Validation | `ExhibitionController.php:186` → `'title' => 'nullable|string|max:5000'` |
| Frontend | `Create.jsx:465-477` — field is labelled **Caption** and rendered with `<ReactQuill>`, so the submitted value is **HTML**, not plain text |
| Sanitiser | `ExhibitionController.php:46-49` `cleanHtml()` keeps `<p><br><strong><b><em><i><u><s><ul><ol><li><a><h1>…<h6><span><blockquote>` — the markup counts toward the 255 limit |

A caption of ~2 formatted sentences exceeds 255 characters once the Quill markup is included:

```
SQLSTATE[22001]: String data, right truncated: 1406 Data too long for column 'title' at row 1
```

Same outcome: files in S3, no row.

Note the field is also `nullable` in validation while the column is `NOT NULL`. Today this survives
because `cleanHtml(null)` returns `''`, but it is fragile.

---

## 5. Root cause #3 (less frequent) — memory exhaustion during image optimization

`ServiceClass::uploadFile()` runs `Image::make($file)` + `->encode()` when
`OptimizationSetting.image_optimization_enabled` is on (`ServiceClass.php:214-225`).

A very large source photo can exceed PHP `memory_limit`. That is a **fatal error, not catchable by
the `catch (\Throwable)` block**, so the request dies after earlier files (main image, sponsor image,
some gallery entries) already reached S3. Also produces orphans.

---

## 6. How to confirm on the VPS (do this first tomorrow)

```bash
cd /www/wwwroot/13.232.248.155

# 1. Find the actual SQL errors
grep -iE "1366|1406|Incorrect integer value|Data too long" storage/logs/laravel.log | tail -40

# 2. Confirm production schema really matches the migration.
#    CLAUDE.md warns some prod tables were created outside migration tracking,
#    so never assume the migration file reflects the live column types.
/www/server/php/83/bin/php artisan tinker
>>> DB::select("SHOW COLUMNS FROM exhibitions LIKE 'link'");
>>> DB::select("SHOW COLUMNS FROM exhibitions LIKE 'title'");
>>> DB::select("SELECT @@sql_mode");
```

Cross-check the failing timestamps / user IDs in the log against the orphaned S3 folders already
identified. That closes the loop before any code is changed.

---

## 7. Fix plan

### Step 1 — Migration to correct the column types

New migration, following the project convention in
`database/migrations/2026_07_05_000001_create_missing_post_media_tables.php` (guard everything, since
`migrate --force` on the VPS aborts silently and later migrations then never run):

- `link` : `int` → `string(1000)` nullable
- `title`: `varchar(255)` → `text`  (alternative: keep 255 and cap validation instead — see Step 2)

Guard with `Schema::hasTable('exhibitions')` and `Schema::hasColumn(...)` before altering.
`doctrine/dbal` may be required for column changes on Laravel 10 — check `composer.json` before
writing the migration; if it is absent, use a raw `DB::statement('ALTER TABLE ...')` instead.

**Existing `link` data:** the column is currently `int`, so any existing values are numeric or NULL.
Widening to string is non-destructive, but confirm with
`SELECT id, link FROM exhibitions WHERE link IS NOT NULL LIMIT 20;` before running.

### Step 2 — Make validation agree with the schema

In both `store()` and `update()` in `app/Http/Controllers/user/ExhibitionController.php`:

- `title` — decide one of:
  - widen column to `text` and keep `max:5000`, **or**
  - keep `varchar(255)` and change the rule to `max:255`, validating the *stripped* length so the
    user is judged on visible text, not on Quill markup.
- `link` — add `url` or `max:1000` consistent with the new column width.
- Consider whether **Caption** should be a Quill editor at all; a plain `<Input>` would remove the
  markup-length trap entirely.

Also mirror the same fix in the admin controller if it shares these rules —
check `app/Http/Controllers/ExhibitionController.php` and `app/Http/Controllers/admin/`.

### Step 3 — Make the write atomic and clean up S3 on failure

Wrap `store()` and `update()` in `DB::transaction()`, tracking the keys written by
`uploadMainFiles()` so they can be removed with `ServiceClass::deleteFile()` in the `catch` before
rethrowing. (Alternative, simpler: create the row first with the text fields, then upload media and
update the row — but the rollback-on-failure path is still needed.)

### Step 4 — Surface a real error to the user

Right now a DB exception is a 500, which the Inertia form shows as a silent failure. After the fix,
an over-long caption or bad link should come back as a normal validation error on the field.

### Step 5 — Clean up existing orphans

Once the fix is deployed, list the S3 keys under `exhibitions/images/<name>-<userId>/` that no
`exhibitions` row references and delete them. Do this **after** the fix, and take a listing first —
some of those users may want to be told to resubmit.

---

## 8. Separate bug noticed during the investigation (not the cause of this issue)

`ExhibitionController::show()` (`ExhibitionController.php:351-358`) renders the Inertia page
`User/Exhibition/Show`, but `resources/js/Pages/User/Exhibition/` contains only
`Create.jsx`, `Edit.jsx`, `Index.jsx`. The route `user.exhibitions.show` will therefore 500.
Worth fixing in the same pass, or logging separately.

---

## 9. Files touched by this work

- `app/Http/Controllers/user/ExhibitionController.php` — validation rules, transaction, S3 rollback
- `database/migrations/<new>_fix_exhibitions_link_and_title_columns.php` — new, guarded
- `resources/js/Pages/User/Exhibition/Create.jsx` — Caption field, link field hints
- `resources/js/Pages/User/Exhibition/Edit.jsx` — same, keep in sync
- possibly `resources/js/Pages/User/Exhibition/Show.jsx` — missing page (§8)

## 10. Deployment reminder (see also §12)

Only `main` deploys (`.github/workflows/deploy.yml`). The SSH script does **not** stop on error, so
the Actions run shows ✅ even when `artisan migrate --force` fails. After deploying this fix, open the
run and read the **"Apply any new database migrations"** step output explicitly before telling users
to resubmit.

---

## 11. What was actually done (2026-09-05)

Both predicted SQL failures were reproduced against the real schema before any code
changed — `1366 Incorrect integer value` for `link`, `1406 Data too long` for `title` —
and the fixed schema was re-tested with the same inserts.

**Step 1 — schema.** `database/migrations/2026_09_05_000001_fix_exhibitions_link_and_title_columns.php`,
guarded with `Schema::hasTable` / `hasColumn`. `link` int → `varchar(1000)`, `title`
varchar(255) → `text`. doctrine/dbal is **not** installed, so it uses raw
`DB::statement('ALTER TABLE ... MODIFY ...')`. `down()` nulls non-numeric links before
narrowing so a rollback cannot abort. Verified both by running it on the existing schema
and by migrating a fresh database from scratch.

**Step 2 — validation.** Nothing needed changing: `link` was already `max:1000` and
`title` `max:5000`, and the columns now match those rules. Caption stayed a ReactQuill
editor — widening the column removed the trap, and swapping the editor is a product
decision, not a bug fix.

**Step 3 — atomicity and rollback.** `store()` and `update()` in
`app/Http/Controllers/user/ExhibitionController.php` now track every key
`uploadMainFiles()` writes and delete them on failure. The row, the board and the
membership request go through one `DB::transaction`; media syncing stays outside it,
because those files can be gigabytes and must not hold a transaction open.
`update()` no longer uses `ServiceClass::updateFile()` — the previous keys are collected
as *stale* and deleted only after the write commits, so a failed edit no longer destroys
the files the row still points at.

**Step 4 — error surfacing.** `submissionFailure()` re-throws validation / authorization /
`abort()` results unchanged, and turns anything else into a logged error plus a form
error, instead of the silent 500 the user experienced as "nothing happened".
`Create.jsx` and `Edit.jsx` show that message via `errors.submission`.

**Step 5 — orphans: reporting only, nothing deleted.** The orphaned files are the only
record of who was affected, so they are kept. `php artisan exhibitions:orphan-media-report`
(`app/Console/Commands/ReportOrphanExhibitionMedia.php`) is read-only and groups orphans by
the user id in the owner folder, with `--files` and `--csv=` for detail.
**Run it on the VPS** — locally the database is a partial copy while `.env` points at the
same bucket, which overstates the orphan set.

**§8 — the missing page.** `resources/js/Pages/User/Exhibition/Show.jsx` was created and the
View button in `Index.jsx` (commented out since the first commit) re-enabled.

### Two further bugs of the same class, found while testing

Both were caught by the new tests, not by the original investigation:

- **`exhibitions.slug` is varchar(255)** and was derived unbounded from the caption. Now
  that `title` is TEXT, a long caption overflowed the slug instead. `trimSlug()` caps the
  base at 200 characters.
- **`app/Traits/HasSeo.php`** builds `seos.meta_title` / `og_title` / `twitter_title`
  (all varchar(255)) from the model title inside a `created()` hook, so a long caption made
  the SEO insert throw and roll the whole submission back. `seoLine()` now strips markup and
  clamps to the column width. This trait is shared across domains, so the same latent
  failure existed for any rich-text title.

Also: `routes/web.php` pulled in `routes/user.php` with `include_once`, so every `user.*`
route vanished after the first application boot in a process. Harmless for real requests
(one boot each), but it made the routes untestable. Changed to `include`.

### Tests

`tests/Feature/UserExhibitionSubmissionTest.php` — 3 passing: submission with an external
link, submission with a long rich-text caption, and no orphaned uploads left behind when a
submission fails. Uses `DatabaseTransactions`, **not** `RefreshDatabase`, so it does not
wipe the dev database.

Do not run the whole suite against the dev database — `ProfileTest` uses `RefreshDatabase`
and would truncate it. The Breeze tests fail on a fresh database for unrelated pre-existing
reasons (`/profile` 404s), and uploads fail there because `optimization_settings` has no
migration — one of the untracked production tables CLAUDE.md warns about.

## 12. Still outstanding

- **Deploy.** Merge to `main`, then read the "Apply any new database migrations" step in the
  Actions log — the SSH script does not stop on error, so a green run does not mean the
  migration ran.
- **Confirm against production** (§6): the fix assumes prod matches the local schema
  (`link int`, `title varchar(255)`). Check `SHOW COLUMNS` on the VPS before trusting it.
- **Run the orphan report on the VPS** and contact the members it names to resubmit.
- `optimization_settings` has no migration and so does not exist in a fresh database. Worth a
  guarded `create` migration, separately from this work.
- Root cause #3 (memory exhaustion in image optimization) is not addressed. The S3 rollback
  does not help there: a fatal error is not catchable, so those uploads still orphan. Would
  need a `memory_limit` raise or a size check before `Image::make()`.
