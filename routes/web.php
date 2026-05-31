<?php

use App\Http\Controllers\admin\CategoryController;
use App\Http\Controllers\admin\CommentController;
use App\Http\Controllers\admin\ContestManageController;
use App\Http\Controllers\admin\DashboardController;
use App\Http\Controllers\admin\EntryController;
use App\Http\Controllers\admin\LangController;
use App\Http\Controllers\admin\NotificationController;
use App\Http\Controllers\admin\PaymentManageController;
use App\Http\Controllers\admin\PlanController;
use App\Http\Controllers\admin\PostController;
use App\Http\Controllers\admin\RoleController;
use App\Http\Controllers\admin\SectionController;
use App\Http\Controllers\admin\SettingController;
use App\Http\Controllers\admin\SubscriptionController;
use App\Http\Controllers\admin\UserController;
use App\Http\Controllers\AdvertisementController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\BlockedIpController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\CommunityReactionController;
use App\Http\Controllers\ChunkUploadController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContestController;
use App\Http\Controllers\ExhibitionController;
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\IslamicZoneController;
use App\Http\Controllers\LotteryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SponsorController;
use App\Http\Controllers\user\ContestManageUserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostCommentController;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\admin\ExhibitionBoardController as AdminExhibitionBoardController;
use App\Http\Controllers\ExhibitionController as AdminExhibitionController;
use Inertia\Inertia;

Route::get('/local-s3-proxy/{path}', function ($path) {
    if (Storage::disk('public')->exists($path)) {
        return response()->file(storage_path('app/public/' . $path));
    }
    return redirect('https://muslimhall.s3.ap-south-1.amazonaws.com/' . $path);
})->where('path', '.*')->name('local.s3.proxy');

Route::get('/s3-test', function () {
    try {
        $path = Storage::disk('s3')->put(
            'debug/test2.txt',
            'Hello S3'
        );
        return $path ?: 'Empty response';
    } catch (\Throwable $e) {
        logger('S3 test error: ' . $e->getMessage());
        return $e->getMessage();
    }
});

//clear all cache route
Route::get('/clear', function () {
    Artisan::call('route:clear');
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    Artisan::call('view:clear');

    return "All caches cleared successfully!";
})->name('clear.all.cache');



Route::get('/', [FrontendController::class, 'index'])->name('home');
Route::get('/post-detail/{slug}', [FrontendController::class, 'post'])->name('post-detail');
Route::get('/islamic-detail/{id}', [FrontendController::class, 'islamic'])->name('islamic-detail');
Route::get('/category-detail/{id}', [FrontendController::class, 'category'])->name('category-detail');
Route::get('/book-detail/{id}', [FrontendController::class, 'book'])->name('book-detail');
Route::get('/exhibition-detail/{id}', [FrontendController::class, 'exhibition'])->name('exhibition-detail');
Route::get('/contests-details', [FrontendController::class, 'contests'])->name('contest-details');
Route::get('/contests-details/{id}', [FrontendController::class, 'contestSingle'])->name('contest-details.single');
Route::get('/exhibition-board/{id}', [FrontendController::class, 'exhibitionBoard'])
    ->name('exhibition-board.show');
Route::middleware(['auth'])->group(function () {
    Route::post('/upload/chunk', [ChunkUploadController::class, 'upload'])->name('upload.chunk');
    // Returns a fresh CSRF token — called after long chunk uploads so the final form POST doesn't 419
    Route::get('/csrf-token', fn() => response()->json(['token' => csrf_token()]))->name('csrf.refresh');
});



Route::get('/community', [FrontendController::class, 'community'])->name('community');
Route::get('/community-details/{id}', [FrontendController::class, 'communitySingle'])->name('community-details');
Route::post('/community/reactions/toggle', [CommunityReactionController::class, 'togglePostReaction'])
    ->middleware('auth')
    ->name('community.reactions.toggle');

