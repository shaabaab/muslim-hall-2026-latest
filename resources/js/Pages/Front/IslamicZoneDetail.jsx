import { Link, usePage } from "@inertiajs/react";
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { useState, useMemo, useEffect } from 'react';
import { getS3PublicUrl } from "@/Utils/s3Helpers";


export default function IslamicZoneDetail() {
    const { islamic } = usePage().props;
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        sort: 'newest',
        type: 'all'
    });

    // Extract unique types for the filter dropdown
    const uniqueTypes = useMemo(() => {
        return [...new Set(islamic.map(item => item.type))];
    }, [islamic]);

    // Filter and sort logic (Client Side)
    const filteredIslamic = useMemo(() => {
        let result = [...islamic];

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(item => 
                item.title?.toLowerCase().includes(searchTerm) ||
                item.description?.toLowerCase().includes(searchTerm)
            );
        }

        // Type Filter
        if (filters.type !== 'all') {
            result = result.filter(item => item.type === filters.type);
        }

        // Sort filter
        switch (filters.sort) {
            case 'newest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title_asc':
                result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'title_desc':
                result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
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
            sort: 'newest',
            type: 'all'
        });
        setShowMobileFilter(false);
    };

    // Calculate Stats
    const typeStats = useMemo(() => {
        const stats = {};
        islamic.forEach(item => {
            const typeName = item.type || 'Other';
            stats[typeName] = (stats[typeName] || 0) + 1;
        });
        return stats;
    }, [islamic]);

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />

                {/* Main Content */}
                <div className="content-section" id="resources">
                    <div className="container">
                        
                        {/* Mobile Filter Toggle */}
                        <div className="mobile-actions">
                            <button
                                className="btn-mobile-filter"
                                onClick={() => setShowMobileFilter(true)}
                            >
                                <i className="fas fa-sliders-h"></i> Filters
                            </button>
                        </div>

                        {/* Mobile Sidebar Overlay */}
                        {showMobileFilter && (
                            <div
                                className="sidebar-backdrop"
                                onClick={() => setShowMobileFilter(false)}
                            ></div>
                        )}

                        <div className="content-grid">
                            {/* Filter Sidebar */}
                            <aside className={`sidebar ${showMobileFilter ? "open" : ""}`}>
                                <div className="sidebar-inner">
                                    <div className="sidebar-header">
                                        <h3>Filters</h3>
                                        <div className="sidebar-header-actions">
                                            <button onClick={clearFilters} className="btn-text">
                                                Reset
                                            </button>
                                            <button
                                                className="btn-icon mobile-only"
                                                onClick={() => setShowMobileFilter(false)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="filter-block">
                                        <div className="search-box">
                                            <i className="fas fa-search"></i>
                                            <input
                                                type="text"
                                                placeholder="Search Islamic content..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Resource Types */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">Resource Type</h4>
                                        <div className="category-nav">
                                            <button
                                                className={`nav-items ${filters.type === "all" ? "active" : ""}`}
                                                onClick={() => handleFilterChange("type", "all")}
                                            >
                                                <span>All Resources</span>
                                                <span className="badge">{islamic.length}</span>
                                            </button>
                                            
                                            {uniqueTypes.map((type) => (
                                                <button
                                                    key={type}
                                                    className={`nav-items ${filters.type === type ? "active" : ""}`}
                                                    onClick={() => handleFilterChange("type", type)}
                                                >
                                                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                    <span className="badge">{typeStats[type] || 0}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sort */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">Sort By</h4>
                                        <select
                                            className="form-select"
                                            value={filters.sort}
                                            onChange={(e) => handleFilterChange("sort", e.target.value)}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="title_asc">Title (A-Z)</option>
                                            <option value="title_desc">Title (Z-A)</option>
                                        </select>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">Quick Stats</h4>
                                        <div className="stats-card">
                                            <div className="stat-item">
                                                <span className="stat-label">Total Resources:</span>
                                                <span className="stat-value">{islamic.length}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Showing:</span>
                                                <span className="stat-value">{filteredIslamic.length}</span>
                                            </div>
                                            <div className="stat-note">
                                                <i className="fas fa-info-circle"></i>
                                                Filtered results
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Feed */}
                            <main className="feed">
                                <div className="feed-header">
                                    <h2>
                                        {filters.type === 'all' 
                                            ? 'All Islamic Resources' 
                                            : `${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)} Content`
                                        }
                                    </h2>
                                    <span className="result-count">
                                        {filteredIslamic.length} results found
                                    </span>
                                </div>

                                {/* Active Filters */}
                                <div className="active-filters">
                                    {filters.search && (
                                        <span className="filter-chip">
                                            Search: "{filters.search}"
                                            <button onClick={() => handleFilterChange("search", "")}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    )}
                                    {filters.type !== 'all' && (
                                        <span className="filter-chip">
                                            Type: {filters.type}
                                            <button onClick={() => handleFilterChange("type", "all")}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    )}
                                </div>

                                {/* Type Quick Tabs */}
                                <div className="category-quick-tabs">
                                    <button
                                        className={`quick-tab ${filters.type === 'all' ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('type', 'all')}
                                    >
                                        All
                                    </button>
                                    {uniqueTypes.slice(0, 6).map((type) => (
                                        <button
                                            key={type}
                                            className={`quick-tab ${filters.type === type ? 'active' : ''}`}
                                            onClick={() => handleFilterChange('type', type)}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {/* Resources Grid */}
                                <div className="grid-container">
                                    {filteredIslamic && filteredIslamic.length > 0 ? (
                                        filteredIslamic.map((p) => (
                                            <div key={p.id} className="post-card">
                                                <Link href={`/islamic-detail/${p.id}`} className="card-img-link">
                                                    <div className="card-img-wrapper">
                                                        <img
                                                            src={getS3PublicUrl(p.image)}
                                                            alt={p.title}
                                                            onError={(e) => {
                                                                e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
                                                            }}
                                                        />
                                                        <span className="category-tag">
                                                            {p.type?.toUpperCase() || 'RESOURCE'}
                                                        </span>
                                                    </div>
                                                </Link>
                                                
                                                <div className="card-body">
                                                    <div className="card-date">
                                                        <i className="far fa-clock"></i> {new Date(p.created_at).toLocaleDateString()}
                                                    </div>
                                                    
                                                    <h3 className="card-title">
                                                        <Link href={`/islamic-detail/${p.id}`}>{p.title}</Link>
                                                    </h3>
                                                    
                                                    <p className="card-text">
                                                        {p.description?.replace(/<[^>]+>/g, '').slice(0, 120)}...
                                                    </p>
                                                    
                                                    <div className="card-footer">
                                                        <div className="meta">
                                                            <i className="fas fa-book"></i> {p.type}
                                                        </div>
                                                        <Link 
                                                            href={`/islamic-detail/${p.id}`}
                                                            className="btn-view"
                                                        >
                                                            <i className="fas fa-eye"></i> View
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            <div className="icon">
                                                <i className="fas fa-search"></i>
                                            </div>
                                            <h3>No Islamic resources found</h3>
                                            <p>Try adjusting your filters or search terms.</p>
                                            <button onClick={clearFilters} className="btn btn-secondary">
                                                Clear Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </main>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>

            <style jsx>{`
                /* --- Global Reset & Vars --- */
                .page-wrapper {
                    background-color: #f4f6f8;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }

                /* --- Layout CSS --- */
                .content-section { padding: 40px 0; }
                .container-md { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    padding: 0 20px; 
                }
                
                .content-grid {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 30px;
                    align-items: start;
                }

                /* --- Sidebar Design (Clean White) --- */
                .sidebar {
                    position: sticky;
                    top: 90px;
                }
                
                .sidebar-inner {
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }
                
                .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .sidebar-header h3 { 
                    margin: 0; 
                    font-size: 16px; 
                    font-weight: 700; 
                    color: #111; 
                }
                
                .btn-text {
                    background: none; 
                    border: none;
                    color: #666; 
                    font-size: 13px;
                    cursor: pointer; 
                    text-decoration: underline;
                    padding: 4px 8px;
                }
                
                .btn-text:hover {
                    color: #1b7a3a;
                }
                
                .btn-icon {
                    background: #f3f4f6;
                    border: none;
                    border-radius: 6px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #666;
                }
                
                .btn-icon:hover {
                    background: #e5e7eb;
                }

                .filter-block { 
                    margin-bottom: 24px; 
                }
                
                .filter-block:last-child { 
                    margin-bottom: 0; 
                }
                
                .search-box {
                    position: relative;
                }
                
                .search-box i {
                    position: absolute; 
                    left: 12px; 
                    top: 50%;
                    transform: translateY(-50%); 
                    color: #9ca3af;
                    font-size: 14px;
                }
                
                .search-box input {
                    width: 100%; 
                    padding: 10px 10px 10px 36px;
                    border: 1px solid #e5e7eb; 
                    border-radius: 8px;
                    font-size: 14px; 
                    background: #f9fafb;
                    transition: all 0.2s;
                }
                
                .search-box input:focus {
                    background: #fff; 
                    outline: none; 
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                .filter-title {
                    font-size: 12px; 
                    text-transform: uppercase;
                    color: #6b7280; 
                    font-weight: 600;
                    margin-bottom: 12px; 
                    letter-spacing: 0.5px;
                }

                .category-nav { 
                    display: flex; 
                    flex-direction: column; 
                    gap: 2px; 
                }
                
                .nav-items {
                    display: flex; 
                    justify-content: space-between;
                    align-items: center; 
                    padding: 8px 12px;
                    background: transparent; 
                    border: none;
                    border-radius: 6px; 
                    cursor: pointer;
                    color: #4b5563; 
                    font-size: 14px;
                    text-align: left; 
                    width: 100%;
                    transition: all 0.2s;
                }
                
                .nav-items:hover { 
                    background: #f3f4f6; 
                    color: #111; 
                }
                
                .nav-items.active { 
                    background: #f0fdf4; 
                    color: #166534; 
                    font-weight: 600; 
                }
                
                .badge {
                    font-size: 11px; 
                    background: #f3f4f6;
                    padding: 2px 8px; 
                    border-radius: 10px; 
                    color: #6b7280;
                }
                
                .nav-items.active .badge { 
                    background: #dcfce7; 
                    color: #166534; 
                }

                .form-select {
                    width: 100%; 
                    padding: 10px;
                    border: 1px solid #e5e7eb; 
                    border-radius: 8px;
                    color: #374151; 
                    font-size: 14px;
                    background: #fff; 
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                
                .form-select:focus {
                    outline: none;
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                /* Stats Card */
                .stats-card {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                }
                
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                
                .stat-item:last-child {
                    margin-bottom: 0;
                }
                
                .stat-label {
                    color: #6b7280;
                }
                
                .stat-value {
                    color: #111;
                    font-weight: 600;
                }
                
                .stat-note {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 12px;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* --- Feed & Cards --- */
                .feed-header {
                    display: flex; 
                    justify-content: space-between;
                    align-items: baseline; 
                    margin-bottom: 20px;
                }
                
                .feed-header h2 { 
                    margin: 0; 
                    font-size: 24px; 
                    color: #111; 
                    font-weight: 700;
                }
                
                .result-count { 
                    color: #6b7280; 
                    font-size: 14px; 
                }

                .active-filters { 
                    margin-bottom: 20px; 
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .filter-chip {
                    display: inline-flex; 
                    align-items: center; 
                    gap: 8px;
                    background: #e0f2f1; 
                    color: #00695c;
                    padding: 6px 12px; 
                    border-radius: 20px; 
                    font-size: 13px; 
                    font-weight: 500;
                }
                
                .filter-chip button { 
                    background: none; 
                    border: none; 
                    color: inherit; 
                    cursor: pointer; 
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                
                .filter-chip button:hover {
                    background: rgba(0,0,0,0.1);
                }

                /* Quick Tabs */
                .category-quick-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .quick-tab {
                    padding: 6px 16px;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 20px;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .quick-tab:hover {
                    border-color: #1b7a3a;
                    color: #1b7a3a;
                }
                
                .quick-tab.active {
                    background: #1b7a3a;
                    border-color: #1b7a3a;
                    color: white;
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }

                .post-card {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex; 
                    flex-direction: column;
                    height: 100%;
                }
                
                .post-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    border-color: #d1fae5;
                }

                .card-img-wrapper {
                    height: 180px; 
                    position: relative; 
                    overflow: hidden;
                }
                
                .card-img-wrapper img {
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain;
                    transition: transform 0.3s;
                }
                
                .post-card:hover .card-img-wrapper img { 
                    transform: scale(1.05); 
                }
                
                .category-tag {
                    position: absolute; 
                    top: 12px; 
                    left: 12px;
                    background: rgba(255,255,255,0.95);
                    padding: 4px 10px; 
                    border-radius: 4px;
                    font-size: 11px; 
                    font-weight: 700; 
                    color: #166534;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 1;
                }

                .card-body { 
                    padding: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    flex: 1; 
                }
                
                .card-date {
                    font-size: 12px; 
                    color: #9ca3af; 
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .card-title {
                    font-size: 16px; 
                    font-weight: 700; 
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                }
                
                .card-title a { 
                    color: #111; 
                    text-decoration: none; 
                }
                
                .card-title a:hover { 
                    color: #166534; 
                }
                
                .card-text {
                    font-size: 14px; 
                    color: #4b5563; 
                    line-height: 1.5;
                    margin-bottom: 16px; 
                    flex: 1;
                }

                .card-footer {
                    padding-top: 12px; 
                    border-top: 1px solid #f3f4f6;
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                
                .meta { 
                    font-size: 12px; 
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .btn-view {
                    background: none; 
                    border: none;
                    color: #1b7a3a; 
                    font-size: 13px; 
                    cursor: pointer;
                    display: flex; 
                    align-items: center; 
                    gap: 4px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                
                .btn-view:hover { 
                    color: #14532d; 
                }

                /* No Results */
                .no-results {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                }
                
                .no-results .icon {
                    font-size: 48px;
                    color: #d1d5db;
                    margin-bottom: 16px;
                }
                
                .no-results h3 {
                    font-size: 20px;
                    color: #111;
                    margin: 0 0 8px 0;
                    font-weight: 600;
                }
                
                .no-results p {
                    color: #6b7280;
                    margin: 0 0 20px 0;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .btn {
                    padding: 8px 20px;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                
                .btn-secondary {
                    background: #fff;
                    border-color: #e5e7eb;
                    color: #374151;
                }
                
                .btn-secondary:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                /* --- Mobile Responsive --- */
                .mobile-actions { 
                    display: none; 
                    margin-bottom: 20px; 
                }
                
                .sidebar-backdrop { 
                    display: none; 
                }
                
                .mobile-only { 
                    display: none; 
                }
                
                @media (max-width: 992px) {
                    .content-grid { 
                        grid-template-columns: 1fr; 
                    }
                    
                    .mobile-actions { 
                        display: block; 
                    }
                    
                    .btn-mobile-filter {
                        width: 100%; 
                        padding: 12px;
                        background: #fff; 
                        border: 1px solid #d1d5db;
                        border-radius: 8px; 
                        font-weight: 600;
                        display: flex; 
                        justify-content: center; 
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .btn-mobile-filter:hover {
                        background: #f9fafb;
                    }

                    .sidebar {
                        position: fixed; 
                        top: 0; 
                        left: -100%;
                        width: 300px; 
                        height: 100vh;
                        z-index: 1050; 
                        transition: left 0.3s;
                        border-right: 1px solid #e5e7eb;
                        background: #fff;
                    }
                    
                    .sidebar.open { 
                        left: 0; 
                    }
                    
                    .sidebar-inner { 
                        height: 100%; 
                        border-radius: 0; 
                        border: none;
                        overflow-y: auto;
                    }
                    
                    .sidebar-backdrop {
                        display: block; 
                        position: fixed; 
                        inset: 0;
                        background: rgba(0,0,0,0.5); 
                        z-index: 1040;
                    }
                    
                    .mobile-only { 
                        display: block; 
                    }
                    
                    .feed-header {
                        flex-direction: column;
                        gap: 8px;
                        align-items: flex-start;
                    }
                    
                    .category-quick-tabs {
                        overflow-x: auto;
                        padding-bottom: 12px;
                    }
                }
                
                @media (max-width: 768px) {
                    .grid-container {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 20px;
                    }
                    
                    .content-section {
                        padding: 30px 0;
                    }
                    
                    .container-md {
                        padding: 0 16px;
                    }
                }
                
                @media (max-width: 480px) {
                    .grid-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .sidebar {
                        width: 85%;
                    }
                    
                    .category-quick-tabs {
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}