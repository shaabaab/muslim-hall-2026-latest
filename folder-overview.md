# Project Structure Breakdown

> **Stack:** Laravel 10 · React (JSX) · Inertia.js · Tailwind CSS · Vite · MySQL

---

## 🖥️ Frontend

> `resources/js/` · `resources/css/` · `resources/views/` · config files

### Pages — `resources/js/Pages/`

| Directory         | Contents                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Admin/`          | ExhibitionBoards (Index, Show)                                                                                                                                                                          |
| `Auth/`           | Login, Register, ForgotPassword, ResetPassword, VerifyEmail                                                                                                                                             |
| `Front/`          | Home, Header, Footer, PostDetail, ContestDetail, ExhibitionDetail, IslamicZone, Community, BookDetail, AuthorProfile, Search, Contact, CountdownTimer, RamadanCalendar, IslamicPrayerCalendar, and more |
| `User/`           | Dashboard, Login, Registration, Community, Exhibition, ExhibitionBoards                                                                                                                                 |
| `UserNavSection/` | Dashboard, Post (Create/Edit/Index), Contest (Entry/Fee/History/Show), OwnContest, Subscription, Profile                                                                                                |
| `Post/`           | Create, Edit, Index, Show, Comments/Index                                                                                                                                                               |
| `Contest/`        | Create, Edit, Show, EntryList, Reviews, Archived/, Category/, Entry/, Prize/, Vote/                                                                                                                     |
| `Exhibition/`     | Create, Edit, Index                                                                                                                                                                                     |
| `Community/`      | Create, Edit, Index                                                                                                                                                                                     |
| `IslamicZone/`    | Create, Edit, Index                                                                                                                                                                                     |
| `Books/`          | Create, Edit, Index, Show                                                                                                                                                                               |
| `Plan/`           | Create, Index                                                                                                                                                                                           |
| `Subscription/`   | Create, Edit, Index, Show, Payments, PaymentHistory                                                                                                                                                     |
| `Settings/`       | Create, Edit, Index, ContactInfo/, Feedback/, Optimization/, SliderSection/, SocialSection/                                                                                                             |
| `Roles/`          | Create, Edit, Index                                                                                                                                                                                     |
| `Seo/`            | Create, Edit, Index                                                                                                                                                                                     |
| `Sponsor/`        | Create, Edit, Index                                                                                                                                                                                     |
| `Users/`          | Create, Edit, Index                                                                                                                                                                                     |
| `Badge/`          | Create, Edit, Index                                                                                                                                                                                     |
| `Report/`         | Index                                                                                                                                                                                                   |
| `Advertisement/`  | Create, Edit, Index                                                                                                                                                                                     |
| `BlockedIp/`      | Create, Edit, Index                                                                                                                                                                                     |
| `Lang/`           | Create, Edit, Index                                                                                                                                                                                     |
| `Lottery/`        | Index                                                                                                                                                                                                   |

### Components — `resources/js/Components/`

| File                                                           | Purpose                    |
| -------------------------------------------------------------- | -------------------------- |
| `Modal.jsx`                                                    | Reusable modal dialog      |
| `Dropdown.jsx`                                                 | Dropdown menu              |
| `NotificationDropdown.jsx`                                     | Notification bell dropdown |
| `MultipleMediaUpload.jsx`                                      | Multi-file upload UI       |
| `UploadProgressModal.jsx`                                      | Upload progress overlay    |
| `BackgroundUploadIndicator.jsx`                                | Background upload status   |
| `PDFViewer.jsx`                                                | Inline PDF viewer          |
| `PostInfoDropdown.jsx`                                         | Post actions dropdown      |
| `TextInput.jsx`, `InputLabel.jsx`, `InputError.jsx`            | Form elements              |
| `PrimaryButton.jsx`, `SecondaryButton.jsx`, `DangerButton.jsx` | Button variants            |
| `Checkbox.jsx`, `NavLink.jsx`, `ResponsiveNavLink.jsx`         | UI utilities               |
| `ApplicationLogo.jsx`                                          | Logo component             |

### Contexts — `resources/js/Contexts/`

| File                          | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `BackgroundUploadContext.jsx` | Global state for background uploads |

### Layouts — `resources/js/Layouts/`

| File                           | Purpose                        |
| ------------------------------ | ------------------------------ |
| `AuthenticatedLayout.jsx`      | Admin/authenticated user shell |
| `FrontAuthenticatedLayout.jsx` | Frontend authenticated shell   |
| `FrontEndLayout.jsx`           | Public frontend shell          |
| `GuestLayout.jsx`              | Guest/auth pages shell         |

### Utilities & Config

| File                              | Purpose                |
| --------------------------------- | ---------------------- |
| `resources/js/Utils/s3Helpers.js` | AWS S3 upload helpers  |
| `resources/js/app.jsx`            | React app entry point  |
| `resources/js/bootstrap.js`       | Axios/Echo bootstrap   |
| `resources/css/app.css`           | Global CSS             |
| `resources/views/app.blade.php`   | Inertia HTML shell     |
| `tailwind.config.js`              | Tailwind configuration |
| `vite.config.js`                  | Vite bundler config    |
| `postcss.config.js`               | PostCSS config         |
| `package.json`                    | Node dependencies      |

---

## ⚙️ Backend

> `app/` · `routes/` · `config/`

### Controllers — `app/Http/Controllers/`

| File                                       | Purpose                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PostController.php`                       | Post CRUD                                                                                                                                                                                                                                                                                                                                                     |
| `ContestController.php`                    | Contest management                                                                                                                                                                                                                                                                                                                                            |
| `ExhibitionController.php`                 | Exhibition management                                                                                                                                                                                                                                                                                                                                         |
| `CommunityController.php`                  | Community posts                                                                                                                                                                                                                                                                                                                                               |
| `IslamicZoneController.php`                | Islamic zone content                                                                                                                                                                                                                                                                                                                                          |
| `BookController.php`                       | Books management                                                                                                                                                                                                                                                                                                                                              |
| `ProfileController.php`                    | User profile                                                                                                                                                                                                                                                                                                                                                  |
| `SocialiteController.php`                  | OAuth login                                                                                                                                                                                                                                                                                                                                                   |
| `FollowController.php`                     | Follow/unfollow                                                                                                                                                                                                                                                                                                                                               |
| `ReportController.php`                     | Content reports                                                                                                                                                                                                                                                                                                                                               |
| `AdvertisementController.php`              | Ads management                                                                                                                                                                                                                                                                                                                                                |
| `BadgeController.php`                      | User badges                                                                                                                                                                                                                                                                                                                                                   |
| `BlockedIpController.php`                  | IP blocking                                                                                                                                                                                                                                                                                                                                                   |
| `ContactController.php`                    | Contact form                                                                                                                                                                                                                                                                                                                                                  |
| `ContestSponsorController.php`             | Contest sponsors                                                                                                                                                                                                                                                                                                                                              |
| `SponsorController.php`                    | Sponsors                                                                                                                                                                                                                                                                                                                                                      |
| `LotteryController.php`                    | Lottery logic                                                                                                                                                                                                                                                                                                                                                 |
| `HeroController.php`, `HeadController.php` | Homepage sections                                                                                                                                                                                                                                                                                                                                             |
| `SeoController.php`                        | SEO management                                                                                                                                                                                                                                                                                                                                                |
| `FrontendController.php`                   | Public frontend routes                                                                                                                                                                                                                                                                                                                                        |
| `DashboardController.php`                  | Dashboard stats                                                                                                                                                                                                                                                                                                                                               |
| `ChunkUploadController.php`                | Chunked file uploads                                                                                                                                                                                                                                                                                                                                          |
| **`admin/`**                               | CategoryController, CommentController, ContestManageController, DashboardController, EntryController, ExhibitionBoardController, LangController, NotificationController, OptimizationSettingController, PaymentManageController, PlanController, PostController, RoleController, SectionController, SettingController, SubscriptionController, UserController |
| **`user/`**                                | CommunityController, ContestController, ContestManageUserController, ExhibitionBoardController, ExhibitionController, PostManageUserController, UserSubscriptionController                                                                                                                                                                                    |
| **`Auth/`** (admin & user)                 | AuthenticatedSessionController, RegisteredUserController, PasswordController, PasswordResetLinkController, EmailVerification controllers                                                                                                                                                                                                                      |

