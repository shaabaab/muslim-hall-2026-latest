<?php

use App\Http\Controllers\admin\ContestManageController;
use Illuminate\Support\Facades\Route;

// 🔹 Admin Controllers
use App\Http\Controllers\ProfileController;

// 🔹 Islamic Zone Controllers
use App\Http\Controllers\FrontendController;
use App\Http\Controllers\CommunityController;

// 🔹 Exhibition Controllers
use App\Http\Controllers\admin\UserController;
use App\Http\Controllers\PostCommentController;

// 🔹 User Controllers
use App\Http\Controllers\PostReactionController;
use App\Http\Controllers\IslamicCommentController;
use App\Http\Controllers\IslamicReactionController;
use App\Http\Controllers\CommunityCommentController;
use App\Http\Controllers\CommunityReactionController;
use App\Http\Controllers\ContestSponsorController;
use App\Http\Controllers\ExhibitionCommentController;
use App\Http\Controllers\ExhibitionReactionController;
use App\Http\Controllers\user\PostManageUserController;
use App\Http\Controllers\user\UserSubscriptionController;
use App\Http\Controllers\user\ContestManageUserController;
use App\Http\Controllers\user\ContestController;
use App\Http\Controllers\DashboardController as UserDashboardController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\SocialiteController;
use App\Http\Controllers\user\CommunityController as UserCommunityController;

use App\Http\Controllers\user\ExhibitionBoardController as UserExhibitionBoardController;
use App\Http\Controllers\user\ExhibitionController as UserExhibitionController;



Route::get('/dashboard', [UserDashboardController::class, 'index'])
    ->name('dashboard')
    ->middleware(['auth', 'verified']);


Route::get('/auth/google', [SocialiteController::class, 'googleLogin'])->name('google.login');
Route::get('/auth/google/callback', [SocialiteController::class, 'googleCallback'])->name('google.callback');

Route::post('/user/subscriptions/pay', [UserSubscriptionController::class, 'payWithSslCommerz'])->name('user.subscriptions.pay');
Route::post('/sslcommerz/subscription/success', [UserSubscriptionController::class, 'sslSuccess'])->name('sslcommerz.subscription.success');
Route::post('/sslcommerz/subscription/fail', [UserSubscriptionController::class, 'sslFail'])->name('sslcommerz.subscription.fail');
Route::post('/sslcommerz/subscription/cancel', [UserSubscriptionController::class, 'sslCancel'])->name('sslcommerz.subscription.cancel');
Route::post('/sslcommerz/subscription/ipn', [UserSubscriptionController::class, 'sslIpn'])->name('sslcommerz.subscription.ipn');


Route::middleware(['auth'])->prefix('user')->name('user.')->group(function () {
    Route::resource('exhibition-boards', UserExhibitionBoardController::class)
        ->parameters([
            'exhibition-boards' => 'board',
        ]);

    Route::post('/exhibition-boards/{board}/request-access', [UserExhibitionBoardController::class, 'requestAccess'])
        ->name('exhibition-boards.request-access');

    Route::post('/exhibition-board-member-requests/{memberRequest}/owner-approve', [UserExhibitionBoardController::class, 'approveMemberRequest'])
        ->name('exhibition-board-member-requests.owner-approve');

    Route::post('/exhibition-board-member-requests/{memberRequest}/owner-reject', [UserExhibitionBoardController::class, 'rejectMemberRequest'])
        ->name('exhibition-board-member-requests.owner-reject');

    Route::resource('exhibitions', UserExhibitionController::class);

    Route::post('/exhibitions/{exhibition}/toggle-featured', [UserExhibitionController::class, 'toggleFeatured'])
        ->name('exhibitions.toggle-featured');

    Route::post('/exhibitions/{exhibition}/mark-sold', [UserExhibitionController::class, 'markAsSold'])
        ->name('exhibitions.mark-sold');
});