Route::post('/post/comments', [PostCommentController::class, 'store'])
    ->middleware('auth')
    ->name('post.comments.store');

Route::put('/post/comments/{comment}', [PostCommentController::class, 'update'])
    ->middleware('auth')
    ->name('post.comments.update');

Route::delete('/post/comments/{comment}', [PostCommentController::class, 'destroy'])
    ->middleware('auth')
    ->name('post.comments.destroy');



Route::get('/post-details', [FrontendController::class, 'postDetails'])->name('post-details');
Route::get('/islamic-zone', [FrontendController::class, 'islamicZone'])->name('islamic-zone');
Route::get('/islamic-details', [FrontendController::class, 'islamicDetails'])->name('islamic-details');
Route::get('/islamic/quran', [FrontendController::class, 'islamicQuren'])->name('islamic-quran');
Route::get('/category-details', [FrontendController::class, 'categoryDetails'])->name('category-details');
Route::get('/book-details', [FrontendController::class, 'bookDetails'])->name('book-details');
Route::get('/exhibition-details', [FrontendController::class, 'exhibitionDetails'])->name('exhibition-details');

Route::get('/prayer/calendar', function () {
    return Inertia::render('Front/IslamicPrayerCalender');
})->name('islamic-calender');



Route::get('/home', function () {
    return Inertia::render('Home');
})->middleware(['auth', 'verified']);


Route::get('/islamic/hadith', function () {
    return Inertia::render('Front/CommingSoon');
});


Route::get('/islamic/calendar', function () {
    return Inertia::render('Front/IslamicYearlyCalender');
});

Route::get('/ramadan/calendar', function () {
    return Inertia::render('Front/RamadanCalendar');
});



