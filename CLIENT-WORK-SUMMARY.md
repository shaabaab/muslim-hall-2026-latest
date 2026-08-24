# Muslim Hall — Work Summary

**Work area:** Exhibitions section (public pages, member area, admin panel)
**Period:** 3 August 2026 – 18 August 2026
**Scope:** 23 sets of changes across 75 files

---

## Overview

The main assignment was to move **Create Board** from the member area into the admin
panel. While building and testing that, several existing problems came to light — most
importantly that **no file upload anywhere on the site was working**, and that members
had **no way to request access to a board**, which silently blocked the entire exhibition
approval process.

All of those were fixed, the exhibition pages were rebuilt, and the complete
board-to-published-exhibition workflow was tested end to end for the first time.

---

## 1. New features

### Admin can now create Exhibition Boards
Creating a board has moved from the member area to the admin panel, with its own creation
screen (title, description, cover image, active/inactive). Boards created by an admin go
live immediately — an admin no longer has to approve their own board. The old member-side
page is now blocked for non-admins.

### Members can request access to a board
A new **Available Boards** tab in the member area lists the boards a member is allowed to
join, each with a **Request Access** button and an optional message to the board owner.

This closed a significant gap: previously there was no way for a member to ask to join a
board, so the board owner and admin had nothing to approve — which meant an exhibition
submitted by anyone other than the board's own owner could **never** be approved. It
looked like a bug in approvals; the real cause was a missing screen.

### Faster approvals for admins
When an admin also owns a board, they can now approve a join request **as the owner** and
**as the admin** from the same screen, instead of switching back and forth between the
admin panel and the member area. The two approvals are still recorded separately so the
record of who approved what stays accurate.

### Full-screen image viewer
Any exhibition photo can be clicked to open full screen for a proper look, and closed
with Escape or a click outside.

### Related exhibitions on the detail page
An exhibition's page now shows the other exhibitions from the same board in a slider, so
visitors can browse the whole board without going back and forth.

### Clickable people
Names and profile pictures — on exhibitions, comments and replies — now link through to
that person's public profile.

### Owner and Contributor labels
Each exhibition inside a board is now labelled to show whether it was posted by the
board's owner or by a contributor, and a total view count is shown on the board page.

---

## 2. Pages redesigned and improved

| Page | What changed |
|---|---|
| **Exhibition board page** (public) | Rebuilt as a slideshow with thumbnails underneath, keyboard and swipe navigation, and a blurred backdrop so photos of any shape sit neatly in the frame |
| **Exhibition board page** — latest pass | Long descriptions are now shortened with a **"see more…!"** link through to the full page, which also stopped very long text from stretching the photo frame; thumbnails now sit **four per row** instead of scrolling sideways |
| **Exhibition listing page** (public) | Refreshed layout and card design |
| **Exhibition detail page** (public) | Rebuilt — description, comments and replies, reactions, exhibition information panel and sponsor block |
| **Create Exhibition form** | Rebuilt and expanded: choose an existing board or request a new one, plus caption, main image, sponsor image, gallery images, item type, description, document, PDF, video and audio files, price, currency, dimensions, material, external link, language and availability. Menu item renamed to **"Join Exhibition"** |
| **Edit Exhibition form** | Brought fully in line with the create form |
| **Member dashboard** | Visual refresh of the cards and layout |
| **Home page** | New Exhibitions gallery section, refreshed "Latest Updates" section |
| **Header** | Simplified — Community and Contest links temporarily hidden |
| **Footer** | Social media links fixed (see below) |
| **Sidebars (admin and member)** | Create Board moved to the admin menu, a duplicated menu item removed, and the Exhibitions menu unlocked |

---

## 3. Problems fixed

1. **No file uploads were working anywhere on the site.** The site's AWS storage key had
   become invalid, so every image, document, video and audio upload was failing. Nothing
   was shown on screen when it failed, which is why it had gone unnoticed. The key was
   regenerated and uploads restored.

2. **Profile pictures were not displaying** — the site was looking for them in the wrong
   storage location.

3. **Profile photos only saved every other attempt**, and a failed upload would wipe the
   photo already on the account. Both fixed; replaced photos are now properly deleted
   instead of piling up in storage.

4. **Exhibitions with audio files crashed** with a database error. The same fault
   affected the Community section and was fixed there too.

5. **The admin's board detail page was effectively broken.** It opened, but the Member
   Requests tab always appeared empty and the Approve button did nothing — even when
   requests clearly existed. This is almost certainly why the **View** button on the
   admin board list had been hidden by a previous developer. Fixed, and the View button
   is back.

6. **Editing a board or exhibition erased its image** if you did not upload a new one.
   Existing images are now kept when they aren't being replaced.

7. **Broken image links for some users.** Files uploaded by members whose names contain
   spaces or non-English characters produced dead links. Uploads are now filed into a
   safe per-user folder.

8. **Image previews in the edit forms** no longer break before saving.

9. **View counts were wrong.** Opening one exhibition was adding a view to *every* other
   exhibition on the same board. Counts are now accurate, and the number shown on the
   board page matches the number shown on the listing page.

10. **Exhibition title and description no longer block submission** — they are now
    optional.

---

## 4. Documentation and verification

- **A step-by-step walkthrough of the whole workflow was written and verified in
  practice** — creating a board, a member requesting access, the two membership
  approvals, submitting the exhibition, its approval, and confirming it appears publicly.

- **A written reference for how many approvals each situation needs**, which had never
  been documented and was a regular source of confusion:

  | Situation | Approvals needed |
  |---|---|
  | Admin's own board, admin posts their own exhibition | **1** |
  | Admin's board, a different member posts | **3** |
  | Member-created board, a different member posts | **4** |

- **Two internal reference documents** were added to the project so the next developer
  does not have to rediscover any of this.

- **Tidy-up across roughly 50 files** — consistent handling of image addresses and
  consistent code formatting. No change in behaviour, but less room for the image
  problems above to reappear.

---

## 5. Recommended next steps

These are not blocking anything today, but each will cost time or cause confusion later.

1. **The admin panel does not display error messages.** When something fails, the screen
   stays silent. Three of the problems listed above were hidden behind this, including
   one where the system was returning a message that described the problem exactly — it
   simply was never shown. This is the highest-value item on the list.

2. **A storage setting in the site configuration contradicts the code**, which is the
   root of the profile-picture problems. Worth resolving properly rather than patching
   each place it appears.

3. **Confirm when the Community and Contest links should return to the header** — they
   are currently hidden, not removed.

4. **Older boards created before this work may have an incomplete active/inactive
   setting**, which could make a board publicly visible yet impossible to approve
   exhibitions for. Worth a quick check against the live data.
