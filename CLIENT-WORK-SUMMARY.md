# Muslim Hall — Work Summary

**Work area:** Exhibitions section (public pages, member area, admin panel)
**Period:** 3 August 2026 – 5 September 2026
**Scope:** 23 sets of changes across 75 files, plus a follow-up investigation and fix in
September (see problem 12)

---

## Overview

The main assignment was to move **Create Board** from the member area into the admin
panel. While building and testing that, several existing problems came to light — most
importantly that **no file upload anywhere on the site was working**, and that members
had **no way to request access to a board**, which silently blocked the entire exhibition
approval process.

All of those were fixed, the exhibition pages were rebuilt, and the complete
board-to-published-exhibition workflow was tested end to end for the first time.

In early September a separate report — "my exhibition is not submitting" — was
investigated and traced to a mismatch between what the submission form accepted and what
the database was able to store. That is problem 12 below, and it accounts for around 58
failed submissions since mid-July.

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

### Share button on every exhibition board
The public board listing page now has a **Share** button on each board, next to the view
count. On a phone it opens the device's usual share sheet — WhatsApp, Facebook, Messenger,
email and so on. On a computer it copies the board's address to the clipboard and confirms
that it has done so.

### Owner and Contributor labels
Each exhibition inside a board is now labelled to show whether it was posted by the
board's owner or by a contributor, and a total view count is shown on the board page.

---

## 2. Pages redesigned and improved

| Page | What changed |
|---|---|
| **Exhibition board page** (public) | Rebuilt as a slideshow with thumbnails underneath, keyboard and swipe navigation, and a blurred backdrop so photos of any shape sit neatly in the frame |
| **Exhibition board page** — latest pass | Long descriptions are now shortened with a **"see more…!"** link through to the full page, which also stopped very long text from stretching the photo frame; thumbnails now sit **four per row** instead of scrolling sideways |
| **Exhibition board page** — header | The green panel at the top of a board now shows the **board's main picture on the right**, alongside the title, description and Owner/Exhibitions/Views details on the left. Boards without a picture of their own use the first exhibition's photo, so the space is never left empty. On phones the picture moves below the text |
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

11. **Shared links showed no picture and no title.** Sharing an exhibition to Facebook,
    WhatsApp, Instagram or anywhere else posted a bare web address with no preview card.
    The cause was not the share button: social platforms build the preview themselves by
    reading the page, and the exhibition pages were not supplying a title, description or
    image for them to read — so every link fell back to a generic "Muslim Hall" with no
    picture. Exhibition pages and board pages now provide all three, and the same
    improvement applies to the pages that already supplied them (posts and Islamic Zone),
    which now also specify the picture's size and the site name so the larger preview card
    is used.

    Two things worth knowing about this one. Facebook and WhatsApp **remember** the old
    empty preview for any address that has already been shared, so previously shared links
    may keep looking plain until they are refreshed through Facebook's own sharing tool.
    And **Instagram does not support link previews at all** — it is the one platform where
    a shared link cannot show a picture, regardless of the work above.

12. **Some members could not submit an exhibition at all, and were told nothing.** The
    form appeared to accept the submission and then simply did nothing — no error, no
    confirmation, no exhibition. Reported as "my exhibition is not submitting".

    Two fields were storing more, or different, information than the database had been
    set up to hold:

    - **Caption.** The form allowed up to 5,000 characters, but the database could only
      store 255. The rich-text formatting counts towards that limit as well, so a caption
      was often over the line before it looked long. Captions written in Arabic or Bengali
      reached it especially quickly — a short Hadith with its translation is already past
      255 characters.
    - **External Link.** This field had been set up to store a number rather than a web
      address, so **any** submission containing a link was rejected regardless of length.

    In both cases the member's uploaded photos were saved successfully and only the
    exhibition record failed, which is why it looked as though nothing had happened at
    all. It also explains why the fault seemed random: whether a submission worked
    depended entirely on how long the caption was and whether a link was included.

    The site's own error records show **around 58 failed attempts between 18 July and
    4 September** — roughly two-thirds caused by the caption and one-third by the link.
    Six of them were members editing an existing exhibition rather than creating a new
    one, so edits were being lost in the same way.

    Three things were changed. Both fields now hold the full range of what members
    actually enter, and every remaining field was checked against the database for the
    same kind of mismatch. A submission is now saved **completely or not at all**, so a
    failure no longer leaves photos stranded in storage without an exhibition. And if
    anything does go wrong, the member is now shown a clear message instead of silence.

    Because the uploaded photos were preserved, the affected members can be identified
    from their own files and contacted to resubmit. **No member content has been
    deleted.** The fix was also tested against long Arabic and Bengali captions before
    release, which caught two further faults of the same kind that would otherwise have
    appeared the moment the caption limit was raised.

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

- **Automated checks were added for the submission fault in problem 12** — covering a
  submission with an external link, a submission with a long formatted caption, and
  confirmation that a failed submission leaves no stranded photos behind. These run on
  demand and will catch the same fault if it is ever reintroduced. They are the first
  automated tests the project has for the exhibitions area.

- **A reporting tool was added** that lists photos in storage with no matching exhibition
  and identifies which member uploaded each one. It only reports — it deletes nothing —
  because those files are the only surviving record of who was affected.

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

5. **Check the share previews on the live site once, after this release.** The preview
   picture is served from the site's file storage, and if that storage is set to refuse
   anonymous requests the social platforms cannot fetch the image — the preview would
   still appear without a picture even though the pages are now correct. One shared link
   tested on Facebook confirms it either way.

6. **Optional: dedicated Facebook / WhatsApp / X buttons.** The current Share button uses
   the phone's own share sheet, which is the natural behaviour on mobile but gives desktop
   visitors a copied link rather than a one-click share. Individual platform buttons can
   be added if that matters for the audience.

7. **Contact the members affected by problem 12.** They can be identified from the photos
   they uploaded, and their submissions cannot be recovered — they will need to submit
   again. Worth doing soon: some of them last tried in July.

8. **Very large photos can still fail during upload.** This is a separate, less frequent
   cause with the same outward symptom, and it is the one part of problem 12 that is not
   resolved. When a photo is large enough to exhaust the server's working memory the
   upload stops mid-way, and unlike the faults above this cannot be caught and reported
   from within the site. Raising the server's image-processing limit, or rejecting
   oversized photos before processing them, would close it. Recommended if any member
   reports the same symptom after this release.

9. **The silent-failure pattern is wider than the exhibition form.** Item 1 above notes
   that the admin panel shows no error messages; problem 12 was the same fault in the
   member area. It is now fixed for exhibition submission specifically, but other member
   forms have not been checked and may fail just as quietly.
