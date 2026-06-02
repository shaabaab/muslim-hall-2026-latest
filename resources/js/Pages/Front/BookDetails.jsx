import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { usePage } from "@inertiajs/react";
import { Button } from "antd";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import Footer from "./Footer";
import Header from "./Header";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function BookDetails() {
    const { book, auth } = usePage().props;
    const [pdfLoadError, setPdfLoadError] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(true);
    console.log(auth);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    // function for nextPage
    function nextPage() {
        setPageNumber((prev) => (prev < numPages ? prev + 1 : prev));
    }

    // //function for previous page
    function prevPage() {
        setPageNumber((prev) => (prev > 1 ? prev - 1 : prev));
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Get photo URL
    const getPhotoUrl = (photoPath) => {
        return photoPath ? `/storage/${photoPath}` : "/default-book-cover.jpg";
    };

    // Get PDF file URL
    const getPdfUrl = (filePath) => {
        if (!filePath) return null;
        return `/storage/${filePath}`;
    };

    // Get file size in readable format
    const getFileSize = (filePath) => {
        if (!filePath) return null;
        return "2.5 MB";
    };

    // PDF load handlers
    const handlePdfLoad = () => {
        setIsPdfLoading(false);
        setPdfLoadError(false);
    };

    const handlePdfError = () => {
        setIsPdfLoading(false);
        setPdfLoadError(true);
    };
    function onDocumentLoadError(error) {
        console.error("PDF loading error:", error);
        setPdfLoadError(true);
        setIsPdfLoading(false);
    }

    const roles = auth?.user?.roles || [];

    const isAdmin = auth?.user?.role == 2;
    const isMember = auth?.user?.subscriptions?.length > 0;

    const canDownload = isAdmin || isMember;

    console.log(auth.user);

    return (
        <FrontAuthenticatedLayout>
            <div className="theme-dark-active">
                <Header />

                {/* Main Content Section */}
                <div className="content-section" id="book-details">
                    <div className="container-md">
                        <div className="content-layout">
                            {/* Book Info Sidebar */}
                            <div className="filter-sidebar">
                                <div className="filter-header">
                                    <h3 className="filter-title">
                                        <i className="fas fa-book"></i>
                                        Book Info
                                    </h3>
                                </div>

                                {/* Book Cover */}
                                <div className="book-cover-container">
                                    <img
                                        src={getPhotoUrl(book?.photo)}
                                        alt={book?.title || "Book Cover"}
                                        className="book-cover"
                                    />
                                </div>

                                {/* Quick Stats */}
                                <div className="stats-group">
                                    <h4 className="stats-title">
                                        <i className="fas fa-chart-bar"></i>
                                        Book Details
                                    </h4>
                                    <div className="stats-list">
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Format:
                                            </span>
                                            <span className="stat-value">
                                                PDF
                                            </span>
                                        </div>
                                        {book?.page_count && (
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Pages:
                                                </span>
                                                <span className="stat-value">
                                                    {book.page_count}
                                                </span>
                                            </div>
                                        )}
                                        {book?.original_pdf && (
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    File Size:
                                                </span>
                                                <span className="stat-value">
                                                    {getFileSize(
                                                        book.original_pdf,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Views:
                                            </span>
                                            <span className="stat-value">
                                                {book?.view || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Options */}
                                <div className="download-options">
                                    <h4 className="stats-title">
                                        <i className="fas fa-download"></i>
                                        Download Options
                                    </h4>
                                    <div className="download-buttons">
                                        {book?.original_pdf && (
                                            <a
                                                href={
                                                    canDownload
                                                        ? getPdfUrl(
                                                            book.original_pdf,
                                                        )
                                                        : "#"
                                                }
                                                download={canDownload}
                                                onClick={(e) =>
                                                    !canDownload &&
                                                    e.preventDefault()
                                                }
                                                className={`action-btn primary ${!canDownload ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                <i className="fas fa-download"></i>
                                                Download Book
                                            </a>
                                        )}
                                        {book?.compressed_pdf && (
                                            <a
                                                href={getPdfUrl(
                                                    book.compressed_pdf,
                                                )}
                                                download
                                                className="download-btn secondary"
                                            >
                                                <i className="fas fa-file-archive"></i>
                                                Compressed Version
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Publication Info */}
                                <div className="stats-group">
                                    <h4 className="stats-title">
                                        <i className="fas fa-calendar"></i>
                                        Publication
                                    </h4>
                                    <div className="stats-list">
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Added:
                                            </span>
                                            <span className="stat-value">
                                                {formatDate(book?.created_at)}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">
                                                Updated:
                                            </span>
                                            <span className="stat-value">
                                                {formatDate(book?.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Book Details Main Content */}
                            <div className="posts-grid-section">
                                <div className="section-header">
                                    <h2 className="section-title">
                                        {book?.title || "Untitled Book"}
                                    </h2>
                                    <div className="posts-count">
                                        Digital Book • PDF Format
                                    </div>
                                </div>

                                {/* Book Description */}
                                <div className="book-description-card">
                                    <h3 className="description-title">
                                        <i className="fas fa-align-left"></i>
                                        Book Description
                                    </h3>
                                    <div className="description-content">
                                        {book?.description ? (
                                            <div className="prose">
                                                {book.description}
                                            </div>
                                        ) : (
                                            <p className="no-description">
                                                No description available for
                                                this book.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* PDF Preview Section */}
                                {book?.original_pdf && (
                                    <div className="pdf-preview-card">
                                        <div className="preview-header">
                                            <h3 className="preview-title">
                                                <i className="fas fa-eye"></i>
                                                Book Preview
                                            </h3>
                                            <div className="preview-actions">
                                                <a
                                                    href={getPdfUrl(
                                                        book.original_pdf,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="preview-action-btn"
                                                >
                                                    <i className="fas fa-external-link-alt"></i>
                                                    Open in New Tab
                                                </a>
                                            </div>
                                        </div>

                                        <div className="pdf-preview-container">
                                            <div className="pdf-iframe-wrapper">
                                                <Document
                                                    file={`${getPdfUrl(book.original_pdf)}`}
                                                    onLoadSuccess={
                                                        onDocumentLoadSuccess
                                                    }
                                                    onLoadError={(error) => {
                                                        console.error(
                                                            "PDF loading error:",
                                                            error,
                                                        );
                                                        setPdfLoadError(true);
                                                        setIsPdfLoading(false);
                                                    }}
                                                    loading={
                                                        <div className="pdf-loading">
                                                            <div className="loading-spinner">
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            </div>
                                                            <p>
                                                                Loading PDF
                                                                document...
                                                            </p>
                                                        </div>
                                                    }
                                                >
                                                    <Page
                                                        pageNumber={pageNumber}
                                                        renderAnnotationLayer={
                                                            false
                                                        }
                                                        renderTextLayer={false}
                                                        loading={
                                                            <div className="pdf-loading">
                                                                <p>
                                                                    Loading page{" "}
                                                                    {pageNumber}
                                                                    ...
                                                                </p>
                                                            </div>
                                                        }
                                                    />
                                                </Document>
                                            </div>
                                        </div>

                                        <div className="pdf-info-footer">
                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <Button
                                                        onClick={prevPage}
                                                        type="primary"
                                                        disabled={
                                                            pageNumber <= 1
                                                        }
                                                    >
                                                        &laquo; Prev
                                                    </Button>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">
                                                        Counter
                                                    </span>
                                                    <span className="info-value">
                                                        Page {pageNumber} of{" "}
                                                        {numPages}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <Button
                                                        onClick={nextPage}
                                                        type="primary"
                                                        disabled={
                                                            pageNumber >=
                                                            numPages
                                                        }
                                                    >
                                                        Next &raquo;
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="action-buttons-grid">
                                    {book?.original_pdf && (
                                        <a
                                            href={
                                                canDownload
                                                    ? getPdfUrl(
                                                        book.original_pdf,
                                                    )
                                                    : "#"
                                            }
                                            download={canDownload}
                                            onClick={(e) =>
                                                !canDownload &&
                                                e.preventDefault()
                                            }
                                            className={`action-btn primary ${!canDownload ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <i className="fas fa-download"></i>
                                            Download Book
                                        </a>
                                    )}
                                    {book?.original_pdf && (
                                        <a
                                            href={getPdfUrl(book.original_pdf)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="action-btn secondary"
                                        >
                                            <i className="fas fa-book-open"></i>
                                            Read Online
                                        </a>
                                    )}
                                    <button
                                        className="action-btn outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                window.location.href,
                                            );
                                            alert("Page URL copied!");
                                        }}
                                    >
                                        <i className="fas fa-share"></i>
                                        Share Book
                                    </button>
                                </div>

                                {/* Additional Information */}
                                <div className="additional-info-card">
                                    <h3 className="info-title">
                                        <i className="fas fa-info-circle"></i>
                                        Additional Information
                                    </h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">
                                                Publication Date
                                            </span>
                                            <span className="info-value">
                                                {formatDate(book?.created_at)}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Last Updated
                                            </span>
                                            <span className="info-value">
                                                {formatDate(book?.updated_at)}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                Total Views
                                            </span>
                                            <span className="info-value">
                                                {book?.view || 0}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">
                                                File Format
                                            </span>
                                            <span className="info-value">
                                                PDF
                                            </span>
                                        </div>
                                    </div>
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
                    max-width: 100%;
                    color: white;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(20, 108, 32, 0.9) 0%,
                            rgba(46, 139, 87, 0.9) 100%
                        ),
                        url("https://i.postimg.cc/wx0LVLsG/footer-decor-full.png");
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
                    max-width: 100%;
                    margin: 0 auto;
                }

                /* Book Info Sidebar */
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
                    border-bottom: 2px solid #f0f0f0;
                }

                .filter-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #ffffffff;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .filter-title i {
                    color: #1b7a3a;
                }

                /* Book Cover */
                .book-cover-container {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .book-cover {
                    width: 100%;
                    max-width: 200px;
                    border-radius: 12px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    border: 3px solid white;
                }

                /* Stats Group */
                .stats-group {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                }

                .stats-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffffff;
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
                    color: #ffffffff;
                }

                .stat-value {
                    color: #ffffffff;
                    font-weight: 600;
                }

                /* Download Options */
                .download-options {
                    margin: 25px 0;
                }

                .download-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .download-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 15px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    text-align: center;
                    justify-content: center;
                }

                .download-btn.primary {
                    background: linear-gradient(
                        135deg,
                        #1b7a3a 0%,
                        #2e8b57 100%
                    );
                    color: white;
                }

                .download-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                .download-btn.secondary {
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                }

                .download-btn.secondary:hover {
                    background: white;
                    color: #1b7a3a;
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

                /* Book Description Card */
                .book-description-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    margin-bottom: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    border: 1px solid #f0f0f0;
                }

                .description-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .description-content {
                    color: #666;
                    line-height: 1.6;
                }

                .prose {
                    max-width: none;
                }

                .no-description {
                    color: #888;
                    font-style: italic;
                }

                /* PDF Preview Card */
                .pdf-preview-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    margin-bottom: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    border: 1px solid #f0f0f0;
                }

                .preview-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .preview-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .preview-actions {
                    display: flex;
                    gap: 10px;
                }

                .preview-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border: 2px solid #1b7a3a;
                    border-radius: 6px;
                    color: #1b7a3a;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .preview-action-btn:hover {
                    background: #1b7a3a;
                    color: white;
                }

                .pdf-preview-container {
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f8f9fa;
                    position: relative;
                }

                .pdf-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 500px;
                    color: #666;
                }

                .loading-spinner {
                    font-size: 2rem;
                    margin-bottom: 15px;
                    color: #1b7a3a;
                }

                .pdf-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 500px;
                    text-align: center;
                    padding: 40px;
                }

                .error-icon {
                    font-size: 3rem;
                    color: #dc3545;
                    margin-bottom: 20px;
                }

                .pdf-error h4 {
                    color: #333;
                    margin-bottom: 10px;
                }

                .pdf-error p {
                    color: #666;
                    margin-bottom: 25px;
                }

                .error-actions {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .error-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .error-btn.primary {
                    background: #1b7a3a;
                    color: white;
                }

                .error-btn.primary:hover {
                    background: #15652e;
                }

                .error-btn.secondary {
                    background: transparent;
                    color: #1b7a3a;
                    border: 2px solid #1b7a3a;
                }

                .error-btn.secondary:hover {
                    background: #1b7a3a;
                    color: white;
                }

                .pdf-iframe-wrapper {
                    width: 100%;
                }

                .pdf-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                .pdf-info-footer {
                    margin-top: 20px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    text-align: center;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .info-label {
                    font-size: 12px;
                    color: #666;
                    font-weight: 500;
                }

                .info-value {
                    font-size: 14px;
                    color: #333;
                    font-weight: 600;
                }

                /* Action Buttons */
                .action-buttons-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                }

                .action-btn.primary {
                    background: linear-gradient(
                        135deg,
                        #1b7a3a 0%,
                        #2e8b57 100%
                    );
                    color: white;
                }

                .action-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                .action-btn.secondary {
                    background: white;
                    color: #1b7a3a;
                    border: 2px solid #1b7a3a;
                }

                .action-btn.secondary:hover {
                    background: #1b7a3a;
                    color: white;
                    transform: translateY(-2px);
                }

                .action-btn.outline {
                    background: transparent;
                    color: #666;
                    border: 2px solid #e0e0e0;
                }

                .action-btn.outline:hover {
                    background: #f8f9fa;
                    border-color: #666;
                    color: #333;
                }

                /* Additional Info Card */
                .additional-info-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    border: 1px solid #f0f0f0;
                }

                .info-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
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

                    .info-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                }

                @media (max-width: 768px) {
                    .section-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .preview-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .action-buttons-grid {
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

                    .book-description-card,
                    .pdf-preview-card,
                    .additional-info-card {
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

                    .error-actions {
                        flex-direction: column;
                        width: 100%;
                    }

                    .error-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .preview-actions {
                        flex-direction: column;
                        width: 100%;
                    }

                    .preview-action-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
                .pdf-iframe-wrapper {
                    height: auto !important;
                }
                .pdf-page-container {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

                /* This ensures the PDF page scales properly */
                .react-pdf__Page {
                    display: flex;
                    justify-content: center;
                }

                .react-pdf__Page__canvas {
                    max-width: 100%;
                    height: auto !important;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
