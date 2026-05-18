import { Link, usePage, Head } from "@inertiajs/react";
import { useState, useEffect } from 'react';
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';

export default function Search() {
    const { q, results, auth } = usePage().props;
    const [searchQuery, setSearchQuery] = useState(q || '');
    const [activeTab, setActiveTab] = useState('all');

    // Filter results by type
    const filteredResults = {
        all: results || [],
        posts: results?.filter(item => item.type === 'post') || [],
        books: results?.filter(item => item.type === 'book') || [],
        islamic: results?.filter(item => item.type === 'islamic') || [],
        exhibitions: results?.filter(item => item.type === 'exhibition') || [],
    };

    const currentResults = filteredResults[activeTab];
    const totalResults = Object.values(filteredResults).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <FrontAuthenticatedLayout>
            <Head>
                <title>Search Results - Muslim Hall</title>
                <meta name="description" content={`Search results for "${q}" - Find Islamic posts, books, and resources`} />
            </Head>

            <Header />
            
            {/* Hero Section */}
            <section className="container-md">
                <div className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">Search Results</h1>
                        <p className="hero-text">
                            {q ? `Showing results for "${q}"` : 'Search our Islamic knowledge base'}
                        </p>
                        <div className="search-box-hero">
                            <form action="/search" method="GET" className="search-form-hero">
                                <div className="search-input-wrapper-hero">
                                    <input
                                        type="text"
                                        name="q"
                                        placeholder="Search posts, books, Islamic content..."
                                        className="search-input-hero"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit" className="search-submit-hero">
                                        <i className="fas fa-search"></i>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="hero-image">
                        <img
                            src="https://i.postimg.cc/FzWrL91K/download-3.png"
                            alt="Search Islamic Knowledge"
                        />
                    </div>
                </div>
            </section>

            {/* Search Results Section */}
            <div className="content-section">
                <div className="container-md">
                    {/* Results Header */}
                    <div className="results-header">
                        <div className="results-info">
                            <h2 className="results-title">
                                {totalResults} {totalResults === 1 ? 'Result' : 'Results'} Found
                                {q && <span className="search-query"> for "{q}"</span>}
                            </h2>
                            {totalResults === 0 && (
                                <p className="no-results-suggestions">
                                    Try different keywords or browse our categories
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Results Tabs */}
                    {totalResults > 0 && (
                        <div className="results-tabs">
                            <div className="tabs-navigation">
                                <button 
                                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                                >
                                    <i className="fas fa-th"></i>
                                    All ({filteredResults.all.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('posts')}
                                >
                                    <i className="fas fa-newspaper"></i>
                                    Posts ({filteredResults.posts.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('books')}
                                >
                                    <i className="fas fa-book"></i>
                                    Books ({filteredResults.books.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'islamic' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('islamic')}
                                >
                                    <i className="fas fa-mosque"></i>
                                    Islamic ({filteredResults.islamic.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'exhibitions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('exhibitions')}
                                >
                                    <i className="fas fa-palette"></i>
                                    Exhibitions ({filteredResults.exhibitions.length})
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Results Grid */}
                    <div className="search-results">
                        {currentResults.length > 0 ? (
                            <div className="results-grid">
                                {currentResults.map((item, index) => (
                                    <SearchResultCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : totalResults > 0 ? (
                            <div className="no-results-tab">
                                <i className="fas fa-search"></i>
                                <h3>No {activeTab} found</h3>
                                <p>Try switching to another tab or modify your search</p>
                            </div>
                        ) : (
                            <div className="no-results">
                                <div className="no-results-content">
                                    <i className="fas fa-search fa-4x"></i>
                                    <h3>No results found</h3>
                                    <p>We couldn't find any matches for your search. Try different keywords or browse our categories.</p>
                                    <div className="suggestions">
                                        <h4>Try searching for:</h4>
                                        <div className="suggestion-tags">
                                            <Link href="/search?q=Quran" className="suggestion-tag">Quran</Link>
                                            <Link href="/search?q=Hadith" className="suggestion-tag">Hadith</Link>
                                            <Link href="/search?q=Islamic+books" className="suggestion-tag">Islamic Books</Link>
                                            <Link href="/search?q=Prophet" className="suggestion-tag">Prophet</Link>
                                            <Link href="/search?q=Prayer" className="suggestion-tag">Prayer</Link>
                                        </div>
                                    </div>
                                    <div className="browse-categories">
                                        <Link href="/category" className="browse-btn">
                                            <i className="fas fa-folder"></i>
                                            Browse Categories
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
                /* Hero Section */
                .hero-section {
                    border-radius: 20px;
                    padding: 4rem 2rem;
                    margin: 2rem auto;
                    max-width: 1200px;
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
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }

                .hero-text {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 2rem;
                    opacity: 0.95;
                }

                .search-box-hero {
                    max-width: 500px;
                }

                .search-form-hero {
                    width: 100%;
                }

                .search-input-wrapper-hero {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: white;
                    border-radius: 50px;
                    padding: 5px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                .search-input-hero {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 15px 20px;
                    font-size: 16px;
                    outline: none;
                    color: #333;
                }

                .search-input-hero::placeholder {
                    color: #999;
                }

                .search-submit-hero {
                    background: #1b7a3a;
                    border: none;
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 18px;
                }

                .search-submit-hero:hover {
                    background: #2e8b57;
                    transform: scale(1.05);
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

                /* Results Section */
                .content-section {
                    padding: 80px 0;
                    background-color: #f9f9f9;
                }

                .results-header {
                    margin-bottom: 2rem;
                }

                .results-info {
                    text-align: center;
                }

                .results-title {
                    font-size: 2rem;
                    color: #1b7a3a;
                    margin-bottom: 1rem;
                }

                .search-query {
                    color: #666;
                    font-weight: normal;
                }

                .no-results-suggestions {
                    color: #666;
                    font-size: 1.1rem;
                }

                /* Results Tabs */
                .results-tabs {
                    margin-bottom: 2rem;
                }

                .tabs-navigation {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .tab-btn {
                    background: white;
                    border: 2px solid #e0e0e0;
                    padding: 12px 20px;
                    border-radius: 25px;
                    color: #666;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tab-btn.active {
                    background: #1b7a3a;
                    border-color: #1b7a3a;
                    color: white;
                }

                .tab-btn:hover:not(.active) {
                    border-color: #1b7a3a;
                    color: #1b7a3a;
                }

                /* Results Grid */
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 2rem;
                }

                /* Search Result Card */
                .search-result-card {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    border: 1px solid #f0f0f0;
                }

                .search-result-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }

                .result-image {
                    height: 200px;
                    overflow: hidden;
                    position: relative;
                }

                .result-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .search-result-card:hover .result-image img {
                    transform: scale(1.05);
                }

                .result-type {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: rgba(27, 122, 58, 0.9);
                    color: white;
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .result-content {
                    padding: 1.5rem;
                }

                .result-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                }

                .result-title a {
                    color: #333;
                    text-decoration: none;
                }

                .result-title a:hover {
                    color: #1b7a3a;
                }

                .result-excerpt {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .result-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.85rem;
                    color: #888;
                }

                .result-date {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .read-more-btn {
                    background: #1b7a3a;
                    color: white;
                    text-decoration: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .read-more-btn:hover {
                    background: #2e8b57;
                    color: white;
                    text-decoration: none;
                }

                /* No Results States */
                .no-results-tab {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                }

                .no-results-tab i {
                    font-size: 3rem;
                    color: #ddd;
                    margin-bottom: 1rem;
                }

                .no-results-tab h3 {
                    color: #666;
                    margin-bottom: 1rem;
                }

                .no-results {
                    text-align: center;
                    padding: 4rem 2rem;
                }

                .no-results-content i {
                    color: #ddd;
                    margin-bottom: 1.5rem;
                }

                .no-results-content h3 {
                    color: #666;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }

                .no-results-content p {
                    color: #888;
                    margin-bottom: 2rem;
                    max-width: 500px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .suggestions {
                    margin-bottom: 2rem;
                }

                .suggestions h4 {
                    color: #666;
                    margin-bottom: 1rem;
                }

                .suggestion-tags {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .suggestion-tag {
                    background: #f0f0f0;
                    color: #666;
                    padding: 8px 16px;
                    border-radius: 20px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                }

                .suggestion-tag:hover {
                    background: #1b7a3a;
                    color: white;
                    text-decoration: none;
                }

                .browse-categories {
                    margin-top: 2rem;
                }

                .browse-btn {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .browse-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    color: white;
                    text-decoration: none;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .hero-section {
                        flex-direction: column;
                        text-align: center;
                        padding: 3rem 1.5rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        margin-bottom: 2rem;
                    }

                    .tabs-navigation {
                        justify-content: flex-start;
                        overflow-x: auto;
                        padding-bottom: 10px;
                    }
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2rem;
                    }

                    .results-title {
                        font-size: 1.5rem;
                    }

                    .results-grid {
                        grid-template-columns: 1fr;
                    }

                    .content-section {
                        padding: 40px 0;
                    }
                }

                @media (max-width: 480px) {
                    .tabs-navigation {
                        flex-direction: column;
                    }

                    .tab-btn {
                        justify-content: center;
                    }

                    .search-input-wrapper-hero {
                        flex-direction: column;
                        border-radius: 15px;
                        padding: 10px;
                    }

                    .search-input-hero {
                        margin-bottom: 10px;
                        text-align: center;
                    }

                    .suggestion-tags {
                        flex-direction: column;
                        align-items: center;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

// Search Result Card Component
function SearchResultCard({ item }) {
    const getItemLink = () => {
        switch (item.type) {
            case 'post':
                return `/post-detail/${item.slug}`;
            case 'book':
                return `/book-detail/${item.id}`;
            case 'islamic':
                return `/islamic-detail/${item.id}`;
            case 'exhibition':
                return `/exhibition-detail/${item.id}`;
            default:
                return '#';
        }
    };

    const getItemImage = () => {
        if (item.images && item.images.length > 0) {
            return `${window.location.origin}/storage/${item.images[0].image}`;
        }
        if (item.photo) {
            return `${window.location.origin}/storage/${item.photo}`;
        }
        if (item.thumbnail) {
            return `${window.location.origin}/storage/${item.thumbnail}`;
        }
        if (item.image) {
            return `${window.location.origin}/storage/${item.image}`;
        }
        return 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
    };

    const getItemExcerpt = () => {
        const content = item.content || item.description || '';
        return content.replace(/<[^>]+>/g, '').slice(0, 150) + '...';
    };

    return (
        <div className="search-result-card">
            <div className="result-image">
                <img
                    src={getItemImage()}
                    alt={item.title}
                    onError={(e) => {
                        e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
                    }}
                />
                <div className="result-type">{item.type}</div>
            </div>
            <div className="result-content">
                <h3 className="result-title">
                    <Link href={getItemLink()}>{item.title}</Link>
                </h3>
                <p className="result-excerpt">{getItemExcerpt()}</p>
                <div className="result-meta">
                    <span className="result-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <Link href={getItemLink()} className="read-more-btn">
                        Read More
                    </Link>
                </div>
            </div>
        </div>
    );
}