### Middleware — `app/Http/Middleware/`

| File                                            | Purpose                     |
| ----------------------------------------------- | --------------------------- |
| `CheckAdmin.php`                                | Admin role guard            |
| `CheckPermission.php`                           | Permission-based access     |
| `CheckBlockedIp.php`                            | Block banned IPs            |
| `HandleInertiaRequests.php`                     | Inertia shared data         |
| `LogUserActivity.php`                           | Activity logging            |
| `Authenticate.php`                              | Auth guard                  |
| `RedirectIfAuthenticated.php`                   | Guest-only redirect         |
| `VerifyCsrfToken.php`, `TrustProxies.php`, etc. | Standard Laravel middleware |

### Form Requests — `app/Http/Requests/`

40+ request classes for validation, including:
`PostStoreRequest`, `PostUpdateRequest`, `ContestStore`, `ContestUpdate`, `StoreEntryRequest`, `StoreCommunityRequest`, `StoreExhibitionRequest`, `StoreIslamicZoneRequest`, `ProfileUpdateRequest`, `StoreAdminRequest`, `StoreAdvertisementRequest`, `ContestFeeStore`, `ContestSponsorStore`, and many more.

### Services — `app/Services/`

| File                | Purpose                   |
| ------------------- | ------------------------- |
| `EntryService.php`  | Contest entry processing  |
| `PdfOcrService.php` | PDF OCR extraction        |
| `ServiceClass.php`  | General service utilities |

