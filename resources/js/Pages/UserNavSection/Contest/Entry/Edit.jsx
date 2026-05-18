import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import {
    ArrowLeftOutlined,
    AudioOutlined,
    CalendarOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    PictureOutlined,
    PlusOutlined,
    SaveOutlined,
    TrophyOutlined,
    UploadOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Link, router } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Image,
    Input,
    message,
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
    const hasFile = value instanceof File || !!postFile;
    const isImage = accept.includes("image");

    const triggerFileInput = () => document.getElementById(id)?.click();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file && onFileChange) onFileChange(field, file);
        e.target.value = "";
    };

    const getPreviewUrl = () => {
        if (value instanceof File) return URL.createObjectURL(value);
        if (postFile && !(value instanceof File)) return postFile;
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
// ✅ MultipleFeaturedImages (UNLIMITED + MULTI SELECT)
const MultipleFeaturedImages = ({
    featuredImages,
    onAddImages,
    onRemoveImage,
}) => {
    const getPreviewUrl = (image) => {
        if (image.file instanceof File) return URL.createObjectURL(image.file);
        if (image.url) return image.url;
        return null;
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;

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

        onAddImages(files);
        message.success(`${files.length} image(s) added!`);
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

            {/* ✅ Always show add box */}
            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() =>
                    document.getElementById("edit-entry-gallery-image")?.click()
                }
            >
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <PlusOutlined className="text-2xl text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">Add Images</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Select multiple
                    </p>
                </div>

                <input
                    type="file"
                    id="edit-entry-gallery-image"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                />
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Edit({ auth, entry, contest }) {
    const pdfInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const quillRef = useRef(null);

    const [isMounted, setIsMounted] = useState(false);
    const [mediaType, setMediaType] = useState("content");

    // ── Individual state for all fields ───────────────────────────────────────
    const [title, setTitle] = useState(entry.title || "");
    const [content, setContent] = useState(entry.content || "");

    // ── File states — pre-populate with existing entry files ─────────────────
    // We store existing file paths as strings, new uploads as File objects
    const [thumbnail, setThumbnail] = useState(entry.thumbnail || null);
    const [videoFile, setVideoFile] = useState(entry.video || null);
    const [audioFile, setAudioFile] = useState(entry.audio || null);
    const [pdfFile, setPdfFile] = useState(entry.pdf || null);
    const [galleryImages, setGalleryImages] = useState(
        entry.images
            ? entry.images.map((img) => ({
                  id: img.id,
                  url: getS3PublicUrl(img.image),
                  name: img.image?.split("/").pop() || "Image",
                  existing: true,
              }))
            : [],
    );
    const [removedGalleryIds, setRemovedGalleryIds] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Upload progress modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadFileName, setUploadFileName] = useState("");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDate = (dateString) => dayjs(dateString).format("MMM D, YYYY");

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

    // ── Gallery handlers ───────────────────────────────────────────────────────
    const handleAddGalleryImages = (files) => {
        const newOnes = files.map((file) => ({
            id: `new-${Date.now()}-${file.name}-${Math.random()}`,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            existing: false,
        }));

        setGalleryImages((prev) => [...prev, ...newOnes]);
    };

    const handleRemoveGalleryImage = (index) => {
        const img = galleryImages[index];

        // existing images -> backend delete list
        if (img?.existing && img?.id) {
            setRemovedGalleryIds((prev) => [...prev, img.id]);
        }

        // new image preview url cleanup
        if (!img?.existing && img?.url) {
            URL.revokeObjectURL(img.url);
        }

        setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    };
    const isMember = auth.user.subscriptions?.length > 0;
    // ── Sidebar tabs — only visible if 'image' is in formats ──────────────────
    const hasImageFormat = isManual && contestFormats.includes("image");
    const thumbnailPreview =
        thumbnail && !(thumbnail instanceof File)
            ? getS3PublicUrl(thumbnail)
            : null;
    const sidebarItems = useMemo(() => {
        if (!hasImageFormat) return [];

        // Build preview URL for existing thumbnail

        return [
            {
                key: "1",
                label: "Thumbnail",
                children: (
                    <FileUploadComponent
                        field="thumbnail"
                        label="Thumbnail Image"
                        accept="image/*"
                        postFile={thumbnailPreview}
                        onFileChange={(field, file) => setThumbnail(file)}
                        onRemove={() => setThumbnail(null)}
                        value={thumbnail instanceof File ? thumbnail : null}
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
                        onAddImages={handleAddGalleryImages}
                        onRemoveImage={handleRemoveGalleryImage}
                    />
                ),
            },
        ];
    }, [thumbnail, galleryImages, hasImageFormat, errors.thumbnail]);

    // helper: build existing file display path
    const getExistingPath = (val) =>
        val && !(val instanceof File) ? getS3PublicUrl(val) : null;

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
                    <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-lg mt-4">
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
                                    {pdfFile instanceof File
                                        ? pdfFile.name
                                        : pdfFile === "processing"
                                          ? "Processing..."
                                          : pdfFile.split("/").pop()}
                                </Text>
                                {pdfFile === "processing" ? (
                                    <span className="text-xs text-orange-500 mt-1 font-semibold">
                                        Your PDF is currently being processed.
                                    </span>
                                ) : (
                                    getExistingPath(pdfFile) && (
                                        <a
                                            href={getExistingPath(pdfFile)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-500 underline mt-1"
                                        >
                                            View current file
                                        </a>
                                    )
                                )}
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="small"
                                        danger
                                        ghost
                                        disabled={!isMember}
                                        icon={<DeleteOutlined />}
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
                                    onClick={() => pdfInputRef.current?.click()}
                                    size="large"
                                >
                                    Upload PDF File
                                </Button>
                            </div>
                        )}
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
                                        {videoFile instanceof File
                                            ? videoFile.name
                                            : videoFile === "processing"
                                              ? "Processing..."
                                              : videoFile.split("/").pop()}
                                    </Text>
                                    {videoFile === "processing" ? (
                                        <span className="text-xs text-orange-500 mt-1 font-semibold">
                                            Your video is currently being
                                            processed.
                                        </span>
                                    ) : (
                                        getExistingPath(videoFile) && (
                                            <a
                                                href={getExistingPath(
                                                    videoFile,
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-500 underline mt-1"
                                            >
                                                View current file
                                            </a>
                                        )
                                    )}
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
                                    {audioFile instanceof File
                                        ? audioFile.name
                                        : audioFile === "processing"
                                          ? "Processing..."
                                          : audioFile.split("/").pop()}
                                </Text>
                                {audioFile === "processing" ? (
                                    <span className="text-xs text-orange-500 mt-1 font-semibold">
                                        Your audio track is being processed.
                                    </span>
                                ) : (
                                    getExistingPath(audioFile) && (
                                        <a
                                            href={getExistingPath(audioFile)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-500 underline mt-1"
                                        >
                                            View current file
                                        </a>
                                    )
                                )}
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

    // ── Auto-select first available tab ───────────────────────────────────────
    useEffect(() => {
        if (isManual && mediaItems.length > 0) {
            const keys = mediaItems.map((t) => t.key);
            if (!keys.includes(mediaType)) {
                setMediaType(keys[0]);
            }
        }
    }, [mediaItems, isManual]);

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
                const response = await fetch(route("upload.chunk"), {
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

    // ── Submit — manually build FormData ──────────────────────────────────────
    const submit = async () => {
        if (!title) return message.error("Title is required!");

        const formData = new FormData();
        formData.append("_method", "PUT");
        formData.append("title", title);
        formData.append("content", content || "");
        formData.append("contest_id", contest.id);

        if (thumbnail instanceof File) {
            formData.append("thumbnail", thumbnail);
        } else if (thumbnail === null) {
            formData.append("remove_thumbnail", "1");
        }

        if (videoFile instanceof File && videoFile.size < 5000000) {
            formData.append("video", videoFile);
        } else if (videoFile === null) {
            formData.append("remove_video", "1");
        }

        if (audioFile instanceof File && audioFile.size < 5000000) {
            formData.append("audio", audioFile);
        } else if (audioFile === null) {
            formData.append("remove_audio", "1");
        }

        if (pdfFile instanceof File && pdfFile.size < 5000000) {
            formData.append("pdf", pdfFile);
        } else if (pdfFile === null) {
            formData.append("remove_pdf", "1");
        }

        // New gallery images only
        galleryImages
            .filter((img) => !img.existing)
            .forEach((img) => formData.append("images[]", img.file));

        // IDs of gallery images to remove
        removedGalleryIds.forEach((id) =>
            formData.append("remove_images[]", id),
        );

        setProcessing(true);

        const largeFileForProgress =
            (videoFile instanceof File ? videoFile : null) ||
            (audioFile instanceof File ? audioFile : null) ||
            (pdfFile instanceof File ? pdfFile : null);
        const url = route("user.entries.update", entry.id);

        setUploadFileName(largeFileForProgress?.name || "");
        setUploadPercent(0);
        setUploadDone(false);

        // ── 1. HANDLE CHUNKED UPLOADS BEFORE SUBMIT ──
        try {
            if (videoFile instanceof File && videoFile.size >= 5000000) {
                setUploadModalOpen(true);
                const tempPath = await uploadFileInChunks(
                    videoFile,
                    setUploadPercent,
                );
                formData.append("video_temp_path", tempPath);
                setUploadPercent(100);
            }
            if (audioFile instanceof File && audioFile.size >= 5000000) {
                setUploadModalOpen(true);
                const tempPath = await uploadFileInChunks(
                    audioFile,
                    setUploadPercent,
                );
                formData.append("audio_temp_path", tempPath);
                setUploadPercent(100);
            }
            if (pdfFile instanceof File && pdfFile.size >= 5000000) {
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

        if (largeFileForProgress && uploadModalOpen) {
            setUploadPercent(100); // chunking done, keep modal up
        }

        // ── 2. FINAL FORM SUBMISSION ──
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader(
            "X-CSRF-TOKEN",
            document.querySelector('meta[name="csrf-token"]')?.content || "",
        );
        xhr.setRequestHeader("X-Inertia", "true");
        xhr.setRequestHeader(
            "X-Inertia-Version",
            document.head.querySelector('[name="inertia-version"]')?.content ||
                "",
        );

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && !largeFileForProgress) {
                setUploadPercent(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            setProcessing(false);
            if (xhr.status >= 200 && xhr.status < 400) {
                if (largeFileForProgress) {
                    setUploadDone(true);
                } else {
                    setUploadModalOpen(false);
                    message.success("Entry updated successfully!");
                    window.location.href = route("user.own_entry.index");
                }
            } else if (xhr.status === 409) {
                window.location.href = route("user.own_entry.index");
            } else {
                setUploadModalOpen(false);
                try {
                    const res = JSON.parse(xhr.responseText);
                    setErrors(res?.errors || {});
                    message.error(
                        res?.message || res?.error || "Upload failed.",
                    );
                } catch {
                    message.error("Upload failed. Please try again.");
                }
            }
        };

        xhr.onerror = () => {
            setProcessing(false);
            setUploadModalOpen(false);
            message.error("Network error during upload. Please try again.");
        };

        xhr.send(formData);
    };

    const handleUploadModalClose = () => {
        setUploadModalOpen(false);
        setUploadDone(false);
        router.visit(route("user.own_entry.index"));
    };

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`Edit Entry: ${entry.title}`}
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Back button */}
                    <Link href={route("user.own_entry.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-6"
                        >
                            Back to Entries
                        </Button>
                    </Link>

                    {/* Contest Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-full shrink-0">
                                <TrophyOutlined
                                    style={{
                                        fontSize: "24px",
                                        color: "#1890ff",
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                    <Title level={3} className="mb-0">
                                        {contest.title}
                                    </Title>
                                    <Tag color="blue">Editing Entry</Tag>
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
                                            disabled={processing}
                                            onClick={submit}
                                        >
                                            Update Entry
                                        </Button>

                                        <Link
                                            href={route("user.own_entry.index")}
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
