# Exhibition Board Work — Notes

Branch: `exibition-task` → merged to `main` → deployed to VPS via GitHub Actions.

Covers the "move Create Board to the admin panel" task, five unrelated bugs found along
the way, a reference for the exhibition approval workflow (which is not a bug, but looks
like one), and the first end-to-end verification of the cross-user board workflow.

---

## 1. Feature: Create Board moved from user panel to admin panel

Previously "Create Board" lived in the user sidebar (`FrontAuthenticatedLayout`). It now
lives in the admin sidebar (`AuthenticatedLayout`), and the admin side has its own
create flow.

### Files changed

| File | Change |
|---|---|
| `routes/web.php` (~243) | Admin resource `->only([...])` extended with `create`, `store` |
| `app/Http/Controllers/Admin/ExhibitionBoardController.php` | Added `create()`, `store()`, `generateUniqueSlug()`, `use App\Support\UploadRules;` |
| `resources/js/Pages/Admin/ExhibitionBoards/Create.jsx` | New page (copied from the User version, repointed at admin routes + `AuthenticatedLayout`) |
| `resources/js/Layouts/AuthenticatedLayout.jsx` | Fixed duplicated menu item; added `routeMap` entries for list + create |
| `resources/js/Layouts/FrontAuthenticatedLayout.jsx` | Removed the "Create Board" child and its `parentMap` / `routeToKeyMap` entries |
| `app/Http/Controllers/user/ExhibitionBoardController.php` | Added `__construct` with `$this->middleware('admin')->only(['create','store'])` |

### Notes / decisions

- **Admin-created boards are auto-approved.** The user-side `store()` sets
  `STATUS_PENDING`; the admin one does not — an admin shouldn't have to approve their
  own board.
- **The user-side route still exists and is still reachable by URL.** Hiding the menu
  item is cosmetic. The `admin` middleware in the controller constructor is what
  actually protects it. Don't remove it.
- `generateUniqueSlug()` was copy-pasted from the User controller because the two
  controllers don't share a parent. It now exists in two places — if a third is ever
  needed, lift it into a trait or onto the `ExhibitionBoard` model.
- Pre-existing flaw in that slug helper (inherited, not introduced): it counts matching
  rows rather than checking availability, so after deletions it can return a slug that
  already exists.

### Still unverified

- Confirm a non-admin user gets **403** at `/user/exhibition-boards/create`.

---

## 2. Bugs fixed (all pre-existing, unrelated to the feature)

These surfaced during testing. None were caused by the board work.

### 2a. Invalid AWS access key — all uploads failing silently

`InvalidAccessKeyId` (HTTP 403) from S3. Every upload in the app was failing.

Fixed by regenerating the key in AWS and updating `.env`.

Why it was invisible: `ServiceClass::uploadFile()` catches the exception, logs it, and
returns `null`. Callers then `return back()->with('error', ...)`, and the admin layout
doesn't render flash messages — so the UI showed nothing at all.

### 2b. Broken profile images — disk mismatch

`app/Http/Middleware/HandleInertiaRequests.php`

```php
// before — built a /storage/... local path for a file that lives on S3
'photo_url' => $user->photo
    ? Storage::disk(config('filesystems.default'))->url($user->photo)
    : null,

// after
'photo_url' => ServiceClass::getFileUrl($user->photo),
```

`config('filesystems.default')` is `local` (see `.env`), but `ServiceClass::getDisk()`
rewrites `local` → `s3`, so uploads go to S3 while the URL pointed at local storage → 404.

Extra trap: because `photo_url` was a non-empty string it was *truthy*, so the JSX
fallback `user?.photo_url ? ... : getS3PublicUrl(user.photo)` never reached the working
branch.

### 2c. Profile photo saved only every other attempt

`app/Http/Controllers/ProfileController.php`

The third argument of `ServiceClass::uploadFile($file, $path, $disk)` is the **disk
name**, but the old photo path was being passed there with a comment claiming it
"deletes old file automatically". It does no such thing.

```php
// after
if ($request->hasFile('photo')) {
    $oldPhoto = $request->user()->getOriginal('photo');
    $newPath  = ServiceClass::uploadFile($request->file('photo'), 'users/photos');

    if ($newPath) {
        $request->user()->photo = $newPath;
        ServiceClass::deleteFile($oldPhoto);
    }
}
```

Why it alternated: with an existing photo → invalid disk → upload returns `null` →
`photo` saved as `null`. Next attempt → no original photo → default disk → works.
Forever alternating. The `if ($newPath)` guard also stops a failed upload from wiping
the existing photo.

Side effect of the old code: old photos were never deleted, so orphaned files are
accumulating in the bucket.

