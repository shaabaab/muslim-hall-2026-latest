import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function PostDetail() {
    const {
        settings,
        posts,
        filters: initialFilters,
        categories,
        auth,
    } = usePage().props;

    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [currentPostId, setCurrentPostId] = useState(null);

    const [filters, setFilters] = useState({
        search: initialFilters?.search || "",
        sort: initialFilters?.sort || "newest",
        category: initialFilters?.category || "all",
        subcategory: initialFilters?.subcategory || "all",
        page: initialFilters?.page || 1,
    });

    // Debounced filter updates
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route("post-details"), filters, {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                only: ["posts", "filters"],
            });
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "category" ? { subcategory: "all" } : {}),
            ...(key !== "page" && { page: 1 }),
        }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: "",
            sort: "newest",
            category: "all",
            subcategory: "all",
            page: 1,
        };
        setFilters(clearedFilters);
        router.get(route("post-details"), clearedFilters, {
            preserveState: true,
            replace: true,
            only: ["posts", "filters"],
        });
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setFilters((prev) => ({
            ...prev,
            page,
        }));
    };

    // Report functions
    const handleReportClick = (e, postId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.user) {
            router.visit(route("login"));
            return;
        }
        setCurrentPostId(postId);
        setShowReportModal(true);
        setReportError("");
        setReportSuccess("");
    };

    const submitReport = () => {
        if (!reportReason.trim() || reportReason.length < 10) {
            setReportError(
                "Please provide a detailed reason (at least 10 characters).",
            );
            return;
        }

        if (!currentPostId) {
            setReportError("No post selected for reporting.");
            return;
        }

        setReportSubmitting(true);
        setReportError("");

        router.post(
            route("reports.store"),
            {
                reason: reportReason,
                report_type: "post",
                reportable_id: currentPostId,
                reportable_type: "App\\Models\\Post",
            },
            {
                onSuccess: () => {
                    setReportSuccess(
                        "Report submitted successfully! Our team will review it.",
                    );
                    setTimeout(() => {
                        setShowReportModal(false);
                        setReportReason("");
                        setReportSuccess("");
                        setCurrentPostId(null);
                    }, 2000);
                },
                onError: (errors) => {
                    if (errors.reason) {
                        setReportError(errors.reason);
                    } else if (errors.message) {
                        setReportError(errors.message);
                    } else {
                        setReportError(
                            "Failed to submit report. Please try again.",
                        );
                    }
                },
                onFinish: () => {
                    setReportSubmitting(false);
                },
                preserveScroll: true,
            },
        );
    };

    const closeReportModal = () => {
        if (!reportSubmitting) {
            setShowReportModal(false);
            setReportReason("");
            setReportError("");
            setReportSuccess("");
            setCurrentPostId(null);
        }
    };

    const mainCategories = categories?.filter((cat) => !cat.parent_id) || [];
    const subCategories = categories?.filter((cat) => cat.parent_id) || [];

    const getSubcategoriesForCategory = (categorySlug) => {
        if (categorySlug === "all") return [];
        const category = categories?.find((cat) => cat.slug === categorySlug);
        return subCategories.filter((sub) => sub.parent_id === category?.id);
    };

    const getCategoryStats = () => {
        const stats = {};
        posts?.data?.forEach((p) => {
            const categoryName = p.category?.name || "Uncategorized";
            stats[categoryName] = (stats[categoryName] || 0) + 1;
        });
        return stats;
    };

    const categoryStats = getCategoryStats();
    const currentSubcategories = getSubcategoriesForCategory(filters.category);

    // Pagination rendering logic
    const renderPagination = () => {
        if (!posts || posts.data.length === 0) return null;

        const currentPage = posts.current_page;
        const lastPage = posts.last_page;

        if (lastPage <= 1) return null;

        const pages = [];

        pages.push(1);

        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(lastPage - 1, currentPage + 1);

        if (startPage > 2) pages.push("...");

        for (let i = startPage; i <= endPage; i++) pages.push(i);

        if (endPage < lastPage - 1) pages.push("...");

        if (lastPage > 1) pages.push(lastPage);

        return (
            <div className="pagination">
                <button
                    className={`pagination-btn ${currentPage === 1 ? "disabled" : ""}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <i className="fas fa-chevron-left"></i> Previous
                </button>

                <div className="pagination-numbers">
                    {pages.map((page, index) => (
                        <button
                            key={`${page}-${index}`}
                            className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "ellipsis" : ""}`}
                            onClick={() =>
                                page !== "..." && handlePageChange(page)
                            }
                            disabled={page === "..."}
                        >
                            {page === "..." ? "..." : page}
                        </button>
                    ))}
                </div>

                <button
                    className={`pagination-btn ${currentPage === lastPage ? "disabled" : ""}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                >
                    Next <i className="fas fa-chevron-right"></i>
                </button>

                <div className="page-info">
                    Page {currentPage} of {lastPage}
                </div>
            </div>
        );
    };

    // Safe image helper (NO design change)
    const postThumb = (p) =>
        getS3PublicUrl(p?.thumbnail || p?.image || p?.cover || null);

    return (
        <FrontAuthenticatedLayout>
            {/* Report Modal */}
            {showReportModal && (
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-flag-checkered"></i> Report
                                Content
                            </h3>
                            <button
                                onClick={closeReportModal}
                                className="modal-close-btn"
                                disabled={reportSubmitting}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="info-box">
                                <i className="fas fa-info-circle"></i>
                                <p>
                                    Please report content only if it violates
                                    our community guidelines. False reporting
                                    may lead to account restrictions.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Reason for reporting{" "}
                                    <span className="required">*</span>
                                </label>
                                <textarea
                                    className="form-textarea"
                                    value={reportReason}
                                    onChange={(e) => {
                                        setReportReason(e.target.value);
                                        setReportError("");
                                    }}
                                    placeholder="Describe why this content is inappropriate (min 10 chars)..."
                                    rows={5}
                                    disabled={reportSubmitting}
                                    maxLength={500}
                                />
                                <div className="char-count">
                                    {reportReason.length}/500
                                </div>
                            </div>

                            {reportError && (
                                <div className="alert alert-error">
                                    <i className="fas fa-exclamation-circle"></i>{" "}
                                    {reportError}
                                </div>
                            )}

                            {reportSuccess && (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle"></i>{" "}
                                    {reportSuccess}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={closeReportModal}
                                className="btn btn-secondary"
                                disabled={reportSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReport}
                                className="btn btn-danger"
                                disabled={
                                    reportSubmitting || reportReason.length < 10
                                }
                            >
                                {reportSubmitting
                                    ? "Submitting..."
                                    : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-wrapper">
                <Header />

                <div className="content-section" id="posts">
                    <div className="container">
                        <div className="mobile-actions">
                            <button
                                className="btn-mobile-filter"
                                onClick={() => setShowMobileFilter(true)}
                            >
                                <i className="fas fa-sliders-h"></i> Filters
                            </button>
                        </div>

                        {showMobileFilter && (
                            <div
                                className="sidebar-backdrop"
                                onClick={() => setShowMobileFilter(false)}
                            ></div>
                        )}

                        <div className="content-grid">
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

                                    <div className="filter-block">
                                        <div className="search-box">
                                            <i className="fas fa-search"></i>
                                            <input
                                                type="text"
                                                placeholder="Search posts..."
                                                value={filters.search}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "search",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="filter-block">
                                        <h4 className="filter-title">
                                            Categories
                                        </h4>
                                        <div className="category-nav">
                                            <button
                                                className={`nav-items ${filters.category === "all" ? "active" : ""}`}
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "category",
                                                        "all",
                                                    )
                                                }
                                            >
                                                <span>All Categories</span>
                                                <span className="badge">
                                                    {posts?.total || 0}
                                                </span>
                                            </button>

                                            {mainCategories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    className={`nav-items ${filters.category === category.slug ? "active" : ""}`}
                                                    onClick={() =>
                                                        handleFilterChange(
                                                            "category",
                                                            category.slug,
                                                        )
                                                    }
                                                >
                                                    <span>{category.name}</span>
                                                    <span className="badge">
                                                        {categoryStats[
                                                            category.name
                                                        ] || 0}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {currentSubcategories.length > 0 && (
                                        <div className="filter-block">
                                            <h4 className="filter-title">
                                                Subcategories
                                            </h4>
                                            <div className="category-nav indent">
                                                <button
                                                    className={`nav-items ${filters.subcategory === "all" ? "active" : ""}`}
                                                    onClick={() =>
                                                        handleFilterChange(
                                                            "subcategory",
                                                            "all",
                                                        )
                                                    }
                                                >
                                                    <span>
                                                        All Subcategories
                                                    </span>
                                                </button>
                                                {currentSubcategories.map(
                                                    (subcategory) => (
                                                        <button
                                                            key={subcategory.id}
                                                            className={`nav-items ${filters.subcategory === subcategory.slug ? "active" : ""}`}
                                                            onClick={() =>
                                                                handleFilterChange(
                                                                    "subcategory",
                                                                    subcategory.slug,
                                                                )
                                                            }
                                                        >
                                                            <span>
                                                                {
                                                                    subcategory.name
                                                                }
                                                            </span>
                                                            <span className="badge">
                                                                {categoryStats[
                                                                    subcategory
                                                                        .name
                                                                ] || 0}
                                                            </span>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

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
                                        </select>
                                    </div>
                                </div>
                            </aside>

                            <main className="feed">
                                <div className="feed-header">
                                    <h2>
                                        {filters.category === "all"
                                            ? "Latest Posts"
                                            : mainCategories.find(
                                                (c) =>
                                                    c.slug ===
                                                    filters.category,
                                            )?.name || "Posts"}
                                    </h2>
                                    <span className="result-count">
                                        {posts?.total || 0} results found
                                        {posts?.data?.length < posts?.total && (
                                            <span className="showing">
                                                {" "}
                                                (showing {posts?.data?.length})
                                            </span>
                                        )}
                                    </span>
                                </div>

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

                                <div className="grid-container">
                                    {posts && posts.data.length > 0 ? (
                                        posts.data.map((p) => (
                                            <div
                                                key={p.id}
                                                className="post-card border-1 border-[#0f8022] shadow-md shadow-blue bg-[#ffffff]"
                                            >
                                                <Link
                                                    href={`/post-detail/${p.slug}`}
                                                    className="card-img-link"
                                                >
                                                    <div className="card-img-wrapper">
                                                        <img
                                                            src={
                                                                postThumb(p) ||
                                                                getS3PublicUrl(
                                                                    settings?.header_logo,
                                                                )
                                                            }
                                                            alt={p.title}
                                                        />
                                                        <span className="category-tag">
                                                            {p.category?.name ||
                                                                "General"}
                                                        </span>
                                                    </div>
                                                </Link>

                                                <div className="card-body">
                                                    <div className="card-date">
    <i className="far fa-clock"></i>{" "}
    {new Date(p.created_at).toLocaleDateString()}
    
    <span className="card-author">
        {" "}By {p.author?.name || "Admin"}
    </span>
</div>
                                                    {/* <div className="card-date">
                                                        <i className="far fa-clock"></i>{" "}
                                                        {new Date(
                                                            p.created_at,
                                                        ).toLocaleDateString()}
                                                    </div> */}

                                                    <h3 className="card-title">
                                                        <Link
                                                            href={`/post-detail/${p.slug}`}
                                                        >
                                                            {p.title}
                                                        </Link>
                                                    </h3>

                                                    <p className="card-text">
                                                        {p.content
                                                            ? new DOMParser()
                                                                .parseFromString(
                                                                    p.content.replace(
                                                                        /<[^>]+>/g,
                                                                        "",
                                                                    ),
                                                                    "text/html",
                                                                )
                                                                .body.textContent.slice(
                                                                    0,
                                                                    90,
                                                                ) + "..."
                                                            : ""}
                                                    </p>

                                                    <div className="card-footer">
                                                        <div className="meta">
                                                            <i className="far fa-eye"></i>{" "}
                                                            {p.viewer_count ??
                                                                0}
                                                        </div>
                                                        <button
                                                            className="btn-report"
                                                            onClick={(e) =>
                                                                handleReportClick(
                                                                    e,
                                                                    p.id,
                                                                )
                                                            }
                                                            title="Report this post"
                                                        >
                                                            <i className="far fa-flag"></i>{" "}
                                                            Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            <div className="icon">
                                                <i className="fas fa-search"></i>
                                            </div>
                                            <h3>No posts found</h3>
                                            <p>
                                                Try clearing your filters or
                                                searching for something else.
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

                                {renderPagination()}
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
                    font-family:
                        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                        "Helvetica Neue", Arial, sans-serif;
                }

                /* --- Report Modal (Fixed) --- */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .modal-container {
                    background: #ffffff;
                    width: 100%;
                    max-width: 500px;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .modal-header {
                    background: #ffffff;
                    padding: 16px 24px;
                    border-bottom: 1px solid #eaeaea;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .modal-title i {
                    color: #dc3545;
                }

                .modal-close-btn {
                    background: transparent;
                    border: none;
                    color: #666;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                }
                .modal-close-btn:hover {
                    background: #f5f5f5;
                    color: #333;
                }

                .modal-body {
                    padding: 24px;
                    background: #fff;
                }

                .info-box {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    color: #555;
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .info-box i {
                    color: #007bff;
                    margin-top: 2px;
                }

                .form-group {
                    margin-bottom: 0;
                }
                .form-label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: #333;
                    font-size: 14px;
                }
                .required {
                    color: #dc3545;
                }

                .form-textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ced4da;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 14px;
                    color: #333;
                    transition: border-color 0.2s;
                    resize: vertical;
                }
                .form-textarea:focus {
                    outline: none;
                    border-color: #80bdff;
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                }

                .char-count {
                    text-align: right;
                    font-size: 12px;
                    color: #999;
                    margin-top: 5px;
                }

                .alert {
                    margin-top: 15px;
                    padding: 10px 15px;
                    border-radius: 6px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .alert-error {
                    background: #fde8e8;
                    color: #c53030;
                }
                .alert-success {
                    background: #def7ec;
                    color: #03543f;
                }

                .modal-footer {
                    padding: 16px 24px;
                    background: #f8f9fa;
                    border-top: 1px solid #eaeaea;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                /* --- Buttons --- */
                .btn {
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: #fff;
                    border-color: #ced4da;
                    color: #495057;
                }
                .btn-secondary:hover:not(:disabled) {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }

                .btn-danger {
                    background: #dc3545;
                    color: white;
                }
                .btn-danger:hover:not(:disabled) {
                    background: #c82333;
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
                }
                .search-box input:focus {
                    background: #fff;
                    outline: none;
                    border-color: #1b7a3a;
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
                .category-nav.indent {
                    padding-left: 12px;
                    border-left: 2px solid #f3f4f6;
                    margin-top: 10px;
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
                .showing {
                    color: #9ca3af;
                    font-size: 13px;
                }

                .active-filters {
                    margin-bottom: 20px;
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
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(
                        auto-fill,
                        minmax(280px, 1fr)
                    );
                    gap: 24px;
                    margin-bottom: 40px;
                }

                .post-card {
                    border-radius: 12px;
                    overflow: hidden;

                    transition:
                        transform 0.2s,
                        box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .post-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                }

                .card-img-wrapper {
                    width: 100%;
                    height: 200px;
                    position: relative;
                    overflow: hidden;
                }

                .card-img-wrapper img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.3s;
                }

                .post-card:hover .card-img-wrapper img {
                    transform: scale(1.05);
                }

                @media (min-width: 768px) {
                    .card-img-wrapper {
                        height: 250px;
                    }
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
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                                    .card-author {
                    margin-left: 4px;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 500;
                }

                .card-author::before {
                    content: "|";
                    margin-right: 5px;
                    color: #94a3b8;
                }

                // .card-date {
                //     font-size: 12px;
                //     color: #9ca3af;
                //     margin-bottom: 8px;
                // }
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
                }

                .btn-report {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: color 0.2s;
                }
                .btn-report:hover {
                    color: #dc3545;
                }

                /* --- Pagination Styles --- */
                .pagination {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid #e5e7eb;
                }

                .pagination-btn {
                    padding: 8px 16px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    color: #374151;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-height: 36px;
                }

                .pagination-btn:hover:not(.disabled):not(.active):not(
                        .ellipsis
                    ) {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                .pagination-btn.active {
                    background: #166534;
                    color: white;
                    border-color: #166534;
                }

                .pagination-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .pagination-btn.ellipsis {
                    cursor: default;
                    border: none;
                    background: transparent;
                    padding: 8px 8px;
                }

                .pagination-numbers {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }

                .page-info {
                    font-size: 14px;
                    color: #6b7280;
                    margin-left: 20px;
                    padding: 8px 12px;
                    background: #f9fafb;
                    border-radius: 6px;
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

                /* --- Mobile Responsive --- */
                .mobile-actions {
                    display: none;
                    margin-bottom: 20px;
                }
                .sidebar-backdrop {
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

                    .pagination {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .pagination-numbers {
                        order: -1;
                        width: 100%;
                        justify-content: center;
                    }

                    .page-info {
                        margin-left: 0;
                    }
                }
                .mobile-only {
                    display: none;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
