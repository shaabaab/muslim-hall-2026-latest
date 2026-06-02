import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import FrontAuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl, buildS3UrlAlways } from "@/Utils/s3Helpers";
import MultipleMediaUpload from "@/Components/MultipleMediaUpload";
import UploadProgressModal from "@/Components/UploadProgressModal";
import { useBackgroundUpload } from "@/Contexts/BackgroundUploadContext";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Dropdown,
    Grid,
    Image,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Tabs,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    AudioOutlined,
    CloudSyncOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    DownOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    GlobalOutlined,
    HistoryOutlined,
    PictureOutlined,
    PlusOutlined,
    SaveOutlined,
    TagOutlined,
    UploadOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";

// ✅ Quill Direct (NO findDOMNode warning, NO splitText crash)
import Quill from "quill";
import "quill/dist/quill.snow.css";
import MagicUrl from "quill-magic-url";

Quill.register("modules/magicUrl", MagicUrl);
const Font = Quill.import("formats/font");
Font.whitelist = [
    "cairo",
    "times-new-roman",
    "amiri",
    "solaiman-lipi",
    "noto-sans-bengali",
    "sans-serif",
    "serif",
    "monospace",
];
Quill.register(Font, true);

const { Text } = Typography;
const { useBreakpoint } = Grid;

/**
 * ✅ Video URL Handling Helpers
 */
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
            videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    // 3. Facebook handling (Videos & Reels)
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
        // If it's already an embed/plugin URL, just return it
        if (url.includes("facebook.com/plugins/video.php")) return url;

        // Otherwise, wrap it in the Facebook video plugin
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
    }

    return url;
};

// Register Custom Video Blot for Quill
const BlockEmbed = Quill.import("blots/block/embed");
class VideoBlot extends BlockEmbed {
    static create(url) {
        const node = super.create();
        const embedUrl = getEmbedUrl(url);

        const iframe = document.createElement("iframe");
        iframe.setAttribute("src", embedUrl);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute(
            "allow",
            "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share",
        );
        iframe.setAttribute(
            "style",
            "width: 100%; aspect-ratio: 16/9; border: none; overflow: hidden;",
        );

        node.appendChild(iframe);
        return node;
    }

    static value(node) {
        const iframe = node.querySelector("iframe");
        return iframe ? iframe.getAttribute("src") : null;
    }
}
VideoBlot.blotName = "video";
VideoBlot.tagName = "div";
VideoBlot.className = "ql-video";
Quill.register(VideoBlot);

// Draft storage key generator
const getDraftKey = (postId = null) => {
    return postId ? `user_draft_post_${postId}` : "user_draft_new_post";
};

/**
 * ✅ Strong sanitize to reduce Quill DOM edge cases
 */
const sanitizeHtmlForQuill = (html) => {
    if (!html) return "";

    const doc = new DOMParser().parseFromString(html, "text/html");
    const rich = doc.querySelector(".rich-text");

    const container = document.createElement("div");
    container.innerHTML = rich ? rich.innerHTML : doc.body?.innerHTML || html;

    // wrap stray top-level text nodes
    Array.from(container.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim()) {
            const p = document.createElement("p");
            p.textContent = n.textContent || "";
            container.replaceChild(p, n);
        }
    });

    // normalize <br>
    container.innerHTML = container.innerHTML.replaceAll("<br>", "<br/>");

    // remove zero width chars
    container.innerHTML = container.innerHTML.replace(/\u200B/g, "");

    return container.innerHTML;
};

/**
 * ✅ CustomQuillEditor (Quill Direct)
 */