### 2d. Missing-table errors on exhibitions (`SQLSTATE[42S02]`)

```
Table 'muslim_hall.exhibition_audio' doesn't exist
```

Eloquent derives table names by pluralizing the model name, but Laravel treats
**"audio" as uncountable** — so `ExhibitionAudio` resolves to `exhibition_audio`, while
the migration created `exhibition_audios`.

Fixed by declaring the table explicitly:

- `app/Models/ExhibitionAudio.php` → `protected $table = 'exhibition_audios';`
- `app/Models/CommunityAudio.php` → `protected $table = 'community_audios';`

This is the same fix already present in `PostAudio` and `IslamicZoneAudio`; Exhibition
and Community had simply been missed.

> **If you ever add another `*Audio` model, set `$table` explicitly.** `Video` and `Pdf`
> pluralize normally and work by luck.

### 2e. Admin board detail page was completely broken — route-model binding mismatch

**Symptom:** `/admin/exhibition-boards/9` rendered, but the Member Requests tab was empty
even though the DB clearly had a request, and "Approve Board" appeared to do nothing.

**Cause:** the admin resource route and the controller disagreed on the parameter name.

```
Route:      admin/exhibition-boards/{exhibition_board}   →  show
Controller: public function show(ExhibitionBoard $board)
```

Laravel's `ImplicitRouteBinding` matches route parameters to method variables **by name**
(and its snake_case form). It looks for a parameter called `board`; the route only has
`exhibition_board`. No match → **no binding** → the container injects a brand-new empty
`ExhibitionBoard`. `$board->load(...)` then loads relations onto nothing, and every
relation serializes as empty.

`destroy()` had the same signature, so it was broken too.

**Fix** — `routes/web.php`, rename the parameter to match (this is what the user-side
resource has always done):

```php
Route::resource('exhibition-boards', AdminExhibitionBoardController::class)
    ->only(['index', 'create', 'store', 'show', 'destroy'])
    ->parameters([
        'exhibition-boards' => 'board',
    ]);
```

All admin board routes now use `{board}`, consistent with the hand-written
`approve`/`reject` routes just below — which always used `{board}` and therefore always
bound correctly. That's why board approval worked while the detail page did not.

> This almost certainly explains why the **View** button on the admin board list was
> commented out: whoever added it clicked through, got an empty page, and hid the link
> instead of tracing the cause. No route cache involved — run `php artisan route:clear`
> after changing route definitions.

---

## 3. Reference: why exhibition approval gets refused

**This is designed behaviour, not a bug.** It looks like a bug because the error message
is thrown away by the UI (see §4).

`ExhibitionController@approve` (~line 543) calls the guard
`canApproveExhibitionForBoard()` (~line 563) and returns early without updating if it
fails.

### The three gates

```
Gate 1 — exhibition has no board            → approve freely
Gate 2 — exhibition author owns the board   → approve freely
Gate 3 — someone else's board               → requires an approved membership row
```

Gate 3 needs a row in `exhibition_board_members` for that user + board with **all three**
of `owner_status`, `admin_status`, `status` set to `approved`.
`ExhibitionBoardMember::refreshFinalStatus()` only sets `status = approved` once both
`owner_status` and `admin_status` are approved.

### The workflow to satisfy Gate 3

1. User clicks **Request Access** on the board — `user.exhibition-boards.request-access`
2. **Board owner** approves — from `/user/exhibition-boards/{id}` (`...owner-approve`)
3. **An admin** approves — from `/admin/exhibition-boards/{id}` (`...admin-approve`)
4. The exhibition can now be approved

> Being an admin does **not** satisfy step 2 — owner consent and admin consent are
> separate records. If an admin owns the board they still give both, but since the
> **Approve as Owner** button was added (§4) both can be done from
> `/admin/exhibition-boards/{board}` without switching to the user-side page.

### Why it "worked before"

Historically every approved exhibition went through Gate 1 or Gate 2 — no board attached,
or the author was the board owner. Gate 3 had apparently never been exercised
successfully. The first cross-user case is the first real test of that path.

### Root cause: step 1 of the workflow had no UI

`exhibition_board_members` was **empty (0 rows)** in the local mirror of production — no
user has ever requested board access. The reason:

| Step | Backend route + controller | Frontend UI |
|---|---|---|
| 1. Request access | ✅ `user.exhibition-boards.request-access` → `requestAccess()` | ❌ **none — zero references in `resources/js/`** |
| 2. Owner approves | ✅ | ✅ `User/ExhibitionBoards/Index.jsx`, `Show.jsx` |
| 3. Admin approves | ✅ | ✅ `Admin/ExhibitionBoards/Show.jsx` |