### Policies — `app/Policies/`

16 policy classes covering: Admin, Advertisement, BlockedIp, Book, Community, CommunityComment, Exhibition, ExhibitionBoard, ExhibitionBoardMember, ExhibitionComment, Head, Hero, IslamicComment, IslamicZone, PostComment, Seo, Sponsor.

### Jobs, Commands & Notifications

| Category          | Files                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jobs**          | `ProcessFileUpload.php`                                                                                                                                         |
| **Commands**      | `ContestCommand.php`, `DetermineWinners.php`, `ResetStuckProcessing.php`, `SubscriptionBridge.php`, `SubscriptionCommand.php`                                   |
| **Notifications** | `FileProcessingCompleteNotification.php`, `NewPostNotification.php`, `NewReportNotification.php`, `PostApprovedNotification.php`, `PostCommentNotification.php` |

### Routes — `routes/`

| File           | Covers                 |
| -------------- | ---------------------- |
| `web.php`      | Main web routes        |
| `api.php`      | API routes             |
| `auth.php`     | Auth routes            |
| `user.php`     | User-specific routes   |
| `channels.php` | Broadcasting channels  |
| `console.php`  | Artisan console routes |

### Providers — `app/Providers/`

`AppServiceProvider`, `AuthServiceProvider`, `BroadcastServiceProvider`, `EventServiceProvider`, `PermissionServiceProvider`, `RouteServiceProvider`

### Config — `config/`

`app.php`, `auth.php`, `cache.php`, `cors.php`, `database.php`, `filesystems.php`, `logging.php`, `mail.php`, `pdf.php`, `permission.php`, `queue.php`, `sanctum.php`, `services.php`, `session.php`, `sslcommerz.php`

---

## 🗄️ Database

> `database/` · `app/Models/`

### Models — `app/Models/` (50+)

| Category          | Models                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Users & Auth**  | `User.php`, `Badge.php`, `Follow.php`                                                                                                                                                                                           |
| **Posts**         | `Post.php`, `PostImage.php`, `PostAudio.php`, `PostVideo.php`, `PostPdf.php`, `PostComment.php`, `PostReaction.php`                                                                                                             |
| **Contests**      | `Contest.php`, `ContestCategory.php`, `ContestFee.php`, `ContestSponsor.php`, `ContestSponsorImage.php`, `Entry.php`, `EntryImage.php`, `Vote.php`, `Prize.php`, `Winner.php`, `ArchivedContest.php`, `Review.php`              |
| **Community**     | `Community.php`, `CommunityComment.php`, `CommunityCommentReaction.php`, `CommunityPostReaction.php`, `CommunityReaction.php`                                                                                                   |
| **Exhibition**    | `Exhibition.php`, `ExhibitionBoard.php`, `ExhibitionBoardMember.php`, `ExhibitionComment.php`, `ExhibitionReaction.php`                                                                                                         |
| **Islamic Zone**  | `IslamicZone.php`, `IslamicZoneAudio.php`, `IslamicZonePdf.php`, `IslamicZoneVideo.php`, `IslamicComment.php`, `IslamicReaction.php`                                                                                            |
| **Subscriptions** | `Plan.php`, `Subscription.php`, `SubscriptionPayment.php`                                                                                                                                                                       |
| **Content & CMS** | `Book.php`, `Category.php`, `Section.php`, `SliderSection.php`, `Hero.php`, `Head.php`, `Seo.php`, `Language.php`                                                                                                               |
| **Misc**          | `Advertisement.php`, `BlockedIp.php`, `Contact.php`, `ContactInfo.php`, `Feedback.php`, `Report.php`, `Sponsor.php`, `SponsorBanner.php`, `Social.php`, `Setting.php`, `OptimizationSetting.php`, `Reaction.php`, `Comment.php` |

