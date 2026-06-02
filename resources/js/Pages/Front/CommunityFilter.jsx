import { Link, usePage, router } from "@inertiajs/react";
import { useState, useMemo, useEffect } from 'react'; // Added useEffect import
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import Header from "./Header";
import Footer from "./Footer";
import { Head } from '@inertiajs/react';

export default function Community() {
    const { community, auth, categories, popular_tags, trending_posts, featured_posts, filters: initialFilters } = usePage().props;

    // Consolidated filter state
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        sort: initialFilters?.sort || 'latest',
        category: 'all',
        tag: 'all',
        dateRange: { start: '', end: '' },
        minComments: '',
        minLikes: ''
    });

    const [expandedPost, setExpandedPost] = useState(null);
    const [commentText, setCommentText] = useState({});
    const [replyText, setReplyText] = useState({});
    const [showReplyForm, setShowReplyForm] = useState({});
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [selectedReaction, setSelectedReaction] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [postFormData, setPostFormData] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
        image: null,
        is_featured: false,
        status: 'published'
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced filter effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only send relevant filters to backend
            const backendFilters = {
                search: filters.search,
                sort: filters.sort
            };
            
            router.get(route('community'), backendFilters, {
                preserveState: true,
                replace: true,
                only: ['community', 'filters']
            });
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [filters.search, filters.sort]); // Only trigger on search and sort changes

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            sort: 'latest',
            category: 'all',
            tag: 'all',
            dateRange: { start: '', end: '' },
            minComments: '',
            minLikes: ''
        };
        
        setFilters(clearedFilters);
        
        // Only clear backend-managed filters
        router.get(route('community'), {
            search: '',
            sort: 'latest'
        }, {
            preserveState: true,
            replace: true,
            only: ['community', 'filters']
        });
    };

    // Reaction types with emojis
    const reactionTypes = {
        like: { emoji: '👍', label: 'Like', color: 'text-blue-400' },
        love: { emoji: '❤️', label: 'Love', color: 'text-red-400' },
        laugh: { emoji: '😂', label: 'Haha', color: 'text-yellow-400' },
        wow: { emoji: '😮', label: 'Wow', color: 'text-orange-400' },
        sad: { emoji: '😢', label: 'Sad', color: 'text-purple-400' },
        angry: { emoji: '😠', label: 'Angry', color: 'text-red-500' }
    };

    // Format number for display
    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate stats
    const stats = useMemo(() => {
        const totalPosts = community?.length || 0;
        const totalComments = community?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
        const totalViews = community?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
        const totalReactions = community?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

        return {
            total_posts: totalPosts,
            total_comments: totalComments,
            total_views: totalViews,
            total_reactions: totalReactions
        };
    }, [community]);

    // Get unique tags from posts
    const allTags = useMemo(() => {
        if (!community) return [];
        const tags = community.flatMap(post => post.tags || []);
        const tagCounts = tags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});

        return ['all', ...Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([tag]) => tag)
            .slice(0, 15)
        ];
    }, [community]);

    // Advanced filtering (client-side only)
    const filteredPosts = useMemo(() => {
        if (!community) return [];

        let filtered = [...community];

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(post => 
                post.title?.toLowerCase().includes(searchTerm) ||
                post.content?.toLowerCase().includes(searchTerm) ||
                post.user?.name?.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (filters.category !== 'all') {
            filtered = filtered.filter(post => post.category === filters.category);
        }

        // Tag filter
        if (filters.tag !== 'all') {
            filtered = filtered.filter(post => post.tags?.includes(filters.tag));
        }

        // Date range filter
        if (filters.dateRange.start) {
            filtered = filtered.filter(post => new Date(post.created_at) >= new Date(filters.dateRange.start));
        }
        if (filters.dateRange.end) {
            filtered = filtered.filter(post => new Date(post.created_at) <= new Date(filters.dateRange.end));
        }

        // Minimum comments filter
        if (filters.minComments) {
            filtered = filtered.filter(post => (post.comments_count || 0) >= parseInt(filters.minComments));
        }

        // Minimum likes filter
        if (filters.minLikes) {
            filtered = filtered.filter(post => (post.likes_count || 0) >= parseInt(filters.minLikes));
        }

        // Sort posts
        switch (filters.sort) {
            case 'popular':
                filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'most_commented':
                filtered.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
                break;
            case 'most_liked':
                filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
                break;
            case 'trending':
                filtered.sort((a, b) => {
                    const scoreA = calculateTrendingScore(a);
                    const scoreB = calculateTrendingScore(b);
                    return scoreB - scoreA;
                });
                break;
            case 'featured':
                filtered = filtered.filter(post => post.is_featured);
                break;
            case 'latest':
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        return filtered;
    }, [community, filters]);

    // Calculate trending score
    const calculateTrendingScore = (post) => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const hoursSincePost = (now - postDate) / (1000 * 60 * 60);

        const timeWeight = Math.max(0, 1 - (hoursSincePost / 168));
        const engagementScore =
            (post.views || 0) * 0.1 +
            (post.comments_count || 0) * 2 +
            (post.likes_count || 0) * 3;

        return engagementScore * timeWeight;
    };

    // Rest of your component remains the same...
    // [Keep all your existing functions and JSX as they were]

    return (
        <>
            <Head>
                <title>Community - Muslim Hall</title>
                <meta name="description" content="Join our community discussions, share your thoughts, and connect with others." />
                <meta name="keywords" content="community, discussion, forum, muslim, islamic" />
            </Head>

            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <div className="live_auction_style__one bg-body pt-40 pb-5">
                        <Header />
                        <div className="container-md">
                            <div className="row">
                                {/* Advanced Sidebar */}
                                <div className="col-lg-3 mb-4">
                                    <div className="sticky-top" style={{ top: '100px' }}>
                                        {/* Your sidebar content */}
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="col-lg-9">
                                    {/* Quick Filters Bar */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="bg-body-3 rounded-lg p-3">
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <h5 className="text-white mb-0">
                                                        <i className="fas fa-filter me-2"></i>
                                                        Filters
                                                    </h5>
                                                    <button 
                                                        onClick={clearFilters}
                                                        className="btn btn-sm btn-outline-light"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>

                                                <div className="row g-3">
                                                    {/* Search Filter */}
                                                    <div className="col-md-6">
                                                        <label className="form-label text-white mb-2">
                                                            <i className="fas fa-search me-2"></i>
                                                            Search Posts
                                                        </label>
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                className="form-control bg-dark text-white border-secondary"
                                                                placeholder="Search posts..."
                                                                value={filters.search}
                                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                            />
                                                            <span className="input-group-text bg-secondary border-secondary">
                                                                <i className="fas fa-search text-white"></i>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Sort Filter */}
                                                    <div className="col-md-6">
                                                        <label className="form-label text-white mb-2">
                                                            <i className="fas fa-sort me-2"></i>
                                                            Sort By
                                                        </label>
                                                        <select
                                                            className="form-select bg-dark text-white border-secondary"
                                                            value={filters.sort}
                                                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                                                        >
                                                            <option value="latest">Latest</option>
                                                            <option value="popular">Most Popular</option>
                                                            <option value="most_commented">Most Commented</option>
                                                            <option value="most_liked">Most Liked</option>
                                                            <option value="trending">Trending</option>
                                                            <option value="featured">Featured</option>
                                                        </select>
                                                    </div>

                                                    {/* Category Filter */}
                                                    <div className="col-md-6">
                                                        <label className="form-label text-white mb-2">
                                                            <i className="fas fa-folder me-2"></i>
                                                            Category
                                                        </label>
                                                        <select
                                                            className="form-select bg-dark text-white border-secondary"
                                                            value={filters.category}
                                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                                        >
                                                            <option value="all">All Categories</option>
                                                            {categories?.map((category, index) => (
                                                                <option key={index} value={category}>
                                                                    {category}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Tag Filter */}
                                                    <div className="col-md-6">
                                                        <label className="form-label text-white mb-2">
                                                            <i className="fas fa-tag me-2"></i>
                                                            Tag
                                                        </label>
                                                        <select
                                                            className="form-select bg-dark text-white border-secondary"
                                                            value={filters.tag}
                                                            onChange={(e) => handleFilterChange('tag', e.target.value)}
                                                        >
                                                            <option value="all">All Tags</option>
                                                            {allTags?.map((tag, index) => (
                                                                <option key={index} value={tag}>
                                                                    {tag}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Advanced Filters Toggle */}
                                                <div className="mt-3">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                                    >
                                                        <i className={`fas fa-chevron-${showAdvancedFilters ? 'up' : 'down'} me-2`}></i>
                                                        Advanced Filters
                                                    </button>
                                                </div>

                                                {/* Advanced Filters */}
                                                {showAdvancedFilters && (
                                                    <div className="row g-3 mt-3 pt-3 border-top border-secondary">
                                                        <div className="col-md-6">
                                                            <label className="form-label text-white mb-2">Date From</label>
                                                            <input
                                                                type="date"
                                                                className="form-control bg-dark text-white border-secondary"
                                                                value={filters.dateRange.start}
                                                                onChange={(e) => handleFilterChange('dateRange', {
                                                                    ...filters.dateRange,
                                                                    start: e.target.value
                                                                })}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label text-white mb-2">Date To</label>
                                                            <input
                                                                type="date"
                                                                className="form-control bg-dark text-white border-secondary"
                                                                value={filters.dateRange.end}
                                                                onChange={(e) => handleFilterChange('dateRange', {
                                                                    ...filters.dateRange,
                                                                    end: e.target.value
                                                                })}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label text-white mb-2">Min Comments</label>
                                                            <input
                                                                type="number"
                                                                className="form-control bg-dark text-white border-secondary"
                                                                placeholder="0"
                                                                value={filters.minComments}
                                                                onChange={(e) => handleFilterChange('minComments', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label text-white mb-2">Min Likes</label>
                                                            <input
                                                                type="number"
                                                                className="form-control bg-dark text-white border-secondary"
                                                                placeholder="0"
                                                                value={filters.minLikes}
                                                                onChange={(e) => handleFilterChange('minLikes', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Results Count */}
                                                <div className="mt-3 pt-3 border-top border-secondary">
                                                    <div className="text-gray-300">
                                                        Showing {filteredPosts.length} of {community?.length} posts
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rest of your JSX remains the same */}
                                    {/* [Keep your featured posts, posts grid, etc.] */}
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>

                {/* Your modals remain the same */}
            </FrontAuthenticatedLayout>
        </>
    );
}

// CommentThread component remains the same