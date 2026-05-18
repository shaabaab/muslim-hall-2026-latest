import { Link, router } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

import {
    CalendarOutlined,
    EyeOutlined,
    LikeOutlined,
    TrophyOutlined,
    UserOutlined,
    FolderOpenOutlined,
    EditOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import ImageContent from "../../../Front/ImageContent";
import PDFViewer from "@/Components/PDFViewer";
const getStorageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return getS3PublicUrl(path);
};
/** ✅ Reused PostInfoMini pattern — same as PostDetails */
const EntryInfoMini = ({ title = "Info", items = [] }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="pi-wrap">
            <button
                type="button"
                className="pi-head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="pi-title">{title}</span>
                <span className={`pi-chevron ${open ? "open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </button>
            <div className={`pi-body ${open ? "open" : ""}`}>
                {items.map((it, idx) => (
                    <div key={idx} className="pi-row">
                        <div className="pi-ico">{it.icon}</div>
                        <div className="pi-text">
                            <div className="pi-label">{it.label}</div>
                            <div className="pi-val">{it.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function Show({ entry, auth }) {
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const can = (permission) => auth?.user?.permissions?.includes(permission);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "" }),
            4000,
        );
    };

    const handleDelete = () => {
        router.delete(route("user.entries.destroy", entry.id), {
            onSuccess: () => showToast("Entry deleted successfully", "success"),
            onError: () => showToast("Failed to delete entry", "error"),
        });
        setDeleteConfirm(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getUserDisplay = () => {
        if (!entry?.user) return "N/A";
        if (typeof entry.user === "object")
            return entry.user.name || `User #${entry.user.id}`;
        return `User #${entry.user_id}`;
    };

    const getContestDisplay = () => {
        if (!entry?.contest) return "N/A";
        if (typeof entry.contest === "object")
            return entry.contest.title || `Contest #${entry.contest.id}`;
        return `Contest #${entry.contest_id}`;
    };

    const getVoteStats = () => {
        if (!entry?.votes || !Array.isArray(entry.votes))
            return { total: 0, recent: 0 };
        const total = entry.votes.length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = entry.votes.filter(
            (v) => new Date(v.created_at) > sevenDaysAgo,
        ).length;
        return { total, recent };
    };

    const getStatusConfig = (status) => {
        const map = {
            approved: {
                label: "Approved",
                color: "#16a34a",
                bg: "#dcfce7",
                icon: <CheckCircleOutlined />,
            },
            pending: {
                label: "Pending",
                color: "#d97706",
                bg: "#fef3c7",
                icon: <ClockCircleOutlined />,
            },
            rejected: {
                label: "Rejected",
                color: "#dc2626",
                bg: "#fee2e2",
                icon: <CloseCircleOutlined />,
            },
        };
        return (
            map[status] || {
                label: status || "Unknown",
                color: "#64748b",
                bg: "#f1f5f9",
                icon: null,
            }
        );
    };

    // const renderMediaPreview = () => {
    //     if (!entry?.media_path) return null;

    //     const ext = entry.media_path.split(".").pop()?.toLowerCase();
    //     const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    //     const isVideo = ["mp4", "mov", "avi", "webm"].includes(ext);
    //     const isPDF = ext === "pdf";
    //     const isWord = ["doc", "docx"].includes(ext);

    //     if (isImage) {
    //         return (
    //             <div className="media-wrap">
    //                 <img
    //                     src={`/storage/${entry.media_path}`}
    //                     alt={entry.title || "Entry media"}
    //                     className="media-img"
    //                     loading="lazy"
    //                 />
    //             </div>
    //         );
    //     }

    //     if (isVideo) {
    //         return (
    //             <div className="media-wrap">
    //                 <div className="video-wrapper">
    //                     <video controls className="video-player">
    //                         <source
    //                             src={`/storage/${entry.media_path}`}
    //                             type="video/mp4"
    //                         />
    //                         Your browser does not support the video tag.
    //                     </video>
    //                 </div>
    //             </div>
    //         );
    //     }

    //     if (isPDF || isWord) {
    //         return (
    //             <a
    //                 href={`/storage/${entry.media_path}`}
    //                 target="_blank"
    //                 rel="noreferrer"
    //                 className="download-btn"
    //             >
    //                 <FileTextOutlined />
    //                 <span>Download {isPDF ? "PDF" : "Word Document"}</span>
    //             </a>
    //         );
    //     }

    //     return (
    //         <a
    //             href={`/storage/${entry.media_path}`}
    //             target="_blank"
    //             rel="noreferrer"
    //             className="download-btn"
    //         >
    //             <FileTextOutlined />
    //             <span>Download File</span>
    //         </a>
    //     );
    // };

    const PdfContent = () => {
        if (!entry?.pdf_content && !entry?.pdf) return null;

        if (entry.pdf === "processing") {
            return (
                <div className="pdf-section p-6 text-center bg-gray-50 border border-gray-200 rounded-lg">
                    <FileTextOutlined className="text-4xl text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">Your PDF is currently being processed.</p>
                </div>
            );
        }

        return (
            <div className="pdf-section">
                {entry?.pdf && (
                    // <PDFViewer pdfPath={getS3PublicUrl(entry.pdf)} />
                    <PDFViewer pdfPath={getStorageUrl(entry.pdf)} />
                )}
                {entry?.pdf && (
                    <div className="pdf-download-section">
                        {/* keep as-is */}
                    </div>
                )}
            </div>
        );
    };

    const VideoContent = () => {
        if (!entry?.video && !entry?.video_url) return null;

        const getEmbedUrl = (url) => {
            if (!url) return null;

            // 1. If it's an iframe tag, extract the src
            if (url.includes("<iframe")) {
                const match = url.match(/src=["']([^"']+)["']/);
                if (match && match[1]) {
                    url = match[1];
                }
            }

            url = url.trim();

            // 2. YouTube handling
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                if (url.includes("watch?v=")) {
                    videoId = url.split("watch?v=")[1]?.split("&")[0];
                } else if (url.includes("youtu.be/")) {
                    videoId = url.split("youtu.be/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/embed/")) {
                    videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/shorts/")) {
                    videoId = url
                        .split("youtube.com/shorts/")[1]
                        ?.split("?")[0];
                }
                return videoId
                    ? `https://www.youtube.com/embed/${videoId}`
                    : url;
            }

            // 3. Facebook handling
            if (url.includes("facebook.com") || url.includes("fb.watch")) {
                if (url.includes("facebook.com/plugins/video.php")) return url;
                return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
            }

            return url;
        };

        const embedUrl = getEmbedUrl(entry.video_url);

        if (entry.video === "processing") {
            return (
                <div className="video-section">
                    <div className="video-player-container bg-gray-50 p-10 text-center rounded-lg border border-gray-200">
                        <ClockCircleOutlined className="text-4xl text-blue-400 mb-2" />
                        <h3 className="text-gray-700 font-semibold mb-1">Video is Processing</h3>
                        <p className="text-gray-500 text-sm">Please wait a few minutes while we process your video.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="video-section">
                {entry?.video && (
                    <div className="video-player-container">
                        <div className="video-wrapper">
                            <video
                                controls
                                className="video-player"
                                // poster={
                                //     entry.image
                                //         ? getS3PublicUrl(entry.image)
                                //         : entry.thumbnail
                                //           ? getS3PublicUrl(entry.thumbnail)
                                //           : ""
                                // }

                                poster={
                                    entry.image
                                        ? getStorageUrl(entry.image)
                                        : entry.thumbnail
                                            ? getStorageUrl(entry.thumbnail)
                                            : ""
                                }
                            >
                                <source src={getStorageUrl(entry.video)} />
                                {/* <source src={getS3PublicUrl(entry.video)} /> */}
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                )}

                {embedUrl && (
                    <div className="video-embed-container">
                        <div className="video-embed-wrapper">
                            <iframe
                                src={embedUrl}
                                title={entry.title}
                                className="video-iframe"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const AudioContent = () => {
        if (!entry?.audio) return null;

        if (entry.audio === "processing") {
            return (
                <div className="audio-section">
                    <div className="audio-player-container bg-gray-50 py-6 text-center rounded-lg border border-gray-200">
                        <ClockCircleOutlined className="text-3xl text-green-400 mb-2" />
                        <p className="text-gray-600 font-medium">Your audio track is being processed.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="audio-section">
                <div className="audio-player-container">
                    <div className="audio-player-wrapper">
                        <audio controls className="audio-player">
                            <source
                                // src={getS3PublicUrl(entry.audio)}
                                src={getStorageUrl(entry.audio)}
                                type="audio/mpeg"
                            />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            </div>
        );
    };

    const voteStats = getVoteStats();
    const statusConfig = getStatusConfig(entry?.status);

    const entryInfoItems = [
        {
            label: "Contest",
            value: getContestDisplay(),
            icon: <TrophyOutlined />,
        },
        {
            label: "Submitted By",
            value: getUserDisplay(),
            icon: <UserOutlined />,
        },
        {
            label: "Submitted",
            value: formatDate(entry?.created_at),
            icon: <CalendarOutlined />,
        },
        {
            label: "Total Votes",
            value: voteStats.total,
            icon: <LikeOutlined />,
        },
    ];

    return (
        <FrontAuthenticatedLayout user={auth?.user} header="Entry Details">
            <div className="entry-wrapper">
                {/* Toast */}
                {toast.show && (
                    <div className={`toast-message ${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                {/* Delete Confirm Modal */}
                {deleteConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h3 className="modal-title">Delete this entry?</h3>
                            <p className="modal-desc">
                                This action cannot be undone.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="modal-cancel"
                                    onClick={() => setDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modal-confirm"
                                    onClick={handleDelete}
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="container mt-0 mt-md-5">
                    {/* ── Header ── */}
                    <header className="post-header-section">
                        <div className="title-wrap">
                            <div className="entry-trophy-icon">
                                <TrophyOutlined />
                            </div>
                            <h1 className="main-heading">
                                {entry?.title || "Untitled Entry"}
                            </h1>
                            <div
                                className="status-badge"
                                style={{
                                    color: statusConfig.color,
                                    background: statusConfig.bg,
                                }}
                            >
                                {statusConfig.icon}
                                <span>{statusConfig.label}</span>
                            </div>
                        </div>

                        <div className="info-wrap">
                            <EntryInfoMini
                                title="Entry Info"
                                items={entryInfoItems}
                            />
                        </div>
                    </header>

                    {/* ── Action Bar ── */}
                    <div className="action-bar">
                        <Link
                            href={route("user.own_entry.index")}
                            className="action-btn back"
                        >
                            <ArrowLeftOutlined />
                            <span>Back to Entries</span>
                        </Link>
                        <div className="action-right">
                            {can("edit-entry") && (
                                <Link
                                    href={route("user.entries.edit", entry.id)}
                                    className="action-btn edit"
                                >
                                    <EditOutlined />
                                    <span>Edit Entry</span>
                                </Link>
                            )}
                            {can("delete-entry") && (
                                <button
                                    className="action-btn delete"
                                    onClick={() => setDeleteConfirm(true)}
                                >
                                    <DeleteOutlined />
                                    <span>Delete</span>
                                </button>
                            )}
                            <Link
                                href={route(
                                    "user.contests.show",
                                    entry?.contest_id,
                                )}
                                className="action-btn contest"
                            >
                                <TrophyOutlined />
                                <span>View Contest</span>
                            </Link>
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <main className="content-column">
                            {/* ── Media ── */}

                            <ImageContent post={entry} />
                            <PdfContent />

                            <VideoContent />
                            <AudioContent />
                            {/* ── Entry Content ── */}
                            {entry?.content && (
                                <section className="content-card">
                                    <div className="card-header-row">
                                        <FileTextOutlined className="card-header-icon" />
                                        <span>Entry Content</span>
                                    </div>
                                    <article className="article-body">
                                        <div
                                            className="rich-text"
                                            dangerouslySetInnerHTML={{
                                                __html: entry.content,
                                            }}
                                        />
                                    </article>
                                </section>
                            )}

                            {/* ── Vote Stats ── */}
                            <section className="content-card">
                                <div className="card-header-row">
                                    <LikeOutlined className="card-header-icon" />
                                    <span>Vote Statistics</span>
                                </div>
                                <div className="stats-row">
                                    <div className="stat-bubble">
                                        <div className="stat-number">
                                            {voteStats.total}
                                        </div>
                                        <div className="stat-label">
                                            Total Votes
                                        </div>
                                    </div>
                                    <div className="stat-bubble accent">
                                        <div className="stat-number">
                                            {voteStats.recent}
                                        </div>
                                        <div className="stat-label">
                                            Last 7 Days
                                        </div>
                                    </div>
                                </div>

                                {/* Votes list */}
                                {entry?.votes && entry.votes.length > 0 ? (
                                    <div className="votes-list">
                                        <div className="votes-list-title">
                                            Recent Votes
                                        </div>
                                        {entry.votes.map((vote, idx) => (
                                            <div
                                                key={vote.id || idx}
                                                className="vote-row"
                                            >
                                                <div className="vote-avatar">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${vote.user?.name || "V"}&background=1b7a3a&color=fff`}
                                                        alt={vote.user?.name}
                                                    />
                                                </div>
                                                <div className="vote-details">
                                                    <span className="vote-name">
                                                        {vote.user?.name ||
                                                            `User #${vote.user_id}`}
                                                    </span>
                                                    <span className="vote-date">
                                                        {formatDate(
                                                            vote.created_at,
                                                        )}
                                                    </span>
                                                    {vote.comment && (
                                                        <span className="vote-comment">
                                                            "{vote.comment}"
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="vote-icon">
                                                    <LikeOutlined />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-msg">No votes yet.</p>
                                )}
                            </section>

                            {/* ── Author / Submitter Box ── (mirrors PostDetails author-bio-box) */}
                            <div className="author-bio-box text-muted">
                                <div className="bio-avatar">
                                    <span>
                                        {entry?.user?.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "U"}
                                    </span>
                                </div>
                                <div className="bio-info">
                                    <h5>{getUserDisplay()}</h5>
                                    <p>
                                        Contest participant · Submitted on{" "}
                                        {formatDate(entry?.created_at)}
                                    </p>
                                    {entry?.updated_at &&
                                        entry.updated_at !==
                                        entry.created_at && (
                                            <p style={{ marginTop: 4 }}>
                                                Last updated:{" "}
                                                {formatDate(entry.updated_at)}
                                            </p>
                                        )}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                {/* ── Styles (same design tokens as PostDetails) ── */}
                <style jsx>{`
                    .entry-wrapper {
                        background-color: #fdfdfd;
                        font-family: "Inter", sans-serif;
                        color: #333;
                        min-height: 100vh;
                    }

                    /* ── Toast ── */
                    .toast-message {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        z-index: 9999;
                        animation: slideIn 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
                    .toast-message.success {
                        background: #10b981;
                        color: white;
                    }
                    .toast-message.error {
                        background: #ef4444;
                        color: white;
                    }
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    /* ── Modal ── */
                    .modal-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.45);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                    }
                    .modal-box {
                        background: white;
                        border-radius: 14px;
                        padding: 32px;
                        max-width: 400px;
                        width: 90%;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    }
                    .modal-title {
                        font-size: 18px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 8px;
                    }
                    .modal-desc {
                        color: #64748b;
                        font-size: 14px;
                        margin: 0 0 24px;
                    }
                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }
                    .modal-cancel {
                        padding: 10px 20px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        color: #334155;
                    }
                    .modal-confirm {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        background: #ef4444;
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .modal-confirm:hover {
                        background: #dc2626;
                    }

                    /* ── Header ── (mirrors PostDetails post-header-section) */
                    .post-header-section {
                        text-align: center;
                        margin-bottom: 26px;
                        max-width: 780px;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .title-wrap {
                        padding: 0 10px;
                    }
                    .entry-trophy-icon {
                        font-size: 28px;
                        color: #f59e0b;
                        margin-bottom: 10px;
                    }
                    .main-heading {
                        line-height: 1.25;
                        color: #0f172a;
                        margin: 0 0 12px;
                        letter-spacing: -0.2px;
                    }
                    .status-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 14px;
                        border-radius: 999px;
                        font-size: 13px;
                        font-weight: 700;
                        margin-bottom: 16px;
                    }

                    /* ── Info dropdown (identical to PostDetails pi-*) ── */
                    .info-wrap {
                        max-width: 520px;
                        margin: 0 auto;
                    }
                    .pi-wrap {
                        border-radius: 14px;
                        background: rgba(248, 250, 252, 0.92);
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                        overflow: hidden;
                    }
                    .pi-head {
                        width: 100%;
                        background: transparent;
                        border: none;
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        cursor: pointer;
                    }
                    .pi-title {
                        font-size: 13px;
                        font-weight: 800;
                        color: #0f172a;
                        letter-spacing: 0.2px;
                    }
                    .pi-chevron {
                        width: 30px;
                        height: 30px;
                        border-radius: 10px;
                        display: grid;
                        place-items: center;
                        color: #334155;
                        background: rgba(226, 232, 240, 0.65);
                        transition:
                            transform 0.2s ease,
                            background 0.2s ease;
                    }
                    .pi-chevron.open {
                        transform: rotate(180deg);
                        background: rgba(226, 232, 240, 0.9);
                    }
                    .pi-body {
                        max-height: 0;
                        opacity: 0;
                        overflow: hidden;
                        transition:
                            max-height 0.28s ease,
                            opacity 0.2s ease;
                    }
                    .pi-body.open {
                        max-height: 500px;
                        opacity: 1;
                    }
                    .pi-row {
                        display: flex;
                        gap: 10px;
                        padding: 10px 12px;
                        border-top: 1px solid rgba(226, 232, 240, 0.85);
                    }
                    .pi-ico {
                        width: 34px;
                        height: 34px;
                        border-radius: 10px;
                        display: grid;
                        place-items: center;
                        background: rgba(226, 232, 240, 0.6);
                        color: #0f172a;
                        flex: 0 0 auto;
                    }
                    .pi-text {
                        min-width: 0;
                        flex: 1;
                    }
                    .pi-label {
                        font-size: 11px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                    }
                    .pi-val {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        line-height: 1.25;
                        margin-top: 2px;
                        word-break: break-word;
                    }

                    /* ── Action Bar ── */
                    .action-bar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 10px;
                        max-width: 860px;
                        margin: 0 auto 28px;
                        padding: 0 4px;
                    }
                    .action-right {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    .action-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        padding: 9px 18px;
                        border-radius: 10px;
                        font-size: 13px;
                        font-weight: 700;
                        cursor: pointer;
                        border: none;
                        text-decoration: none;
                        transition: all 0.18s ease;
                    }
                    .action-btn.back {
                        background: rgba(226, 232, 240, 0.6);
                        color: #334155;
                        border: 1px solid rgba(226, 232, 240, 0.9);
                    }
                    .action-btn.back:hover {
                        background: rgba(226, 232, 240, 0.9);
                    }
                    .action-btn.edit {
                        background: #1b7a3a;
                        color: white;
                    }
                    .action-btn.edit:hover {
                        background: #155d28;
                    }
                    .action-btn.delete {
                        background: #fee2e2;
                        color: #dc2626;
                        border: 1px solid #fecaca;
                    }
                    .action-btn.delete:hover {
                        background: #fecaca;
                    }
                    .action-btn.contest {
                        background: #fef3c7;
                        color: #92400e;
                        border: 1px solid #fde68a;
                    }
                    .action-btn.contest:hover {
                        background: #fde68a;
                    }

                    /* ── Content Cards ── */
                    .content-column {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                    }
                    .content-card {
                        background: white;
                        border-radius: 14px;
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
                        overflow: hidden;
                    }
                    .card-header-row {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 14px 20px;
                        border-bottom: 1px solid rgba(226, 232, 240, 0.85);
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .card-header-icon {
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                        background: rgba(226, 232, 240, 0.6);
                        display: grid;
                        place-items: center;
                        font-size: 14px;
                        color: #1b7a3a;
                        flex: 0 0 auto;
                    }

                    /* ── Media ── */
                    .media-wrap {
                        padding: 16px;
                    }
                    .media-img {
                        width: 100%;
                        height: auto;
                        max-height: 500px;
                        object-fit: cover;
                        border-radius: 10px;
                        display: block;
                    }
                    .video-wrapper {
                        position: relative;
                        padding-bottom: 56.25%;
                        height: 0;
                        overflow: hidden;
                        border-radius: 10px;
                    }
                    .video-player {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 10px;
                    }
                    .download-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        margin: 16px 20px;
                        background: #1b7a3a;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        text-decoration: none;
                        transition: background 0.2s;
                    }
                    .download-btn:hover {
                        background: #155d28;
                        color: white;
                    }

                    /* ── Article ── */
                    .article-body {
                        font-family: "Merriweather", serif;
                        font-size: 17px;
                        line-height: 1.8;
                        color: #2c2c2c;
                        padding: 20px;
                    }
                    .rich-text :global(p) {
                        margin-bottom: 20px;
                    }
                    .rich-text :global(h2),
                    .rich-text :global(h3) {
                        font-family: "Inter", sans-serif;
                        font-weight: 700;
                        margin-top: 32px;
                        margin-bottom: 12px;
                        color: #111;
                    }
                    .rich-text :global(blockquote) {
                        background: #fff9c4;
                        border-left: 4px solid #fbc02d;
                        padding: 16px 20px;
                        margin: 24px 0;
                        font-style: italic;
                        border-radius: 4px;
                    }

                    /* ── Vote Stats ── */
                    .stats-row {
                        display: flex;
                        gap: 16px;
                        padding: 20px 20px 0;
                    }
                    .stat-bubble {
                        flex: 1;
                        background: rgba(248, 250, 252, 0.9);
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        border-radius: 12px;
                        padding: 18px;
                        text-align: center;
                    }
                    .stat-bubble.accent {
                        background: #eafaf1;
                        border-color: rgba(27, 122, 58, 0.2);
                    }
                    .stat-number {
                        font-size: 32px;
                        font-weight: 900;
                        color: #0f172a;
                        line-height: 1;
                    }
                    .stat-bubble.accent .stat-number {
                        color: #1b7a3a;
                    }
                    .stat-label {
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        color: #64748b;
                        margin-top: 6px;
                    }

                    /* ── Votes list ── (mirrors comment-block) */
                    .votes-list {
                        padding: 16px 20px 20px;
                    }
                    .votes-list-title {
                        font-size: 12px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        color: #64748b;
                        margin-bottom: 14px;
                    }
                    .vote-row {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(226, 232, 240, 0.7);
                    }
                    .vote-row:last-child {
                        border-bottom: none;
                    }
                    .vote-avatar img {
                        width: 38px;
                        height: 38px;
                        border-radius: 50%;
                        flex: 0 0 auto;
                    }
                    .vote-details {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }
                    .vote-name {
                        font-size: 14px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .vote-date {
                        font-size: 12px;
                        color: #94a3b8;
                    }
                    .vote-comment {
                        font-size: 13px;
                        color: #64748b;
                        font-style: italic;
                        margin-top: 2px;
                    }
                    .vote-icon {
                        color: #1b7a3a;
                        font-size: 14px;
                        padding-top: 4px;
                    }

                    .empty-msg {
                        padding: 20px;
                        color: #94a3b8;
                        font-size: 14px;
                        font-style: italic;
                        text-align: center;
                    }

                    /* ── Author box (identical to PostDetails) ── */
                    .author-bio-box {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 8px;
                        display: flex;
                        gap: 20px;
                        align-items: center;
                        margin-bottom: 50px;
                    }
                    .bio-avatar {
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, #1b7a3a, #34a853);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                        flex: 0 0 auto;
                    }
                    .bio-info h5 {
                        margin: 0 0 5px;
                        font-size: 16px;
                        font-weight: 700;
                    }
                    .bio-info p {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                    }

                    /* ── Responsive ── */
                    @media (max-width: 600px) {
                        .post-header-section {
                            text-align: left;
                            margin-bottom: 18px;
                        }
                        .main-heading {
                            font-size: 22px;
                        }
                        .info-wrap {
                            max-width: 100%;
                        }
                        .action-bar {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .action-right {
                            width: 100%;
                        }
                        .stats-row {
                            flex-direction: column;
                        }
                        .author-bio-box {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .pi-head {
                            padding: 10px;
                        }
                        .pi-row {
                            padding: 10px;
                        }
                        .container {
                            padding: 18px 12px 50px;
                        }
                    }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}