// 🧑‍💻 User Routes
Route::middleware(['auth', 'verified'])
    ->prefix('user')
    ->name('user.')
    ->group(function () {



        //profile routes can be here 
    
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::get('/show-profile/{id}', [ProfileController::class, 'show'])->name('profile.show');

        // Follow/Unfollow Routes
        Route::post('/users/{id}/follow', [FollowController::class, 'follow'])->name('follow');
        Route::post('/users/{id}/unfollow', [FollowController::class, 'unfollow'])->name('unfollow');
        Route::post('/users/{id}/toggle-follow', [FollowController::class, 'toggleFollow'])->name('togglefollow');

        // 🔸 Contest Management
        Route::get('/participate/contests', [ContestManageUserController::class, 'index'])->name('contests.participate.index');
        Route::get('/participate/{id}/contests', [ContestManageUserController::class, 'show'])->name('contests.participate.show');
        Route::get('/history_contest', [ContestManageUserController::class, 'historyContest'])->name('history.index');
        Route::get('/contest-fees', [ContestManageUserController::class, 'contestFees'])->name('contest-fees.index');
        Route::get('/entries', [ContestManageUserController::class, 'indexEntry'])->name('own_entry.index');
        Route::get('/entries/{id}/edit', [ContestManageUserController::class, 'editEntry'])->name('entries.edit');
        Route::put('/entries/{id}/update', [ContestManageUserController::class, 'entryUpdate'])->name('entries.update');
        Route::post('entries/{entry}/disqualify', [ContestManageUserController::class, 'disqualify'])->name('user.entries.disqualify');

        // ⚠️ IMPORTANT: specific routes MUST come before wildcard {id?} routes
        Route::get('/{id}/entries/create/contests', [ContestManageUserController::class, 'createEntry'])->name('entries.create');
        Route::post('/{id}/entries/contests', [ContestManageUserController::class, 'storeEntry'])->name('entries.store');
        Route::get('/{id}/entries/contests', [ContestManageUserController::class, 'getEntry'])->name('entries.index');

        Route::get('/entries/{id}', [ContestManageUserController::class, 'showEntry'])->name('entries.show');

        Route::post('/{id}/set-manual-winner', [ContestManageController::class, 'setManualWinner'])->name('manual.winner');

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

        Route::post('/contests/{id}/', [ContestManageUserController::class, 'update'])->name('contests.update');

        //contest sponsor routes can be added here
        Route::resource('sponsors', ContestSponsorController::class)->names([
            'index' => 'sponsors.index',
            'create' => 'sponsors.create',
            'store' => 'sponsors.store',
            'show' => 'sponsors.show',
            'edit' => 'sponsors.edit',
            'update' => 'sponsors.update',
            'destroy' => 'sponsors.destroy',
        ]);

        Route::get('/contests/{id}/entry/index', [\App\Http\Controllers\user\ContestController::class, 'entryIndex'])->name('contests.entry.index');
        Route::get('contest/{id}/reviews', [\App\Http\Controllers\user\ContestController::class, 'contestReviewIndex'])->name('contest.reviews');
        Route::get('contest/{id}/entry/show', [\App\Http\Controllers\user\ContestController::class, 'entryShow'])->name('entry.show');


        //vote history routes can be added here
        Route::get('/contests/{entryId}/vote-history', [ContestManageUserController::class, 'voteHistory'])->name('entries.vote-history');
        Route::get('/contests/{entryId}/review-history', [ContestManageUserController::class, 'reviewHistory'])->name('entries.review-history');
        Route::post('/entries/{entryId}/vote', [ContestManageUserController::class, 'voteStore'])->name('entries.vote');


        //fronted contest details route
        Route::post('/contest/reviews/{id?}', [ContestManageUserController::class, 'storeReview'])->name('contests.reviews.store');
        Route::post('/contest/reviews/{id?}/entry', [ContestManageUserController::class, 'storeReviewEntry'])->name('entry.reviews.store');
        Route::post('/contest/entries', [ContestManageUserController::class, 'storeContestEntry'])->name('contests.entries.store');


        // 🔸 Community & Exhibition Management
        Route::resource('communities', UserCommunityController::class);

        // 🔸 Post Management
        Route::resource('posts', PostManageUserController::class)->names([
            'index' => 'posts.index',
            'create' => 'posts.create',
            'store' => 'posts.store',
            'show' => 'posts.show',
            'edit' => 'posts.edit',
            'update' => 'posts.update',
            'destroy' => 'posts.destroy',
        ]);

        Route::put('/user/posts/{post}/status', [PostManageUserController::class, 'updateStatus'])
            ->name('posts.update-status');

        Route::post('/reactions/{id}', [PostManageUserController::class, 'postReaction'])->name('reactions.store');
        Route::get('/posts/{id}/reactions', [PostManageUserController::class, 'postReactionHistory'])->name('posts.reactions');
        Route::get('/posts/{id}/comments', [PostManageUserController::class, 'postCommentHistory'])->name('posts.comments');
        Route::delete('/comments/{comment}', [PostManageUserController::class, 'destroyComment'])->name('comments.destroy');

        // 🔸 Subscription Management
        Route::resource('subscriptions', UserSubscriptionController::class)->names([
            'index' => 'subscriptions.index',
            'create' => 'subscriptions.create',
            'store' => 'subscriptions.store',
            'show' => 'subscriptions.show',
            'edit' => 'subscriptions.edit',
            'update' => 'subscriptions.update',
            'destroy' => 'subscriptions.destroy',
        ]);
        Route::get('/subscriptions/{id}/payments', [UserSubscriptionController::class, 'paymentHistory'])->name('subscriptions.payments');
    });


