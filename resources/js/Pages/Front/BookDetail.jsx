import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function BookDetail() {
    const { book, filters: initialFilters } = usePage().props;

    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [filters, setFilters] = useState({
        search: initialFilters?.search || "",
        sort: initialFilters?.sort || "newest",
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route("book-details"), filters, {
                preserveState: true,
                replace: true,
                only: ["book", "filters"],
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        const clearedFilters = { search: "", sort: "newest" };
        setFilters(clearedFilters);
        setShowMobileFilter(false);

        router.get(route("book-details"), clearedFilters, {
            preserveState: true,
            replace: true,
            only: ["book", "filters"],
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const stats = useMemo(() => {
        const data = book || [];
        const cats = new Set(data.map((item) => item.category).filter(Boolean));
        const auths = new Set(data.map((item) => item.author).filter(Boolean));
        return { categories: cats.size, authors: auths.size };
    }, [book]);

    const totalBooks = (book || []).length;

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />


                <section className="px-4 pt-6 pb-2 sm:pt-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="relative overflow-hidden rounded-2xl border bg-[#1b7a3a]">
                            {/* soft lights */}
                            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                            <div className="relative p-4 md:p-8">
                                {/* top row */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-white">
                                        <i className="fas fa-star-and-crescent"></i>
                                        Muslim Hall
                                    </span>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <button
                                            onClick={clearFilters}
                                            disabled={isLoading}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                                            title="Reset filters"
                                        >
                                            <i className="fas fa-undo"></i>
                                            Reset
                                        </button>

                                        <button
                                            onClick={() => {
                                                const el =
                                                    document.getElementById(
                                                        "books",
                                                    );
                                                el?.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start",
                                                });
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-emerald-950 transition hover:opacity-90"
                                            title="Browse books"
                                        >
                                            <i className="fas fa-arrow-down"></i>
                                            Browse
                                        </button>
                                    </div>
                                </div>

                                {/* title */}
                                <div className="mt-5">
                                    <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
                                        Islamic Book Library
                                    </h1>

                                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
                                        Qur’an, Hadith, Seerah, Fiqh, Duas &
                                        more — browse, search, and filter
                                        effortlessly to find the right book for
                                        you
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 sm:p-4 backdrop-blur text-center">
                                        <div className="text-base font-black text-white sm:text-xl">
                                            {stats.categories}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold tracking-wide text-white/80 sm:mt-1 sm:text-xs">
                                            Categories
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 sm:p-4 backdrop-blur text-center">
                                        <div className="text-base font-black text-white sm:text-xl">
                                            {stats.authors}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold tracking-wide text-white/80 sm:mt-1 sm:text-xs">
                                            Authors
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-2.5 sm:p-4 backdrop-blur text-center">
                                        <div className="text-base font-black text-white sm:text-xl">
                                            {totalBooks}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold tracking-wide text-white/80 sm:mt-1 sm:text-xs">
                                            Books
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <div className="content-section" id="books">
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
                            <aside
                                className={`sidebar ${showMobileFilter ? "open" : ""}`}
                            >
                                <div className="sidebar-inner">
                                    <div className="sidebar-header">
                                        <h3>Filters</h3>
                                        <div className="sidebar-header-actions">
                                            <button
                                                onClick={clearFilters}
                                                className="btn-text"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                className="btn-icon mobile-only"
                                                onClick={() =>
                                                    setShowMobileFilter(false)
                                                }
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
                                                placeholder="Search title, author..."
                                                value={filters.search}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "search",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Sort */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">
                                            Sort By
                                        </h4>
                                        <select
                                            className="form-select"
                                            value={filters.sort}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    "sort",
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isLoading}
                                        >
                                            <option value="newest">
                                                Newest First
                                            </option>
                                            <option value="oldest">
                                                Oldest First
                                            </option>
                                            <option value="title_asc">
                                                Title (A-Z)
                                            </option>
                                            <option value="title_desc">
                                                Title (Z-A)
                                            </option>
                                            <option value="author_asc">
                                                Author (A-Z)
                                            </option>
                                        </select>
                                    </div>

                                    {/* Library Stats */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">
                                            Library Stats
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Categories:
                                                </span>
                                                <span className="stat-value">
                                                    {stats.categories}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Authors:
                                                </span>
                                                <span className="stat-value">
                                                    {stats.authors}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Showing:
                                                </span>
                                                <span className="stat-value">
                                                    {totalBooks}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">
                                            Quick View
                                        </h4>
                                        <div className="quick-actions">
                                            <button
                                                className="nav-items"
                                                onClick={() => {
                                                    handleFilterChange(
                                                        "sort",
                                                        "newest",
                                                    );
                                                    handleFilterChange(
                                                        "search",
                                                        "",
                                                    );
                                                }}
                                                disabled={isLoading}
                                            >
                                                <i className="fas fa-star"></i>{" "}
                                                New Arrivals
                                            </button>
                                            <button
                                                className="nav-items"
                                                onClick={() => {
                                                    handleFilterChange(
                                                        "search",
                                                        "",
                                                    );
                                                    handleFilterChange(
                                                        "sort",
                                                        "title_asc",
                                                    );
                                                }}
                                                disabled={isLoading}
                                            >
                                                <i className="fas fa-list"></i>{" "}
                                                View All A-Z
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Feed */}
                            <main className="feed">
                                <div className="feed-header">
                                    <h2>All Books</h2>
                                    <span className="result-count">
                                        {totalBooks}{" "}
                                        {totalBooks === 1 ? "book" : "books"}{" "}
                                        found
                                    </span>
                                </div>

                                {/* Active Filters */}
                                {filters.search && (
                                    <div className="active-filters">
                                        <span className="filter-chip">
                                            Search: "{filters.search}"
                                            <button
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "search",
                                                        "",
                                                    )
                                                }
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    </div>
                                )}

                                {isLoading && (
                                    <div className="loading-indicator">
                                        <div className="spinner-large"></div>
                                        <p>Loading books...</p>
                                    </div>
                                )}

                                {/* Books Grid */}
                                <div className="grid-container">
                                    {!isLoading && book && book.length > 0
                                        ? book.map((p) => (
                                              <div
                                                  key={p.id}
                                                  className="book-card"
                                              >
                                                  <Link
                                                      href={`/book-detail/${p.id}`}
                                                      className="card-img-link"
                                                  >
                                                      <div className="card-img-wrapper">
                                                          <img
                                                              alt={p.title}
                                                              src={`${window.location.origin}/storage/${p.photo}`}
                                                              onError={(e) => {
                                                                  e.target.src =
                                                                      "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                              }}
                                                          />
                                                          {p.category && (
                                                              <span className="category-tag">
                                                                  {p.category}
                                                              </span>
                                                          )}
                                                      </div>
                                                  </Link>

                                                  <div className="card-body">
                                                      <div className="card-date">
                                                          <i className="far fa-calendar"></i>
                                                          {p.published_year ||
                                                              "Year not specified"}
                                                      </div>

                                                      <h3 className="card-title">
                                                          <Link
                                                              href={`/book-detail/${p.id}`}
                                                          >
                                                              {p.title}
                                                          </Link>
                                                      </h3>

                                                      {p.author && (
                                                          <div className="book-author">
                                                              <i className="fas fa-user-edit"></i>
                                                              {p.author}
                                                          </div>
                                                      )}

                                                      <p className="card-text">
                                                          {p.description
                                                              ?.replace(
                                                                  /<[^>]+>/g,
                                                                  "",
                                                              )
                                                              .slice(0, 120)}
                                                          ...
                                                      </p>

                                                      <div className="card-footer">
                                                          <div className="meta">
                                                              <i className="fas fa-book"></i>{" "}
                                                              Islamic Book
                                                          </div>
                                                          {p.publisher && (
                                                              <div className="publisher">
                                                                  <i className="fas fa-print"></i>{" "}
                                                                  {p.publisher}
                                                              </div>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))
                                        : !isLoading && (
                                              <div className="no-results">
                                                  <div className="icon">
                                                      <i className="fas fa-book"></i>
                                                  </div>
                                                  <h3>No books found</h3>
                                                  <p>
                                                      Try clearing your filters
                                                      or searching for something
                                                      else.
                                                  </p>
                                                  <button
                                                      onClick={clearFilters}
                                                      className="btn btn-secondary"
                                                  >
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
                /* --- Global Styles --- */
                .page-wrapper {
                    background-color: #f4f6f8;
                    min-height: 100vh;
                    font-family:
                        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                        "Helvetica Neue", Arial, sans-serif;
                }

                /* --- Banner (NO IMAGE) --- */
                .books-banner {
                    padding: 22px 0 10px;
                }

                .banner-card {
                    position: relative;
                    background: linear-gradient(135deg, #0b3a2a, #0f5132);
                    border-radius: 18px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
                    padding: 22px;
                    color: #fff;
                }

                .banner-card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(
                            circle at 20% 20%,
                            rgba(255, 255, 255, 0.14),
                            transparent 55%
                        ),
                        radial-gradient(
                            circle at 80% 20%,
                            rgba(255, 255, 255, 0.08),
                            transparent 50%
                        );
                    pointer-events: none;
                }

                .banner-top {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .banner-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.14);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.4px;
                    white-space: nowrap;
                }

                .banner-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }

                .banner-btn {
                    border: 1px solid transparent;
                    border-radius: 12px;
                    padding: 10px 12px;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition:
                        transform 0.15s ease,
                        opacity 0.15s ease,
                        background 0.15s ease;
                    white-space: nowrap;
                }

                .banner-btn:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                .banner-btn.ghost {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.22);
                    color: #fff;
                }

                .banner-btn.solid {
                    background: #fff;
                    color: #0b3a2a;
                }

                .banner-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                }

                .banner-title {
                    position: relative;
                    z-index: 1;
                    margin: 0 0 10px 0;
                    font-size: 34px;
                    line-height: 1.12;
                    font-weight: 1000;
                }

                .banner-subtitle {
                    position: relative;
                    z-index: 1;
                    margin: 0 0 16px 0;
                    max-width: 820px;
                    font-size: 14px;
                    line-height: 1.7;
                    color: rgba(255, 255, 255, 0.92);
                }

                .banner-stats {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 10px;
                    margin-bottom: 14px;
                }

                .stat-box {
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 14px;
                    padding: 12px 12px;
                    backdrop-filter: blur(6px);
                }

                .stat-num {
                    font-size: 18px;
                    font-weight: 950;
                    line-height: 1;
                    margin-bottom: 8px;
                }

                .stat-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.9);
                }

                .banner-chips {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 10px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.95);
                    white-space: nowrap;
                }

                /* --- Layout CSS --- */
                .content-section {
                    padding: 40px 0;
                }
                .container {
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

                /* --- Sidebar Design --- */
                .sidebar {
                    position: sticky;
                    top: 90px;
                }
                .sidebar-inner {
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                    padding: 24px;
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
                }

                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
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
                }
                .search-box input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .filter-title {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #6b7280;
                    font-weight: 600;
                    margin-bottom: 12px;
                    letter-spacing: 0.5px;
                }

                .stats-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #4b5563;
                }
                .stat-label {
                    color: #6b7280;
                }
                .stat-value {
                    font-weight: 600;
                    color: #166534;
                }

                .quick-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-items {
                    display: flex;
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
                    gap: 8px;
                }
                .nav-items:hover:not(:disabled) {
                    background: #f3f4f6;
                    color: #111;
                }
                .nav-items:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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
                    transition: all 0.2s;
                }
                .form-select:focus {
                    outline: none;
                    border-color: #1b7a3a;
                }
                .form-select:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
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
                }
                .result-count {
                    color: #6b7280;
                    font-size: 14px;
                }

                .active-filters {
                    margin-bottom: 20px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
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
                    display: flex;
                    align-items: center;
                }

                .loading-indicator {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    grid-column: 1 / -1;
                }
                .spinner-large {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f0f0f0;
                    border-top: 4px solid #1b7a3a;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(
                        auto-fill,
                        minmax(280px, 1fr)
                    );
                    gap: 24px;
                }

                .book-card {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                    transition:
                        transform 0.2s,
                        box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .book-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                }

                .card-img-wrapper {
                    height: 200px;
                    position: relative;
                    overflow: hidden;
                }
                .card-img-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .book-card:hover .card-img-wrapper img {
                    transform: scale(1.05);
                }

                .category-tag {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #166534;
                    text-transform: uppercase;
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
                    gap: 4px;
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

                .book-author {
                    font-size: 13px;
                    color: #6b7280;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
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
                    font-size: 12px;
                    color: #9ca3af;
                }
                .meta {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .publisher {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* --- No Results --- */
                .no-results {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                }
                .no-results .icon {
                    font-size: 48px;
                    color: #d1d5db;
                    margin-bottom: 20px;
                }
                .no-results h3 {
                    font-size: 24px;
                    margin-bottom: 10px;
                    color: #111827;
                }
                .no-results p {
                    color: #6b7280;
                    margin-bottom: 30px;
                }

                /* --- Buttons --- */
                .btn {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .btn-secondary {
                    background: white;
                    border-color: #d1d5db;
                    color: #374151;
                }
                .btn-secondary:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }

                /* --- Mobile Responsive --- */
                .mobile-actions {
                    display: none;
                    margin-bottom: 20px;
                }
                .sidebar-backdrop {
                    display: none;
                }

                @media (max-width: 992px) {
                    .banner-card {
                        padding: 18px;
                    }

                    .banner-title {
                        font-size: 28px;
                    }

                    .banner-stats {
                        grid-template-columns: 1fr;
                    }

                    .banner-top {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }

                    .banner-actions {
                        width: 100%;
                        justify-content: flex-start;
                    }

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
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 1040;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                }
                .mobile-only {
                    display: none;
                }

                @media (max-width: 768px) {
                    .content-section {
                        padding: 20px 0;
                    }
                    .container {
                        padding: 0 16px;
                    }
                    .grid-container {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 480px) {
                    .books-banner {
                        padding: 16px 0 6px;
                    }

                    .banner-title {
                        font-size: 22px;
                    }

                    .banner-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .feed-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                    .card-img-wrapper {
                        height: 180px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
