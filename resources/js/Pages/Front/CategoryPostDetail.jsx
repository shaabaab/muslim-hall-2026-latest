import { Link, usePage, router } from "@inertiajs/react";
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { useState, useEffect } from 'react';

export default function CategoryPostDetail() {
    const { category, filters: initialFilters } = usePage().props;
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        sort: initialFilters?.sort || 'newest'
    });

    // Get posts from the category
    const posts = category?.post || [];

    // Debounced filter updates to prevent too many requests
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route('category.single', { slug: category?.slug }), filters, {
                preserveState: true,
                replace: true,
                only: ['category', 'filters']
            });
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [filters, category?.slug]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            sort: 'newest'
        };
        setFilters(clearedFilters);
        // Immediate navigation when clearing filters
        router.get(route('category.single', { slug: category?.slug }), clearedFilters, {
            preserveState: true,
            replace: true,
            only: ['category', 'filters']
        });
    };

    // Filter and sort posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = !filters.search ||
            post.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            post.content?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesSearch;
    }).sort((a, b) => {
        switch (filters.sort) {
            case 'oldest':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'title_asc':
                return (a.title || '').localeCompare(b.title || '');
            case 'title_desc':
                return (b.title || '').localeCompare(a.title || '');
            case 'newest':
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    return (
        <FrontAuthenticatedLayout>
            <div className="theme-dark-active">
                <Header />

                {/* Hero Section */}
                <section className="container-md">
                    <div className="hero-section">
                        <div className="hero-content">
                            <div className="category-badge">
                                <i className="fas fa-folder"></i>
                                {category?.name || 'Category'}
                            </div>
                            <h1 className="hero-title">{category?.name || 'Category'} Posts</h1>
                            <p className="hero-text">
                                {category?.description || `Explore our collection of ${category?.name || 'category'} posts, articles, and educational content. Discover knowledge that enlightens and inspires your spiritual journey.`}
                            </p>
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{posts.length}</div>
                                    <div className="stat-label">&nbsp; Total Posts</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {posts.filter(p => p.images && p.images.length > 0).length}
                                    </div>
                                    <div className="stat-label">&nbsp; With Images</div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-image">
                            <img
                                src={category?.img ? `${window.location.origin}/storage/${category.img}` : "https://i.postimg.cc/rmRDSs27/vecteezy-islamic-new-year-celebration-4k-resolution-ai-generated-32976145.jpg"}
                                alt={category?.name || 'Category'}
                                onError={(e) => {
                                    e.target.src = 'https://i.postimg.cc/rmRDSs27/vecteezy-islamic-new-year-celebration-4k-resolution-ai-generated-32976145.jpg';
                                }}
                            />
                        </div>
                    </div>
                </section>

                {/* Main Content Section */}
                <div className="content-section" id="posts">
                    <div className="container-md">
                        <div className="content-layout">
                            {/* Filter Sidebar */}
                            <div className="filter-sidebar">
                                <div className="filter-header">
                                    <h3 className="filter-title">
                                        <i className="fas fa-filter"></i>
                                        Filters
                                    </h3>
                                    <button
                                        onClick={clearFilters}
                                        className="clear-filters-btn"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                {/* Search Filter */}
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Search Posts
                                    </label>
                                    <div className="search-input-group">
                                        <i className="fas fa-search search-icon"></i>
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Search posts..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="filter-group">
                                    <label className="filter-label">
                                        Sort By
                                    </label>
                                    <select
                                        className="sort-select"
                                        value={filters.sort}
                                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="title_asc">Title A-Z</option>
                                        <option value="title_desc">Title Z-A</option>
                                    </select>
                                </div>

                                {/* Results Count */}
                                <div className="results-card">
                                    <div className="results-content">
                                        <h4 className="results-count">{filteredPosts.length}</h4>
                                        <p className="results-label">
                                            {filteredPosts.length === 1 ? 'Post Found' : 'Posts Found'}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="stats-group">
                                    <h4 className="stats-title">
                                        <i className="fas fa-chart-bar"></i>
                                        Quick Stats
                                    </h4>
                                    <div className="stats-list">
                                        <div className="stat-item">
                                            <span className="stat-label">Total Posts:</span>
                                            <span className="stat-value">{posts.length}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">With Images:</span>
                                            <span className="stat-value">
                                                {posts.filter(p => p.images && p.images.length > 0).length}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Category:</span>
                                            <span className="stat-value">{category?.name}</span>
                                        </div>
                                    </div>
                                    <div className="stats-note">
                                        <i className="fas fa-info-circle"></i>
                                        Real-time filtered results
                                    </div>
                                </div>

                                {/* Category Info */}
                                <div className="category-info">
                                    <h4 className="category-info-title">
                                        <i className="fas fa-info-circle"></i>
                                        About This Category
                                    </h4>
                                    <p className="category-description">
                                        {category?.description || `Explore all posts in the ${category?.name} category.`}
                                    </p>
                                    <div className="category-meta">
                                        <div className="meta-item">
                                            <i className="fas fa-calendar"></i>
                                            Created: {category?.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Posts Grid */}
                            <div className="posts-grid-section">
                                <div className="section-header">
                                    <h2 className="section-title">
                                        {category?.name} Posts
                                        {filters.search && (
                                            <span className="search-term">
                                                for "{filters.search}"
                                            </span>
                                        )}
                                    </h2>
                                    <div className="posts-count">
                                        Showing {filteredPosts.length} of {posts.length} posts
                                    </div>
                                </div>

                                <div className="posts-grid">
                                    {filteredPosts.length > 0 ? (
                                        filteredPosts.map((post) => (
                                            <div key={post.id} className="post-card">
                                                <div className="post-image">
<Link href={`/post-detail/${post.slug}`}>
                        <img
                            alt={post.title}
                            src={
                                post.images && 
                                post.images.length > 0 && 
                                post.images[0]?.image
                                    ? `${window.location.origin}/storage/${post.images[0].image}`
                                    : 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'
                            }
                            onError={(e) => {
                                e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
                            }}
                        />
                        <div className="post-overlay">
                            <span className="read-more">Read More</span>
                        </div>
                    </Link>
</div>
                                                <div className="post-content">
                                                    <h3 className="post-title">
                                                        <Link href={`/post-detail/${post.slug}`}>{post.title}</Link>
                                                    </h3>
                                                    <p className="post-excerpt">
                                                        {post.content?.replace(/<[^>]+>/g, '').slice(0, 120)}...
                                                    </p>
                                                    <div className="post-meta">
                                                        <span className="meta-item">
                                                            <i className="fas fa-images"></i>
                                                            {post.images?.length || 0} images
                                                        </span>
                                                        <span className="meta-item">
                                                            <i className="fas fa-calendar"></i>
                                                            {new Date(post.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="meta-item">
                                                            <i className="fas fa-eye"></i>
                                                            {post.viewer_count || 0} views
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-posts">
                                            <div className="no-posts-icon">
                                                <i className="fas fa-search"></i>
                                            </div>
                                            <h3 className="no-posts-title">No Posts Found</h3>
                                            <p className="no-posts-text">
                                                {filters.search
                                                    ? `We couldn't find any posts matching "${filters.search}" in ${category?.name} category.`
                                                    : `There are no posts available in the ${category?.name} category yet.`
                                                }
                                            </p>
                                            {filters.search && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="no-posts-btn"
                                                >
                                                    Clear Search
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Back to Categories */}
                                {filteredPosts.length > 0 && (
                                    <div className="back-to-categories">
                                        <Link href="/category" className="back-link">
                                            <i className="fas fa-arrow-left"></i>
                                            Back to All Categories
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>

            <style jsx>{`
                /* Hero Section Styles */
                .hero-section {
                    border-radius: 20px;
                    padding: 4rem 2rem;
                    max-width: 100%;
                    color: white;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    background: linear-gradient(135deg, rgba(20, 108, 32, 0.9) 0%, rgba(46, 139, 87, 0.9) 100%),
                        url('https://i.postimg.cc/wx0LVLsG/footer-decor-full.png');
                    background-size: cover;
                    background-position: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .hero-content {
                    flex: 1;
                    padding-right: 2rem;
                }

                .category-badge {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    backdrop-filter: blur(10px);
                }

                .hero-title {
                    font-size: 42px;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    line-height: 1.2;
                }

                .hero-text {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 2rem;
                    opacity: 0.95;
                    max-width: 600px;
                }

                .hero-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat-item {
                    text-align: center;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 0.5rem;
                }

                .stat-label {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                }

                .hero-image {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .hero-image img {
                    max-width: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                    // border: 1px solid gold;
                    // box-shadow: 0px 0px 8px black;
                }

                /* Main Content Section */
                .content-section {
                    padding: 80px 0;
                    background-color: #f9f9f9;
                }

                .content-layout {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 40px;
                    max-width: 100%;
                    margin: 0 auto;
                }

                /* Filter Sidebar */
                .filter-sidebar {
                    background: #338447 !important;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                    height: fit-content;
                    position: sticky;
                    top: 100px;
                }

                .filter-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                }

                .filter-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .clear-filters-btn {
                    background: transparent;
                    border: 2px solid #ff6b6b;
                    color: #ff6b6b;
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .clear-filters-btn:hover {
                    background: #ff6b6b;
                    color: white;
                }

                .filter-group {
                    margin-bottom: 25px;
                }

                .filter-label {
                    display: block;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 10px;
                    font-size: 14px;
                }

                .search-input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-icon {
                    position: absolute;
                    left: 15px;
                    color: #666;
                    z-index: 1;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 15px 12px 45px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: white;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                .sort-select {
                    width: 100%;
                    padding: 12px 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .sort-select:focus {
                    outline: none;
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                .results-card {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin: 25px 0;
                }

                .results-content {
                    color: white;
                }

                .results-count {
                    font-size: 36px;
                    font-weight: 700;
                    margin: 0 0 5px 0;
                    line-height: 1;
                }

                .results-label {
                    font-size: 14px;
                    opacity: 0.9;
                    margin: 0;
                }

                .stats-group {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid rgba(255, 255, 255, 0.2);
                }

                .stats-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .stats-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 15px;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                }

                .stat-label {
                    color: #ffffff;
                }

                .stat-value {
                    color: #ffffff;
                    font-weight: 600;
                }

                .stats-note {
                    font-size: 12px;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    opacity: 0.8;
                }

                .category-info {
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 2px solid rgba(255, 255, 255, 0.2);
                }

                .category-info-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .category-description {
                    color: #ffffff;
                    font-size: 13px;
                    line-height: 1.5;
                    margin-bottom: 15px;
                    opacity: 0.9;
                }

                .category-meta {
                    font-size: 12px;
                    color: #ffffff;
                    opacity: 0.8;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                /* Posts Grid Section */
                .posts-grid-section {
                    border-radius: 15px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .section-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .search-term {
                    font-size: 18px;
                    color: #666;
                    font-weight: 500;
                }

                .posts-count {
                    color: #666;
                    font-size: 14px;
                    font-weight: 500;
                }

                .posts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 25px;
                    margin-bottom: 30px;
                }

                .post-card {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    border: 1px solid #f0f0f0;
                }

                .post-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }

                .post-image {
                    height: 200px;
                    overflow: hidden;
                    position: relative;
                }

                .post-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .post-card:hover .post-image img {
                    transform: scale(1.05);
                }

                .post-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(27, 122, 58, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .post-card:hover .post-overlay {
                    opacity: 1;
                }

                .read-more {
                    color: white;
                    font-weight: 600;
                    font-size: 16px;
                }

                .post-content {
                    padding: 20px;
                }

                .post-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .post-title a {
                    color: #333;
                    text-decoration: none;
                }

                .post-title a:hover {
                    color: #1b7a3a;
                }

                .post-excerpt {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }

                .post-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 12px;
                    flex-wrap: wrap;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: #888;
                }

                .meta-item i {
                    font-size: 11px;
                }

                /* Back to Categories */
                .back-to-categories {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #e0e0e0;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #1b7a3a;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 10px 20px;
                    border: 2px solid #1b7a3a;
                    border-radius: 25px;
                    transition: all 0.3s ease;
                }

                .back-link:hover {
                    background: #1b7a3a;
                    color: white;
                    text-decoration: none;
                }

                /* No Posts State */
                .no-posts {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                }

                .no-posts-icon {
                    font-size: 64px;
                    color: #ddd;
                    margin-bottom: 20px;
                }

                .no-posts-title {
                    font-size: 24px;
                    color: #666;
                    margin-bottom: 10px;
                }

                .no-posts-text {
                    color: #888;
                    margin-bottom: 25px;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                    line-height: 1.6;
                }

                .no-posts-btn {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .no-posts-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .content-layout {
                        grid-template-columns: 1fr;
                        gap: 30px;
                    }

                    .filter-sidebar {
                        position: static;
                    }

                    .hero-section {
                        flex-direction: column;
                        text-align: center;
                        padding: 3rem 1.5rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        margin-bottom: 2rem;
                    }

                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .hero-stats {
                        justify-content: center;
                    }
                }

                @media (max-width: 768px) {
                    .section-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .posts-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-title {
                        font-size: 2rem;
                    }

                    .hero-text {
                        font-size: 1rem;
                    }

                    .content-section {
                        padding: 40px 0;
                    }

                    .filter-sidebar,
                    .posts-grid-section {
                        padding: 20px;
                    }

                    .hero-stats {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .post-meta {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .section-title {
                        font-size: 24px;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 5px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}