// Protected routes with automatic permission check
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['auth', 'verified'])
        ->name('dashboard');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management Routes
    Route::middleware(['permission:users.index'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Role Management Routes
    Route::middleware(['permission:roles.index'])->group(function () {
        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
        Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
        Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    });

    //post management routes can be added here
    Route::resource('posts', PostController::class)->names([
        'index' => 'posts.index',
        'create' => 'posts.create',
        'store' => 'posts.store',
        'show' => 'posts.show',
        'edit' => 'posts.edit',
        'update' => 'posts.update',
        'destroy' => 'posts.destroy',
    ]);
    Route::put('/posts/{post}/status', [PostController::class, 'updateStatus'])
        ->name('posts.update-status');

    Route::post('/posts/{post}/approved', [PostController::class, 'approved'])->name('posts.approved');
    Route::post('/posts/{post}/rejected', [PostController::class, 'rejected'])->name('posts.rejected');

    Route::post('/posts/{post}/hide', [PostController::class, 'hidePost'])->name('posts.hide');
    Route::post('/posts/{post}/unhide', [PostController::class, 'unhidePost'])->name('posts.unhide');

    Route::post('/reactions', [PostController::class, 'reaction'])->name('reactions.store');


    //badge management routes can be added here
    Route::resource('badges', BadgeController::class)->names([
        'index' => 'badges.index',
        'create' => 'badges.create',
        'store' => 'badges.store',
        'show' => 'badges.show',
        'edit' => 'badges.edit',
        'update' => 'badges.update',
        'destroy' => 'badges.destroy',
    ]);

    Route::resource('sponsors', SponsorController::class);

    // lang Management Routes
    // Route::middleware(['permission:langs.index'])->group(function () {
    Route::resource('langs', LangController::class)->names([
        'index' => 'langs.index',
        'create' => 'langs.create',
        'store' => 'langs.store',
        'show' => 'langs.show',
        'edit' => 'langs.edit',
        'update' => 'langs.update',
        'destroy' => 'langs.destroy',
    ]);
    // });

    //section management routes can be added here
    Route::resource('sections', SectionController::class)->names([
        'index' => 'sections.index',
        'create' => 'sections.create',
        'store' => 'sections.store',
        'show' => 'sections.show',
        'edit' => 'sections.edit',
        'update' => 'sections.update',
        'destroy' => 'sections.destroy',
    ]);

    Route::resource('exhibitions', ExhibitionController::class);

    Route::resource('exhibition-boards', AdminExhibitionBoardController::class)
        ->only(['index', 'show', 'destroy']);

    Route::post('/exhibition-boards/{board}/approve', [AdminExhibitionBoardController::class, 'approve'])
        ->name('exhibition-boards.approve');

    Route::post('/exhibition-boards/{board}/reject', [AdminExhibitionBoardController::class, 'reject'])
        ->name('exhibition-boards.reject');

    Route::post('/exhibition-board-member-requests/{memberRequest}/admin-approve', [AdminExhibitionBoardController::class, 'approveMemberRequest'])
        ->name('exhibition-board-member-requests.admin-approve');

    Route::post('/exhibition-board-member-requests/{memberRequest}/admin-reject', [AdminExhibitionBoardController::class, 'rejectMemberRequest'])
        ->name('exhibition-board-member-requests.admin-reject');

    Route::post('/exhibitions/{exhibition}/approve', [AdminExhibitionController::class, 'approve'])
        ->name('exhibitions.approve');

    Route::post('/exhibitions/{exhibition}/reject', [AdminExhibitionController::class, 'reject'])
        ->name('exhibitions.reject');
    Route::resource('islamic-zone', IslamicZoneController::class);
    Route::get('/islamic-zone/download/{id}', [IslamicZoneController::class, 'download'])->name('islamic-zone.download');
    Route::resource('books', BookController::class);
    Route::resource('advertisements', AdvertisementController::class);
    Route::resource('communities', CommunityController::class);

    Route::resource('seos', SeoController::class);
    Route::resource('blockedips', BlockedIpController::class);

    Route::post('advertisements/approve/{id}', [AdvertisementController::class, 'approve'])->name('approve.status');

    //category management routes can be added here
    Route::resource('categories', CategoryController::class)->names([
        'index' => 'categories.index',
        'create' => 'categories.create',
        'store' => 'categories.store',
        'show' => 'categories.show',
        'edit' => 'categories.edit',
        'update' => 'categories.update',
        'destroy' => 'categories.destroy',
    ]);





    // comment routes
    Route::resource('comments', CommentController::class)->names([
        'index' => 'comments.index',
        'create' => 'comments.create',
        'store' => 'comments.store',
        'show' => 'comments.show',
        'edit' => 'comments.edit',
        'update' => 'comments.update',
        'destroy' => 'comments.destroy',
    ]);

    Route::post('/contests/{id}/', [ContestController::class, 'update'])->name('contests.update');

    //contest routes can be added here
    Route::resource('contests', ContestController::class)->names([
        'index' => 'contests.index',
        'create' => 'contests.create',
        'store' => 'contests.store',
        'show' => 'contests.show',
        'edit' => 'contests.edit',
        'update' => 'contests.update',
        'destroy' => 'contests.destroy',
    ]);

    Route::get('contests/fee/{id}/add', [ContestController::class, 'contestFee'])->name('contests.fee');
    Route::post('contests/fee/store', [ContestController::class, 'contestFeeStore'])->name('contests.fee.store');
    Route::get('contests-fees', [ContestController::class, 'feesIndex'])->name('contests.fees.index');

    //lottery route to get contest winner
    Route::get('lottery', [LotteryController::class, 'index']);
    Route::get('lottery/participants', [LotteryController::class, 'getParticipants']);

    Route::get('contests/{id}/entries', [ContestManageController::class, 'entryIndex'])->name('entries.contest.index');
    Route::post('contest/winner/{id}/', [ContestManageController::class, 'winnerDeclear'])->name('winner.declare');
    Route::post('contest/winner/{id}/manual', [ContestManageController::class, 'winnerDeclearManual'])->name('winner.declare.manual');
    Route::get('contest/{id}/reviews', [ContestManageController::class, 'contestReviewIndex'])->name('contest.reviews');
    Route::post('contest/{id}/holded', [ContestManageController::class, 'contestHolded'])->name('contest.holded');
    Route::post('contest/{id}/actived', [ContestManageController::class, 'contestActive'])->name('contest.activated');

    Route::get('entry/{id}/reviews', [ContestManageController::class, 'entryReviewIndex'])->name('entry.reviews');
    Route::get('contests/archived', [ContestManageController::class, 'archivedContestIndex'])->name('contests.archived.index');
    Route::post('entries/{entry}/disqualify', [ContestManageUserController::class, 'disqualify'])->name('user.entries.disqualify');

    //contest category routes can be added here
    Route::get('contests_category/create', [ContestManageController::class, 'contestCategoryCreate'])->name('contest.category.create');
    Route::post('contests_category', [ContestManageController::class, 'contestCategoryStore'])->name('contest.category.store');
    Route::get('/contests_category', [ContestManageController::class, 'contestCategoryIndex'])->name('contest.category.index');
    Route::delete('contests_category/{id}/delete', [ContestManageController::class, 'contestCategoryDestroy'])->name('contest.category.destroy');



    //entry routes can be added here
    Route::resource('entries', EntryController::class)->names([
        'index' => 'entries.index',
        'create' => 'entries.create',
        'store' => 'entries.store',
        'show' => 'entries.show',
        'edit' => 'entries.edit',
        'update' => 'entries.update',
        'destroy' => 'entries.destroy',

    ]);
    Route::delete('entries/{id}/destroy-entry', [EntryController::class, 'destroyEntry'])->name('entries.destroyEntry');

    //plan routes can be added here
    Route::resource('plans', PlanController::class)->names([
        'index' => 'plans.index',
        'create' => 'plans.create',
        'store' => 'plans.store',
        'show' => 'plans.show',
        'edit' => 'plans.edit',
        'update' => 'plans.update',
        'destroy' => 'plans.destroy',
    ]);

    //subscription routes can be added here
    Route::resource('subscriptions', SubscriptionController::class)->names([
        'index' => 'subscriptions.index',
        'create' => 'subscriptions.create',
        'store' => 'subscriptions.store',
        'show' => 'subscriptions.show',
        'edit' => 'subscriptions.edit',
        'update' => 'subscriptions.update',
        'destroy' => 'subscriptions.destroy',
    ]);
    Route::get('/subscriptions/{id}/invoices', [SubscriptionController::class, 'invoices'])->name('subscriptions.invoices');
    Route::get('/subscriptions/{id}/payments', [SubscriptionController::class, 'paymentHistory'])->name('subscriptions.payments');

    Route::post('/subscriptions/{id}/verify', [SubscriptionController::class, 'verify'])->name('subscriptions.verify');
    Route::get('/payments', [PaymentManageController::class, 'payments'])
        ->name('payments.index');


    // Votes routes
    Route::post('/votes/store', [ContestManageController::class, 'voteStore'])->name('votes.store');
    Route::get('/votes', [ContestManageController::class, 'voteIndex'])->name('votes.index');
    Route::delete('/votes/{id}', [ContestManageController::class, 'voteDestroy'])->name('votes.destroy');

    //prize routes
    Route::get('/prizes', [ContestManageController::class, 'prizeIndex'])->name('prizes.index');
    Route::get('/prizes/create', [ContestManageController::class, 'prizeCreate'])->name('prizes.create');
    Route::post('/prizes/store', [ContestManageController::class, 'prizeStore'])->name('prizes.store');
    Route::get('/prizes/{id}', [ContestManageController::class, 'prizeShow'])->name('prizes.show');

    //Archived Contests
    // Route::get('/archived', [ContestManageController::class, 'archivedIndex'])->name('archived.index');
    Route::get('/archived', [ContestManageController::class, 'archivedContestIndex'])->name('archived.index');
    Route::get('/archived/create', [ContestManageController::class, 'archivedCreate'])->name('archived.create');
    Route::post('/archived/store', [ContestManageController::class, 'archivedStore'])->name('archived.store');

    //review routes can be added here
    Route::get('/reviews', [ContestManageController::class, 'reviewIndex'])->name('reviews.index');
    Route::post('/reviews/store', [ContestManageController::class, 'reviewStore'])->name('reviews.store');
    Route::get('/reviews/{id}/edit', [ContestManageController::class, 'reviewEdit'])->name('reviews.edit');
    Route::put('/reviews/{id}', [ContestManageController::class, 'reviewUpdate'])->name('reviews.update');
    Route::delete('/reviews/{id}', [ContestManageController::class, 'reviewDestroy'])->name('reviews.destroy');

    //winner management routes
    Route::get('/winners', [ContestManageController::class, 'winnerIndex'])->name('winners.index');
    Route::get('/winners/create', [ContestManageController::class, 'winnerCreate'])->name('winners.create');
    Route::post('/{id}/determine-winner', [ContestManageController::class, 'determineWinner'])->name('contests.determine-winner');
    Route::post('/{id}/set-manual-winner', [ContestManageController::class, 'setManualWinner'])->name('manual.winner');
    Route::post('/bulk-winner', [ContestManageController::class, 'bulkSetManualWinners'])->name('entries.bulk-winner');


    //settings management routes
    Route::controller(SettingController::class)->group(function () {

        //site setting section management routes
        Route::get('/settings', 'index')->name('settings.index');
        Route::get('/settings/create', 'create')->name('settings.create');
        Route::post('/settings/store', 'store')->name('settings.store');
        Route::get('/settings/{id}/edit', 'edit')->name('settings.edit');
        Route::put('/settings/{id}', 'update')->name('settings.update');
        Route::delete('/settings/{id}', 'destroy')->name('settings.destroy');


        //slider section management routes
        Route::get('/settings/slider', 'sliderIndex')->name('settings.slider.index');
        Route::get('/settings/slider/create', 'sliderCreate')->name('settings.slider.create');
        Route::post('/settings/slider/store', 'sliderStore')->name('settings.slider.store');
        Route::get('/settings/slider/{id}/edit', 'sliderEdit')->name('settings.slider.edit');
        Route::put('/settings/slider/{id}', 'sliderUpdate')->name('settings.slider.update');
        Route::delete('/settings/slider/{id}', 'sliderDestroy')->name('settings.slider.destroy');


        //contact info section management routes
        Route::get('/settings/contact-info', 'contactInfoIndex')->name('settings.contactinfo.index');
        Route::get('/settings/contact-info/create', 'contactInfoCreate')->name('settings.contactinfo.create');
        Route::post('/settings/contact-info/store', 'contactInfoStore')->name('settings.contactinfo.store');
        Route::get('/settings/contact-info/{id}/edit', 'contactInfoEdit')->name('settings.contactinfo.edit');
        Route::put('/settings/contact-info/{id}', 'contactInfoUpdate')->name('settings.contactinfo.update');
        Route::delete('/settings/contact-info/{id}', 'contactInfoDestroy')->name('settings.contactinfo.destroy');


        //feedback section management routes
        Route::get('/settings/feedback', 'feedbackIndex')->name('settings.feedback.index');
        Route::delete('/settings/feedback/{id}', 'feedbackDestroy')->name('settings.feedback.destroy');


        //social link section management routes
        Route::get('/settings/social-links', 'socialLinkIndex')->name('settings.sociallinks.index');
        Route::get('/settings/social-links/create', 'socialLinkCreate')->name('settings.sociallinks.create');
        Route::post('/settings/social-links/store', 'socialLinkStore')->name('settings.sociallinks.store');
        Route::get('/settings/social-links/{id}/edit', 'socialLinkEdit')->name('settings.sociallinks.edit');
        Route::put('/settings/social-links/{id}', 'socialLinkUpdate')->name('settings.sociallinks.update');
        Route::delete('/settings/social-links/{id}', 'socialLinkDestroy')->name('settings.sociallinks.destroy');

        // optimization section management routes
        Route::get('/settings/optimization', [\App\Http\Controllers\admin\OptimizationSettingController::class, 'index'])->name('settings.optimization.index');
        Route::post('/settings/optimization', [\App\Http\Controllers\admin\OptimizationSettingController::class, 'update'])->name('settings.optimization.update');
    });

    Route::patch('/posts/{post}/status', [PostController::class, 'updateStatus'])
        ->name('posts.update-status');

    Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports.index');
    Route::put('/reports/{report}/status', [ReportController::class, 'updateStatus'])->name('reports.update-status');
    Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');

    Route::get('/contacts', [ContactController::class, 'adminIndex'])->name('admin.contacts.index');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->name('admin.contacts.show');
    Route::post('/contacts/{contact}/status', [ContactController::class, 'updateStatus'])->name('admin.contacts.update-status');
    Route::post('/contacts/{contact}/reply', [ContactController::class, 'sendReply'])->name('admin.contacts.send-reply');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->name('admin.contacts.destroy');
    Route::post('/contacts/bulk-action', [ContactController::class, 'bulkAction'])->name('admin.contacts.bulk-action');
});

