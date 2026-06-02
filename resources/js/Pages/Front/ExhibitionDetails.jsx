import { Link, usePage, useForm, router } from "@inertiajs/react";
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    Upload,
    Button,
    Row,
    Col,
    Switch,
    InputNumber,
    Space,
    message
} from 'antd';
import {
    SaveOutlined,
    UploadOutlined,
    PlusOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    PictureOutlined,
    EditOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

export default function ExhibitionDetail() {
    const { exhibition, langs, currencyOptions, filters: initialFilters, member, auth } = usePage().props;
    
    // Ensure exhibition is always an array
    const exhibitions = Array.isArray(exhibition) ? exhibition : [];
    
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [currentExhibitionId, setCurrentExhibitionId] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    
    const [filters, setFilters] = useState({
        search: initialFilters?.search || '',
        sort: initialFilters?.sort || 'newest',
        status: initialFilters?.status ,
        type: initialFilters?.type 
    });

    // Debounced filter updates
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route('exhibition-details'), filters, {
                preserveState: true,
                replace: true,
                only: ['exhibition', 'filters']
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: '',
            sort: 'newest',
            status: 'all',
            type: 'all'
        };
        setFilters(clearedFilters);
        router.get(route('exhibition-details'), clearedFilters, {
            preserveState: true,
            replace: true,
            only: ['exhibition', 'filters']
        });
    };

    // Report functions
    const handleReportClick = (e, exhibitionId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.user) {
            router.visit(route("login"));
            return;
        }
        setCurrentExhibitionId(exhibitionId);
        setShowReportModal(true);
        setReportError("");
        setReportSuccess("");
    };

    // const submitReport = () => {
    //     if (!reportReason.trim() || reportReason.length < 10) {
    //         setReportError("Please provide a detailed reason (at least 10 characters).");
    //         return;
    //     }

    //     if (!currentExhibitionId) {
    //         setReportError("No exhibition selected for reporting.");
    //         return;
    //     }

    //     setReportSubmitting(true);
    //     setReportError("");

    //     router.post(
    //         route("reports.store"),
    //         {
    //             reason: reportReason,
    //             report_type: "exhibition",
    //             reportable_id: currentExhibitionId,
    //             reportable_type: "App\\Models\\Exhibition",
    //         },
    //         {
    //             onSuccess: () => {
    //                 setReportSuccess("Report submitted successfully! Our team will review it.");
    //                 setTimeout(() => {
    //                     setShowReportModal(false);
    //                     setReportReason("");
    //                     setReportSuccess("");
    //                     setCurrentExhibitionId(null);
    //                 }, 2000);
    //             },
    //             onError: (errors) => {
    //                 if (errors.reason) {
    //                     setReportError(errors.reason);
    //                 } else if (errors.message) {
    //                     setReportError(errors.message);
    //                 } else {
    //                     setReportError("Failed to submit report. Please try again.");
    //                 }
    //             },
    //             onFinish: () => {
    //                 setReportSubmitting(false);
    //             },
    //             preserveScroll: true,
    //         }
    //     );
    // };

    const closeReportModal = () => {
        if (!reportSubmitting) {
            setShowReportModal(false);
            setReportReason("");
            setReportError("");
            setReportSuccess("");
            setCurrentExhibitionId(null);
        }
    };

    // Helper to get image
    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
        return imagePath.startsWith('http') ? imagePath : `${window.location.origin}/storage/${imagePath}`;
    };

    // Derived Data for Filters
    const statuses = [...new Set(exhibitions.map(item => item.status).filter(Boolean))];
    const types = [...new Set(exhibitions.map(item => item.type).filter(Boolean))];

    // Stats Calculation
    const stats = useMemo(() => {
        return {
            total: exhibitions.length,
            featured: exhibitions.filter(i => i.is_featured).length,
            forSale: exhibitions.filter(i => i.is_available && i.price > 0).length
        };
    }, [exhibitions]);

    return (
        <FrontAuthenticatedLayout>
            {/* Report Modal */}
            {/* {showReportModal && (
                <div className="modal-backdrop">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-flag-checkered"></i> Report Content
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
                                <p>Please report content only if it violates our community guidelines. False reporting may lead to account restrictions.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Reason for reporting <span className="required">*</span>
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
                                    <i className="fas fa-exclamation-circle"></i> {reportError}
                                </div>
                            )}

                            {reportSuccess && (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle"></i> {reportSuccess}
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
                                disabled={reportSubmitting || reportReason.length < 10}
                            >
                                {reportSubmitting ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            <div className="page-wrapper">
                <Header />

                {/* Main Content */}
                <div className="content-section" id="exhibitions">
                    <div className="container-md">
                        
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
                                                placeholder="Search exhibitions..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                            />
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
                                            <option value="price_asc">Price: Low to High</option>
                                            <option value="price_desc">Price: High to Low</option>
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">Status</h4>
                                        <div className="category-nav">
                                            <button
                                                className={`nav-items ${filters.status === "all" ? "active" : ""}`}
                                                onClick={() => handleFilterChange("status", "all")}
                                            >
                                                <span>All Statuses</span>
                                            </button>
                                            
                                            {statuses.map(status => (
                                                <button
                                                    key={status}
                                                    className={`nav-items ${filters.status === status ? "active" : ""}`}
                                                    onClick={() => handleFilterChange("status", status)}
                                                >
                                                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Type Filter */}
                                    <div className="filter-block">
                                        <h4 className="filter-title">Type</h4>
                                        <div className="category-nav">
                                            <button
                                                className={`nav-items ${filters.type === "all" ? "active" : ""}`}
                                                onClick={() => handleFilterChange("type", "all")}
                                            >
                                                <span>All Types</span>
                                            </button>
                                            
                                            {types.map(type => (
                                                <button
                                                    key={type}
                                                    className={`nav-items ${filters.type === type ? "active" : ""}`}
                                                    onClick={() => handleFilterChange("type", type)}
                                                >
                                                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                        

                                    {/* Quick Actions */}
                                    {auth?.user && (
                                        <div className="filter-block">
                                            <h4 className="filter-title">Actions</h4>
                                            <button 
                                                className="action-btn primary"
                                                onClick={() => setCreateModalVisible(true)}
                                            >
                                                <i className="fas fa-plus-circle"></i> Create New
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            {/* Main Feed */}
                            <main className="feed">
                                <div className="feed-header">
                                    <h2>Gallery</h2>
                                    <span className="result-count">
                                        {exhibitions.length} results found
                                    </span>
                                </div>

                                {/* Active Filters */}
                                {filters.search && (
                                    <div className="active-filters">
                                        <span className="filter-chip">
                                            Search: "{filters.search}"
                                            <button onClick={() => handleFilterChange("search", "")}>
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </span>
                                    </div>
                                )}

                                {/* Exhibitions Grid */}
                                <div className="grid-container">
                                    {exhibitions.length > 0 ? (
                                        exhibitions.map((item) => (
                                            <div key={item.id} className="post-card">
                                                <Link href={`/exhibition-detail/${item.id}`} className="card-img-link">
                                                    <div className="card-img-wrapper">
                                                        <img
                                                            alt={item.title || 'Exhibition'}
                                                            src={getImageUrl(item.image)}
                                                            onError={(e) => { e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'; }}
                                                        />
                                                        <div className="card-badges">
                                                            {/* {item.is_featured && (
                                                                <span className="badge featured">
                                                                    <i className="fas fa-star"></i>
                                                                </span>
                                                            )} */}
                                                            <span className={`badge status ${item.status}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <span className="category-tag">
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                </Link>
                                                
                                                <div className="card-body">
                                                    <div className="card-date">
                                                        <i className="far fa-clock"></i> {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                    
                                                    <h3 className="card-title">
                                                        <Link href={`/exhibition-detail/${item.id}`}>
                                                            {item.title || 'Untitled'}
                                                        </Link>
                                                    </h3>
                                                    
                                                    <p className="card-text">
                                                        {item.description?.replace(/<[^>]+>/g, '').slice(0, 90)}...
                                                    </p>
                                                    
                                                    <div className="card-footer">
                                                        <div className="meta">
                                                            {item.price > 0 ? (
                                                                <span className="price">
                                                                    <i className="fas fa-tag"></i> ${parseFloat(item.price).toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="meta-item">
                                                                    <i className="fas fa-palette"></i> {item.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* <button 
                                                            className="btn-report"
                                                            onClick={(e) => handleReportClick(e, item.id)}
                                                            title="Report this exhibition"
                                                        >
                                                            <i className="far fa-flag"></i> Report
                                                        </button> */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            <div className="icon">
                                                <i className="fas fa-palette"></i>
                                            </div>
                                            <h3>No exhibitions found</h3>
                                            <p>Try clearing your filters or searching for something else.</p>
                                            {auth?.user ? (
                                                <button 
                                                    onClick={() => setCreateModalVisible(true)}
                                                    className="btn btn-secondary"
                                                >
                                                    Create First Exhibition
                                                </button>
                                            ) : (
                                                <button onClick={clearFilters} className="btn btn-secondary">
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </main>
                        </div>
                    </div>
                </div>

                <Footer />

                {/* Create Exhibition Modal */}
                {auth?.user && (
                    <CreateExhibitionModal
                        visible={createModalVisible}
                        onClose={() => setCreateModalVisible(false)}
                        langs={langs}
                        currencyOptions={currencyOptions}
                        member={member}
                    />
                )}
            </div>

            <style jsx>{`
                /* --- Global Reset & Vars --- */
                .page-wrapper {
                    background-color: #f4f6f8;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
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
                .modal-title i { color: #dc3545; }

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
                .modal-close-btn:hover { background: #f5f5f5; color: #333; }

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
                .info-box i { color: #007bff; margin-top: 2px; }

                .form-group { margin-bottom: 0; }
                .form-label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: #333;
                    font-size: 14px;
                }
                .required { color: #dc3545; }

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
                    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
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
                .alert-error { background: #fde8e8; color: #c53030; }
                .alert-success { background: #def7ec; color: #03543f; }

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
                .btn:disabled { opacity: 0.6; cursor: not-allowed; }
                
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
                    border-color: #9ca3af;
                }

                .action-btn {
                    width: 100%;
                    padding: 10px;
                    background: rgba(27, 122, 58, 0.1);
                    border: 1px solid rgba(27, 122, 58, 0.3);
                    color: #1b7a3a;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .action-btn.primary {
                    background: #1b7a3a;
                    color: white;
                    font-weight: 600;
                    border: none;
                }
                .action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(27, 122, 58, 0.2);
                }

                /* --- Layout CSS --- */
                .content-section { padding: 40px 0; }
                .container-md { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
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
                
                .sidebar-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .btn-text {
                    background: none; 
                    border: none;
                    color: #666; 
                    font-size: 13px;
                    cursor: pointer; 
                    text-decoration: underline;
                    padding: 0;
                }
                .btn-text:hover { color: #333; }
                
                .btn-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                }
                .btn-icon:hover { color: #333; }
                
                .filter-block { margin-bottom: 24px; }
                .filter-block:last-child { margin-bottom: 0; }
                
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
                    color: #374151;
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

                .stats-group {
                    display: flex; 
                    flex-direction: column; 
                    gap: 8px;
                    margin-top: 10px;
                }
                .stat-item {
                    display: flex; 
                    justify-content: space-between;
                    align-items: center; 
                    font-size: 13px;
                    color: #4b5563; 
                    padding: 6px 0;
                }
                .stat-label { 
                    opacity: 0.8; 
                }
                .stat-value { 
                    font-weight: 600; 
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
                    font-weight: 500;
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    font-size: 12px;
                }
                .filter-chip button:hover { opacity: 0.8; }

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
                }
                .post-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                }

                .card-img-link {
                    display: block;
                    text-decoration: none;
                }

                .card-img-wrapper {
                    height: 200px; 
                    position: relative; 
                    overflow: hidden;
                }
                .card-img-wrapper img {
                    width: 100%; 
                    height: 100%; 
                    object-fit: cover;
                    transition: transform 0.3s;
                }
                .post-card:hover .card-img-wrapper img { 
                    transform: scale(1.05); 
                }
                
                .card-badges {
                    position: absolute; 
                    top: 12px; 
                    left: 12px;
                    display: flex; 
                    flex-direction: column; 
                    gap: 5px;
                }
                
                .badge {
                    padding: 4px 8px; 
                    border-radius: 12px;
                    font-size: 10px; 
                    font-weight: 600;
                    text-transform: uppercase; 
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .badge.featured {
                    background: #ffc107; 
                    color: black;
                }
                .badge.status.published { background: #28a745; }
                .badge.status.draft { background: #6c757d; }
                .badge.status.sold { background: #dc3545; }
                
                .category-tag {
                    position: absolute; 
                    top: 12px; 
                    right: 12px;
                    background: rgba(255,255,255,0.95);
                    padding: 4px 10px; 
                    border-radius: 4px;
                    font-size: 11px; 
                    font-weight: 700; 
                    color: #166534;
                    text-transform: uppercase;
                    border: 2px solid #166534;
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
                    text-decoration: underline;
                }
                
                .card-text {
                    font-size: 14px; 
                    color: #4b5563; 
                    line-height: 1.5;
                    margin-bottom: 16px; 
                    flex: 1;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
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
                    gap: 8px;
                }
                .price {
                    font-weight: 600; 
                    color: #166534;
                    display: flex; 
                    align-items: center; 
                    gap: 4px;
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
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .btn-report:hover { 
                    color: #dc3545; 
                    background: #f8f9fa;
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
                    font-weight: 700;
                }
                .no-results p {
                    color: #6b7280;
                    margin-bottom: 30px;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                    line-height: 1.5;
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
                        padding: 20px;
                    }
                    
                    .sidebar-backdrop {
                        display: block; 
                        position: fixed; 
                        inset: 0;
                        background: rgba(0,0,0,0.5); 
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
                    .grid-container {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 20px;
                    }
                    .content-section { 
                        padding: 30px 0; 
                    }
                    .container-md {
                        padding: 0 15px;
                    }
                }

                @media (max-width: 480px) {
                    .grid-container {
                        grid-template-columns: 1fr;
                    }
                    .feed-header {
                        flex-direction: column;
                        gap: 10px;
                        align-items: flex-start;
                    }
                    .result-count {
                        font-size: 13px;
                    }
                    .post-card {
                        margin-bottom: 0;
                    }
                }

                /* --- Additional utility classes --- */
                .text-center { text-align: center; }
                .text-dark { color: #111; }
                .mb-0 { margin-bottom: 0; }
                .me-2 { margin-right: 8px; }
                .max-w-4xl { max-width: 56rem; }
                .d-flex { display: flex; }
                .flex-wrap { flex-wrap: wrap; }
                .gap-2 { gap: 8px; }
                .position-relative { position: relative; }
                .mt-3 { margin-top: 12px; }
                .mt-4 { margin-top: 16px; }
                .mb-0 { margin-bottom: 0; }
                .ms-2 { margin-left: 8px; }
                .p-2 { padding: 8px; }
                .border { border: 1px solid #e5e7eb; }
                .rounded { border-radius: 6px; }
                .bg-light { background-color: #f9fafb; }
                .text-primary { color: #007bff; }
                .justify-content-end { justify-content: flex-end; }
                .gap-2 { gap: 8px; }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

// Create Exhibition Modal Component
function CreateExhibitionModal({ visible, onClose, langs, currencyOptions, member }) {
    const [form] = Form.useForm();
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'art',
        title: '',
        description: '',
        lang_id: '',
        image: null,
        gallery: [],
        document: null,
        price: 0,
        currency: 'USD',
        link: '',
        dimensions: '',
        material: '',
        is_available: true,
        is_featured: false,
        status: 'draft'
    });

    const handleMainImageUpload = (file) => {
        setData('image', file);
        const reader = new FileReader();
        reader.onload = () => setMainImagePreview(reader.result);
        reader.readAsDataURL(file);
        return false;
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];
        setData('gallery', newGallery);

        const reader = new FileReader();
        reader.onload = () => {
            setGalleryPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleGalleryRemove = (index) => {
        const newGallery = data.gallery.filter((_, i) => i !== index);
        setData('gallery', newGallery);
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleDocumentUpload = (file) => {
        setData('document', file);
        setDocumentPreview(file);
        return false;
    };

    const handleDocumentRemove = () => {
        setData('document', null);
        setDocumentPreview(null);
    };

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'gallery' && Array.isArray(data[key])) {
                data[key].forEach((file, index) => {
                    formData.append(`gallery[${index}]`, file);
                });
            } else if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        post(route('front.exhibition.create'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Exhibition created successfully!');
                handleClose();
                router.reload();
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
                message.error('Please check the form for errors.');
            }
        });
    };

    const handleClose = () => {
        reset();
        form.resetFields();
        setMainImagePreview(null);
        setGalleryPreviews([]);
        setDocumentPreview(null);
        onClose();
    };

    return (
        <Modal
            title={
                <div className="text-center">
                    <h4 className="mb-0 text-dark">
                        <i className="fas fa-plus-circle me-2"></i>
                        Create New Exhibition
                    </h4>
                </div>
            }
            open={visible}
            onCancel={handleClose}
            footer={null}
            width={800}
            style={{ top: 20 }}
            className="create-exhibition-modal"
        >
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 10px' }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Item Type"
                                validateStatus={errors.type ? 'error' : ''}
                                help={errors.type}
                                required
                            >
                                <Select
                                    size="large"
                                    value={data.type}
                                    onChange={(value) => setData('type', value)}
                                >
                                    <Option value="product"><Space><ShoppingOutlined /> Product</Space></Option>
                                    <Option value="document"><Space><FileTextOutlined /> Document</Space></Option>
                                    <Option value="art"><Space><PictureOutlined /> Art</Space></Option>
                                    <Option value="photography"><Space><PictureOutlined /> Photography</Space></Option>
                                    <Option value="craft"><Space><EditOutlined /> Craft</Space></Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Title"
                                validateStatus={errors.title ? 'error' : ''}
                                help={errors.title}
                                required
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter item title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Description"
                                validateStatus={errors.description ? 'error' : ''}
                                help={errors.description}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Describe your exhibition item..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    showCount
                                    maxLength={1000}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Select Language"
                                validateStatus={errors.lang_id ? 'error' : ''}
                                help={errors.lang_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)}
                                >
                                    {langs?.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? 'error' : ''}
                                help={errors.status}
                                required
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    size="large"
                                    placeholder="Select Status"
                                >
                                    <Option value="draft">Draft</Option>
                                    <Option value="published">Published</Option>
                                    <Option value="sold">Sold</Option>
                                    <Option value="archived">Archived</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Main Image"
                                validateStatus={errors.image ? 'error' : ''}
                                help={errors.image}
                                required
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Select Main Image
                                    </Button>
                                </Upload>

                                {mainImagePreview && (
                                    <div className="mt-3">
                                        <img
                                            src={mainImagePreview}
                                            alt="Main preview"
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '150px',
                                                borderRadius: '8px',
                                                objectFit: 'cover'
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Gallery Images"
                                validateStatus={errors.gallery ? 'error' : ''}
                                help={errors.gallery}
                            >
                                <Upload
                                    beforeUpload={handleGalleryUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button icon={<PlusOutlined />}>
                                        Add to Gallery
                                    </Button>
                                </Upload>

                                {galleryPreviews.length > 0 && (
                                    <div className="mt-3">
                                        <div className="d-flex flex-wrap gap-2">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={index} className="position-relative">
                                                    <img
                                                        src={preview}
                                                        alt={`Gallery ${index + 1}`}
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            borderRadius: '6px',
                                                            objectFit: 'cover'
                                                        }}
                                                        className="border border-dashed border-gray-300"
                                                    />
                                                    <Button
                                                        type="link"
                                                        danger
                                                        size="small"
                                                        onClick={() => handleGalleryRemove(index)}
                                                        style={{ position: 'absolute', top: -5, right: -5 }}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <small className="text-muted">
                                            {galleryPreviews.length} image(s) selected
                                        </small>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        {member && (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Price"
                                        validateStatus={errors.price ? 'error' : ''}
                                        help={errors.price}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="0.00"
                                            value={data.price}
                                            onChange={(value) => setData('price', value)}
                                            min={0}
                                            step={0.01}
                                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label="Currency"
                                        validateStatus={errors.currency ? 'error' : ''}
                                        help={errors.currency}
                                    >
                                        <Select
                                            value={data.currency}
                                            onChange={(value) => setData('currency', value)}
                                            size="large"
                                        >
                                            {currencyOptions?.map(currency => (
                                                <Option key={currency.value} value={currency.value}>
                                                    {currency.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label="External Link"
                                        validateStatus={errors.link ? 'error' : ''}
                                        help={errors.link}
                                    >
                                        <Input
                                            placeholder="https://example.com"
                                            value={data.link}
                                            onChange={(e) => setData('link', e.target.value)}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        {(data.type === 'art' || data.type === 'product' || data.type === 'craft') && (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Dimensions"
                                        validateStatus={errors.dimensions ? 'error' : ''}
                                        help={errors.dimensions}
                                    >
                                        <Input
                                            placeholder="e.g., 24x36 inches, 50x70 cm"
                                            value={data.dimensions}
                                            onChange={(e) => setData('dimensions', e.target.value)}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Material"
                                        validateStatus={errors.material ? 'error' : ''}
                                        help={errors.material}
                                    >
                                        <Input
                                            placeholder="e.g., Oil on canvas, Wood, Metal"
                                            value={data.material}
                                            onChange={(e) => setData('material', e.target.value)}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24}>
                            <Form.Item 
                                label="Document File (Optional)"
                                validateStatus={errors.document ? 'error' : ''}
                                help={errors.document}
                            >
                                <Upload
                                    beforeUpload={handleDocumentUpload}
                                    onRemove={handleDocumentRemove}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        Select Document
                                    </Button>
                                </Upload>

                                {documentPreview && (
                                    <div className="mt-3">
                                        <div className="p-2 border rounded bg-light">
                                            <FileTextOutlined className="text-primary me-2" />
                                            <span>{documentPreview.name}</span>
                                        </div>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="Available for Sale">
                                <Switch
                                    checked={data.is_available}
                                    onChange={(checked) => setData('is_available', checked)}
                                />
                                <span className="ms-2">
                                    {data.is_available ? 'Available' : 'Not Available'}
                                </span>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="Featured Item">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) => setData('is_featured', checked)}
                                />
                                <span className="ms-2">
                                    {data.is_featured ? 'Featured' : 'Regular'}
                                </span>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mt-4 mb-0">
                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                onClick={handleClose}
                                size="large"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: '160px' }}
                            >
                                {processing ? 'Creating...' : 'Create Exhibition'}
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
}