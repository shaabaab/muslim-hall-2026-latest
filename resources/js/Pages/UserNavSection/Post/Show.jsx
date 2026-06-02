import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import { Link, router, usePage, Head } from "@inertiajs/react";
import {
    Typography,
    Tag,
    Button,
    message,
    Popconfirm,
    Space,
    Row,
    Col,
    Image,
    Card,
    Statistic,
    Descriptions,
    Alert,
} from "antd";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PDFViewer from "@/Components/PDFViewer";
import ImageContent from "@/Pages/Front/ImageContent";

import {
    ArrowLeftOutlined,
    EyeOutlined,
    CalendarOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    FilePdfOutlined,
    AudioOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeFilled,
    ShareAltOutlined,
    DownloadOutlined,
    HistoryOutlined,
    FolderOutlined,
    FolderOpenOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

/** ✅ Custom small info dropdown (no Ant Design) */
const PostInfoMini = ({ title = "Info", items = [] }) => {
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

export default function Show() {
    const { post, auth } = usePage().props;
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
    }, []);

    const handleDelete = () => {
        router.delete(route("user.posts.destroy", post.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.success("Post deleted successfully");
                router.visit(route("user.posts.index"));
            },
            onError: () => {
                message.error("Failed to delete post");
            },
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const availableMediaTypes = useMemo(() => {
        const types = [];
        if (post?.image) types.push("image");
        // Only count pdfs that are actually done (not still processing)
        if (post?.pdf && post.pdf !== 'processing') types.push("pdf");
        if (post?.pdfs?.some(p => p.pdf && p.pdf !== 'processing')) types.push("pdf");
        if (post?.content) types.push("content");
        if (post?.video && post.video !== 'processing') types.push("video");
        if (post?.video_url) types.push("video");
        if (post?.videos?.some(v => v.video && v.video !== 'processing')) types.push("video");
        if (post?.audio && post.audio !== 'processing') types.push("audio");
        if (post?.audios?.some(a => a.audio && a.audio !== 'processing')) types.push("audio");
        if (post?.post_audios?.some(a => a.audio && a.audio !== 'processing')) types.push("audio");
        // Deduplicate
        return [...new Set(types)];
    }, [post]);

    const postItems = [
        { label: "Category", value: post.category?.name || "General", icon: <FolderOpenOutlined /> },
        { label: "Published", value: formatDate(post.created_at), icon: <CalendarOutlined /> },
        { label: "Views", value: post.viewer_count || 0, icon: <EyeOutlined /> },
        { label: "Content Type", value: availableMediaTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", "), icon: <FileTextOutlined /> },
    ];

    const handleSocialShare = (platform) => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(post?.title || "");
        let shareUrl = "";
        switch (platform) {
            case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`; break;
            case "whatsapp": shareUrl = `https://wa.me/?text=${title}%20${url}`; break;
            default: return;
        }
        window.open(shareUrl, "_blank", "width=600,height=400");
    };

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Post Preview">
            <Head title={post?.title} />
            <div className="blog-wrapper">
                {toast.show && <div className={`toast-message ${toast.type}`}>{toast.message}</div>}

                <div className="container mt-0 mt-md-5">
                    {/* Header Actions */}
                    <div className="admin-actions-bar mb-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <Link href={route("user.posts.index")}>
                                <Button icon={<ArrowLeftOutlined />} type="text">Back to My Posts</Button>
                            </Link>

                            <Space wrap>
                                <Tag color={post.status == 1 ? "green" : "orange"}>
                                    {post.status == 1 ? "PUBLISHED" : "DRAFT"}
                                </Tag>
                                <Link href={route("user.posts.edit", post.id)}>
                                    <Button type="primary" icon={<EditOutlined />}>Edit Post</Button>
                                </Link>
                                <Popconfirm
                                    title="Delete post?"
                                    onConfirm={handleDelete}
                                    okText="Yes"
                                    cancelText="No"
                                    okType="danger"
                                >
                                    <Button danger icon={<DeleteOutlined />}>Delete</Button>
                                </Popconfirm>
                            </Space>
                        </div>
                    </div>

                    <header className="post-header-section">
                        <h1 className="main-heading">{post.title}</h1>
                        <div className="info-wrap">
                            <PostInfoMini title="Info" items={postItems} />
                        </div>
                    </header>

                    <div className="max-w-5xl mx-auto">
                        <main className="content-column">
                            <ImageContent post={post} />
                            
                            {/* PDF Section — skip files still processing */}
                            {(post.pdf && post.pdf !== 'processing' ||
                              post.pdfs?.some(p => p.pdf && p.pdf !== 'processing')) && (
                                <div className="pdf-section">
                                    {post.pdf && post.pdf !== 'processing' && (
                                        <div className="mb-4"><PDFViewer pdfPath={getS3PublicUrl(post.pdf)} /></div>
                                    )}
                                    {post.pdfs
                                        ?.filter(p => p.pdf && p.pdf !== 'processing')
                                        .map((item, idx) => (
                                            <div key={idx} className="mb-4">
                                                <PDFViewer pdfPath={getS3PublicUrl(item.pdf)} />
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Content */}
                            {post.content && (
                                <div className="article-section">
                                    <article className="article-body">
                                        <div className="rich-text" dangerouslySetInnerHTML={{ __html: post.content }} />
                                    </article>
                                </div>
                            )}

                            {/* Video Section — skip files still processing */}
                            {(post.video && post.video !== 'processing' ||
                              post.video_url ||
                              post.videos?.some(v => v.video && v.video !== 'processing')) && (
                                <div className="video-section">
                                    {post.video && post.video !== 'processing' && (
                                        <div className="video-wrapper mb-4">
                                            <video controls className="video-player">
                                                <source src={getS3PublicUrl(post.video)} />
                                            </video>
                                        </div>
                                    )}
                                    {post.videos
                                        ?.filter(v => v.video && v.video !== 'processing')
                                        .map((item, idx) => (
                                            <div key={idx} className="video-wrapper mb-4">
                                                <video controls className="video-player">
                                                    <source src={getS3PublicUrl(item.video)} />
                                                </video>
                                            </div>
                                        ))}
                                    {post.video_url && (
                                        <div className="video-embed-wrapper mb-4">
                                            <iframe src={post.video_url} className="video-iframe" allowFullScreen />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audio Section — skip files still processing */}
                            {(post.audio && post.audio !== 'processing' ||
                              post.audios?.some(a => a.audio && a.audio !== 'processing')) && (
                                <div className="audio-section mb-4 p-4 bg-gray-50 rounded-lg">
                                    {post.audio && post.audio !== 'processing' && (
                                        <audio controls className="w-full mb-2">
                                            <source src={getS3PublicUrl(post.audio)} />
                                        </audio>
                                    )}
                                    {post.audios
                                        ?.filter(a => a.audio && a.audio !== 'processing')
                                        .map((item, idx) => (
                                            <audio key={idx} controls className="w-full mb-2">
                                                <source src={getS3PublicUrl(item.audio)} />
                                            </audio>
                                        ))}
                                </div>
                            )}

                            {/* Social Share */}
                            <div className="engagement-row py-4 border-t border-b border-gray-100 my-8 flex justify-between items-center">
                                <div className="share-cluster flex items-center gap-3">
                                    <span className="font-bold text-gray-500">Share:</span>
                                    <button onClick={() => handleSocialShare("facebook")} className="social-btn fb"><i className="fab fa-facebook-f"></i></button>
                                    <button onClick={() => handleSocialShare("twitter")} className="social-btn tw"><i className="fab fa-twitter"></i></button>
                                    <button onClick={() => handleSocialShare("whatsapp")} className="social-btn wa"><i className="fab fa-whatsapp"></i></button>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                <style jsx global>{`
                    .blog-wrapper { background: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
                    .admin-actions-bar { background: #f8fafc; padding: 1rem; border-bottom: 1px solid #e2e8f0; }
                    .main-heading { font-size: 2.5rem; font-weight: 800; color: #1e293b; text-align: center; margin: 2rem 0; }
                    .info-wrap { max-width: 600px; margin: 0 auto 3rem; }
                    .pi-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .pi-head { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #f8fafc; border: none; cursor: pointer; }
                    .pi-title { font-weight: 700; color: #475569; }
                    .pi-body { max-height: 0; opacity: 0; transition: all 0.3s ease; overflow: hidden; }
                    .pi-body.open { max-height: 500px; opacity: 1; padding: 0.5rem 0; }
                    .pi-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-top: 1px solid #f1f5f9; }
                    .pi-ico { font-size: 1.25rem; color: #10b981; }
                    .pi-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
                    .pi-val { font-weight: 700; color: #1e293b; }
                    .article-body { font-size: 1.125rem; line-height: 1.75; color: #334155; }
                    .rich-text :global(p) { margin-bottom: 1.5rem; }
                    .rich-text :global(img) { border-radius: 12px; margin: 2rem 0; max-width: 100%; }
                    .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 12px; overflow: hidden; background: #000; }
                    .video-player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                    .video-embed-wrapper { position: relative; padding-bottom: 56.25%; height: 0; border-radius: 12px; overflow: hidden; }
                    .video-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
                    .social-btn { width: 40px; height: 40px; border-radius: 50%; color: #fff; border: none; cursor: pointer; display: grid; place-items: center; transition: transform 0.2s; }
                    .social-btn:hover { transform: scale(1.1); }
                    .social-btn.fb { background: #3b5998; }
                    .social-btn.tw { background: #1da1f2; }
                    .social-btn.wa { background: #25d366; }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}