const CustomQuillEditor = ({
    value,
    onChange,
    placeholder,
    className = "",
}) => {
    const holderRef = useRef(null);
    const quillRef = useRef(null);
    const applyingRef = useRef(false);
    const lastHtmlRef = useRef("");

    const modules = useMemo(
        () => ({
            magicUrl: true,
            toolbar: [
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [
                    {
                        font: [
                            false,
                            "cairo",
                            "times-new-roman",
                            "amiri",
                            "solaiman-lipi",
                            "noto-sans-bengali",
                            "sans-serif",
                            "serif",
                            "monospace",
                        ],
                    },
                ],
                [{ size: ["small", false, "large", "huge"] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [
                    { list: "ordered" },
                    { list: "bullet" },
                    { indent: "-1" },
                    { indent: "+1" },
                ],
                [{ direction: "rtl" }, { align: [] }],
                ["link", "image", "video", "blockquote", "code-block"],
                ["clean"],
            ],
            clipboard: { matchVisual: false },
            history: { delay: 200, maxStack: 500, userOnly: true },
        }),
        [],
    );

    useEffect(() => {
        if (!holderRef.current) return;
        if (quillRef.current) return;

        const q = new Quill(holderRef.current, {
            theme: "snow",
            placeholder: placeholder || "",
            modules,
        });

        // Tab indent
        q.keyboard.addBinding({ key: 9, shiftKey: false }, () => {
            q.format("indent", "+1", "user");
            return false;
        });
        q.keyboard.addBinding({ key: 9, shiftKey: true }, () => {
            q.format("indent", "-1", "user");
            return false;
        });

        const onTextChange = () => {
            if (applyingRef.current) return;
            const html = q.root.innerHTML || "";
            lastHtmlRef.current = html;
            onChange?.(html);
        };

        q.on("text-change", onTextChange);

        // Override video handler
        const toolbar = q.getModule("toolbar");
        toolbar.addHandler("video", () => {
            const range = q.getSelection();
            const url = prompt("Enter Video URL (YouTube, Facebook):");
            if (url && range) {
                q.insertEmbed(range.index, "video", url, "user");
            }
        });

        quillRef.current = q;

        return () => {
            try {
                q.off("text-change", onTextChange);
            } catch {}
            quillRef.current = null;
            if (holderRef.current) holderRef.current.innerHTML = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const q = quillRef.current;
        if (!q) return;

        const next = sanitizeHtmlForQuill(value || "");
        if ((next || "") === (lastHtmlRef.current || "")) return;

        applyingRef.current = true;
        try {
            q.setText("", "silent");
            q.clipboard.dangerouslyPasteHTML(next || "<p><br/></p>", "silent");
            q.history.clear();
            lastHtmlRef.current = q.root.innerHTML || "";
        } catch (e) {
            q.setText((value || "").replace(/<[^>]+>/g, ""), "silent");
            lastHtmlRef.current = q.root.innerHTML || "";
        } finally {
            setTimeout(() => {
                applyingRef.current = false;
            }, 0);
        }
    }, [value]);

    return (
        <div className={className}>
            <div ref={holderRef} />
        </div>
    );
};

const MediaDropdown = ({ value, onChange, items }) => {
    const active = items.find((i) => i.key === value) || items[0];

    const menuItems = items.map((i) => ({
        key: i.key,
        label: i.label,
    }));

    return (
        <div className="w-full">
            <Dropdown
                trigger={["click"]}
                placement="bottomLeft"
                menu={{
                    items: menuItems,
                    onClick: ({ key }) => onChange(key),
                }}
            >
                <Button
                    size="large"
                    className="w-full flex items-center justify-between"
                >
                    <span className="flex items-center gap-2">
                        {active?.label}
                    </span>
                    <DownOutlined />
                </Button>
            </Dropdown>

            <div className="mt-4">{active?.children}</div>
        </div>
    );
};

const ResponsiveMediaSwitch = ({ activeKey, onChange, items }) => {
    const screens = useBreakpoint();
    const isMobile = !screens.md; // < md => mobile

    if (isMobile) {
        return (
            <MediaDropdown
                value={activeKey}
                onChange={onChange}
                items={items}
            />
        );
    }

    // Desktop/Tablet normal tabs
    return (
        <Tabs
            activeKey={activeKey}
            onChange={onChange}
            items={items.map(({ key, label, children }) => ({
                key,
                label,
                children,
            }))}
        />
    );
};

// Enhanced File Upload Component (image preview)
const FileUploadComponent = ({
    field,
    label,
    accept,
    postFile,
    required = false,
    description = "",
    previewHeight = "h-48",
    onFileChange,
    onRemove,
    value,
    error,
}) => {
    const id = `${field}-upload`;
    const hasFile = value || postFile;
    const isImage = accept.includes("image");

    const triggerFileInput = () => document.getElementById(id)?.click();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file && onFileChange) onFileChange(field, file);
        // ✅ allow same file reselect later
        e.target.value = "";
    };

    const handleRemove = () => {
        onRemove?.(field);
    };

const previewUrl = useMemo(() => {
    if (value instanceof File) {
        return URL.createObjectURL(value);
    }

    if (postFile) {
        return typeof postFile === "string" && postFile.startsWith("http")
            ? postFile
            : getS3PublicUrl(postFile);
    }

    return null;
}, [value, postFile]);

useEffect(() => {
    return () => {
        if (previewUrl && value instanceof File) {
            URL.revokeObjectURL(previewUrl);
        }
    };
}, [previewUrl, value]);


    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div
                className={`relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-lg overflow-hidden ${previewHeight} flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all`}
                onClick={triggerFileInput}
            >
                {hasFile && isImage && previewUrl ? (
                    <>
                        <Image
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            alt={label}
                            preview={{
                                mask: (
                                    <div className="flex items-center justify-center">
                                        <EyeOutlined className="text-white text-lg" />
                                        <span className="ml-2 text-white">
                                            Preview
                                        </span>
                                    </div>
                                ),
                            }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <UploadOutlined className="text-white text-2xl" />
                        </div>
                    </>
                ) : hasFile ? (
                    <div className="text-center p-4">
                        <FileTextOutlined className="text-3xl text-blue-500" />
                        <p className="mt-2 text-sm font-medium">
                            {value instanceof File
                                ? value.name
                                : `Current ${label}`}
                        </p>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <PictureOutlined className="text-3xl text-gray-400" />
                        <p className="text-gray-500 mt-2">Click to upload</p>
                    </div>
                )}

                <input
                    type="file"
                    id={id}
                    hidden
                    accept={accept}
                    onChange={handleFileSelect}
                />
            </div>

            {description && (
                <p className="text-gray-500 text-xs mt-2">{description}</p>
            )}

            {error && (
                <Text type="danger" className="text-xs mt-2 block">
                    {error}
                </Text>
            )}

            <div className="mt-2 flex justify-between">
                <Button
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerFileInput();
                    }}
                    icon={<UploadOutlined />}
                >
                    {hasFile ? "Change" : "Upload"}
                </Button>

                {hasFile && (
                    <Button
                        size="small"
                        danger
                        ghost
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
};

// Multiple Featured Images Component (FULL PERFECT)
const MultipleFeaturedImages = ({
    featuredImages,
    onAddImage,
    onRemoveImage,
    onUpdateImage,
    postFeaturedImages = [],
}) => {
    // const [images, setImages] = useState([]);
    const objectUrlsRef = useRef([]);

    const cleanupObjectUrls = () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
    };

    // useEffect(() => {
    //     let nextImages = [];

    //     if (featuredImages?.length > 0) {
    //         nextImages = featuredImages;
    //     } else if (postFeaturedImages?.length > 0) {
    //         nextImages = postFeaturedImages.map((img) => {
    //             const imageUrl = img.image || img;
    //             const imageName =
    //                 img.name ||
    //                 (typeof img === "string"
    //                     ? img.split("/").pop()
    //                     : "Featured Image");

    //             return {
    //                 id: img.id ?? imageUrl,
    //                 url:
    //                     typeof imageUrl === "string" &&
    //                         imageUrl.startsWith("http")
    //                         ? imageUrl
    //                         : getS3PublicUrl(imageUrl),
    //                 name: imageName,
    //                 isExisting: true,
    //                 originalData: img,
    //             };
    //         });
    //     }

    //     setImages(nextImages);

    //     return () => cleanupObjectUrls();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [featuredImages, postFeaturedImages]);


useEffect(() => {
    return () => cleanupObjectUrls();
}, []);

    const validateFile = (file) => {
    if (!file) return { ok: false, msg: "No file selected" };
    if (!file.type?.startsWith("image/"))
        return { ok: false, msg: "Only image files are allowed" };
    return { ok: true };
};

    // ✅ multiple select supported here
    const handleFileSelect = (e, index = null) => {
        const files = Array.from(e.target.files || []);
        e.target.value = ""; // ✅ allow same file reselect

        if (files.length === 0) return;

        // ✅ Replace a specific slot: only first file
        if (index !== null) {
            const file = files[0];
            const v = validateFile(file);
            if (!v.ok) return message.error(v.msg);

            onUpdateImage?.(index, file);
            return;
        }

        // ✅ Add many at once
        files.forEach((file) => {
            const v = validateFile(file);
            if (!v.ok) {
                message.error(`${file.name}: ${v.msg}`);
                return;
            }
            onAddImage?.(file);
        });
    };

    const getPreviewUrl = (image) => {
        if (!image) return null;

        // parent structure: { url } or { file }
        if (image.url) return image.url;

        if (image.file instanceof File) {
            const url = URL.createObjectURL(image.file);
            objectUrlsRef.current.push(url);
            return url;
        }

        if (image instanceof File) {
            const url = URL.createObjectURL(image);
            objectUrlsRef.current.push(url);
            return url;
        }

        if (image.image) return getS3PublicUrl(image.image);

        return null;
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700">
                        Featured Images
                    </label>
                </div>
<Tag color="blue">{featuredImages.length} Selected</Tag>            </div>

            {/* Grid */}
            {featuredImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                    {featuredImages.map((image, index) => {
                        const previewUrl = getPreviewUrl(image);
                        const imageName =
                            image.name ||
                            image.file?.name ||
                            `Image ${index + 1}`;

                        return (
                            <div
                                key={image.id || index}
                                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                            >
                                <div className="aspect-square relative">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={`Featured ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PictureOutlined className="text-gray-400 text-2xl" />
                                        </div>
                                    )}

                                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                                        {index + 1}
                                    </div>

                                    {/* Replace button on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <Button
                                            size="small"
                                            icon={<UploadOutlined />}
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        `replace-featured-${index}`,
                                                    )
                                                    ?.click()
                                            }
                                        >
                                            Replace
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-2 bg-white border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div className="truncate">
                                            <p className="text-xs font-medium truncate">
                                                {imageName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {image.isExisting
                                                    ? "Existing"
                                                    : "New"}
                                            </p>
                                        </div>

                                        <Button
                                            size="small"
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() =>
                                                onRemoveImage?.(index)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Hidden input for replace */}
                                <input
                                    id={`replace-featured-${index}`}
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, index)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add box ALWAYS visible */}
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() =>
                    document.getElementById("add-featured-image")?.click()
                }
            >
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <PlusOutlined className="text-2xl text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">
                        Add Featured Images
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        Click to select multiple images
                    </p>
                </div>

                <input
                    type="file"
                    id="add-featured-image"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e)}
                />
            </div>
        </div>
    );
};

export default function Create({ auth, languages, categories, post = null }) {
    const initialFormData = {
        statusBox: post?.statusBox != undefined ? post.statusBox : 0,
        title: post?.title || "",
        lang_id: post?.lang_id || "",
        category_id: post?.category_id || "",
        status: post?.status != undefined ? post.status : 0,

        thumbnail: null,
        remove_thumbnail: false,
        sponsor: null,
        remove_sponsor: false,

        content: sanitizeHtmlForQuill(post?.content || ""),

        pdf: null, // Deprecated
        pdfs: [],
        remove_pdfs: [],
        existing_pdfs: post?.post_pdfs?.map((p) => p.id) || [],

        video: null, // Deprecated
        videos: [],
        remove_videos: [],
        existing_videos: post?.post_videos?.map((v) => v.id) || [],

        audio: null, // Single field (still used for normal users or backward compatibility)
        remove_audio: false,

        audios: [],
        remove_audios: [],
        existing_audios: post?.post_audios?.map((a) => a.id) || [],

        video_url: post?.video_url || "",

        featured_images: [],
        remove_featured_images: [],
        existing_featured_images:
            post?.featured_images?.map((img) => img.id) || [],
        _method: !!post ? "PUT" : "POST",
    };

    const { data, setData, post: submitForm, processing, errors, transform, reset } = useForm(initialFormData);

    const { uploads, addUpload } = useBackgroundUpload();

    const isEditMode = !!post;
    const draftKey = getDraftKey(post?.id);

    // native refs
    const pdfInputRef = useRef(null);
// const thumbnailFileRef = useRef(null);
// const sponsorFileRef = useRef(null);    

    const videoInputRef = useRef(null);
    const audioInputRef = useRef(null);

    const autoSaveIntervalRef = useRef(null);
    const lastSavedRef = useRef(null);
    const isInitialMount = useRef(true);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [draftExists, setDraftExists] = useState(false);

    const [mediaType, setMediaType] = useState(
        post?.pdf
            ? "pdf"
            : post?.video || post?.video_url
              ? "video"
              : post?.audio
                ? "audio"
                : "content",
    );

    const [featuredImages, setFeaturedImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [pdfs, setPdfs] = useState([]);
    const [submittingType, setSubmittingType] = useState(null);
    const [filteredCategories, setFilteredCategories] = useState(categories);

    // Upload progress modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadFileName, setUploadFileName] = useState("");
    const [audios, setAudios] = useState([]);

    const isMember = true; // Admin is always member

    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (flash?.error) {
            message.error(flash.error);
        }
    }, [flash]);

    // categories filter
    useEffect(() => {
        if (data.lang_id) {
            const filtered = categories.filter(
                (cat) => cat.lang_id == data.lang_id,
            );
            setFilteredCategories(filtered);

            if (data.category_id) {
                const currentCategory = categories.find(
                    (cat) => cat.id == data.category_id,
                );
                if (currentCategory && currentCategory.lang_id != data.lang_id)
                    setData("category_id", "");
            }
        } else {
            setFilteredCategories([]);
            setData("category_id", "");
        }
    }, [data.lang_id, categories, data.category_id, setData]);

    // init featured from post
    useEffect(() => {
        if (post?.featured_images?.length) {
            setFeaturedImages(
                post.featured_images.map((img) => {
                    const path = img.image || img;
                    return {
                        id: img.id ?? path,
                        file: null,
                        image: path,
                        name:
                            img.name ||
                            (typeof path === "string"
                                ? path.split("/").pop()
                                : "Featured Image"),
                        url: img.url
                            ? img.url
                            : typeof path === "string" &&
                                path.startsWith("http")
                              ? path
                              : getS3PublicUrl(path),
                        isExisting: true,
                    };
                }),
            );
        }

        // Initialize multi videos
        if (post?.post_videos?.length) {
            setVideos(
                post.post_videos.map((v) => ({
                    id: v.id,
                    video: v.video,
                    name:
                        v.name ||
                        (typeof v.video === "string"
                            ? v.video.split("/").pop()
                            : "Video"),
                    url: buildS3UrlAlways(v.video),
                    isExisting: true,
                })),
            );
        }

        // Initialize multi pdfs
        if (post?.post_pdfs?.length) {
            setPdfs(
                post.post_pdfs.map((p) => ({
                    id: p.id,
                    pdf: p.pdf,
                    name:
                        p.name ||
                        (typeof p.pdf === "string"
                            ? p.pdf.split("/").pop()
                            : "PDF"),
                    url: buildS3UrlAlways(p.pdf),
                    isExisting: true,
                })),
            );
        }
        // Initialize multi audios
        if (post?.post_audios?.length) {
            setAudios(
                post.post_audios.map((a) => ({
                    id: a.id,
                    audio: a.audio,
                    name: a.name || (typeof a.audio === "string" ? a.audio.split("/").pop() : "Audio"),
                    url: buildS3UrlAlways(a.audio),
                    isExisting: true,
                }))
            );
        }
    }, [post]);

    // reset native input values
    const resetInputForField = useCallback((field) => {
        if (field === "pdf" && pdfInputRef.current)
            pdfInputRef.current.value = "";
        if (field === "video" && videoInputRef.current)
            videoInputRef.current.value = "";
        if (field === "audio" && audioInputRef.current)
            audioInputRef.current.value = "";
    }, []);

    const handleFileChange = useCallback(
        (field, file) => {
            if (!file) return;

            if (field === "pdf") setData("remove_pdf", false);
            if (field === "video") setData("remove_video", false);
            if (field === "audio") setData("remove_audio", false);

            setData(field, file);
            setHasUnsavedChanges(true);
            resetInputForField(field);
        },
        [resetInputForField, setData],
    );

    const handleRemoveFile = useCallback(
        (field) => {
            setData(field, null);
            setData(`remove_${field}`, true);
            setHasUnsavedChanges(true);
            resetInputForField(field);
        },
        [resetInputForField, setData],
    );

    // Media Handlers (Multiple)
    const handleAddMediaFile = useCallback((type, file) => {
        if (!file) return;
        const uniqueId = `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newItem = {
            id: uniqueId,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        if (type === "video") {
            setVideos((prev) => {
                const updated = [...prev, newItem];
                setData("videos", updated.filter(v => !v.isExisting).map(v => v.file));
                return updated;
            });
        } else if (type === "pdf") {
            setPdfs((prev) => {
                const updated = [...prev, newItem];
                setData("pdfs", updated.filter(p => !p.isExisting).map(p => p.file));
                return updated;
            });
        } else if (type === "audio") {
            setAudios((prev) => {
                const updated = [...prev, newItem];
                setData("audios", updated.filter(a => !a.isExisting).map(a => a.file));
                return updated;
            });
        }
        setHasUnsavedChanges(true);
    }, [setData]);

  const handleRemoveMediaFile = useCallback((type, index, id, isExisting) => {
    const setter = type === "video" ? setVideos : type === "pdf" ? setPdfs : setAudios;
    setter((prev) => {
        const item = prev[index];
        const updated = prev.filter((_, i) => i !== index);

        if (isExisting && id) {
            setData((prevForm) => ({
                ...prevForm,
                [`remove_${type}s`]: [...(prevForm[`remove_${type}s`] || []), id],
                [`existing_${type}s`]: (prevForm[`existing_${type}s`] || []).filter(
                    (existingId) => existingId !== id
                ),
            }));
        }

        setData(`${type}s`, updated.filter((x) => !x.isExisting).map((x) => x.file));
        return updated;
    });
    setHasUnsavedChanges(true);
}, [setData]);

const handleUpdateMediaFile = useCallback((type, index, file, id, isExisting) => {
    if (!file) return;
    const setter = type === "video" ? setVideos : type === "pdf" ? setPdfs : setAudios;
    setter((prev) => {
        const updated = [...prev];
        const old = updated[index];

        updated[index] = {
            ...old,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        if (isExisting && id) {
            setData((prevForm) => ({
                ...prevForm,
                [`remove_${type}s`]: [...(prevForm[`remove_${type}s`] || []), id],
                [`existing_${type}s`]: (prevForm[`existing_${type}s`] || []).filter(
                    (existingId) => existingId !== id
                ),
            }));
        }

        setData(`${type}s`, updated.filter((x) => !x.isExisting).map((x) => x.file));
        return updated;
    });
    setHasUnsavedChanges(true);
}, [setData]);

//     const handleUpdateMediaFile = useCallback((type, index, file, id, isExisting) => {
//         if (!file) return;
//         const setter = type === "video" ? setVideos : type === "pdf" ? setPdfs : setAudios;
//         setter((prev) => {
//             const updated = [...prev];
//             const old = updated[index];

//             updated[index] = {
//                 ...old,
//                 file,
//                 name: file.name,
//                 url: URL.createObjectURL(file),
//                 isExisting: false,
//             };

//             if (type === "video") {
//                 setVideos((prev) => {
//                     const updated = [...prev, newItem];
//                     setData(
//                         "videos",
//                         updated.filter((v) => !v.isExisting).map((v) => v.file),
//                     );
//                     return updated;
//                 });
//             } else if (type === "pdf") {
//                 setPdfs((prev) => {
//                     const updated = [...prev, newItem];
//                     setData(
//                         "pdfs",
//                         updated.filter((p) => !p.isExisting).map((p) => p.file),
//                     );
//                     return updated;
//                 });
//             }
//             setHasUnsavedChanges(true);
//         },
//         [setData],
//     );

//     const handleRemoveMediaFile = useCallback(
//         (type, index, id, isExisting) => {
//             const setter = type === "video" ? setVideos : setPdfs;
//             setter((prev) => {
//                 const item = prev[index];
//                 const updated = prev.filter((_, i) => i !== index);

//                 if (item?.isExisting && item?.id) {
//                     setData((prevForm) => ({
//                         ...prevForm,
//                         [`remove_${type}s`]: [
//                             ...(prevForm[`remove_${type}s`] || []),
//                             item.id,
//                         ],
//                         [`existing_${type}s`]: (
//                             prevForm[`existing_${type}s`] || []
//                         ).filter((existingId) => existingId !== item.id),
//                     }));
//                 }

//                 setData(
//                     `${type}s`,
//                     updated.filter((x) => !x.isExisting).map((x) => x.file),
//                 );
//                 return updated;
//             });
//             setHasUnsavedChanges(true);
//         },
//         [setData],
//     );

//     const handleUpdateMediaFile = useCallback(
//         (type, index, file, id, isExisting) => {
//             if (!file) return;
//             const setter = type === "video" ? setVideos : setPdfs;
//             setter((prev) => {
//                 const updated = [...prev];
//                 const old = updated[index];

//                 updated[index] = {
//                     ...old,
//                     file,
//                     name: file.name,
//                     url: URL.createObjectURL(file),
//                     isExisting: false,
//                 };

//                 if (old?.isExisting && old?.id) {
//                     setData((prevForm) => ({
//                         ...prevForm,
//                         [`remove_${type}s`]: [
//                             ...(prevForm[`remove_${type}s`] || []),
//                             old.id,
//                         ],
//                         [`existing_${type}s`]: (
//                             prevForm[`existing_${type}s`] || []
//                         ).filter((existingId) => existingId !== old.id),
//                     }));
//                 }

//                 setData(
//                     `${type}s`,
//                     updated.filter((x) => !x.isExisting).map((x) => x.file),
//                 );
//                 return updated;
//             });
//             setHasUnsavedChanges(true);
//         },
//         [setData],
//     );

    // featured images handlers
    const handleAddFeaturedImage = (file) => {
        if (!file) return;

        setFeaturedImages((prev) => {
            const newImage = {
                id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                file,
                name: file.name,
                url: URL.createObjectURL(file),
                isExisting: false,
            };

            const updated = [...prev, newImage];

            setData(
                "featured_images",
                updated.filter((img) => !img.isExisting).map((img) => img.file)
            );

            return updated;
        });

        setHasUnsavedChanges(true);
    };

    const handleRemoveFeaturedImage = (index) => {
        const imageToRemove = featuredImages[index];
        const updated = featuredImages.filter((_, i) => i !== index);

        setFeaturedImages(updated);
        setHasUnsavedChanges(true);

        if (imageToRemove?.isExisting && imageToRemove?.id) {
            setData((prev) => ({
                ...prev,
                remove_featured_images: [
                    ...(prev.remove_featured_images || []),
                    imageToRemove.id,
                ],
                existing_featured_images: (prev.existing_featured_images || []).filter(
                    (id) => id !== imageToRemove.id
                ),
                featured_images: updated
                    .filter((img) => !img.isExisting)
                    .map((img) => img.file),
            }));
        } else {
            setData(
                "featured_images",
                updated.filter((img) => !img.isExisting).map((img) => img.file)
            );
        }
    };

    const handleUpdateFeaturedImage = (index, file) => {
        if (!file) return;

        const updated = [...featuredImages];
        const old = updated[index];

        updated[index] = {
            ...old,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        setFeaturedImages(updated);
        setHasUnsavedChanges(true);

        if (old?.isExisting && old?.id) {
            setData((prev) => ({
                ...prev,
                remove_featured_images: [
                    ...(prev.remove_featured_images || []),
                    old.id,
                ],
                existing_featured_images: (prev.existing_featured_images || []).filter(
                    (id) => id !== old.id
                ),
                featured_images: updated
                    .filter((img) => !img.isExisting)
                    .map((img) => img.file),
            }));
        } else {
            setData(
                "featured_images",
                updated.filter((img) => !img.isExisting).map((img) => img.file)
            );
        }
    };

    // draft serialize
    const serializeFormData = useCallback(
        (formData) => ({
            title: formData.title,
            lang_id: formData.lang_id,
            category_id: formData.category_id,
            status: formData.status,
            statusBox: formData.statusBox,
            content: formData.content,
            video_url: formData.video_url,
            mediaType,
        }),
        [mediaType],
    );

    useEffect(() => {
        if (isInitialMount.current) {
            lastSavedRef.current = JSON.stringify(serializeFormData(data));
            isInitialMount.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveDraftToSession = useCallback(() => {
        try {
            const draftData = {
                ...serializeFormData(data),
                savedAt: new Date().toISOString(),
                postId: post?.id || null,
            };
            sessionStorage.setItem(draftKey, JSON.stringify(draftData));
            lastSavedRef.current = JSON.stringify(serializeFormData(data));
            setHasUnsavedChanges(false);
            setDraftExists(true);
        } catch {
            message.error("Failed to save draft");
        }
    }, [data, draftKey, post?.id, serializeFormData]);

    const loadDraftFromSession = useCallback(() => {
        try {
            const savedDraft = sessionStorage.getItem(draftKey);
            if (!savedDraft) return;
            const draft = JSON.parse(savedDraft);

            setData("title", draft.title || "");
            setData("lang_id", draft.lang_id || "");
            setData("category_id", draft.category_id || "");
            setData("content", sanitizeHtmlForQuill(draft.content || ""));
            setData("video_url", draft.video_url || "");
            if (draft.mediaType) setMediaType(draft.mediaType);

            setShowRestorePrompt(false);
            message.success("Draft restored!");
            setHasUnsavedChanges(true);
        } catch {
            message.error("Failed to load draft");
        }
    }, [draftKey, setData]);

    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(draftKey);
        setShowRestorePrompt(false);
        setHasUnsavedChanges(false);
        setDraftExists(false);
        lastSavedRef.current = JSON.stringify(serializeFormData(data));
    }, [draftKey, data, serializeFormData]);

    useEffect(() => {
        const savedDraft = sessionStorage.getItem(draftKey);
        if (savedDraft) {
            setDraftExists(true);
            setShowRestorePrompt(true);
        }

        autoSaveIntervalRef.current = setInterval(() => {
            if (hasUnsavedChanges) saveDraftToSession();
        }, 5000);

        return () => clearInterval(autoSaveIntervalRef.current);
    }, [draftKey, hasUnsavedChanges, saveDraftToSession]);

    const discardDraft = () => {
        Modal.confirm({
            title: "Discard Draft?",
            icon: <ExclamationCircleOutlined />,
            content: "This will permanently delete your saved draft.",
            okText: "Yes, Discard",
            okType: "danger",
            cancelText: "Cancel",
            onOk() {
                clearDraft();
                message.info("Draft discarded");
            },
        });
    };

    const handleFieldChange = (field, value) => {
        setData(field, value);
        setHasUnsavedChanges(true);
    };

    const handleMediaTypeChange = (key) => {
        setMediaType(key);
        setHasUnsavedChanges(true);
    };

    /**
     * Upload a single large file in chunks using XHR for real-time per-byte progress.
     * fileIndex / totalFiles are used to scale progress across multiple files.
     */
    const uploadOneFile = async (file, fileIndex, totalFiles) => {
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        const identifier = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const fileName = file.name;
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const chunkFormData = new FormData();
            chunkFormData.append("chunk", chunk);
            chunkFormData.append("chunkIndex", chunkIndex);
            chunkFormData.append("totalChunks", totalChunks);
            chunkFormData.append("identifier", identifier);
            chunkFormData.append("fileName", fileName);

                // Fake progress interval
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.floor(Math.random() * 15) + 5;
                    if (progress >= 95) clearInterval(progressInterval);
                    else setUploadPercent(progress);
                }, 200);

                const result = await new Promise((resolve, reject) => {
                    const uploadUrl = typeof route === 'function' ? route("upload.chunk") : "/upload/chunk";
                    const xhrChunk = new XMLHttpRequest();
                    xhrChunk.open("POST", uploadUrl, true);
                    xhrChunk.setRequestHeader("X-CSRF-TOKEN", csrfMeta?.content || "");
                    xhrChunk.setRequestHeader("Accept", "application/json");

                    // Ignore real-time byte-level progress since we are faking it quickly
                    xhrChunk.upload.onprogress = (e) => {};

                    xhrChunk.onload = () => {
                        if (xhrChunk.status >= 200 && xhrChunk.status < 300) {
                            try { resolve(JSON.parse(xhrChunk.responseText)); }
                            catch { reject(new Error("Invalid server response")); }
                        } else {
                            reject(new Error(`Chunk ${chunkIndex + 1} failed (HTTP ${xhrChunk.status})`));
                        }
                    };
                    xhrChunk.onerror = () => reject(new Error(`Network error on chunk ${chunkIndex + 1}`));
                    xhrChunk.send(chunkFormData);
                });
                
                clearInterval(progressInterval);

            if (result.done) {
                // Mark this file as 100% in global progress
                setUploadPercent(Math.round(((fileIndex + 1) / totalFiles) * 100));
                return result.temp_path;
            }
        }
        throw new Error("Upload incomplete — server never sent done signal.");
    };

//     const handleSubmit = async (submitType = "draft") => {
//         if (!data.title) return message.error("Title is required!");
//         setSubmittingType(submitType);

//         const finalStatus = submitType === "publish" ? 1 : 0;
//         const url = isEditMode
//             ? route("admin.posts.update", post.id)
//             : route("admin.posts.store");

//         clearDraft();

//         // Build FormData manually for XHR progress tracking
//         const formData = new FormData();
//         formData.append("title", data.title || "");
//         formData.append("lang_id", data.lang_id || "");
//         formData.append("category_id", data.category_id || "");
//         formData.append("status", finalStatus);
//         formData.append("statusBox", finalStatus);
//         formData.append("content", data.content || "");
//         formData.append("video_url", data.video_url || "");
//         formData.append("remove_thumbnail", data.remove_thumbnail ? "1" : "0");
//         formData.append("remove_sponsor", data.remove_sponsor ? "1" : "0");
//         formData.append("remove_audio", data.remove_audio ? "1" : "0");
        
//   if (data.thumbnail instanceof File) {
//     formData.append("thumbnail", data.thumbnail);
// }

// if (data.sponsor instanceof File) {
//     formData.append("sponsor", data.sponsor);
// }
//         if (data.audio instanceof File && data.audio.size < 5000000) formData.append("audio", data.audio);

//         if (Array.isArray(data.featured_images)) {
//             data.featured_images.forEach((f) => {
//                 if (f instanceof File) formData.append("featured_images[]", f);
//             });
//         }
//         if (Array.isArray(data.remove_featured_images)) {
//             data.remove_featured_images.forEach((id) =>
//                 formData.append("remove_featured_images[]", id)
//             );
//         }
//         if (Array.isArray(data.existing_featured_images)) {
//             data.existing_featured_images.forEach((id) =>
//                 formData.append("existing_featured_images[]", id)
//             );
//         }

//         // MULTI VIDEOS
//         if (Array.isArray(data.videos)) {
//             data.videos.forEach((f) => {
//                 if (f instanceof File && f.size < 5000000) formData.append("videos[]", f);
//             });
//         }

//         // MULTI PDFS
//         if (Array.isArray(data.pdfs)) {
//             data.pdfs.forEach((f) => {
//                 if (f instanceof File && f.size < 5000000) formData.append("pdfs[]", f);
//             });
//         }

//         // MULTI AUDIOS
//         if (Array.isArray(data.audios)) {
//             data.audios.forEach((f) => {
//                 if (f instanceof File && f.size < 5000000) formData.append("audios[]", f);
//             });
//         }

//         if (Array.isArray(data.remove_videos)) {
//             data.remove_videos.forEach((id) => formData.append("remove_videos[]", id));
//         }
//         if (Array.isArray(data.remove_pdfs)) {
//             data.remove_pdfs.forEach((id) => formData.append("remove_pdfs[]", id));
//         }
//         if (Array.isArray(data.remove_audios)) {
//             data.remove_audios.forEach((id) => formData.append("remove_audios[]", id));
//         }
//         if (Array.isArray(data.existing_videos)) {
//             data.existing_videos.forEach((id) => formData.append("existing_videos[]", id));
//         }
//         if (Array.isArray(data.existing_pdfs)) {
//             data.existing_pdfs.forEach((id) => formData.append("existing_pdfs[]", id));
//         }
//         if (Array.isArray(data.existing_audios)) {
//             data.existing_audios.forEach((id) => formData.append("existing_audios[]", id));
//         }

//         if (isEditMode) formData.append("_method", "PUT");

//         setUploadFileName("Media Files"); // Generic name for multiple files
//         setUploadPercent(0);
//         setUploadDone(false);

//         // ── 1. COLLECT ALL LARGE FILES THAT NEED CHUNKED UPLOAD ──
//         const largeFiles = [];
//         if (Array.isArray(data.videos)) {
//             data.videos.forEach((f) => { if (f instanceof File && f.size >= 5000000) largeFiles.push({ f, key: "video_temp_paths[]" }); });
//         }
//         if (Array.isArray(data.pdfs)) {
//             data.pdfs.forEach((f) => { if (f instanceof File && f.size >= 5000000) largeFiles.push({ f, key: "pdf_temp_paths[]" }); });
//         }
//         if (Array.isArray(data.audios)) {
//             data.audios.forEach((f) => { if (f instanceof File && f.size >= 5000000) largeFiles.push({ f, key: "audio_temp_paths[]" }); });
//         }
//         if (data.audio instanceof File && data.audio.size >= 5000000) {
//             largeFiles.push({ f: data.audio, key: "audio_temp_path" });
//         }
//         const anyLargeFile = largeFiles.length > 0;

//         // ── 2. PERFORM CHUNKED UPLOADS WITH REAL-TIME PROGRESS ──
//         try {
//             if (anyLargeFile) {
//                 setUploadModalOpen(true);
//                 for (let i = 0; i < largeFiles.length; i++) {
//                     const { f, key } = largeFiles[i];
//                     setUploadFileName(f.name);
//                     const tempPath = await uploadOneFile(f, i, largeFiles.length);
//                     formData.append(key, tempPath);
//                 }
//             }
//         } catch (error) {
//             setSubmittingType(null);
//             setUploadModalOpen(false);
//             return message.error("Large file chunk upload failed. Please try again.");
//         }

// // ── 3. FINAL FORM SUBMISSION WITH INERTIA ROUTER ──
// router.post(url, formData, {
//     forceFormData: true,
//     onStart: () => {
//         if (!anyLargeFile) {
//             setUploadModalOpen(true);
//         }
//     },
//     onProgress: (progress) => {
//         if (!anyLargeFile && progress?.percentage != null) {
//             setUploadPercent(Math.round(progress.percentage));
//         }
//     },
//     onSuccess: () => {
//         setSubmittingType(null);

//         if (anyLargeFile) {
//             setUploadDone(true);
//         } else {
//             setUploadModalOpen(false);
//             message.success(isEditMode ? "Post updated!" : "Post created!");
//             router.visit(route("admin.posts.index"));
//         }
//     },
//     onError: (errs) => {
//         setSubmittingType(null);
//         setUploadModalOpen(false);

//         if (errs?.thumbnail) {
//             message.error(errs.thumbnail);
//             return;
//         }

//         if (errs?.sponsor) {
//             message.error(errs.sponsor);
//             return;
//         }

//         if (errs?.title) {
//             message.error(errs.title);
//             return;
//         }

//         message.error("Upload failed. Please check the form.");
//     },
//     onFinish: () => {
//         setSubmittingType(null);
//     },
// });
//     };


    const handleSubmit = async (submitType = "publish") => {
        if (!data.title) return message.error("Title is required!");
        setSubmittingType(submitType);
        
        const finalStatus = submitType === "publish" ? 1 : 0;
        const url = isEditMode
            ? route("admin.posts.update", post.id)
            : route("admin.posts.store");

        // Refresh CSRF token first to prevent 419 errors after long idle time or chunk uploads
        try {
            const tokenUrl = typeof route === "function" ? route("csrf.refresh") : "/csrf-token";
            const tokenRes = await fetch(tokenUrl, { credentials: "same-origin" });
            if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                if (tokenData.token) {
                    const metaTag = document.querySelector('meta[name="csrf-token"]');
                    if (metaTag) metaTag.setAttribute("content", tokenData.token);
                }
            }
        } catch (err) {
            console.error("CSRF Refresh Failed:", err);
        }

        // ── detect large files ──
        const allNewMediaFiles = [
            ...(Array.isArray(data.videos) ? data.videos : []),
            ...(Array.isArray(data.pdfs) ? data.pdfs : []),
            ...(Array.isArray(data.audios) ? data.audios : []),
            ...(data.audio instanceof File ? [data.audio] : []),
        ];
        const anyLarge = allNewMediaFiles.some((f) => f instanceof File && f.size >= 2000000);

        // ⚠️ Read the (possibly fresh) CSRF token AFTER the refresh above
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

        // ── Build FormData for initial submission ──
        const initialForm = new FormData();
        Object.keys(data).forEach(key => {
            // Status and statusBox are handled explicitly below
            if (['status', 'statusBox'].includes(key)) return;

            // Handle multiple-upload fields
            if (['videos', 'pdfs', 'audios'].includes(key)) {
                if (Array.isArray(data[key])) {
                    data[key].forEach(file => {
                        // Only include SMALL files in the initial request (under 2MB)
                        if (file instanceof File && file.size < 2000000) {
                            initialForm.append(`${key}[]`, file);
                        }
                    });
                }
                return;
            }

            // Handle single-upload fields
            if (['video', 'pdf', 'audio'].includes(key)) {
                if (data[key] instanceof File && data[key].size < 2000000) {
                    initialForm.append(key, data[key]);
                }
                return;
            }

            if (data[key] === null || data[key] === undefined) return;

            if (Array.isArray(data[key])) {
                data[key].forEach(val => {
                    if (val !== null && val !== undefined) initialForm.append(`${key}[]`, val);
                });
            } else if (typeof data[key] === 'boolean') {
                initialForm.append(key, data[key] ? '1' : '0');
            } else {
                initialForm.append(key, data[key]);
            }
        });
        initialForm.append('status', finalStatus);
        initialForm.append('statusBox', finalStatus);

        if (anyLarge) {
            initialForm.append('is_background', 'true');
            if (Array.isArray(data.videos)) initialForm.append('video_count', data.videos.filter(f => f instanceof File && f.size >= 2000000).length);
            if (Array.isArray(data.pdfs)) initialForm.append('pdf_count', data.pdfs.filter(f => f instanceof File && f.size >= 2000000).length);
            if (Array.isArray(data.audios)) initialForm.append('audio_count', data.audios.filter(f => f instanceof File && f.size >= 2000000).length);
            
            if (data.video instanceof File && data.video.size >= 2000000) initialForm.append('has_video', '1');
            if (data.pdf instanceof File && data.pdf.size >= 2000000) initialForm.append('has_pdf', '1');
            if (data.audio instanceof File && data.audio.size >= 2000000) initialForm.append('has_audio', '1');
        }

        const runBackgroundUploadAndSubmit = async () => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: initialForm
                });

                if (!response.ok) throw new Error('Initial submission failed');
                const result = await response.json();
                const postId = result.postId;

                if (anyLarge && postId) {
                    if (Array.isArray(data.videos)) {
                        data.videos.filter(f => f instanceof File && f.size >= 2000000).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'video' });
                        });
                    }
                    if (Array.isArray(data.pdfs)) {
                        data.pdfs.filter(f => f instanceof File && f.size >= 2000000).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'pdf' });
                        });
                    }
                    if (Array.isArray(data.audios)) {
                        data.audios.filter(f => f instanceof File && f.size >= 2000000).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'audio' });
                        });
                    }
                    if (data.audio instanceof File && data.audio.size >= 2000000) {
                        addUpload({ id: Math.random().toString(36).substr(2, 9), file: data.audio, postId, type: 'audio_single' });
                    }
                }

                setUploadPercent(100);
                setTimeout(() => setUploadDone(true), 500);
                clearDraft();

                message.success(isEditMode ? "Post updated and processing!" : "Post created and processing!");
                setTimeout(() => {
                    router.visit(route("admin.posts.index"));
                }, 1500);

            } catch (err) {
                console.error(err);
                message.error('Submission Error: ' + err.message);
                setSubmittingType(null);
                setUploadModalOpen(false);
            }
        };

        if (anyLarge) {
            setSubmittingType("background");
            const displayFile = allNewMediaFiles.find((f) => f instanceof File && f.size >= 2000000);
            setUploadFileName(displayFile?.name || "Files");
            setUploadModalOpen(true);
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 95) {
                    progress = 95;
                    clearInterval(interval);
                }
                setUploadPercent(Math.round(progress));
            }, 300);

            runBackgroundUploadAndSubmit();
        } else {
            router.post(url, initialForm, {
                onStart: () => setSubmittingType(submitType),
                onFinish: () => setSubmittingType(null),
                onSuccess: () => {
                    clearDraft();
                    message.success(isEditMode ? "Post updated!" : "Post created!");
                },
            });
        }
    };
    const handleUploadModalClose = () => {
        setUploadModalOpen(false);
        setUploadDone(false);
        router.visit(route("admin.posts.index"));
    };

    // ✅ Right sidebar tabs items (Thumbnail/Gallery/Sponsors)
    const sidebarItems = useMemo(
        () => [
            {
                key: "1",
                label: "Thumbnail",
                children: (
<FileUploadComponent
    field="thumbnail"
    label="Thumbnail Image"
    accept="image/*"
    postFile={data.remove_thumbnail ? null : post?.thumbnail}
    onFileChange={(f, file) => {
        setData("remove_thumbnail", false);
        setData(f, file);
        setHasUnsavedChanges(true);
    }}
    onRemove={(f) => {
        setData(f, null);
        setData("remove_thumbnail", true);
        setHasUnsavedChanges(true);
    }}
    value={data.thumbnail}
    error={errors.thumbnail}
/>
                ),
            },
            {
                key: "2",
                label: "Gallery",
                children: (
                    <MultipleFeaturedImages
                        featuredImages={featuredImages}
                        onAddImage={handleAddFeaturedImage}
                        onRemoveImage={handleRemoveFeaturedImage}
                        onUpdateImage={handleUpdateFeaturedImage}
                        // postFeaturedImages={post?.featured_images || []}
                    />
                ),
            },
            {
                key: "3",
                label: "Sponsors",
                children: (
<FileUploadComponent
    field="sponsor"
    label="Sponsor Image"
    accept="image/*"
    postFile={data.remove_sponsor ? null : post?.sponsor}
    onFileChange={(f, file) => {
        setData("remove_sponsor", false);
        setData(f, file);
        setHasUnsavedChanges(true);
    }}
    onRemove={(f) => {
        setData(f, null);
        setData("remove_sponsor", true);
        setHasUnsavedChanges(true);
    }}
    value={data.sponsor}
    error={errors.sponsor}
/>
                ),
            },
        ],
        [
            data.thumbnail,
            data.remove_thumbnail,
            data.sponsor,
            data.remove_sponsor,
            post?.thumbnail,
            post?.sponsor,
            post?.featured_images,
            featuredImages,
            errors.thumbnail,
            errors.sponsor,
        ],
    );

    // ✅ Media items (mobile dropdown / desktop tabs) - NO useMemo for maximum reliability
    const mediaItems = [
        {
            key: "content",
            label: (
                <span className="flex items-center">
                    <FileTextOutlined />
                    <span className="ml-2">Text Content</span>
                </span>
            ),
            children: (
                <div className="mt-4 min-h-[400px]">
                    <CustomQuillEditor
                        value={data.content}
                        onChange={(val) => handleFieldChange("content", val)}
                        placeholder="Start writing..."
                    />
                </div>
            ),
        },
        {
            key: "pdf",
            label: (
                <span className="flex items-center">
                    <FilePdfOutlined />
                    <span className="ml-2">PDF Document</span>
                </span>
            ),
            children: (
                <MultipleMediaUpload
                    type="pdf"
                    files={pdfs}
                    existingFiles={[]} // Already in pdfs state
                    onAdd={(file) => handleAddMediaFile("pdf", file)}
                    onRemove={(type, abs, id, isEx) =>
                        handleRemoveMediaFile(type, abs, id, isEx)
                    }
                    onUpdate={(type, abs, file, id, isEx) =>
                        handleUpdateMediaFile(type, abs, file, id, isEx)
                    }
                    error={errors.pdfs}
                />
            ),
        },
        {
            key: "video",
            label: (
                <span className="flex items-center">
                    <VideoCameraOutlined />
                    <span className="ml-2">Video</span>
                </span>
            ),
            children: (
                <div className="mt-4 space-y-4">
                    <Input
                        size="large"
                        prefix={<VideoCameraOutlined />}
                        placeholder="Embed URL (YouTube/Vimeo)"
                        value={data.video_url}
                        onChange={(e) =>
                            handleFieldChange("video_url", e.target.value)
                        }
                    />
                    <Divider>OR</Divider>
                    <MultipleMediaUpload
                        type="video"
                        files={videos}
                        existingFiles={[]} // Already in videos state
                        onAdd={(file) => handleAddMediaFile("video", file)}
                        onRemove={(type, abs, id, isEx) =>
                            handleRemoveMediaFile(type, abs, id, isEx)
                        }
                        onUpdate={(type, abs, file, id, isEx) =>
                            handleUpdateMediaFile(type, abs, file, id, isEx)
                        }
                        error={errors.videos}
                    />
                </div>
            ),
        },
        {
            key: "audio",
            label: (
                <span className="flex items-center">
                    <AudioOutlined />
                    <span className="ml-2">Audio</span>
                </span>
            ),
            children: (
                <div className="mt-4">
                    <MultipleMediaUpload
                        type="audio"
                        files={audios}
                        existingFiles={[]} 
                        onAdd={(file) => handleAddMediaFile("audio", file)}
                        onRemove={(type, abs, id, isEx) => handleRemoveMediaFile(type, abs, id, isEx)}
                        onUpdate={(type, abs, file, id, isEx) => handleUpdateMediaFile(type, abs, file, id, isEx)}
                        error={errors.audios}
                    />
                </div>
            ),
        },
    ];

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={isEditMode ? "Edit Post" : "Create Post"}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="font-semibold text-lg sm:text-xl text-gray-800 leading-tight">
                                    {isEditMode
                                        ? "Edit Post"
                                        : "Create New Post"}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {isEditMode
                                        ? "Modify your post details"
                                        : "Create a new article"}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                {draftExists && !hasUnsavedChanges && (
                                    <Tag
                                        color="blue"
                                        icon={<CloudSyncOutlined />}
                                        className="w-fit"
                                    >
                                        Draft Saved
                                    </Tag>
                                )}

                                <Link
                                    href={route("admin.posts.index")}
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        icon={<ArrowLeftOutlined />}
                                        className="w-full sm:w-auto"
                                    >
                                        Back to My Posts
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Restore Draft Prompt */}
                    {showRestorePrompt && (
                        <div className="mb-6">
                            <Alert
                                message="Unfinished Draft Found"
                                type="warning"
                                showIcon
                                closable
                                onClose={() => setShowRestorePrompt(false)}
                                action={
                                    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                                        <Button
                                            size="small"
                                            type="primary"
                                            onClick={loadDraftFromSession}
                                            icon={<HistoryOutlined />}
                                            className="w-full sm:w-auto"
                                        >
                                            Restore Draft
                                        </Button>

                                        <Button
                                            size="small"
                                            onClick={discardDraft}
                                            danger
                                            className="w-full sm:w-auto"
                                        >
                                            Discard
                                        </Button>

                                        <Button
                                            size="small"
                                            onClick={() =>
                                                setShowRestorePrompt(false)
                                            }
                                            className="w-full sm:w-auto"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                }
                            />
                        </div>
                    )}

                    <Row gutter={[24, 24]}>
                        {/* Main */}
                        <Col xs={24} lg={16}>
                            <Card
                                title="Post Information"
                                className="shadow-sm mb-6 rounded-lg"
                            >
                                <Space
                                    direction="vertical"
                                    className="w-full"
                                    size="large"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Post Title{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <Input
                                            size="large"
                                            placeholder="Enter a catchy title..."
                                            value={data.title}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    "title",
                                                    e.target.value,
                                                )
                                            }
                                            status={errors.title ? "error" : ""}
                                        />
                                        {errors.title && (
                                            <Text
                                                type="danger"
                                                className="text-xs"
                                            >
                                                {errors.title}
                                            </Text>
                                        )}
                                    </div>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Language
                                            </label>
                                            <Select
                                                className="w-full"
                                                size="large"
                                                placeholder="Select language"
                                                value={
                                                    data.lang_id
                                                        ? Number(data.lang_id)
                                                        : undefined
                                                }
                                                onChange={(val) =>
                                                    handleFieldChange(
                                                        "lang_id",
                                                        val,
                                                    )
                                                }
                                                status={
                                                    errors.lang_id
                                                        ? "error"
                                                        : ""
                                                }
                                                allowClear
                                                showSearch
                                                optionFilterProp="children"
                                            >
                                                {languages.map((lang) => (
                                                    <Select.Option
                                                        key={lang.id}
                                                        value={lang.id}
                                                    >
                                                        <div className="flex items-center">
                                                            <GlobalOutlined className="mr-2" />
                                                            {lang.name}
                                                            {lang.code && (
                                                                <span className="ml-2 text-gray-400 text-xs">
                                                                    ({lang.code}
                                                                    )
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                            {errors.lang_id && (
                                                <Text
                                                    type="danger"
                                                    className="text-xs"
                                                >
                                                    {errors.lang_id}
                                                </Text>
                                            )}
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Category
                                            </label>
                                            <Select
                                                className="w-full"
                                                size="large"
                                                placeholder={
                                                    data.lang_id
                                                        ? "Select category"
                                                        : "Select language first"
                                                }
                                                value={
                                                    data.category_id
                                                        ? Number(
                                                              data.category_id,
                                                          )
                                                        : undefined
                                                }
                                                onChange={(val) =>
                                                    handleFieldChange(
                                                        "category_id",
                                                        val,
                                                    )
                                                }
                                                status={
                                                    errors.category_id
                                                        ? "error"
                                                        : ""
                                                }
                                                allowClear
                                                disabled={!data.lang_id}
                                                showSearch
                                                optionFilterProp="children"
                                            >
                                                {filteredCategories.map((c) => (
                                                    <Select.Option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        <div className="flex items-center">
                                                            <TagOutlined className="mr-2" />
                                                            {c.name}
                                                        </div>
                                                    </Select.Option>
                                                ))}
                                            </Select>

                                            {!data.lang_id && (
                                                <Text
                                                    type="secondary"
                                                    className="text-xs mt-1 block"
                                                >
                                                    Please select a language
                                                    first to see categories
                                                </Text>
                                            )}
                                            {errors.category_id && (
                                                <Text
                                                    type="danger"
                                                    className="text-xs block"
                                                >
                                                    {errors.category_id}
                                                </Text>
                                            )}
                                        </Col>
                                    </Row>
                                </Space>
                            </Card>

                            {/* ✅ Mobile dropdown + Desktop tabs */}
                            <Card className="shadow-sm rounded-lg">
                                <ResponsiveMediaSwitch
                                    activeKey={mediaType}
                                    onChange={handleMediaTypeChange}
                                    items={mediaItems}
                                />
                            </Card>
                        </Col>

                        {/* Sidebar */}
                        <Col xs={24} lg={8}>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <Tabs
                                    defaultActiveKey="1"
                                    items={sidebarItems}
                                />
                            </div>

                            <Card className="shadow-sm rounded-lg sticky top-6 mt-6">
                                <Space
                                    direction="vertical"
                                    className="w-full"
                                    size="middle"
                                >
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<CloudUploadOutlined />}
                                        loading={submittingType === "publish"}
                                        onClick={() => handleSubmit("publish")}
                                    >
                                        Save As Published
                                    </Button>

                                    <Button
                                        size="large"
                                        block
                                        icon={<SaveOutlined />}
                                        loading={submittingType === "draft"}
                                        onClick={() => handleSubmit("draft")}
                                    >
                                        Save As Draft
                                    </Button>

                                    <Divider className="my-2" />

                                    <Button
                                        size="large"
                                        block
                                        danger
                                        ghost
                                        onClick={() => {
                                            clearDraft();
                                            router.visit(
                                                route("admin.posts.index"),
                                            );
                                        }}
                                        icon={<DeleteOutlined />}
                                    >
                                        Discard & Exit
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
                {submittingType && !uploadModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl">
                            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-700 font-medium">
                                {submittingType === "publish"
                                    ? "Publishing..."
                                    : "Saving draft..."}
                            </p>
                        </div>
                    </div>
                )}

                <UploadProgressModal
                    open={uploadModalOpen}
                    percent={uploadPercent}
                    done={uploadDone}
                    fileName={uploadFileName}
                    onClose={handleUploadModalClose}
                />

                <style>{`
    @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Bengali:wght@300;400;600;700&display=swap");

    @font-face {
        font-family: "solaiman-lipi";
        src: url("https://cdn.jsdelivr.net/npm/solaimanlipi@1.0.0/SolaimanLipi.woff2") format("woff2");
        font-weight: normal;
    }

    .ql-font-cairo { font-family: "Cairo", sans-serif; }
    .ql-font-amiri { font-family: "Amiri", serif; direction: rtl; }
    .ql-font-solaiman-lipi { font-family: "solaiman-lipi", sans-serif; }
    .ql-font-noto-sans-bengali { font-family: "Noto Sans Bengali", sans-serif; }
    .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif; }

    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="cairo"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="cairo"]::before { content: "Cairo (عربي)"; font-family: "Cairo", sans-serif; }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="amiri"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="amiri"]::before { content: "Amiri (أميري)"; font-family: "Amiri", serif; }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before { content: "Times New Roman"; font-family: "Times New Roman", Times, serif; }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="solaiman-lipi"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="solaiman-lipi"]::before { content: "সোলাইমান লিপি"; font-family: "solaiman-lipi", sans-serif; }
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noto-sans-bengali"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noto-sans-bengali"]::before { content: "Noto Bengali"; font-family: "Noto Sans Bengali", sans-serif; }

    .ql-container { min-height: 350px; font-size: 16px; }
    .ql-editor { min-height: 350px; white-space: pre-wrap !important; overflow-wrap: anywhere; word-break: break-word; tab-size: 4; }
    .ql-editor p { margin: 0 0 0.75em; }
    .ql-toolbar.ql-snow { border-top-left-radius: 8px; border-top-right-radius: 8px; background: #fbfbfb; }
    .ql-container.ql-snow { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    .ql-toolbar .ql-font { min-width: 140px; max-width: 220px; white-space: nowrap; text-overflow: ellipsis; }

    @media (max-width: 768px) {
        .ql-container { min-height: 250px; font-size: 14px; }
        .ql-editor { min-height: 250px; }
    }
`}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}