// Shared Notification Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Lightweight endpoint: poll for file-processing-complete notifications
    Route::get('/poll-processing-done', function () {
        $notifications = auth()->user()
            ->unreadNotifications()
            ->where('type', \App\Notifications\FileProcessingCompleteNotification::class)
            ->get();

        // Mark them as read so they don't fire again
        $notifications->each->markAsRead();

        return response()->json(
            $notifications->map(fn($n) => $n->data)->values()
        );
    })->name('poll.processing.done');

    // Check actual DB status of all media for a post
    // Returns { processing: bool, remaining: int } — used by the frontend
    // to know when ALL files are truly done (not just notification-based).
    Route::get('/api/posts/{postId}/media-status', function ($postId) {
        $post = \App\Models\Post::with(['videos', 'pdfs', 'audios'])->findOrFail($postId);

        // Count how many media rows still say 'processing'
        $remaining =
            $post->videos->where('video', 'processing')->count() +
            $post->pdfs->where('pdf', 'processing')->count() +
            $post->audios->where('audio', 'processing')->count() +
            ($post->audio === 'processing' ? 1 : 0);

        return response()->json([
            'processing' => $remaining > 0,
            'remaining' => $remaining,
        ]);
    })->name('api.posts.media-status');

    // API routes for background upload attachment
    Route::post('/api/posts/{postId}/attach-media', [App\Http\Controllers\user\PostManageUserController::class, 'attachMedia'])
        ->name('api.posts.attach-media');
});


Route::get('/log_in', [UserController::class, 'log_in'])->name('log_in');
Route::get('/registration', [UserController::class, 'registration'])->name('registration');
Route::post('/registration', [RegisteredUserController::class, 'store'])->name('registration.store');

Route::post('/front/exhibition/create', [ExhibitionController::class, 'frontStore'])->name('front.exhibition.create');
Route::get('/reports/create/{type}/{id}', [ReportController::class, 'create'])->name('reports.create');
Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
Route::get('/my-reports', [ReportController::class, 'myReports'])->name('reports.my');
Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports.index');

Route::get('/terms', [FrontendController::class, 'Terms'])->name('terms');
Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

Route::get('/storage-link', function () {
    Artisan::call('storage:link');
    return 'Storage link created successfully!';
});

Route::get('/author/{id?}', [FrontendController::class, 'authorProfile'])->name('author.profile');

include_once __DIR__ . '/user.php';

require __DIR__ . '/auth.php';
