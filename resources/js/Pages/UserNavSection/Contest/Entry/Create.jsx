import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import {
    ArrowLeftOutlined,
    AudioOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    DollarOutlined,
    EyeOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    LinkOutlined,
    PictureOutlined,
    PlusOutlined,
    SaveOutlined,
    TrophyOutlined,
    UploadOutlined,
    VideoCameraOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Image,
    Input,
    message,
    Modal,
    Row,
    Space,
    Tabs,
    Tag,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import UploadProgressModal from "@/Components/UploadProgressModal";

const { Title, Text } = Typography;

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
    ],
};

const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
];

// ─── FileUploadComponent ──────────────────────────────────────────────────────
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
        e.target.value = "";
    };

    const getPreviewUrl = () => {
        if (value instanceof File) return URL.createObjectURL(value);
        if (postFile)
            return typeof postFile === "string" && postFile.startsWith("http")
                ? postFile
                : postFile;
        return null;
    };

    const previewUrl = getPreviewUrl();

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
                            onRemove?.(field);
                        }}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
};

// ─── MultipleFeaturedImages ───────────────────────────────────────────────────
// ─── MultipleFeaturedImages (UNLIMITED + MULTI SELECT) ───────────────────────
const MultipleFeaturedImages = ({
    featuredImages,
    onAddImages,
    onRemoveImage,
}) => {
    const getPreviewUrl = (image) => {
        if (image instanceof File) return URL.createObjectURL(image);
        if (image.url) return image.url;
        if (image.file instanceof File) return URL.createObjectURL(image.file);
        return null;
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;

        // validation (per file)
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                message.error("Only image files are allowed");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                message.error("Each image must be under 5MB");
                return;
            }
        }

        onAddImages(files); // ✅ send multiple files
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700">
                        Gallery Images
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Add multiple images (Unlimited).
                    </p>
                </div>

                <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded-full">
                    {featuredImages.length}
                </span>
            </div>

            {featuredImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {featuredImages.map((image, index) => {
                        const previewUrl = getPreviewUrl(image);
                        const imageName =
                            image.name ||
                            image.file?.name ||
                            `Image ${index + 1}`;

                        return (
                            <div
                                key={image.id || `${imageName}-${index}`}
                                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                            >
                                <div className="aspect-square relative">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={`Gallery ${index + 1}`}
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
                                </div>

                                <div className="p-2 bg-white border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-medium truncate">
                                            {imageName}
                                        </p>
                                        <Button
                                            size="small"
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => onRemoveImage(index)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ✅ Unlimited: always show add box */}
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() =>
                    document.getElementById("add-entry-gallery-image")?.click()
                }
            >
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <PlusOutlined className="text-2xl text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">Add Images</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Click to select multiple
                    </p>
                </div>

                <input
                    type="file"
                    id="add-entry-gallery-image"
                    hidden
                    accept="image/*"
                    multiple // ✅ MULTI SELECT
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Create({ auth, contest, isMember }) {
    const pdfInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const quillRef = useRef(null);

    const [isMounted, setIsMounted] = useState(false);
    const [mediaType, setMediaType] = useState("content");

    // ── Individual state for all fields (NO useForm) ───────────────────────────
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [thumbnail, setThumbnail] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentNumber, setPaymentNumber] = useState("");
    const [transactionId, setTransactionId] = useState("");
    // Google Form unlock after payment
    const [googleFormUnlocked, setGoogleFormUnlocked] = useState(false);
    const [googleFormPaymentPurpose, setGoogleFormPaymentPurpose] =
        useState(false);

    // Upload progress modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadFileName, setUploadFileName] = useState("");

    useEffect(() => {
        setIsMounted(true);
        // Show warning if contest is member-only and user is not a member
        if (contest.user_type === "member" && !isMember) {
            message.warning(
                "This contest is only for members. You must be a member to participate.",
                5,
            );
        }
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (dateString) => dayjs(dateString).format("MMM D, YYYY");

    const isContestActive = () => {
        const now = dayjs();
        return (
            now.isAfter(dayjs(contest.start_date)) &&
            now.isBefore(dayjs(contest.end_date))
        );
    };

    const contestFormats = useMemo(() => {
        const raw = contest.formats;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map((f) => f.toLowerCase());
        try {
            return JSON.parse(raw).map((f) => f.toLowerCase());
        } catch {
            return [];
        }
    }, [contest.formats]);

    const isManual = contest.type === "manual";
    const isGoogleForm = contest.type === "google_form";
    const active = isContestActive();

    // ── Gallery handlers ───────────────────────────────────────────────────────
    // ── Gallery handlers (UNLIMITED + MULTI) ─────────────────────────────────
    const handleAddGalleryImages = (files) => {
        const newOnes = files.map((file) => ({
            id: `new-${Date.now()}-${file.name}-${Math.random()}`,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
        }));

        setGalleryImages((prev) => [...prev, ...newOnes]);
    };

    const handleRemoveGalleryImage = (index) => {
        setGalleryImages((prev) => {
            const img = prev[index];
            if (img?.url) URL.revokeObjectURL(img.url); // ✅ cleanup
            return prev.filter((_, i) => i !== index);
        });
    };

    // ── Sidebar tabs — only visible if 'image' is in formats ──────────────────
    const hasImageFormat = isManual && contestFormats.includes("image");

    const sidebarItems = useMemo(() => {
        if (!hasImageFormat) return [];
        return [
            {
                key: "1",
                label: "Thumbnail",
                children: (
                    <FileUploadComponent
                        field="thumbnail"
                        label="Thumbnail Image"
                        accept="image/*"
                        postFile={null}
                        onFileChange={(field, file) => setThumbnail(file)}
                        onRemove={() => setThumbnail(null)}
                        value={thumbnail}
                        error={errors.thumbnail}
                    />
                ),
            },
            {
                key: "2",
                label: "Gallery",
                children: (
                    <MultipleFeaturedImages
                        featuredImages={galleryImages}
                        onAddImages={handleAddGalleryImages} // ✅ new function
                        onRemoveImage={handleRemoveGalleryImage}
                    />
                ),
            },
        ];
    }, [thumbnail, galleryImages, hasImageFormat, errors.thumbnail]);

    // ── ALL possible media tab definitions ────────────────────────────────────
    const allMediaItems = useMemo(
        () => ({
            content: {
                key: "content",
                label: (
                    <span className="flex items-center gap-2">
                        <FileTextOutlined />
                        Text Content
                    </span>
                ),
                children: (
                    <div className="mt-4 min-h-[300px]">
                        {isMounted ? (
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={content}
                                onChange={(val) => setContent(val)}
                                placeholder="Write your content..."
                                modules={quillModules}
                                formats={quillFormats}
                                style={{
                                    background: "#fff",
                                    borderRadius: "8px",
                                    height: "250px",
                                    marginBottom: "50px",
                                }}
                            />
                        ) : (
                            <Input.TextArea
                                rows={6}
                                placeholder="Write your content..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                style={{
                                    background: "#fff",
                                    borderRadius: "8px",
                                }}
                            />
                        )}
                    </div>
                ),
            },
            pdf: {
                key: "pdf",
                label: (
                    <span className="flex items-center gap-2">
                        <FilePdfOutlined />
                        PDF
                    </span>
                ),
                children: (
                    <div className=" p-10 text-center border-2 border-dashed border-gray-200 rounded-lg mt-4">
                        <input
                            ref={pdfInputRef}
                            type="file"
                            hidden
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setPdfFile(file);
                            }}
                        />
                        {pdfFile ? (
                            <div className="flex flex-col items-center">
                                <FilePdfOutlined className="text-5xl text-red-500 mb-2" />
                                <Text strong>
                                    {pdfFile.name || "PDF Attachment"}
                                </Text>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="small"
                                        danger
                                        ghost
                                        icon={<DeleteOutlined />}
                                        disabled={!isMember}
                                        onClick={() => {
                                            setPdfFile(null);
                                            if (pdfInputRef.current)
                                                pdfInputRef.current.value = "";
                                        }}
                                    >
                                        Remove
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<UploadOutlined />}
                                        disabled={!isMember}
                                        onClick={() =>
                                            pdfInputRef.current?.click()
                                        }
                                    >
                                        Replace
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <FilePdfOutlined className="text-5xl text-gray-300 mb-4" />
                                <br />
                                <Button
                                    icon={<UploadOutlined />}
                                    disabled={!isMember}
                                    onClick={() => pdfInputRef.current?.click()}
                                    size="large"
                                >
                                    Upload PDF File
                                </Button>
                            </div>
                        )}

                        {/* Member lock overlay */}
                        {!isMember && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                                <div className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl shadow-md border border-gray-100">
                                    <span className="text-3xl">🔒</span>
                                    <p className="text-base font-semibold text-gray-800">
                                        Members Only
                                    </p>
                                    <p className="text-sm text-gray-500 text-center">
                                        PDF upload is available for members.
                                    </p>
                                    <a className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md cursor-pointer transition-colors">
                                        Become a Member
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                ),
            },
            video: {
                key: "video",
                label: (
                    <span className="flex items-center gap-2">
                        <VideoCameraOutlined />
                        Video
                    </span>
                ),
                children: (
                    <div className="mt-4">
                        <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                            <input
                                ref={videoInputRef}
                                type="file"
                                hidden
                                accept="video/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setVideoFile(file);
                                }}
                            />
                            {videoFile ? (
                                <div className="flex flex-col items-center">
                                    <VideoCameraOutlined className="text-4xl text-blue-500 mb-2" />
                                    <Text strong>
                                        {videoFile.name || "Video File"}
                                    </Text>
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            size="small"
                                            danger
                                            ghost
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                                setVideoFile(null);
                                                if (videoInputRef.current)
                                                    videoInputRef.current.value =
                                                        "";
                                            }}
                                        >
                                            Remove
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<UploadOutlined />}
                                            onClick={() =>
                                                videoInputRef.current?.click()
                                            }
                                        >
                                            Replace
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <VideoCameraOutlined className="text-4xl text-gray-300 mb-2" />
                                    <br />
                                    <Button
                                        icon={<UploadOutlined />}
                                        onClick={() =>
                                            videoInputRef.current?.click()
                                        }
                                    >
                                        Upload Video File
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ),
            },
            audio: {
                key: "audio",
                label: (
                    <span className="flex items-center gap-2">
                        <AudioOutlined />
                        Audio
                    </span>
                ),
                children: (
                    <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-lg mt-4">
                        <input
                            ref={audioInputRef}
                            type="file"
                            hidden
                            accept="audio/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setAudioFile(file);
                            }}
                        />
                        {audioFile ? (
                            <div className="flex flex-col items-center">
                                <AudioOutlined className="text-4xl text-green-500 mb-2" />
                                <Text strong>
                                    {audioFile.name || "Audio File"}
                                </Text>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="small"
                                        danger
                                        ghost
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            setAudioFile(null);
                                            if (audioInputRef.current)
                                                audioInputRef.current.value =
                                                    "";
                                        }}
                                    >
                                        Remove
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<UploadOutlined />}
                                        onClick={() =>
                                            audioInputRef.current?.click()
                                        }
                                    >
                                        Replace
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <AudioOutlined className="text-4xl text-gray-300 mb-2" />
                                <br />
                                <Button
                                    icon={<AudioOutlined />}
                                    onClick={() =>
                                        audioInputRef.current?.click()
                                    }
                                    size="large"
                                >
                                    Upload Audio Track
                                </Button>
                            </div>
                        )}
                    </div>
                ),
            },
        }),
        [content, pdfFile, videoFile, audioFile, isMounted],
    );

    // ── Filter media tabs based on contest.formats ────────────────────────────
    const mediaItems = useMemo(() => {
        if (!isManual) return [];
        const formatKeyMap = {
            text: "content",
            pdf: "pdf",
            video: "video",
            audio: "audio",
        };
        return contestFormats
            .map((fmt) => formatKeyMap[fmt.toLowerCase()])
            .filter(Boolean)
            .map((key) => allMediaItems[key])
            .filter(Boolean);
    }, [isManual, contestFormats, allMediaItems]);

    // ── Auto-select first available tab when formats change ───────────────────
    useEffect(() => {
        if (isManual && mediaItems.length > 0) {
            const keys = mediaItems.map((t) => t.key);
            if (!keys.includes(mediaType)) {
                setMediaType(keys[0]);
            }
        }
    }, [mediaItems, isManual]);

    // ── Check if user can participate ─────────────────────────────────────────
    const canParticipate = () => {
        // member-only contest: only members can participate
        if (contest.user_type === "member" && !isMember) {
            return false;
        }
        // user type 'user' allows both users and members
        // user type 'all' allows everyone
        return true;
    };

    /**
     * Chunked file upload logic for large files (video, audio, pdf)
     */
    const uploadFileInChunks = async (file, onProgress) => {
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        const identifier = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const fileName = file.name;

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

            try {
                // Use a relative path fallback if route() helper has issues on production protocol
                const uploadUrl =
                    typeof route === "function"
                        ? route("upload.chunk")
                        : "/upload/chunk";

                const response = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN":
                            document.querySelector('meta[name="csrf-token"]')
                                ?.content || "",
                        Accept: "application/json",
                    },
                    body: chunkFormData,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed at chunk ${chunkIndex + 1}`);
                }

                const result = await response.json();

                // Update Progress percentage
                const percentCompleted = Math.round(
                    ((chunkIndex + 1) / totalChunks) * 100,
                );
                onProgress(percentCompleted);

                if (result.done) {
                    return result.temp_path; // returns e.g "temp/xyz_file.mp4"
                }
            } catch (error) {
                console.error("Chunk Upload Error:", error);
                throw error;
            }
        }

        throw new Error("File upload incomplete.");
    };

    // ── Perform the actual submission ─────────────────────────────────────────
    const doSubmit = async (paymentInfo = null) => {
        // Refresh CSRF token first to prevent 419 after long idle time or chunk uploads
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

        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content || "");
        formData.append("contest_id", contest.id);

        if (thumbnail) formData.append("thumbnail", thumbnail);

        // Small files (<5MB) → send directly
        if (pdfFile && pdfFile.size < 5 * 1024 * 1024)
            formData.append("pdf", pdfFile);
        if (videoFile && videoFile.size < 5 * 1024 * 1024)
            formData.append("video", videoFile);
        if (audioFile && audioFile.size < 5 * 1024 * 1024)
            formData.append("audio", audioFile);

        if (galleryImages.length > 0) {
            galleryImages.forEach((img) =>
                formData.append("images[]", img.file),
            );
        }

        if (paymentInfo) {
            formData.append("payment_info[method]", paymentInfo.method);
            formData.append("payment_info[number]", paymentInfo.number);
            formData.append(
                "payment_info[transactionId]",
                paymentInfo.transactionId,
            );
        }

        setProcessing(true);

        const hasLargeFile =
            (videoFile && videoFile.size >= 5 * 1024 * 1024) ||
            (audioFile && audioFile.size >= 5 * 1024 * 1024) ||
            (pdfFile && pdfFile.size >= 5 * 1024 * 1024);

        // ── 1. CHUNKED UPLOAD for large files BEFORE final submit ──
        try {
            if (videoFile && videoFile.size >= 5 * 1024 * 1024) {
                setUploadFileName(videoFile.name);
                setUploadPercent(0);
                setUploadDone(false);
                setUploadModalOpen(true);
                const tempPath = await uploadFileInChunks(
                    videoFile,
                    setUploadPercent,
                );
                formData.append("video_temp_path", tempPath);
                setUploadPercent(100);
            }
            if (audioFile && audioFile.size >= 5 * 1024 * 1024) {
                setUploadFileName(audioFile.name);
                setUploadPercent(0);
                setUploadDone(false);
                setUploadModalOpen(true);
                const tempPath = await uploadFileInChunks(
                    audioFile,
                    setUploadPercent,
                );
                formData.append("audio_temp_path", tempPath);
                setUploadPercent(100);
            }
            if (pdfFile && pdfFile.size >= 5 * 1024 * 1024) {
                setUploadFileName(pdfFile.name);
                setUploadPercent(0);
                setUploadDone(false);
                setUploadModalOpen(true);
                const tempPath = await uploadFileInChunks(
                    pdfFile,
                    setUploadPercent,
                );
                formData.append("pdf_temp_path", tempPath);
                setUploadPercent(100);
            }
        } catch (error) {
            setProcessing(false);
            setUploadModalOpen(false);
            return message.error(
                "Large file chunk upload failed. Please try again.",
            );
        }

        // ── 2. FINAL FORM SUBMISSION via Inertia router.post() ──
        // router.post() correctly handles CSRF, redirects, and Inertia responses
        router.post(route("user.entries.store", { id: contest.id }), formData, {
            forceFormData: true,
            onSuccess: () => {
                setProcessing(false);
                setUploadModalOpen(false);
                if (hasLargeFile) {
                    setUploadDone(true);
                } else {
                    message.success("Entry submitted successfully!");
                }
            },
            onError: (errors) => {
                setProcessing(false);
                setUploadModalOpen(false);
                setErrors(errors);
                const firstError = Object.values(errors)[0];
                message.error(
                    firstError ||
                        "Submission failed. Please check your inputs.",
                );
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const handleUploadModalClose = () => {
        setUploadModalOpen(false);
        setUploadDone(false);
        router.visit(route("user.contests.participate.index"));
    };

    // ── Submit — with user type and payment checks ───────────────────────────
    const submit = () => {
        if (!isContestActive()) {
            return message.error(
                "This contest is no longer active. You cannot submit entries.",
            );
        }
        if (!title) return message.error("Title is required!");

        // Check user type restrictions
        if (!canParticipate()) {
            return message.warning(
                "This contest is only for members. You must be a member to participate.",
            );
        }

        // If paid contest, show payment modal for all users
        if (contest.payment_type === "paid") {
            setShowPaymentModal(true);
            return;
        }

        // Free contest — submit directly
        doSubmit();
    };

    // ── Handle payment confirmation ──────────────────────────────────────────
    const handlePaymentConfirm = () => {
        if (!paymentMethod)
            return message.error("Please select a payment method.");
        if (!paymentNumber)
            return message.error("Please enter your payment number.");
        if (!transactionId)
            return message.error("Please enter the transaction ID.");

        setShowPaymentModal(false);

        // Google Form: just unlock the link, no file submission needed
        if (googleFormPaymentPurpose) {
            setGoogleFormUnlocked(true);
            setGoogleFormPaymentPurpose(false);
            message.success(
                "Payment confirmed! You can now access the submission form.",
            );
            return;
        }

        doSubmit({
            method: paymentMethod,
            number: paymentNumber,
            transactionId: transactionId,
        });
    };

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`Submit Entry: ${contest.title}`}
        >
            <div className="py-6 -m-3">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Back button */}
                    <Link href={route("user.contests.participate.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-6"
                        >
                            Back to Contest
                        </Button>
                    </Link>

                    {/* Contest Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 lg:p-6 mb-8">
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-full shrink-0">
                                    <TrophyOutlined
                                        style={{
                                            fontSize: "24px",
                                            color: "#1890ff",
                                        }}
                                    />
                                </div>{" "}
                                <Title level={3} className="mb-0">
                                    {contest.title}
                                </Title>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <Tag color={active ? "green" : "red"}>
                                        {active ? "Active" : "Ended"}
                                    </Tag>
                                    <Tag color={isManual ? "blue" : "purple"}>
                                        {isManual
                                            ? "Manual Entry"
                                            : "Google Form"}
                                    </Tag>
                                </div>
                                <Text className="text-gray-600 block mb-3">
                                    {contest.content}
                                </Text>
                                <div className="flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2">
                                        <CalendarOutlined className="text-blue-500" />
                                        <Text strong>Starts:</Text>
                                        <Text>
                                            {formatDate(contest.start_date)}
                                        </Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarOutlined className="text-blue-500" />
                                        <Text strong>Ends:</Text>
                                        <Text>
                                            {formatDate(contest.end_date)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contest ended warning */}
                    {!active && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <Text type="danger" strong>
                                This contest is no longer active. You cannot
                                submit new entries.
                            </Text>
                        </div>
                    )}

                    {/* Member-only restriction warning */}
                    {contest.user_type === "member" && !isMember && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3">
                            <WarningOutlined
                                style={{ color: "#faad14", fontSize: 20 }}
                            />
                            <Text strong style={{ color: "#ad6800" }}>
                                This contest is only for members. You must be a
                                member to participate.
                            </Text>
                        </div>
                    )}

                    {/* Paid contest info banner */}
                    {contest.payment_type === "paid" && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                            <DollarOutlined
                                style={{ color: "#1890ff", fontSize: 20 }}
                            />
                            <Text strong style={{ color: "#096dd9" }}>
                                This is a paid contest. Entry fee: ৳
                                {contest.amount} — Payment will be required upon
                                submission.
                            </Text>
                        </div>
                    )}

                    {/* ── GOOGLE FORM type ── */}
                    {isGoogleForm && (
                        <Card className="shadow-sm rounded-lg">
                            <div className="text-center py-8">
                                <LinkOutlined
                                    style={{
                                        fontSize: "48px",
                                        color: active ? "#1890ff" : "#d9d9d9",
                                    }}
                                    className="mb-4 block"
                                />
                                <Title
                                    level={4}
                                    className={!active ? "text-gray-400" : ""}
                                >
                                    Submit via Google Form
                                </Title>

                                {/* Contest ended */}
                                {!active && (
                                    <Text
                                        type="secondary"
                                        className="italic block"
                                    >
                                        Link unavailable — contest has ended.
                                    </Text>
                                )}

                                {/* Active + Paid + NOT yet unlocked (all users must pay) */}
                                {active &&
                                    contest.payment_type === "paid" &&
                                    !googleFormUnlocked && (
                                        <div className="mt-4 p-6 bg-yellow-50 border border-yellow-300 rounded-xl flex flex-col items-center gap-4">
                                            <span className="text-5xl">🔒</span>
                                            <div>
                                                <p className="text-base font-semibold text-yellow-800">
                                                    Payment Required to Access
                                                    Form
                                                </p>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    This is a paid contest. You
                                                    must pay the entry fee of{" "}
                                                    <strong>
                                                        ৳{contest.amount}
                                                    </strong>{" "}
                                                    before accessing the Google
                                                    Form submission link.
                                                </p>
                                            </div>
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<DollarOutlined />}
                                                onClick={() => {
                                                    setGoogleFormPaymentPurpose(
                                                        true,
                                                    );
                                                    setShowPaymentModal(true);
                                                }}
                                                style={{
                                                    background: "#faad14",
                                                    borderColor: "#faad14",
                                                    color: "#000",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Pay ৳{contest.amount} to Unlock
                                                Form
                                            </Button>
                                        </div>
                                    )}

                                {/* Active + (Free, OR paid & unlocked) — all users including members must pay */}
                                {active &&
                                    (contest.payment_type !== "paid" ||
                                        googleFormUnlocked) && (
                                        <>
                                            <Text
                                                type="secondary"
                                                className="block mb-6"
                                            >
                                                Click the link below to open the
                                                submission form.
                                            </Text>
                                            {googleFormUnlocked && (
                                                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                                                    <CheckCircleOutlined
                                                        style={{
                                                            color: "#52c41a",
                                                        }}
                                                    />
                                                    <Text
                                                        style={{
                                                            color: "#389e0d",
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        Payment confirmed — form
                                                        unlocked!
                                                    </Text>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <LinkOutlined className="text-blue-500 shrink-0" />
                                                <a
                                                    href={
                                                        contest.form_url?.startsWith(
                                                            "http",
                                                        )
                                                            ? contest.form_url
                                                            : `https://${contest.form_url}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    Click here to open the
                                                    submission form →
                                                </a>
                                            </div>
                                        </>
                                    )}
                            </div>
                        </Card>
                    )}

                    {/* ── MANUAL type ── */}
                    {isManual && (
                        <Row gutter={[24, 24]}>
                            {/* ── Main Column ── */}
                            <Col xs={24} lg={16}>
                                {/* Entry Info */}
                                <Card
                                    title="Entry Information"
                                    className="shadow-sm mb-6 rounded-lg"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Entry Title{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <Input
                                            size="large"
                                            placeholder="Enter your entry title"
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            status={errors.title ? "error" : ""}
                                            disabled={!active}
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
                                </Card>

                                {/* Media / Content Tabs */}
                                <Card className="shadow-sm rounded-lg">
                                    {mediaItems.length > 0 ? (
                                        <Tabs
                                            activeKey={mediaType}
                                            onChange={(key) => {
                                                setMediaType(key);
                                            }}
                                            items={mediaItems}
                                        />
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <FileTextOutlined
                                                style={{ fontSize: "32px" }}
                                                className="mb-2 block"
                                            />
                                            <Text type="secondary">
                                                No media formats configured for
                                                this contest.
                                            </Text>
                                        </div>
                                    )}
                                </Card>
                            </Col>

                            {/* ── Sidebar Column ── */}
                            <Col xs={24} lg={8}>
                                {hasImageFormat && (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                                        <Tabs
                                            defaultActiveKey="1"
                                            items={sidebarItems}
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <Card className="shadow-sm rounded-lg sticky top-6">
                                    <Space
                                        direction="vertical"
                                        className="w-full"
                                        size="middle"
                                    >
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            icon={<SaveOutlined />}
                                            loading={processing}
                                            disabled={processing || !active}
                                            onClick={submit}
                                        >
                                            Submit Entry
                                        </Button>

                                        <Link
                                            href={route(
                                                "user.contests.participate.index",
                                            )}
                                            className="w-full"
                                        >
                                            <Button
                                                size="large"
                                                block
                                                disabled={processing}
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>

            {/* Payment Modal for Paid Contests */}
            <Modal
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <DollarOutlined
                            style={{ color: "#faad14", fontSize: 20 }}
                        />
                        <span>Payment Required</span>
                    </div>
                }
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => setShowPaymentModal(false)}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="pay"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={processing}
                        onClick={handlePaymentConfirm}
                    >
                        Confirm Payment & Submit
                    </Button>,
                ]}
                centered
            >
                <div style={{ padding: "16px 0" }}>
                    <div
                        style={{
                            background: "#fffbe6",
                            border: "1px solid #ffe58f",
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 20,
                            textAlign: "center",
                        }}
                    >
                        <Text strong style={{ fontSize: 18 }}>
                            Contest Fee: ৳{contest.amount}
                        </Text>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Payment Method{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #d9d9d9",
                            }}
                        >
                            <option value="">Select Method</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Payment Number{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. 01XXXXXXXXX"
                            value={paymentNumber}
                            onChange={(e) => setPaymentNumber(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Transaction ID{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Enter your transaction ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            <UploadProgressModal
                open={uploadModalOpen}
                percent={uploadPercent}
                done={uploadDone}
                fileName={uploadFileName}
                onClose={handleUploadModalClose}
            />
        </FrontAuthenticatedLayout>
    );
}
