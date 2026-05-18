import { Link, usePage } from "@inertiajs/react";
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { useState, useMemo } from 'react';
import { getS3PublicUrl } from "@/Utils/s3Helpers";



export default function IslamicZoneDetail() {
    const { islamic } = usePage().props;
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'newest',
        category: 'all'
    });

    // Filter and sort logic
    const filteredIslamic = useMemo(() => {
        let result = [...islamic];

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort filter
        switch (filters.sortBy) {
            case 'newest':
                result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                result = result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title_asc':
                result = result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title_desc':
                result = result.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }

        return result;
    }, [islamic, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            sortBy: 'newest',
            category: 'all'
        });
    };

    return (
        <FrontAuthenticatedLayout>
            <div className="theme-dark-active">
                <Header />

                {/* Hero Section */}
                {/* <section className="container-md">
                    <div className="hero-section">
                        <div className="hero-content">
                            <h1 className="hero-title">Islamic Zone & Resources</h1>
                            <p className="hero-text">
                                Explore our comprehensive collection of Islamic knowledge, spiritual guidance, 
                                and educational resources. Deepen your understanding of Islam through authentic 
                                content and scholarly works.
                            </p>
                            <div className="hero-actions">
                                <a className="btn-more-info" href="#resources">Explore Resources</a>
                                <a className="btn-more-info varient-2" href="/community">Join Study Group</a>
                            </div>
                        </div>
                        <div className="hero-image">
                            <img
                                src="https://i.postimg.cc/rmRDSs27/vecteezy-islamic-new-year-celebration-4k-resolution-ai-generated-32976145.jpg"
                                alt="Islamic Resources"
                            />
                        </div>
                    </div>
                </section> */}

                {/* Main Content Section */}
                <div className="content-section" id="resources">
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
                                        Search Resources
                                    </label>
                                    <div className="search-input-group">
                                        <i className="fas fa-search search-icon"></i>
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Search resources..."
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
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
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
                                        <h4 className="results-count">{filteredIslamic.length}</h4>
                                        <p className="results-label">
                                            {filteredIslamic.length === 1 ? 'Content Found' : 'Content Found'}
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
                                            <span className="stat-label">Total Resources:</span>
                                            <span className="stat-value">{islamic.length}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Showing:</span>
                                            <span className="stat-value">First {filteredIslamic.length}</span>
                                        </div>
                                    </div>
                                    <div className="stats-note">
                                        <i className="fas fa-info-circle"></i>
                                        Client-side filtered results
                                    </div>
                                </div>
                            </div>

                            {/* Islamic Resources Grid */}
                            <div className="posts-grid-section">
                                <div className="section-header">
                                    <h2 className="section-title">Islamic Quran</h2>
                                    <div className="posts-count">
                                        Showing {filteredIslamic.length} of {islamic.length} resources
                                    </div>
                                </div>

                                <div className="posts-grid">
                                        {filteredIslamic && filteredIslamic.length > 0 ? (
                                            filteredIslamic.map((p) => {
                                                const firstImage = p.image ? getS3PublicUrl(p.image) : null;

                                                return (
                                                    <div key={p.id} className="post-card">
                                                        <div className="post-image">
                                                            <Link href={`/islamic-detail/${p.id}`}>
                                                                <img
                                                                    alt={p.title}
                                                                    src={
                                                                        firstImage
                                                                            ? firstImage
                                                                            : "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png"
                                                                    }
                                                                    onError={(e) => {
                                                                        e.target.src =
                                                                            "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                                    }}
                                                                />
                                                                <div className="post-overlay">
                                                                    <span className="read-more">View Details</span>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        <div className="post-content">
                                                            <h3 className="post-title">
                                                                <Link href={`/islamic-detail/${p.id}`}>{p.title}</Link>
                                                            </h3>
                                                            <p className="post-excerpt">
                                                                {p.description?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                                                            </p>
                                                            <div className="post-meta">
                                                                <span className="meta-item">
                                                                    <i className="fas fa-book"></i>
                                                                    {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                                                                </span>
                                                                <span className="meta-item">
                                                                    <i className="fas fa-calendar"></i>
                                                                    {new Date(p.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            // empty state
                                            <div className="empty-state">
                                                <img src="https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png" alt="No Results" />
                                                <p>No Islamic Quren resources found.</p>
                                            </div>
                                        )}
                                </div>
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
                    // margin: 2rem auto;
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

                .hero-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn-more-info {
                    background-color: white;
                    color: #1b7a3a;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 50px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-block;
                    text-decoration: none;
                }

                .btn-more-info:hover {
                    background-color: #f0f0f0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    text-decoration: none;
                    color: #1b7a3a;
                }

                .btn-more-info.varient-2 {
                    background-color: transparent;
                    color: white;
                    border: 2px solid white;
                }

                .btn-more-info.varient-2:hover {
                    background-color: white;
                    color: #1b7a3a;
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
                    border: 1px solid gold;
                    box-shadow: 0px 0px 8px black;
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
                    // max-width: 1200px;
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
                    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
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

                .filter-title i {
                    color: #ffffff;
                }

                .clear-filters-btn {
                    background: transparent;
                    border: 2px solid #dc3545;
                    color: #dc3545;
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .clear-filters-btn:hover {
                    background: #dc3545;
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
                    border-top: 2px solid rgba(255, 255, 255, 0.3);
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
                    border-bottom: 2px solid #f0f0f0;
                }

                .section-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin: 0;
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
                    object-fit: contain;
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

                /* No Posts State */
                .no-posts {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
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
                }

                @media (max-width: 480px) {
                    .hero-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .btn-more-info {
                        width: 100%;
                        text-align: center;
                    }

                    .posts-grid {
                        gap: 20px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}