### Migrations — `database/migrations/` (60+)

| Migration        | Table                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2014_10_12_...` | `users`, `password_reset_tokens`                                                                                                                                                                                                  |
| `2019_...`       | `failed_jobs`, `personal_access_tokens`                                                                                                                                                                                           |
| `2025_10_06_...` | `permission_tables`, `categories`, `languages`, `sections`, `posts`                                                                                                                                                               |
| `2025_10_07_...` | `books`                                                                                                                                                                                                                           |
| `2025_10_08_...` | `comments`, `contests`, `entries`, `votes`, `prizes`, `reviews`, `archived_contests`                                                                                                                                              |
| `2025_10_09_...` | `seos`                                                                                                                                                                                                                            |
| `2025_10_11_...` | `blocked_ips`                                                                                                                                                                                                                     |
| `2025_10_13_...` | `communities`, `islamic_zones`, `exhibitions`, `advertisements`                                                                                                                                                                   |
| `2025_10_14_...` | `plans`, `subscriptions`, `subscription_payments`                                                                                                                                                                                 |
| `2025_10_15_...` | `post_images`, `contest_prize`, `heroes`, `heads`                                                                                                                                                                                 |
| `2025_10_18_...` | `reactions`, `winners`                                                                                                                                                                                                            |
| `2025_10_19_...` | `slider_sections`, `socials`, `settings`, `contact_infos`, `feedback`                                                                                                                                                             |
| `2025_10_22_...` | `community_comments`, `community_post_reactions`, `exhibition_comments`, `islamic_comments`, `post_comments`, `community_comment_reactions`, `community_reactions`, `exhibition_reactions`, `islamic_reactions`, `post_reactions` |
| `2025_10_27_...` | `users` (add columns)                                                                                                                                                                                                             |
| `2025_10_29_...` | `follows`, `badges`                                                                                                                                                                                                               |
| `2025_11_01_...` | `contest_categories`                                                                                                                                                                                                              |
| `2025_11_16_...` | `sponsors`                                                                                                                                                                                                                        |
| `2025_11_17_...` | `contest_fees`                                                                                                                                                                                                                    |
| `2025_11_20_...` | `contest_sponsors`                                                                                                                                                                                                                |
| `2025_12_16_...` | `reports`                                                                                                                                                                                                                         |
| `2025_12_17_...` | `contacts`                                                                                                                                                                                                                        |
| `2026_05_25_...` | `exhibition_boards`, `exhibition_board_members`                                                                                                                                                                                   |

### Seeders — `database/seeders/`

`DatabaseSeeder`, `AdminSeeder`, `RolePermissionSeeder`, `UserFeedbackSeeder`, `HeroSeeder`, `HeadSeeder`, `SeoSeeder`, `SponsorSeeder`, `AdvertisementSeeder`, `BlockedIpSeeder`, `BookSeeder`, `CommunitySeeder`, `CommunityCommentSeeder`, `ExhibitionSeeder`, `ExhibitionBoardSeeder`, `ExhibitionBoardMemberSeeder`, `IslamicZoneSeeder`

### Factories — `database/factories/` (16)

`UserFactory`, `AdminFactory`, `HeadFactory`, `HeroFactory`, `SeoFactory`, `SponsorFactory`, `AdvertisementFactory`, `BlockedIpFactory`, `BookFactory`, `CommunityFactory`, `CommunityCommentFactory`, `ExhibitionFactory`, `ExhibitionBoardFactory`, `ExhibitionBoardMemberFactory`, `FeedbackFactory`, `IslamicZoneFactory`

---

_Generated from folder structure · Laravel + Inertia.js + React stack_
