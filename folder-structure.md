Folder PATH listing for volume New Volume
Volume serial number is 642D-07E5
H:.
|   .editorconfig
|   .env.example
|   .ftpquota
|   .gitattributes
|   .gitignore
|   .htaccess
|   artisan
|   composer.json
|   composer.lock
|   folder-structure.md
|   package-lock.json
|   package.json
|   phpunit.xml
|   postcss.config.js
|   README.md
|   resources.zip
|   supervisor-muslimhall.conf
|   tailwind.config.js
|   temp.json
|   vite.config.js
|   
+---app
|   +---Console
|   |   |   Kernel.php
|   |   |   
|   |   \---Commands
|   |           ContestCommand.php
|   |           DetermineWinners.php
|   |           ResetStuckProcessing.php
|   |           SubscriptionBrdge.php
|   |           SubscriptionCommand.php
|   |           
|   +---Exceptions
|   |       Handler.php
|   |       
|   +---Helpers
|   |       helpers.php
|   |       
|   +---Http
|   |   |   Kernel.php
|   |   |   
|   |   +---Controllers
|   |   |   |   AdminController.php
|   |   |   |   AdvertisementController.php
|   |   |   |   BadgeController.php
|   |   |   |   BlockedIpController.php
|   |   |   |   BookController.php
|   |   |   |   ChunkUploadController.php
|   |   |   |   CommunityCommentController.php
|   |   |   |   CommunityController.php
|   |   |   |   CommunityReactionController.php
|   |   |   |   ContactController.php
|   |   |   |   ContestController.php
|   |   |   |   ContestSponsorController.php
|   |   |   |   Controller.php
|   |   |   |   DashboardController.php
|   |   |   |   ExhibitionCommentController.php
|   |   |   |   ExhibitionController.php
|   |   |   |   ExhibitionReactionController.php
|   |   |   |   FollowController.php
|   |   |   |   FrontendController.php
|   |   |   |   HeadController.php
|   |   |   |   HeroController.php
|   |   |   |   IslamicCommentController.php
|   |   |   |   IslamicReactionController.php
|   |   |   |   IslamicZoneController.php
|   |   |   |   LotteryController.php
|   |   |   |   PostCommentController.php
|   |   |   |   PostReactionController.php
|   |   |   |   ProfileController.php
|   |   |   |   ReportController.php
|   |   |   |   SeoController.php
|   |   |   |   SocialiteController.php
|   |   |   |   SponsorController.php
|   |   |   |   
|   |   |   +---admin
|   |   |   |   |   CategoryController.php
|   |   |   |   |   CommentController.php
|   |   |   |   |   ContestManageController.php
|   |   |   |   |   DashboardController.php
|   |   |   |   |   EntryController.php
|   |   |   |   |   ExhibitionBoardController.php
|   |   |   |   |   LangController.php
|   |   |   |   |   NotificationController.php
|   |   |   |   |   OptimizationSettingController.php
|   |   |   |   |   PaymentManageController.php
|   |   |   |   |   PlanController.php
|   |   |   |   |   PostController.php
|   |   |   |   |   RoleController.php
|   |   |   |   |   SectionController.php
|   |   |   |   |   SettingController.php
|   |   |   |   |   SubscriptionController.php
|   |   |   |   |   UserController.php
|   |   |   |   |   
|   |   |   |   \---Auth
|   |   |   |           AuthenticatedSessionController.php
|   |   |   |           ConfirmablePasswordController.php
|   |   |   |           EmailVerificationNotificationController.php
|   |   |   |           EmailVerificationPromptController.php
|   |   |   |           NewPasswordController.php
|   |   |   |           PasswordController.php
|   |   |   |           PasswordResetLinkController.php
|   |   |   |           RegisteredUserController.php
|   |   |   |           VerifyEmailController.php
|   |   |   |           
|   |   |   +---Auth
|   |   |   |       AuthenticatedSessionController.php
|   |   |   |       ConfirmablePasswordController.php
|   |   |   |       EmailVerificationNotificationController.php
|   |   |   |       EmailVerificationPromptController.php
|   |   |   |       NewPasswordController.php
|   |   |   |       PasswordController.php
|   |   |   |       PasswordResetLinkController.php
|   |   |   |       RegisteredUserController.php
|   |   |   |       VerifyEmailController.php
|   |   |   |       
|   |   |   \---user
|   |   |           CommunityController.php
|   |   |           ContestController.php
|   |   |           ContestManageUserController.php
|   |   |           ExhibitionBoardController.php
|   |   |           ExhibitionController.php
|   |   |           PostManageUserController.php
|   |   |           UserSubscriptionController.php
|   |   |           
|   |   +---Middleware
|   |   |       Authenticate.php
|   |   |       CheckAdmin.php
|   |   |       CheckBlockedIp.php
|   |   |       CheckPermission.php
|   |   |       EncryptCookies.php
|   |   |       HandleInertiaRequests.php
|   |   |       LogUserActivity.php
|   |   |       PreventRequestsDuringMaintenance.php
|   |   |       RedirectIfAuthenticated.php
|   |   |       TrimStrings.php
|   |   |       TrustHosts.php
|   |   |       TrustProxies.php
|   |   |       ValidateSignature.php
|   |   |       VerifyCsrfToken.php
|   |   |       
|   |   \---Requests
|   |       |   CategoryStoreRequest.php
|   |       |   CategoryUpdateRequest.php
|   |       |   ContestFeeStore.php
|   |       |   ContestSponsorStore.php
|   |       |   ContestStore.php
|   |       |   ContestUpdate.php
|   |       |   PostStoreRequest.php
|   |       |   PostUpdateRequest.php
|   |       |   ProfileUpdateRequest.php
|   |       |   StoreAdminRequest.php
|   |       |   StoreAdvertisementRequest.php
|   |       |   StoreBlockedIpRequest.php
|   |       |   StoreBookRequest.php
|   |       |   StoreCommunityCommentRequest.php
|   |       |   StoreCommunityRequest.php
|   |       |   StoreExhibitionBoardMemberRequest.php
|   |       |   StoreExhibitionBoardRequest.php
|   |       |   StoreExhibitionRequest.php
|   |       |   StoreHeadRequest.php
|   |       |   StoreHeroRequest.php
|   |       |   StoreIslamicZoneRequest.php
|   |       |   StoreSeoRequest.php
|   |       |   StoreSponsorRequest.php
|   |       |   UpdateAdminRequest.php
|   |       |   UpdateAdvertisementRequest.php
|   |       |   UpdateBlockedIpRequest.php
|   |       |   UpdateBookRequest.php
|   |       |   UpdateCommunityCommentRequest.php
|   |       |   UpdateCommunityRequest.php
|   |       |   UpdateExhibitionBoardMemberRequest.php
|   |       |   UpdateExhibitionBoardRequest.php
|   |       |   UpdateExhibitionRequest.php
|   |       |   UpdateHeadRequest.php
|   |       |   UpdateHeroRequest.php
|   |       |   UpdateIslamicZoneRequest.php
|   |       |   UpdateSeoRequest.php
|   |       |   UpdateSponsorRequest.php
|   |       |   UserContestStore.php
|   |       |   UserContestUpdate.php
|   |       |   
|   |       +---Auth
|   |       |       LoginRequest.php
|   |       |       
|   |       \---user
|   |               StoreEntryRequest.php
|   |               
|   +---Jobs
|   |       ProcessFileUpload.php
|   |       
|   +---Models
|   |       Advertisement.php
|   |       ArchivedContest.php
|   |       Badge.php
|   |       BlockedIp.php
|   |       Book.php
|   |       Category.php
|   |       Comment.php
|   |       Community.php
|   |       CommunityComment.php
|   |       CommunityCommentReaction.php
|   |       CommunityPostReaction.php
|   |       CommunityReaction.php
|   |       Contact.php
|   |       ContactInfo.php
|   |       Contest.php
|   |       ContestCategory.php
|   |       ContestFee.php
|   |       ContestSponsor.php
|   |       ContestSponsorImage.php
|   |       Entry.php
|   |       EntryImage.php
|   |       Exhibition.php
|   |       ExhibitionBoard.php
|   |       ExhibitionBoardMember.php
|   |       ExhibitionComment.php
|   |       ExhibitionReaction.php
|   |       Feedback.php
|   |       Follow.php
|   |       Head.php
|   |       Hero.php
|   |       IslamicComment.php
|   |       IslamicReaction.php
|   |       IslamicZone.php
|   |       IslamicZoneAudio.php
|   |       IslamicZonePdf.php
|   |       IslamicZoneVideo.php
|   |       Language.php
|   |       OptimizationSetting.php
|   |       Plan.php
|   |       Post.php
|   |       PostAudio.php
|   |       PostComment.php
|   |       PostImage.php
|   |       PostPdf.php
|   |       PostReaction.php
|   |       PostVideo.php
|   |       Prize.php
|   |       Reaction.php
|   |       Report.php
|   |       Review.php
|   |       Section.php
|   |       Seo.php
|   |       Setting.php
|   |       SliderSection.php
|   |       Social.php
|   |       Sponsor.php
|   |       SponsorBanner.php
|   |       Subscription.php
|   |       SubscriptionPayment.php
|   |       User.php
|   |       Vote.php
|   |       Winner.php
|   |       
|   +---Notifications
|   |       FileProcessingCompleteNotification.php
|   |       NewPostNotification.php
|   |       NewReportNotification.php
|   |       PostApprovedNotification.php
|   |       PostCommentNotification.php
|   |       
|   +---Policies
|   |       AdminPolicy.php
|   |       AdvertisementPolicy.php
|   |       BlockedIpPolicy.php
|   |       BookPolicy.php
|   |       CommunityCommentPolicy.php
|   |       CommunityPolicy.php
|   |       ExhibitionBoardMemberPolicy.php
|   |       ExhibitionBoardPolicy.php
|   |       ExhibitionCommentPolicy.php
|   |       ExhibitionPolicy.php
|   |       HeadPolicy.php
|   |       HeroPolicy.php
|   |       IslamicCommentPolicy.php
|   |       IslamicZonePolicy.php
|   |       PostCommentPolicy.php
|   |       SeoPolicy.php
|   |       SponsorPolicy.php
|   |       
|   +---Providers
|   |       AppServiceProvider.php
|   |       AuthServiceProvider.php
|   |       BroadcastServiceProvider.php
|   |       EventServiceProvider.php
|   |       PermissionServiceProvider.php
|   |       RouteServiceProvider.php
|   |       
|   +---Services
|   |       EntryService.php
|   |       OldEntryService.php
|   |       PdfOcrService.php
|   |       ServiceClass.php
|   |       ServiceClassOld.php
|   |       
|   \---Traits
|           HasSeo.php
|           
+---bootstrap
|   |   app.php
|   |   
|   \---cache
|           .gitignore
|           
+---config
|       app.php
|       auth.php
|       broadcasting.php
|       cache.php
|       cors.php
|       database.php
|       filesystems.php
|       hashing.php
|       logging.php
|       mail.php
|       pdf.php
|       permission.php
|       queue.php
|       sanctum.php
|       services.php
|       session.php
|       sslcommerz.php
|       view.php
|       
+---database
|   |   .gitignore
|   |   
|   +---factories
|   |       AdminFactory.php
|   |       AdvertisementFactory.php
|   |       BlockedIpFactory.php
|   |       BookFactory.php
|   |       CommunityCommentFactory.php
|   |       CommunityFactory.php
|   |       ExhibitionBoardFactory.php
|   |       ExhibitionBoardMemberFactory.php
|   |       ExhibitionFactory.php
|   |       FeedbackFactory.php
|   |       HeadFactory.php
|   |       HeroFactory.php
|   |       IslamicZoneFactory.php
|   |       SeoFactory.php
|   |       SponsorFactory.php
|   |       UserFactory.php
|   |       
|   +---migrations
|   |       2014_10_12_000000_create_users_table.php
|   |       2014_10_12_100000_create_password_reset_tokens_table.php
|   |       2019_08_19_000000_create_failed_jobs_table.php
|   |       2019_12_14_000001_create_personal_access_tokens_table.php
|   |       2025_10_06_070652_create_permission_tables.php
|   |       2025_10_06_195609_create_categories_table.php
|   |       2025_10_06_195751_create_languages_table.php
|   |       2025_10_06_195911_create_sections_table.php
|   |       2025_10_06_200126_create_posts_table.php
|   |       2025_10_07_072456_create_books_table.php
|   |       2025_10_08_072017_create_comments_table.php
|   |       2025_10_08_085132_create_contests_table.php
|   |       2025_10_08_085642_create_entries_table.php
|   |       2025_10_08_090116_create_votes_table.php
|   |       2025_10_08_090325_create_prizes_table.php
|   |       2025_10_08_090714_create_reviews_table.php
|   |       2025_10_08_090846_create_archived_contests_table.php
|   |       2025_10_09_222621_create_seos_table.php
|   |       2025_10_11_202017_create_blocked_ips_table.php
|   |       2025_10_13_165016_create_communities_table.php
|   |       2025_10_13_194456_create_islamic_zones_table.php
|   |       2025_10_13_195338_create_exhibitions_table.php
|   |       2025_10_13_200344_create_advertisements_table.php
|   |       2025_10_14_042916_create_plans_table.php
|   |       2025_10_14_043013_create_subscriptions_table.php
|   |       2025_10_14_050838_create_subscription_payments_table.php
|   |       2025_10_15_044452_create_post_images_table.php
|   |       2025_10_15_065632_create_contest_prize_table.php
|   |       2025_10_15_201625_create_heroes_table.php
|   |       2025_10_15_201700_create_heads_table.php
|   |       2025_10_18_053458_create_reactions_table.php
|   |       2025_10_18_093417_create_winners_table.php
|   |       2025_10_19_054449_create_slider_sections_table.php
|   |       2025_10_19_071339_create_socials_table.php
|   |       2025_10_19_073001_create_settings_table.php
|   |       2025_10_19_085848_create_contact_infos_table.php
|   |       2025_10_19_090308_create_feedback_table.php
|   |       2025_10_22_083503_create_community_comments_table.php
|   |       2025_10_22_083503_create_community_post_reactions_table.php
|   |       2025_10_22_083503_create_exhibition_comments_table.php
|   |       2025_10_22_083503_create_islamic_comments_table.php
|   |       2025_10_22_083503_create_post_comments_table.php
|   |       2025_10_22_083511_create_community_comment_reactions_table.php
|   |       2025_10_22_083511_create_community_reactions_table.php
|   |       2025_10_22_083511_create_exhibition_reactions_table.php
|   |       2025_10_22_083511_create_islamic_reactions_table.php
|   |       2025_10_22_083511_create_post_reactions_table.php
|   |       2025_10_27_035600_update_users_table_add_columns.php
|   |       2025_10_29_042253_create_follows_table.php
|   |       2025_10_29_175406_add_badge_to_users_table.php
|   |       2025_10_29_175819_create_badges_table.php
|   |       2025_11_01_062826_create_contest_categories_table.php
|   |       2025_11_16_063020_create_sponsors_table.php
|   |       2025_11_17_051117_create_contest_fees_table.php
|   |       2025_11_20_071733_create_contest_sponsors_table.php
|   |       2025_12_16_195815_create_reports_table.php
|   |       2025_12_17_081730_create_contacts_table.php
|   |       2026_05_25_073230_create_exhibition_boards_table.php
|   |       2026_05_25_073334_create_exhibition_board_members_table.php
|   |       
|   \---seeders
|           AdminSeeder.php
|           AdvertisementSeeder.php
|           BlockedIpSeeder.php
|           BookSeeder.php
|           CommunityCommentSeeder.php
|           CommunitySeeder.php
|           DatabaseSeeder.php
|           ExhibitionBoardMemberSeeder.php
|           ExhibitionBoardSeeder.php
|           ExhibitionSeeder.php
|           HeadSeeder.php
|           HeroSeeder.php
|           IslamicZoneSeeder.php
|           RolePermissionSeeder.php
|           SeoSeeder.php
|           SponsorSeeder.php
|           UserFeedbackSeeder.php
|           
+---public
|   |   .htaccess
|   |   error_log
|   |   favicon.ico
|   |   index.php
|   |   robots.txt
|   |   
|   \---assets
|       |   images.zip
|       |   
|       +---css
|       |       style.css
|       |       
|       \---images
|               logo.png
|               logo2.jpeg
|               logo3.png
|               placeholder.png
|               
+---resources
|   +---css
|   |       app.css
|   |       
|   +---js
|   |   |   app.jsx
|   |   |   bootstrap.js
|   |   |   
|   |   +---Components
|   |   |       ApplicationLogo.jsx
|   |   |       BackgroundUploadIndicator.jsx
|   |   |       Checkbox.jsx
|   |   |       DangerButton.jsx
|   |   |       Dropdown.jsx
|   |   |       InputError.jsx
|   |   |       InputLabel.jsx
|   |   |       Modal.jsx
|   |   |       MultipleMediaUpload.jsx
|   |   |       NavLink.jsx
|   |   |       NotificationDropdown.jsx
|   |   |       PDFViewer.jsx
|   |   |       PostInfoDropdown.jsx
|   |   |       PrimaryButton.jsx
|   |   |       ResponsiveNavLink.jsx
|   |   |       SecondaryButton.jsx
|   |   |       TextInput.jsx
|   |   |       UploadProgressModal.jsx
|   |   |       
|   |   +---Contexts
|   |   |       BackgroundUploadContext.jsx
|   |   |       
|   |   +---Layouts
|   |   |       AuthenticatedLayout.jsx
|   |   |       FrontAuthenticatedLayout.jsx
|   |   |       FrontEndLayout.jsx
|   |   |       GuestLayout.jsx
|   |   |       
|   |   +---Pages
|   |   |   |   Dashboard.jsx
|   |   |   |   Welcome.jsx
|   |   |   |   
|   |   |   +---Admin
|   |   |   |   \---ExhibitionBoards
|   |   |   |           Index.jsx
|   |   |   |           Show.jsx
|   |   |   |           
|   |   |   +---Advertisement
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Auth
|   |   |   |       ConfirmPassword.jsx
|   |   |   |       ForgotPassword.jsx
|   |   |   |       Login.jsx
|   |   |   |       Register.jsx
|   |   |   |       ResetPassword.jsx
|   |   |   |       VerifyEmail.jsx
|   |   |   |       
|   |   |   +---Badge
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---BlockedIp
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Books
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       Show.jsx
|   |   |   |       
|   |   |   +---Category
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Community
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Contact
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Contest
|   |   |   |   |   ContestFee.jsx
|   |   |   |   |   Create.jsx
|   |   |   |   |   Edit.jsx
|   |   |   |   |   editNew.jsx
|   |   |   |   |   EntryList.jsx
|   |   |   |   |   EntryListOld.jsx
|   |   |   |   |   FeesIndex.jsx
|   |   |   |   |   Index.jsx
|   |   |   |   |   oldCreate.jsx
|   |   |   |   |   Reviews.jsx
|   |   |   |   |   Show.jsx
|   |   |   |   |   
|   |   |   |   +---Archived
|   |   |   |   |       Create.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       Show.jsx
|   |   |   |   |       
|   |   |   |   +---Category
|   |   |   |   |       Create.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---Entry
|   |   |   |   |       Create.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       Reviews.jsx
|   |   |   |   |       Show.jsx
|   |   |   |   |       
|   |   |   |   +---Prize
|   |   |   |   |       Create.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---Review
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   \---Vote
|   |   |   |           Index.jsx
|   |   |   |           
|   |   |   +---Exhibition
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Front
|   |   |   |       AuthorProfile.jsx
|   |   |   |       BookDetail.jsx
|   |   |   |       BookDetails.jsx
|   |   |   |       Category.jsx
|   |   |   |       CategoryPostDetail.jsx
|   |   |   |       CommingSoon.jsx
|   |   |   |       Community.jsx
|   |   |   |       CommunityDetail.jsx
|   |   |   |       CommunityFilter.jsx
|   |   |   |       CommunityNew.jsx
|   |   |   |       Contact.jsx
|   |   |   |       ContestDetail.jsx
|   |   |   |       ContestDetails.jsx
|   |   |   |       ContestDetailsOld.jsx
|   |   |   |       CountdownTimer.jsx
|   |   |   |       Css1.css
|   |   |   |       EndedContestMultipol.jsx
|   |   |   |       EndedContestSection.jsx
|   |   |   |       ExhibitionBoards.jsx
|   |   |   |       ExhibitionBoardShow.jsx
|   |   |   |       ExhibitionDetail.jsx
|   |   |   |       ExhibitionDetails.jsx
|   |   |   |       Footer.jsx
|   |   |   |       GlobalPrayerTimes.module.css
|   |   |   |       Hadish.jsx
|   |   |   |       Header.jsx
|   |   |   |       Home.jsx
|   |   |   |       ImageContent.jsx
|   |   |   |       IslamicHadish.jsx
|   |   |   |       IslamicPrayerCalender.jsx
|   |   |   |       IslamicQuren.jsx
|   |   |   |       IslamicYearlyCalender.css
|   |   |   |       IslamicYearlyCalender.jsx
|   |   |   |       IslamicZone.jsx
|   |   |   |       IslamicZoneDetail.jsx
|   |   |   |       IslamicZoneDetails.jsx
|   |   |   |       LatestContestSection.jsx
|   |   |   |       NotifyForm.jsx
|   |   |   |       PostDetail.jsx
|   |   |   |       PostDetails.jsx
|   |   |   |       PostDetailsNew.jsx
|   |   |   |       RamadanCalendar.jsx
|   |   |   |       RamadanCalendarBD.css
|   |   |   |       RunningContestMultipol.jsx
|   |   |   |       Search.jsx
|   |   |   |       Terms.jsx
|   |   |   |       
|   |   |   +---Frontend
|   |   |   |       Dashboard.jsx
|   |   |   |       
|   |   |   +---IslamicZone
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Lang
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Lottery
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Plan
|   |   |   |       Create.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Post
|   |   |   |   |   Create.jsx
|   |   |   |   |   CreateOld.jsx
|   |   |   |   |   Edit.jsx
|   |   |   |   |   EditNew.jsx
|   |   |   |   |   Index.jsx
|   |   |   |   |   Show.jsx
|   |   |   |   |   
|   |   |   |   \---Comments
|   |   |   |           Index.jsx
|   |   |   |           
|   |   |   +---Profile
|   |   |   |   |   Edit.jsx
|   |   |   |   |   UserProfileEdit.jsx
|   |   |   |   |   
|   |   |   |   \---Partials
|   |   |   |           DeleteUserForm.jsx
|   |   |   |           UpdatePasswordForm.jsx
|   |   |   |           UpdateProfileInformationForm copy.jsx
|   |   |   |           UpdateProfileInformationForm.jsx
|   |   |   |           UserDelete.jsx
|   |   |   |           UserUpdateProfile.jsx
|   |   |   |           
|   |   |   +---Report
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Roles
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Section
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Seo
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Settings
|   |   |   |   |   Create.jsx
|   |   |   |   |   Edit.jsx
|   |   |   |   |   Index.jsx
|   |   |   |   |   
|   |   |   |   +---ContactInfo
|   |   |   |   |       Create.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---Feedback
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---Optimization
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---SliderSection
|   |   |   |   |       Create.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   \---SocialSection
|   |   |   |           Create.jsx
|   |   |   |           Edit.jsx
|   |   |   |           Index.jsx
|   |   |   |           
|   |   |   +---Sponsor
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       
|   |   |   +---Subscription
|   |   |   |       Create.jsx
|   |   |   |       Edit.jsx
|   |   |   |       Index.jsx
|   |   |   |       PaymentHistory.jsx
|   |   |   |       PaymentHistoryNew.jsx
|   |   |   |       Payments.jsx
|   |   |   |       
|   |   |   +---User
|   |   |   |   |   Dashboard.jsx
|   |   |   |   |   Login.jsx
|   |   |   |   |   LoginBackup.jsx
|   |   |   |   |   Registration.jsx
|   |   |   |   |   
|   |   |   |   +---Community
|   |   |   |   |       Create.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   +---Exhibition
|   |   |   |   |       Create.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       
|   |   |   |   \---ExhibitionBoards
|   |   |   |           Create.jsx
|   |   |   |           Edit.jsx
|   |   |   |           Index.jsx
|   |   |   |           Show.jsx
|   |   |   |           
|   |   |   +---UserNavSection
|   |   |   |   |   Dashboard.jsx
|   |   |   |   |   
|   |   |   |   +---Contest
|   |   |   |   |   |   ContestEntry.jsx
|   |   |   |   |   |   ContestFee.jsx
|   |   |   |   |   |   History.jsx
|   |   |   |   |   |   Index.jsx
|   |   |   |   |   |   Show.jsx
|   |   |   |   |   |   
|   |   |   |   |   +---Entry
|   |   |   |   |   |       Create.jsx
|   |   |   |   |   |       Edit.jsx
|   |   |   |   |   |       Index.jsx
|   |   |   |   |   |       reviewHistory.jsx
|   |   |   |   |   |       Show.jsx
|   |   |   |   |   |       VoteHistory.jsx
|   |   |   |   |   |       
|   |   |   |   |   \---Sponsor
|   |   |   |   |           Create.jsx
|   |   |   |   |           Edit.jsx
|   |   |   |   |           Index.jsx
|   |   |   |   |           
|   |   |   |   +---OwnContest
|   |   |   |   |       Create.jsx
|   |   |   |   |       CreateOld.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       EntryList.jsx
|   |   |   |   |       EntryView.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       Reviews.jsx
|   |   |   |   |       Show.jsx
|   |   |   |   |       
|   |   |   |   +---Post
|   |   |   |   |       Create.jsx
|   |   |   |   |       CreateOld.jsx
|   |   |   |   |       Edit.jsx
|   |   |   |   |       Index.jsx
|   |   |   |   |       PostCommentHistory.jsx
|   |   |   |   |       postCommentHistoryCheck.jsx
|   |   |   |   |       PostReactionHistory.jsx
|   |   |   |   |       Show.jsx
|   |   |   |   |       
|   |   |   |   +---Profile
|   |   |   |   |       Show.jsx
|   |   |   |   |       
|   |   |   |   \---Subscription
|   |   |   |           Create.jsx
|   |   |   |           Edit.jsx
|   |   |   |           Index.jsx
|   |   |   |           Show.jsx
|   |   |   |           
|   |   |   \---Users
|   |   |           Create.jsx
|   |   |           Edit.jsx
|   |   |           Index.jsx
|   |   |           
|   |   \---Utils
|   |           s3Helpers.js
|   |           
|   \---views
|       |   app.blade.php
|       |   welcome.blade.php
|       |   
|       \---vendor
|           \---notifications
|                   email.blade.php
|                   
+---routes
|       12.svg
|       api.php
|       auth.php
|       channels.php
|       console.php
|       user.php
|       web.php
|       
+---storage
|   +---app
|   |   +---posts
|   |   |   \---thumbnails
|   |   |           312b5fb5-4031-4ddf-b057-83b66b74d97d.jpg
|   |   |           
|   |   +---public
|   |   |   +---exhibition-boards
|   |   |   |       ihLUTEtHCTfzl3DA9eOBOj9fKyGBm3WKWB4bSAll.png
|   |   |   |       
|   |   |   \---exhibitions
|   |   |       +---gallery
|   |   |       |       0Z5tHVOEhOQ0odj8uAbEBZ9Y6thuayKXpcfBbCQq.png
|   |   |       |       VMaraFAvIS2oeKqkjvMxWWGMtflDhnOerTYAJdaU.jpg
|   |   |       |       
|   |   |       +---images
|   |   |       |       gREg8m5LA97mrdY6T2Er3gyVOjm1KVUVENtd1TZq.png
|   |   |       |       uYvFKdFa7ceXU8VZIu1cLVVhDQAASYNXZ1Y7ld41.png
|   |   |       |       
|   |   |       \---sponsors
|   |   |               lez6PcfgLVQThuArJwpymdYlzMz0oFPfQuaChzwI.jpg
|   |   |               
|   |   +---temp
|   |   |       1777387293888-1000009041_mp4.part
|   |   |       
|   |   \---users
|   |       \---photos
|   |               5434e4d6-9597-422e-a43b-e1b038a2d8f2.jpg
|   |               
|   +---framework
|   |   |   .gitignore
|   |   |   
|   |   +---cache
|   |   |   |   .gitignore
|   |   |   |   
|   |   |   \---data
|   |   |           .gitignore
|   |   |           
|   |   +---sessions
|   |   |       .gitignore
|   |   |       
|   |   +---testing
|   |   |       .gitignore
|   |   |       
|   |   \---views
|   |           .gitignore
|   |           
|   \---logs
|           .gitignore
|           
\---tests
    |   CreatesApplication.php
    |   TestCase.php
    |   
    +---Feature
    |   |   ExampleTest.php
    |   |   ProfileTest.php
    |   |   
    |   \---Auth
    |           AuthenticationTest.php
    |           EmailVerificationTest.php
    |           PasswordConfirmationTest.php
    |           PasswordResetTest.php
    |           PasswordUpdateTest.php
    |           RegistrationTest.php
    |           
    \---Unit
            ExampleTest.php
            
