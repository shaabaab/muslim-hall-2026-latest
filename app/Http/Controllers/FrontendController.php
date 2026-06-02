<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\Book;
use App\Models\Category;
use App\Models\Community;
use App\Models\ContactInfo;
use App\Models\Contest;
use App\Models\ContestCategory;
use App\Models\Exhibition;
use App\Models\ExhibitionBoard;
use App\Models\IslamicZone;
use App\Models\Post;
use App\Models\Setting;
use App\Models\SliderSection;
use App\Models\Social;
use App\Models\Sponsor;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FrontendController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function __construct()
    {
        // $user = User::find(auth()->id());
        // return Inertia::render('Front/Header', [
        //     'user' => $user ? [
        //         'id' => $user->id,
        //         'name' => $user->name,
        //         'email' => $user->email,
        //         'avatar' => $user->avatar,
        //         'role' => $user->role
        //     ] : null
        // ]);
    }


    public function index()
    {
        $islamic = IslamicZone::latest()->take(10)->get();
        $post = Post::where('status', 1)
            ->where('permission', 'approved')
            ->where(function ($query) {
                $query->whereNull('hidden_at')
                    ->orWhere('status', 1);
            })->with(['images', 'audios'])->latest()->take(10)->get();
        $category = Category::latest()->take(10)->get();
        $book = Book::latest()->take(10)->get();
        $exhibition = Exhibition::latest()->take(10)->get();
        $contest = Contest::running()->where('voting_enabled', Contest::CONTEST_ENABLED)->with(['entries', 'reviews', 'winners'])->latest()->take(10)->get();
        $social = Social::get();

        $sponsor = Sponsor::get();
        $contactInfo = ContactInfo::first();
        $settings = Setting::first();
        $sliders = SliderSection::all();
        $advertisement = Advertisement::approved()->get();


        $runningContests = Contest::with([
            'creator',
            'prizes',
            'entries',
            'reviews',
            'category',
            'winners',

        ])
            ->where('voting_enabled', Contest::CONTEST_ENABLED)
            ->where('end_date', '>', Carbon::now())
            ->running()
            ->latest()
            ->limit(10)
            ->get();
        $contests = Contest::with(['creator', 'prizes', 'entries', 'reviews', 'category', 'winners', 'contestSponsor'])->where('voting_enabled', Contest::CONTEST_ENABLED)->running()->latest()->limit(10)->get();
        $endedcontests = Contest::with(['creator', 'prizes', 'entries', 'reviews', 'category', 'winners'])->where('voting_enabled', Contest::CONTEST_ENABLED)->ended()->latest()->limit(10)->get();

        return Inertia::render('Front/Home', [
            'islamic' => $islamic,
            'post' => $post,
            'category' => $category,
            'book' => $book,
            'exhibition' => $exhibition,
            'contest' => $contest,
            'social' => $social,
            'contactInfo' => $contactInfo,
            'settings' => $settings,
            'sliders' => $sliders,
            'advertisement' => $advertisement,
            'runningContests' => $runningContests,
            'contests' => $contests,
            'endedcontests' => $endedcontests,
            'sponsors' => $sponsor
        ]);
    }

    public function post($slug)
    {
        $post = Post::where('status', 1)->where('permission', 'approved')
            ->where(function ($query) {
                $query->whereNull('hidden_at')
                    ->orWhere('status', 1);
            })->with([
                    'category',
                    'author',
                    'images',
                    'videos',
                    'pdfs',
                    'audios',
                    'comments' => function ($query) {
                        $query->with(['user', 'replies.user']);
                    },
                    'reactions.user',
                ])->where('slug', $slug)
            ->where('status', 1)
            ->first();

        if (!$post) {
            abort(404);
        }

        // Get reaction counts
        $reactionCounts = [
            'like' => $post->reactions()->where('type', 'like')->count(),
            'love' => $post->reactions()->where('type', 'love')->count(),
            'dislike' => $post->reactions()->where('type', 'dislike')->count(),
        ];

        // Get user's reaction if logged in
        $userReaction = auth()->check()
            ? $post->reactions()->where('user_id', auth()->id())->first()
            : null;

        $userReactionType = $userReaction ? $userReaction->type : 'none';

        // Track view count
        $ip = request()->ip();
        $viewerIps = $post->viewer_ips ?? [];

        if (!in_array($ip, $viewerIps)) {
            $viewerIps[] = $ip;
            $post->viewer_ips = $viewerIps;
            $post->viewer_count = $post->viewer_count + 1;
            $post->saveQuietly();
        }

        // Get related posts (same category)
        // $relatedPosts = Post::where('status', 1)
        //     ->where(function ($query) {
        //         $query->whereNull('hidden_at')
        //             ->orWhere('status', 1);
        //     })->with(['category', 'author'])
        //     ->where('category_id', $post->category_id)
        //     ->orWhere('lang_id', $post->lang_id)
        //     ->where('id', '!=', $post->id)
        //     ->where('status', 1)
        //     ->latest()
        //     ->limit(3)
        //     ->get();
        $relatedPosts = Post::with(['category', 'author'])
            ->where('id', '!=', $post->id)
            ->where('status', 1)
            ->where('permission', Post::PERMISSION_APPROVED)
            ->whereNull('hidden_at')
            ->where(function ($query) use ($post) {
                $query->where('category_id', $post->category_id)
                    ->orWhere('lang_id', $post->lang_id);
            })
            ->latest()
            ->limit(3)
            ->get();

        $metaImage = $post->image
            ? \App\Services\ServiceClass::getFileUrl($post->image)
            : ($post->thumbnail ? \App\Services\ServiceClass::getFileUrl($post->thumbnail) : null);

        return Inertia::render('Front/PostDetails', [
            'post' => $post,
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction,
            'userReactionType' => $userReactionType,
            'relatedPosts' => $relatedPosts,
            'meta' => [
                'title' => $post->title,
                'description' => Str::limit(strip_tags($post->content), 160),
                'image' => $metaImage,
            ]
        ])->withViewData([
                    'meta' => [
                        'title' => $post->title,
                        'description' => Str::limit(strip_tags($post->content), 160),
                        'image' => $metaImage,
                    ]
                ]);
    }


    public function contests(Request $request)
    {
        $contests = Contest::with(['creator', 'prizes', 'category', 'entries', 'reviews', 'winners', 'contestSponsor', 'votes'])
            ->where('voting_enabled', Contest::CONTEST_ENABLED)
            ->running()
            ->latest()
            ->withCount('contestSponsor')
            ->limit(10)
            ->get();

        $user = User::find(Auth::id());
        // $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        $contestCategory = ContestCategory::all();

        return Inertia::render('Front/ContestDetails', [
            'contests' => $contests,
            // 'isMember' => $isMember,
            'contestCategory' => $contestCategory,
        ]);
    }

    public function contestSingle($id)
    {
        $contest = Contest::with([
            'creator',
            'prizes',
            'entries.user',
            'category',
            'reviews',
            'winners',
            'contestSponsor',
            'votes'
        ])->withCount('contestSponsor')->findOrFail($id);

        $user = auth()->user();
        $ip = request()->ip();

        $viewerUsers = $contest->viewer_users ?? [];
        $viewerIps = $contest->viewer_ips ?? [];

        // if user logged in
        if ($user) {

            if (!in_array($user->id, $viewerUsers)) {

                $viewerUsers[] = $user->id;

                $contest->viewer_users = $viewerUsers;
                $contest->viewer_count = $contest->viewer_count + 1;

                $contest->saveQuietly();
            }
        } else {

            // guest users tracked by IP
            if (!in_array($ip, $viewerIps)) {

                $viewerIps[] = $ip;

                $contest->viewer_ips = $viewerIps;
                $contest->viewer_count = $contest->viewer_count + 1;

                $contest->saveQuietly();
            }
        }

        return Inertia::render('Front/ContestDetail', [
            'contest' => $contest,
        ]);
    }


    public function islamic($id)
    {
        $islam = IslamicZone::with([
            'comments.user',
            'comments.replies.user',
            'reactions.user',
            'seo',
            'language',
            'audios',
            'videos',
            'pdfs'
        ])->findOrFail($id);

        // dd($islam);

        $metaImage = $islam->thumbnail
            ? \App\Services\ServiceClass::getFileUrl($islam->thumbnail)
            : null;

        return Inertia::render('Front/IslamicZoneDetails', [
            'islam' => $islam,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ])->withViewData([
                    'meta' => [
                        'title' => $islam->title,
                        'description' => Str::limit(strip_tags($islam->description), 160),
                        'image' => $metaImage,
                    ]
                ]);
    }

    public function communitySingle($id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        $isAdmin = $user && $user->role == User::ROLE_ADMIN;
        $canAccess = $isMember || $isAdmin;
        abort_if(!$canAccess, 403, 'Access denied. You must be a member to create Community posts.');

        $community = Community::with([
            'user',
            'comments.user',
            'comments.replies.user',
            'comments.reactions',
            'reactions.user',
            'seo'
        ])
            ->withCount(['comments', 'reactions'])
            ->published()
            ->findOrFail($id);

        // Calculate reaction counts
        $reactionCounts = [
            'like' => $community->reactions()->where('type', 'like')->count(),
            'love' => $community->reactions()->where('type', 'love')->count(),
            'dislike' => $community->reactions()->where('type', 'dislike')->count(),
        ];

        // Get user's reaction if logged in
        $userReaction = auth()->check()
            ? $community->reactions()->where('user_id', auth()->id())->first()
            : null;

        return Inertia::render('Front/CommunityDetail', [
            'community' => $community,
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }


    public function community(Request $request)
    {

        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        $isAdmin = $user && $user->role == User::ROLE_ADMIN;
        $canAccess = $isMember || $isAdmin;
        abort_if(!$canAccess, 403, 'Access denied. You must be a member to create Community posts.');


        $community = Community::with([
            'user',
            'comments.user',
            'comments.replies.user',
            'comments.reactions',
            'reactions.user'
        ])
            ->withCount(['comments', 'reactions'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                return $q->where(function ($query) use ($search) {
                    $query->where('title', 'like', '%' . $search . '%')
                        ->orWhere('content', 'like', '%' . $search . '%')
                        ->orWhere('tags', 'like', '%' . $search . '%')
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', '%' . $search . '%');
                        });
                });
            })
            ->published()
            ->latest()
            ->get();

        // Get categories for filter
        $categories = Community::published()
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        // Get popular tags
        $allTags = Community::published()
            ->whereNotNull('tags')
            ->get()
            ->pluck('tags')
            ->flatten()
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(10)
            ->toArray();

        // Get featured posts safely
        $featuredPosts = [];
        try {
            $featuredPosts = Community::with('user')
                ->where('is_featured', true)
                ->published()
                ->take(3)
                ->get();
        } catch (\Exception $e) {
            $featuredPosts = collect([]);
        }

        // Get trending posts (most viewed in last 7 days)
        $trendingPosts = Community::with('user')
            ->published()
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('views', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('Front/Community', [
            'community' => $community,
            'categories' => $categories,
            'popular_tags' => $allTags,
            'featured_posts' => $featuredPosts,
            'trending_posts' => $trendingPosts,
            'filters' => $request->only(['search', 'sort']),
            'auth' => [
                'user' => auth()->user() ? [
                    'id' => auth()->user()->id,
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'avatar' => auth()->user()->avatar,
                    'role' => auth()->user()->role
                ] : null
            ]
        ]);
    }



    public function categorySingle($slug)
    {

        $category = Category::with('post', 'post.images')->where('slug', $slug)->first();

        return Inertia::render('Front/CategoryPostDetail', [
            'category' => $category,
        ]);
    }

    public function category()
    {
        $category = Category::where('status', 1)->get();

        return Inertia::render('Front/Category', [
            'category' => $category,
        ]);
    }

    public function book($id)
    {

        $book = Book::where('id', $id)->first();

        return Inertia::render('Front/BookDetails', [
            'book' => $book,
        ]);
    }

    public function Terms()
    {
        return Inertia::render('Front/Terms');
    }

    public function exhibitionDetails(Request $request)
    {
        $user = Auth::user();

        $isMember = $user && $user->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();

        $isAdmin = $user && $user->role == User::ROLE_ADMIN;

        $canAccess = $isMember || $isAdmin;

        abort_if(!$canAccess, 403, 'Access denied. You must be a member to access exhibitions.');

        $boards = ExhibitionBoard::with(['owner'])
            ->withCount([
                'approvedExhibitions as exhibitions_count',
            ])
            ->withSum('approvedExhibitions as views_count', 'views')
            ->approved()
            ->active()
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where(function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                        ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Front/ExhibitionBoards', [
            'boards' => $boards,
            'member' => (bool) $isMember,
            'filters' => $request->only(['search']),
        ]);
    }

    public function exhibitionBoard($id)
    {
        $user = Auth::user();

        $isMember = $user && $user->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();

        $isAdmin = $user && $user->role == User::ROLE_ADMIN;

        $canAccess = $isMember || $isAdmin;

        abort_if(!$canAccess, 403, 'Access denied. You must be a member to access exhibitions.');

        $board = ExhibitionBoard::with([
            'owner',
            'approvedExhibitions' => function ($query) {
                $query->with(['user', 'reactions'])
                    ->latest();
            },
        ])
            ->approved()
            ->active()
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('Front/ExhibitionBoardShow', [
            'board' => $board,
        ]);
    }

    public function exhibition($id)
    {
        $user = Auth::user();

        $isMember = $user && $user->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();

        $isAdmin = $user && $user->role == User::ROLE_ADMIN;

        $canAccess = $isMember || $isAdmin;

        abort_if(!$canAccess, 403, 'Access denied. You must be a member to access exhibitions.');

        $exhibition = Exhibition::with([
            'board',
            'comments.user',
            'comments.replies.user',
            'reactions.user',
            'seo',
        ])
            ->where('approval_status', Exhibition::APPROVAL_APPROVED)
            ->where('status', Exhibition::STATUS_PUBLISHED)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('Front/ExhibitionDetail', [
            'exhibition' => $exhibition,
        ]);
    }

    public function postDetails(Request $request)
    {
        $posts = Post::where('status', 1)
            ->where('permission', 'approved')
            ->where(function ($query) {
                $query->whereNull('hidden_at');
                // })->with(['images', 'category', 'category.parent', 'audios'])
            })->with(['images', 'category', 'category.parent', 'audios', 'author:id,name'])
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when(
                $request->filled('category') && $request->category !== 'all',
                fn($q) => $q->whereHas(
                    'category',
                    fn($catQ) =>
                    $catQ->where('slug', $request->category)
                )
            )
            ->when(
                $request->filled('subcategory') && $request->subcategory !== 'all',
                fn($q) => $q->whereHas(
                    'category',
                    fn($catQ) =>
                    $catQ->where('slug', $request->subcategory)
                )
            )
            ->when(
                $request->filled('sort'),
                fn($q) => $q->sortByOption($request->sort),
                fn($q) => $q->sortByOption('newest')
            )
            ->paginate(6)
            ->withQueryString();


        $categories = Category::with('parent')->get();

        return Inertia::render('Front/PostDetail', [
            'posts' => $posts,
            'categories' => $categories,
            'filters' => [
                'search' => $request->search ?? '',
                'sort' => $request->sort ?? 'newest',
                'category' => $request->category ?? 'all',
                'subcategory' => $request->subcategory ?? 'all',
                'page' => (int) ($request->page ?? 1),
            ],
        ]);
    }

    public function islamicZone(Request $request)
    {
        $sort = $request->query('sort', 'latest');

        if ($sort === 'popular') {
            $quran = IslamicZone::where('type', IslamicZone::TYPE_QURAN)->orderBy('views', 'desc')->take(3)->get();
            $hadith = IslamicZone::where('type', IslamicZone::TYPE_HADITH)->orderBy('views', 'desc')->take(3)->get();
            $islamicContent = IslamicZone::where('type', IslamicZone::TYPE_ISLAMIC_CONTENT)->orderBy('views', 'desc')->take(3)->get();
            $books = Book::orderBy('view', 'desc')->take(3)->get();
        } else {
            $quran = IslamicZone::where('type', IslamicZone::TYPE_QURAN)->latest()->take(3)->get();
            $hadith = IslamicZone::where('type', IslamicZone::TYPE_HADITH)->latest()->take(3)->get();
            $islamicContent = IslamicZone::where('type', IslamicZone::TYPE_ISLAMIC_CONTENT)->latest()->take(3)->get();
            $books = Book::latest()->take(3)->get();
        }

        return Inertia::render('Front/IslamicZone', [
            'quran' => $quran,
            'hadith' => $hadith,
            'islamicContent' => $islamicContent,
            'books' => $books,
            'currentSort' => $sort,
        ]);
    }

    public function islamicDetails()
    {
        $islam = IslamicZone::where('type', IslamicZone::TYPE_ISLAMIC_CONTENT)->latest()->get();

        return Inertia::render('Front/IslamicZoneDetail', [
            'islamic' => $islam,
        ]);
    }

    public function islamicQuren()
    {
        $islam = IslamicZone::where('type', IslamicZone::TYPE_QURAN)->latest()->get();

        return Inertia::render('Front/IslamicQuren', [
            'islamic' => $islam,
        ]);
    }

    public function categoryDetails()
    {

        $category = Category::latest()->get();
        // dd($category );

        return Inertia::render('Front/CatgoryDetails', [
            'category' => $category,
        ]);
    }

    public function bookDetails(Request $request)
    {

        // $book = Book::latest()->get();
        $book = Book::when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('sort'), fn($q) => $q->sortByOption($request->sort), fn($q) => $q->sortByOption('newest'))
            ->limit(5)
            ->get();

        return Inertia::render('Front/BookDetail', [
            'book' => $book,
        ]);
    }


    public function search(Request $request)
    {
        $query = $request->get('q', '');

        $results = collect();

        if ($query) {
            // Search in posts
            $posts = Post::where('title', 'like', "%{$query}%")
                ->orWhere('content', 'like', "%{$query}%")
                ->with('images')
                ->get()
                ->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'title' => $post->title,
                        'slug' => $post->slug,
                        'content' => $post->content,
                        'images' => $post->images,
                        'created_at' => $post->created_at,
                        'type' => 'post'
                    ];
                });

            // Search in books
            $books = Book::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->get()
                ->map(function ($book) {
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'photo' => $book->photo,
                        'description' => $book->description,
                        'created_at' => $book->created_at,
                        'type' => 'book'
                    ];
                });

            // Search in islamic content
            $islamic = IslamicZone::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->get()
                ->map(function ($islamic) {
                    return [
                        'id' => $islamic->id,
                        'title' => $islamic->title,
                        'thumbnail' => $islamic->thumbnail,
                        'description' => $islamic->description,
                        'created_at' => $islamic->created_at,
                        'type' => 'islamic'
                    ];
                });

            // Search in exhibitions
            $exhibitions = Exhibition::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->get()
                ->map(function ($exhibition) {
                    return [
                        'id' => $exhibition->id,
                        'title' => $exhibition->title,
                        'image' => $exhibition->image,
                        'description' => $exhibition->description,
                        'created_at' => $exhibition->created_at,
                        'type' => 'exhibition'
                    ];
                });

            // Combine all results
            $results = $posts->concat($books)->concat($islamic)->concat($exhibitions);
        }

        return Inertia::render('Front/Search', [
            'q' => $query,
            'results' => $results,
        ]);
    }

    public function authorProfile($id)
    {
        $author = User::where('id', $id)->firstOrFail();

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | This checks AUTHOR membership, not logged-in user membership.
        | If the author's subscription is active, member design.
        | Otherwise normal design.
        */
        $isAuthorMember = $author->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();


        $posts = Post::with(['category', 'author'])
            ->where('created_by', $author->id)
            ->where('status', 1)
            ->latest()
            ->paginate(12);

        $stats = [
            'total_posts' => Post::where('created_by', $author->id)
                ->where('status', 1)
                ->count(),

            'total_views' => Post::where('created_by', $author->id)
                ->where('status', 1)
                ->sum('viewer_count'),

            'total_followers' => $author->followers()->count(),

            'join_date' => $author->created_at
                ? $author->created_at->format('F Y')
                : null,
        ];

        $isFollowing = false;

        if (auth()->check()) {
            $isFollowing = $author->followers()
                ->where('follower_id', auth()->id())
                ->exists();
        }

        return Inertia::render('Front/AuthorProfile', [
            'author' => $author,

            /*
            |--------------------------------------------------------------------------
            | Use this in React, not isMember
            |--------------------------------------------------------------------------
            */
            'author_profile_type' => $isAuthorMember ? 'member' : 'normal',

            /*
            |--------------------------------------------------------------------------
            | Keep old prop only if other old code needs it
            |--------------------------------------------------------------------------
            */
            'isMember' => $isAuthorMember ? true : false,



            'posts' => $posts,
            'stats' => $stats,
            'isFollowing' => $isFollowing,
            'meta' => [
                'title' => $author->name . ' - Author Profile',
                'description' => 'Read all posts by ' . $author->name,
            ],
        ]);
    }
}