// 🔸 Islamic Zone (User Auth Required)

Route::prefix('islamic-zone')->name('islamic-zone.')->group(function () {
    Route::post('/comments', [IslamicCommentController::class, 'store'])->name('comments.store');
    Route::put('/comments/{comment}', [IslamicCommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [IslamicCommentController::class, 'destroy'])->name('comments.destroy');
    Route::post('/reactions/toggle', [IslamicReactionController::class, 'toggle'])->name('reactions.toggle');
});

// 🔸 Exhibition (User Auth Required)
Route::prefix('exhibition')->name('exhibition.')->group(function () {
    Route::post('/comments', [ExhibitionCommentController::class, 'store'])
        ->middleware('auth')
        ->name('comments.store');

    Route::post('/comments/reply', [ExhibitionCommentController::class, 'reply'])
        ->middleware('auth')
        ->name('comments.reply');

    Route::put('/comments/{comment}', [ExhibitionCommentController::class, 'update'])
        ->middleware('auth')
        ->name('comments.update');

    Route::delete('/comments/{comment}', [ExhibitionCommentController::class, 'destroy'])
        ->middleware('auth')
        ->name('comments.destroy');

    Route::post('/reactions/toggle', [ExhibitionReactionController::class, 'toggle'])
        ->middleware('auth')
        ->name('reactions.toggle');

    Route::get('/reactions/{exhibitionId}', [ExhibitionReactionController::class, 'getReactions'])
        ->name('reactions.get');
});

// 🌍 Public Reaction Data (No Auth Needed)
Route::get('/islamic-zone/reactions/{islamicZone}', [IslamicReactionController::class, 'getReactions'])
    ->name('islamic-zone.reactions.get');

Route::get('/exhibition/reactions/{exhibition}', [ExhibitionReactionController::class, 'getReactions'])
    ->name('exhibition.reactions.get');


// Route::get('/community', [FrontendController::class, 'community'])->name('front.community.index');
// Route::get('/community/{id}', [FrontendController::class, 'communitySingle'])->name('front.community.show');
Route::get('/community/reactions/{id}', [CommunityReactionController::class, 'getReactions'])->name('community.reactions.get');

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Community Posts
    Route::post('/community', [CommunityController::class, 'frontStore'])->name('community.store');

    // Comments
    Route::post('/community/comments', [CommunityCommentController::class, 'store'])->name('community.comments.store');
    Route::put('/community/comments/{comment}', [CommunityCommentController::class, 'update'])->name('community.comments.update');
    Route::delete('/community/comments/{comment}', [CommunityCommentController::class, 'destroy'])->name('community.comments.destroy');

    // Reactions
    Route::post('/community/reactions/toggle', [CommunityReactionController::class, 'togglePostReaction'])->name('community.reactions.toggle');
    Route::post('/community/comments/reactions/toggle', [CommunityReactionController::class, 'toggleCommentReaction'])->name('community.comments.reactions.toggle');
});

Route::prefix('post')->name('post.')->group(function () {
    // Comments
    Route::post('/comments', [PostCommentController::class, 'store'])->name('comments.store');
    Route::put('/comments/{comment}', [PostCommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{comment}', [PostCommentController::class, 'destroy'])->name('comments.destroy');

    // Reactions
    Route::post('/reactions/toggle', [PostReactionController::class, 'toggle'])->name('reactions.toggle');
});

// This route should use Post model binding
Route::get('/post/reactions/{post}', [PostReactionController::class, 'getReactions'])
    ->name('post.reactions.get');

Route::get('/category', [FrontendController::class, 'category'])
    ->name('category');

Route::get('/category-single/{slug}', [FrontendController::class, 'categorySingle'])
    ->name('category-single');

Route::get('/search', [FrontendController::class, 'search'])->name('search');

// 🔐 Authentication Routes
require __DIR__ . '/auth.php';