`User\ExhibitionBoardController::index()` was already passing an `availableBoards` prop
(other users' approved+active boards, excluding ones already joined or requested) — and
no component ever read it.

So the chain was: users can't request access → no membership rows → owner and admin have
nothing to approve → Gate 3 unsatisfiable → cross-user exhibitions can never be approved.
A missing feature, not a bug in the board work.

### Fix: Request Access UI ✅ built and verified

`resources/js/Pages/User/ExhibitionBoards/Index.jsx`

- Consumes the previously-ignored `availableBoards` prop
- New **"Available Boards"** tab (with count) listing joinable boards
- **Request Access** button per row → modal with an optional `request_message`
  (max 1000 chars, matching the controller's validation)
- Posts to `user.exhibition-boards.request-access`

> The tab hides your own boards, boards you've joined, and boards you've already
> requested. Logged in as the board owner it looks empty — that is correct, not a bug.
> Test as a user who does **not** own the board.

### Production stopgap

To unblock a stuck exhibition without going through the UI, create the membership row
directly, then approve it through the existing owner/admin screens so the trail is real:

```php
App\Models\ExhibitionBoardMember::create([
    'exhibition_board_id' => <BOARD_ID>,
    'user_id'             => <EXHIBITION_AUTHOR_USER_ID>,
    'owner_status'        => 'pending',
    'admin_status'        => 'pending',
    'status'              => 'pending',
]);
```

### Careful: "member" means two different things

| Term | Meaning |
|---|---|
| **Board member** | permission to post to one specific board (`exhibition_board_members`) |
| **Member** (subscription) | user with an active paid subscription (`isMember`, `User::ROLE_MEMBER`) |

A paid site member is *not* automatically a board member.

Also note `ensureMember()` in `app/Http/Controllers/user/ExhibitionBoardController.php`
computes `$isMember` and never uses it — it returns the user regardless. Despite the
name it does not enforce subscription status.

### Production diagnostic

Run against the DB to see which gate each exhibition falls into:

```sql
SELECT
    e.id AS exhibition_id,
    e.approval_status AS exh_status,
    e.user_id AS exh_author,
    b.id AS board_id,
    b.user_id AS board_owner,
    CASE WHEN e.exhibition_board_id IS NULL THEN 'no board'
         WHEN e.user_id = b.user_id THEN 'SAME'
         ELSE 'different' END AS author_vs_owner,
    b.approval_status AS board_status,
    b.is_active AS board_active,
    m.owner_status, m.admin_status, m.status AS member_status
FROM exhibitions e
LEFT JOIN exhibition_boards b
       ON b.id = e.exhibition_board_id AND b.deleted_at IS NULL
LEFT JOIN exhibition_board_members m
       ON m.exhibition_board_id = e.exhibition_board_id
      AND m.user_id = e.user_id AND m.deleted_at IS NULL
WHERE e.deleted_at IS NULL
ORDER BY e.id;
```

Reading the result:

- `member_status` **NULL** → no membership row at all; the user must request access first
- `member_status` **pending** → check `owner_status` / `admin_status` for which approval
  is outstanding

### Boards not appearing on `/exhibition-details`

Also by design. `FrontendController::publicExhibitionBoardQuery()` uses `whereHas('exhibitions', ...)`,
so a board with **zero approved+published exhibitions** is hidden from the public listing.
An empty board will not show up until it has approved content.

---

## 4. Verified end-to-end walkthrough

Confirmed in the database on board 9 / exhibition 9 — the **first time the cross-user
path has ever completed** in this codebase.

### Phase 1 — Create the board

| Created by | Where | Resulting `approval_status` |
|---|---|---|
| **Admin** | `/admin/exhibition-boards/create` | `approved` (auto) |
| **User** | `/user/exhibition-boards/create` | `pending` → admin must approve |

If user-created, an admin approves it first: `/admin/exhibition-boards/{id}` →
**Approve Board** (top of page). The board must end up `approval_status=approved` **and**
`is_active=true` or nothing downstream works.

### Shortcut — author owns the board?

```
Board owner == exhibition author?  →  SKIP Phases 2 and 3 entirely
```

Gate 2 short-circuits: you don't need permission to post in your own board.

### Phase 2 — User requests access

As the exhibition author (not the owner):

```
/user/exhibition-boards → "Available Boards" tab → Request Access → send
```

Creates one `exhibition_board_members` row, all three statuses `pending`.

### Phase 3 — Two membership approvals

Two different consents. Order doesn't matter; `status` only flips when both are in.

| # | Hat | Where | Sets |
|---|---|---|---|
| 1 | Board **owner** | `/user/exhibition-boards` → Board Requests tab | `owner_status` |
| 2 | **Admin** | `/admin/exhibition-boards/{board}` → Member Requests tab | `admin_status` |

⚠️ On the admin page, don't confuse **Approve Board** (approves the board) with the
Member Requests tab's approve (approves the membership).

### Phase 4 — Create and approve the exhibition

User: `/user/exhibitions/create` → pick the board → submit
(`approval_status=pending`, `status=draft`)

Admin: `/admin/exhibitions` → **Approve** → guard passes → sets `approval_status=approved`,
`status=published`, `approved_at`, `approved_by`, `published_at`.

### Phase 5 — Public visibility

The board appears on `/exhibition-details` only once it has ≥1 approved+published
exhibition. Verified: board 9 became publicly visible immediately after exhibition 9 was
approved.

### Approval count by scenario

| Scenario | Approvals |
|---|---|
| Admin-created board, admin posts own exhibition | **1** — exhibition only |
| Admin-created board, *different user* posts | **3** — owner, admin, exhibition |
| User-created board, *different user* posts | **4** — board, owner, admin, exhibition |

### Admin UX improvements made during this pass

| File | Change |
|---|---|
| `resources/js/Pages/Admin/ExhibitionBoards/Index.jsx` | Uncommented the **View** button (now works post-binding-fix); action column 310 → 380 |
| `resources/js/Pages/Admin/ExhibitionBoards/Show.jsx` | Added **Approve as Owner** button on the Member Requests tab, shown only when the logged-in admin owns the board; renamed the existing button to **Approve as Admin**; action column 230 → 340 |

The owner button posts to the existing `user.exhibition-board-member-requests.owner-approve`
route — no backend change needed. That route sits under plain `auth` middleware and its
controller only checks `board->user_id === $user->id`, which holds for an admin who owns
the board. It returns `back()`, so you stay on the admin page.

> **Deliberately not merged into one click.** `owner_approved_by` and `admin_approved_by`
> stay separate so the audit trail records who consented in which capacity. This removes
> the page-switching, not the two-consent design.

---

## 5. Open items

Nothing here is blocking, but each one will cost time later.

1. **Flash messages are never rendered in `AuthenticatedLayout.jsx`.**
   Highest value fix on this list. Every `->with('error', ...)` in the admin panel is
   invisible. Three separate bugs today hid behind it, including the exhibition approval
   refusal, which returns a message that describes the problem exactly.
   Related: frontend `onSuccess` toasts fire on *any* successful response, including a
   redirect carrying an `error` flash — so the UI shows "updated" when nothing updated.

2. **`FILESYSTEM_DISK=local` in `.env` contradicts `ServiceClass::getDisk()`**, which
   rewrites `local`/`public` → `s3`. Bugs 2b and 2c both trace back to code trusting that
   config value. Worth resolving with whoever owns `ServiceClass` rather than patching
   call sites one at a time.

3. **`is_active` NULL handling is inconsistent.** `FrontendController` treats NULL as
   active (`where('is_active', true)->orWhereNull('is_active')`), but
   `canApproveExhibitionForBoard()` uses a bare `!$board->is_active`, treating NULL as
   inactive. If production has NULL rows (tables created outside migrations — see
   `CLAUDE.md`), a board can be publicly visible yet silently unapprovable.

4. **Verify the 403** for non-admin users at `/user/exhibition-boards/create`.

5. **Leftover "Create Board" button on the user board list.**
   `resources/js/Pages/User/ExhibitionBoards/Index.jsx` still renders a Create Board
   button linking to `user.exhibition-boards.create`. Since that route is now behind the
   `admin` middleware, a normal user clicking it gets a **403**. Hide it behind an
   `isAdmin` check or remove it.

6. **Not yet deployed.** Everything from §2e onward — the route-binding fix, the Request
   Access UI, and the admin UX changes — is local only. Production still has the broken
   admin board detail page and no way for users to request board access.

7. **Production exhibition is still stuck.** The cross-user exhibition on the VPS remains
   unapprovable until either the Request Access UI ships or the stopgap row is inserted
   manually (see §3).

---

## 6. Deploy reminders

- Only `main` deploys. The SSH script **does not stop on error** — a green ✅ in Actions
  does not mean migrations succeeded. Always read the migration section of the log.
- Composer prints PSR-4 "Skipping" warnings for the lowercase `admin/` and `user/`
  controller directories. Pre-existing and expected; the classes still load.
- New `create` migrations must be guarded with `if (Schema::hasTable(...)) return;` —
  production has tables that were created outside Laravel's migration tracking.
