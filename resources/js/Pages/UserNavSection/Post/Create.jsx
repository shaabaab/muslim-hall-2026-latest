import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    ArrowLeftOutlined,
    AudioOutlined,
    CloudSyncOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
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
import { buildS3UrlAlways } from "@/Utils/s3Helpers";

import { Link, router, useForm, usePage } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Image,
    Input,
    message,
    Modal,
    notification,
    Row,
    Select,
    Space,
    Tabs,
    Tag,
    Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import MagicUrl from "quill-magic-url";

Quill.register("modules/magicUrl", MagicUrl);
import UploadProgressModal from "@/Components/UploadProgressModal";
import { useBackgroundUpload } from "@/Contexts/BackgroundUploadContext";


const { Text } = Typography;
const { TabPane } = Tabs;

import MultipleMediaUpload from "@/Components/MultipleMediaUpload";

/**
 * ✅ Quill tab indent fix
 */

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
const CustomQuillEditor = ({
    value,
    onChange,
    placeholder,
    className = "",
}) => {
    const quillRef = useRef(null);

    useEffect(() => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;

        if (editor.__keyboardFixed) return;
        editor.__keyboardFixed = true;

        editor.keyboard.addBinding({ key: 9, shiftKey: false }, () => {
            editor.format("indent", "+1", "user");
            return false;
        });

        editor.keyboard.addBinding({ key: 9, shiftKey: true }, () => {
            editor.format("indent", "-1", "user");
            return false;
        });
    }, []);

    const handleEditorChange = useCallback(
        (content) => onChange?.(content),
        [onChange],
    );

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
        }),
        [],
    );

    const formats = useMemo(
        () => [
            "header",
            "font",
            "size",
            "bold",
            "italic",
            "underline",
            "strike",
            "color",
            "background",
            "list",
            "bullet",
            "indent",
            "direction",
            "align",
            "link",
            "image",
            "video",
            "blockquote",
            "code-block",
        ],
        [],
    );

    return (
        <div className={className}>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value ?? ""}
                onChange={handleEditorChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
};

/**
 * ✅ Single file upload (thumbnail/sponsor)
 */
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
    const inputRef = useRef(null);
    const hasFile = value || postFile;
    const isImage = accept.includes("image");

    const triggerFileInput = () => inputRef.current?.click();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file && onFileChange) onFileChange(field, file);
        e.target.value = "";
    };

    const handleRemove = (e) => {
        e?.stopPropagation?.();
        onRemove?.(field);
    };

    const getPreviewUrl = () => {
        if (value instanceof File) return URL.createObjectURL(value);
        if (!postFile) return null;
        return buildS3UrlAlways(postFile);
    };

    const previewUrl = getPreviewUrl();

    return (
        <div className="mb-4 -m-3">
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
                            className="w-full h-full object-contain"
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
                        <p className="text-gray-400 text-xs mt-1">
                            Recommended: 1200x630px
                        </p>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
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
                    onClick={triggerFileInput}
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
                        onClick={handleRemove}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
};

const MultipleFeaturedImages = ({
    featuredImages = [],
    onAddImage,
    onRemoveImage,
    onUpdateImage,
    max = 5,
}) => {
    const imagesToShow = featuredImages || [];

    const addInputRef = useRef(null);
    const replaceInputRefs = useRef({});

    const validateFile = (file) => {
        if (!file) return { ok: false, msg: "No file selected" };
        if (!file.type?.startsWith("image/"))
            return { ok: false, msg: "Only image files allowed" };
        return { ok: true, msg: "" };
    };

    const canAddMore = max == null ? true : imagesToShow.length < max;
    const remaining =
        max == null ? "∞" : Math.max(0, max - imagesToShow.length);

    const handleAddSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;

        let allowed = files;
        if (max != null) {
            const remain = max - imagesToShow.length;
            if (remain <= 0) return message.error(`Max ${max} images allowed`);
            allowed = files.slice(0, remain);
        }

        for (const file of allowed) {
            const v = validateFile(file);
            if (!v.ok) {
                message.error(`${file.name}: ${v.msg}`);
                continue;
            }
            onAddImage?.(file);
        }
    };

    const handleReplaceSelect = (e, index) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        const v = validateFile(file);
        if (!v.ok) return message.error(v.msg);

        onUpdateImage?.(index, file);
    };

    const getPreviewUrl = (img) => {
        if (!img) return null;
        if (img.file instanceof File) return URL.createObjectURL(img.file);

        const src = img.url ?? img.image ?? img;

        if (typeof src === "string" && /^https?:\/\//i.test(src)) {
            return src;
        }

        return buildS3UrlAlways(src);
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700">
                        Featured Images
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        {max == null
                            ? "Add multiple images (Unlimited)."
                            : `Add multiple images (Max ${max}).`}
                    </p>
                </div>

                <Tag color="blue">
                    {imagesToShow.length} Selected{" "}
                    {max == null ? "" : `/ ${max}`}
                </Tag>
            </div>

            {imagesToShow.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                    {imagesToShow.map((img, index) => {
                        const previewUrl = getPreviewUrl(img);
                        const name =
                            img?.name ||
                            img?.file?.name ||
                            `Image ${index + 1}`;

                        return (
                            <div
                                key={img.id || index}
                                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                            >
                                <div className="aspect-square relative">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PictureOutlined className="text-gray-400 text-2xl" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Space>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => {
                                                    if (!previewUrl) return;
                                                    Modal.info({
                                                        title: `Featured Image ${index + 1}`,
                                                        content: (
                                                            <div className="text-center">
                                                                <img
                                                                    src={
                                                                        previewUrl
                                                                    }
                                                                    alt={name}
                                                                    className="max-w-full max-h-96 mx-auto"
                                                                />
                                                            </div>
                                                        ),
                                                        width: 600,
                                                    });
                                                }}
                                            >
                                                View
                                            </Button>

                                            <Button
                                                size="small"
                                                icon={<UploadOutlined />}
                                                onClick={() =>
                                                    replaceInputRefs.current[
                                                        index
                                                    ]?.click()
                                                }
                                            >
                                                Replace
                                            </Button>
                                        </Space>
                                    </div>

                                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                                        {index + 1}
                                    </div>

                                    <input
                                        ref={(el) =>
                                            (replaceInputRefs.current[index] =
                                                el)
                                        }
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleReplaceSelect(e, index)
                                        }
                                    />
                                </div>

                                <div className="p-2 bg-white border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div className="truncate">
                                            <p className="text-xs font-medium truncate">
                                                {name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {img?.isExisting
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
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer group ${
                    canAddMore
                        ? "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
                onClick={() => {
                    if (!canAddMore)
                        return message.error(
                            max == null
                                ? "Cannot add more"
                                : `Max ${max} images allowed`,
                        );
                    addInputRef.current?.click();
                }}
            >
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <PlusOutlined className="text-2xl text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">
                        Add Featured Image
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        Select one or multiple images
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                        Remaining: {remaining}
                    </p>
                </div>

                <input
                    ref={addInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleAddSelect}
                />
            </div>
        </div>
    );
};

const getDraftKey = (postId = null) =>
    postId ? `user_draft_post_${postId}` : "user_draft_new_post";

export default function Create({
    auth,
    languages,
    categories,
    post = null,
    isMember: isMemberProp,
}) {
    const isEditMode = !!post;
    const draftKey = getDraftKey(post?.id);

    const pdfInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const audioInputRef = useRef(null);

    const autoSaveIntervalRef = useRef(null);
    const lastSavedRef = useRef(null);
    const isInitialMount = useRef(true);

    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [draftExists, setDraftExists] = useState(false);

    const [mediaType, setMediaType] = useState(
        post?.post_pdfs?.length > 0
            ? "pdf"
            : post?.post_videos?.length > 0 || post?.video_url
              ? "video"
              : post?.post_audios?.length > 0 || post?.audio
                ? "audio"
                : "content",
    );

    const [featuredImages, setFeaturedImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [pdfs, setPdfs] = useState([]);
    const [audios, setAudios] = useState([]);
    const [submittingType, setSubmittingType] = useState(null);
    const [filteredCategories, setFilteredCategories] = useState(categories);

    // Upload progress modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadDone, setUploadDone] = useState(false);
    const [uploadFileName, setUploadFileName] = useState("");

    const isMember = isMemberProp ?? auth?.user?.subscriptions?.length > 0;

    const {
        data,
        setData,
        post: submitForm,
        processing,
        errors,
        transform,
    } = useForm({
        statusBox: post?.statusBox != undefined ? post.statusBox : 0,
        title: post?.title || "",
        lang_id: post?.lang_id || "",
        category_id: post?.category_id || "",
        status: post?.status != undefined ? post.status : 0,

        thumbnail: null,
        remove_thumbnail: false,

        sponsor: null,
        remove_sponsor: false,

        content: post?.content || "",

        pdf: null, // Deprecated
        remove_pdf: false, // Deprecated

        video: null, // Deprecated
        remove_video: false, // Deprecated

        videos: [],
        remove_videos: [],

        pdfs: [],
        remove_pdfs: [],

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
        _method: isEditMode ? "PUT" : "POST",
    });

    const safeRoute = useCallback((name, ...args) => {
        const fn = typeof window !== "undefined" ? window.route : undefined;
        if (typeof fn !== "function") {
            message.error(
                "route() is missing. Please enable Ziggy route helper.",
            );
            return null;
        }
        return fn(name, ...args);
    }, []);

    // filter categories by language
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
                if (
                    currentCategory &&
                    currentCategory.lang_id != data.lang_id
                ) {
                    setData("category_id", "");
                }
            }
        } else {
            setFilteredCategories([]);
            setData("category_id", "");
        }
    }, [data.lang_id, categories, data.category_id, setData]);

    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.success) {
            message.success(flash.success);
        }
        if (flash?.error) {
            message.error(flash.error);
        }
    }, [flash]);

    // init featured images from post (existing)
    useEffect(() => {
        if (post?.featured_images?.length > 0) {
            setFeaturedImages(
                post.featured_images.map((img) => {
                    const path = img?.image ?? img;
                    return {
                        id: img?.id ?? path,
                        file: null,
                        image: path,
                        name:
                            img?.name ||
                            (typeof path === "string"
                                ? path.split("/").pop()
                                : "Featured Image"),
                        url: img?.url ?? path,
                        isExisting: true,
                    };
                }),
            );
        }
        if (post?.post_videos?.length > 0) {
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
                    file: null,
                })),
            );
        }
        if (post?.post_pdfs?.length > 0) {
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
                    file: null,
                })),
            );
        }
        if (post?.post_audios?.length > 0) {
            setAudios(
                post.post_audios.map((a) => ({
                    id: a.id,
                    audio: a.audio,
                    name:
                        a.name ||
                        (typeof a.audio === "string"
                            ? a.audio.split("/").pop()
                            : "Audio"),
                    url: buildS3UrlAlways(a.audio),
                    isExisting: true,
                    file: null,
                })),
            );
        }
    }, [post]);

    useEffect(() => {
        const existingIds = featuredImages
            .filter((img) => img?.isExisting && img?.id)
            .map((img) => img.id);

        const newFiles = featuredImages
            .filter((img) => !img?.isExisting && img?.file instanceof File)
            .map((img) => img.file);

        setData((prev) => ({
            ...prev,
            existing_featured_images: existingIds,
            featured_images: newFiles,
        }));
    }, [featuredImages, setData]);

    const handleFileChange = (field, file) => {
        if (!file) return;

        if (field === "thumbnail") setData("remove_thumbnail", false);
        if (field === "sponsor") setData("remove_sponsor", false);

        setData(field, file);
        lastSavedRef.current = null;
        setHasUnsavedChanges(true);
    };

    const handleRemoveFile = (field) => {
        setData(field, null);
        setData(`remove_${field}`, true);
        setHasUnsavedChanges(true);
        lastSavedRef.current = null;
    };

    const handleAddFeaturedImage = (file) => {
        if (!file) return;

        const uniqueId =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const newImage = {
            id: uniqueId,
            file,
            name: file.name,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        setFeaturedImages((prev) => [...prev, newImage]);
        setHasUnsavedChanges(true);
    };

    const handleRemoveFeaturedImage = (index) => {
        setFeaturedImages((prev) => {
            const img = prev[index];
            const updated = prev.filter((_, i) => i !== index);

            if (img?.isExisting && img?.id) {
                setData((prevForm) => ({
                    ...prevForm,
                    remove_featured_images: [
                        ...(prevForm.remove_featured_images || []),
                        img.id,
                    ],
                }));
            }

            return updated;
        });

        setHasUnsavedChanges(true);
    };

    const handleAddMediaFile = (type, file) => {
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
                setData(
                    "videos",
                    updated.filter((v) => !v.isExisting).map((v) => v.file),
                );
                return updated;
            });
        } else if (type === "pdf") {
            setPdfs((prev) => {
                const updated = [...prev, newItem];
                setData(
                    "pdfs",
                    updated.filter((p) => !p.isExisting).map((p) => p.file),
                );
                return updated;
            });
        } else if (type === "audio") {
            if (isMember) {
                setAudios((prev) => {
                    const updated = [...prev, newItem];
                    setData(
                        "audios",
                        updated.filter((a) => !a.isExisting).map((a) => a.file),
                    );
                    return updated;
                });
            } else {
                setData("audio", file);
                setData("remove_audio", false);
            }
        }
        setHasUnsavedChanges(true);
    };

    const handleRemoveMediaFile = (type, index, id, isExisting) => {
        if (type === "audio" && !isMember) {
            setData("audio", null);
            setData("remove_audio", true);
            setHasUnsavedChanges(true);
            return;
        }
        const setter =
            type === "video" ? setVideos : type === "pdf" ? setPdfs : setAudios;
        setter((prev) => {
            const item = prev[index];
            const updated = prev.filter((_, i) => i !== index);

            if (item?.isExisting && item?.id) {
                setData((prevForm) => ({
                    ...prevForm,
                    [`remove_${type}s`]: [
                        ...(prevForm[`remove_${type}s`] || []),
                        item.id,
                    ],
                }));
            }

            setData(
                `${type}s`,
                updated.filter((x) => !x.isExisting).map((x) => x.file),
            );
            return updated;
        });
        setHasUnsavedChanges(true);
    };

    const handleUpdateMediaFile = (type, index, file, id, isExisting) => {
        if (!file) return;
        const setter =
            type === "video" ? setVideos : type === "pdf" ? setPdfs : setAudios;
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

            if (old?.isExisting && old?.id) {
                setData((prevForm) => ({
                    ...prevForm,
                    [`remove_${type}s`]: [
                        ...(prevForm[`remove_${type}s`] || []),
                        old.id,
                    ],
                }));
            }

            setData(
                `${type}s`,
                updated.filter((x) => !x.isExisting).map((x) => x.file),
            );
            return updated;
        });
        setHasUnsavedChanges(true);
    };

    const handleUpdateFeaturedImage = (index, file) => {
        if (!file) return;

        setFeaturedImages((prev) => {
            const updated = [...prev];
            const old = updated[index];

            updated[index] = {
                id:
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                file,
                name: file.name,
                url: URL.createObjectURL(file),
                isExisting: false,
            };

            if (old?.isExisting && old?.id) {
                setData((prevForm) => ({
                    ...prevForm,
                    remove_featured_images: [
                        ...(prevForm.remove_featured_images || []),
                        old.id,
                    ],
                }));
            }

            return updated;
        });

        setHasUnsavedChanges(true);
    };

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
            featuredImagesCount: featuredImages.length,
            thumbnail:
                formData.thumbnail instanceof File
                    ? formData.thumbnail.name
                    : formData.thumbnail,
            sponsor:
                formData.sponsor instanceof File
                    ? formData.sponsor.name
                    : formData.sponsor,
            pdf:
                formData.pdf instanceof File ? formData.pdf.name : formData.pdf,
            video:
                formData.video instanceof File
                    ? formData.video.name
                    : formData.video,
            audio:
                formData.audio instanceof File
                    ? formData.audio.name
                    : formData.audio,
        }),
        [featuredImages.length, mediaType],
    );

    useEffect(() => {
        if (!isInitialMount.current) return;
        lastSavedRef.current = JSON.stringify(serializeFormData(data));
        isInitialMount.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveDraftToSession = useCallback(async () => {
        if (!hasUnsavedChanges && lastSavedRef.current) return;

        setIsSavingDraft(true);
        try {
            const draftData = {
                title: data.title,
                lang_id: data.lang_id,
                category_id: data.category_id,
                status: data.status,
                statusBox: data.statusBox,
                content: data.content,
                video_url: data.video_url,
                mediaType,
                featuredImages,
                savedAt: new Date().toISOString(),
                postId: post?.id || null,
                version: "1.0",
            };

            sessionStorage.setItem(draftKey, JSON.stringify(draftData));
            lastSavedRef.current = JSON.stringify(serializeFormData(data));
            setHasUnsavedChanges(false);
            setDraftExists(true);
        } catch (err) {
            console.error(err);
            message.error("Failed to save draft");
        } finally {
            setIsSavingDraft(false);
        }
    }, [
        data,
        draftKey,
        featuredImages,
        hasUnsavedChanges,
        mediaType,
        post?.id,
        serializeFormData,
    ]);

    const loadDraftFromSession = useCallback(() => {
        try {
            const savedDraft = sessionStorage.getItem(draftKey);
            if (!savedDraft) return;

            const draft = JSON.parse(savedDraft);

            setData("title", draft.title || "");
            setData("lang_id", draft.lang_id || "");
            setData("category_id", draft.category_id || "");
            setData("status", draft.status !== undefined ? draft.status : 0);
            setData(
                "statusBox",
                draft.statusBox !== undefined ? draft.statusBox : 0,
            );
            setData("content", draft.content || "");
            setData("video_url", draft.video_url || "");

            if (draft.mediaType) setMediaType(draft.mediaType);
            if (draft.featuredImages) setFeaturedImages(draft.featuredImages);

            setShowRestorePrompt(false);
            message.success("Draft restored successfully!");
            setHasUnsavedChanges(true);
        } catch (err) {
            console.error(err);
            message.error("Failed to load draft");
        }
    }, [draftKey, setData]);

    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(draftKey);
        setShowRestorePrompt(false);
        setHasUnsavedChanges(false);
        setDraftExists(false);
        lastSavedRef.current = JSON.stringify(serializeFormData(data));
    }, [data, draftKey, serializeFormData]);

    const discardDraft = () => {
        Modal.confirm({
            title: "Discard Draft?",
            icon: <ExclamationCircleOutlined />,
            content:
                "This will permanently delete your saved draft. This action cannot be undone.",
            okText: "Yes, Discard",
            okType: "danger",
            cancelText: "Cancel",
            onOk() {
                clearDraft();
                message.info("Draft discarded");
            },
        });
    };

    useEffect(() => {
        const savedDraft = sessionStorage.getItem(draftKey);
        if (savedDraft) {
            setDraftExists(true);
            setShowRestorePrompt(true);
        }

        autoSaveIntervalRef.current = setInterval(() => {
            if (hasUnsavedChanges) saveDraftToSession();
        }, 5000);

        const handleBeforeUnload = (e) => {
            if (!hasUnsavedChanges) return;
            saveDraftToSession();
            e.preventDefault();
            e.returnValue =
                "You have unsaved changes. Your draft has been saved.";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(autoSaveIntervalRef.current);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [draftKey, hasUnsavedChanges, saveDraftToSession]);

    useEffect(() => {
        const t = setTimeout(() => {
            const current = JSON.stringify(serializeFormData(data));
            const last = lastSavedRef.current;
            setHasUnsavedChanges(current !== last);
        }, 350);

        return () => clearTimeout(t);
    }, [data, featuredImages, serializeFormData]);

    const handleManualSaveDraft = () => {
        saveDraftToSession();
        message.success("Draft saved manually!", 2);
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

    const showPostToast = ({
        type = "success",
        mode = "create",
        flashMessage = "",
    }) => {
        const isUpdate = mode === "update";
        const hasLargeFiles =
            flashMessage && flashMessage.includes("background");

        notification[type]({
            message: isUpdate ? "Post Updated" : "Post Submitted",
            description:
                "Your post is pending admin approval. You will be notified once it is approved.",
            placement: "topRight",
            duration: 4,
            showProgress: true,
        });

        // Extra notification if large files are processing in background
        if (hasLargeFiles) {
            notification.info({
                message: "Files Processing in Background",
                description:
                    "Your video, audio, or PDF is being uploaded to the server in the background. It will appear once processing is complete.",
                placement: "topRight",
                duration: 8,
                showProgress: true,
            });
        }
    };

    const handleSubmit = async (submitType = "draft") => {
        if (!data.title) return message.error("Title is required!");

        const url = isEditMode
            ? safeRoute("user.posts.update", post.id)
            : safeRoute("user.posts.store");

        if (!url) return;

        const finalStatus = submitType === "publish" ? 1 : 0;
        const hasLargeFile = !!(data.video || data.audio || data.pdf);

        setSubmittingType(submitType);
        
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

        // ⚠️ Read the (possibly fresh) CSRF token AFTER the refresh above
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

        // ── Detect large files (> 50 MB) that need background chunked upload ──
        const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50 MB
        const allNewMediaFiles = [
            ...(Array.isArray(data.videos) ? data.videos : []),
            ...(Array.isArray(data.pdfs)   ? data.pdfs   : []),
            ...(Array.isArray(data.audios) ? data.audios : []),
            ...(data.audio instanceof File ? [data.audio] : []),
        ];
        const anyLarge = allNewMediaFiles.some((f) => f instanceof File && f.size >= LARGE_FILE_THRESHOLD);

        // ── Build initialForm for submission ──
        const initialForm = new FormData();
        Object.keys(data).forEach(key => {
            // Status and statusBox are handled explicitly below
            if (['status', 'statusBox'].includes(key)) return;

            // Handle multiple-upload fields
            if (['videos', 'pdfs', 'audios'].includes(key)) {
                if (Array.isArray(data[key])) {
                    data[key].forEach(file => {
                        // Only include SMALL files in the initial request (under 50MB)
                        // Larger files are handled by BackgroundUploadContext later
                        if (file instanceof File && file.size < LARGE_FILE_THRESHOLD) {
                            initialForm.append(`${key}[]`, file);
                        }
                    });
                }
                return;
            }

            // Handle single-upload fields
            if (['video', 'pdf', 'audio'].includes(key)) {
                if (data[key] instanceof File && data[key].size < LARGE_FILE_THRESHOLD) {
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

        // Add the correct status chosen by the user
        initialForm.append('status', finalStatus.toString());
        initialForm.append('statusBox', finalStatus.toString());

        if (anyLarge) {
            initialForm.append('is_background', 'true');
            if (Array.isArray(data.videos)) initialForm.append('video_count', data.videos.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).length);
            if (Array.isArray(data.pdfs)) initialForm.append('pdf_count', data.pdfs.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).length);
            if (Array.isArray(data.audios)) initialForm.append('audio_count', data.audios.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).length);
            
            if (data.video instanceof File && data.video.size >= LARGE_FILE_THRESHOLD) initialForm.append('has_video', '1');
            if (data.pdf instanceof File && data.pdf.size >= LARGE_FILE_THRESHOLD) initialForm.append('has_pdf', '1');
            if (data.audio instanceof File && data.audio.size >= LARGE_FILE_THRESHOLD) initialForm.append('has_audio', '1');
        }

        const runBackgroundUploadAndSubmit = async () => {
            try {
                // 1. Initial Submit to create the post
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

                // 2. Queue large files to the global manager
                if (anyLarge && postId) {
                    if (Array.isArray(data.videos)) {
                        data.videos.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'video' });
                        });
                    }
                    if (Array.isArray(data.pdfs)) {
                        data.pdfs.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'pdf' });
                        });
                    }
                    if (Array.isArray(data.audios)) {
                        data.audios.filter(f => f instanceof File && f.size >= LARGE_FILE_THRESHOLD).forEach(file => {
                            addUpload({ id: Math.random().toString(36).substr(2, 9), file, postId, type: 'audio' });
                        });
                    }
                    if (data.audio instanceof File && data.audio.size >= LARGE_FILE_THRESHOLD) {
                        addUpload({ id: Math.random().toString(36).substr(2, 9), file: data.audio, postId, type: 'audio_single' });
                    }
                }

                // 3. Complete the fake progress
                setUploadPercent(100);
                setTimeout(() => setUploadDone(true), 500);
                clearDraft();

                // 4. Notification and redirect after a small delay
                showPostToast({ mode: isEditMode ? "update" : "create" });
                setTimeout(() => {
                    router.visit(safeRoute("user.posts.index"));
                }, 1500);

            } catch (err) {
                console.error(err);
                notification.error({ message: 'Submission Error', description: err.message });
                setSubmittingType(null);
                setUploadModalOpen(false);
            }
        };

        if (anyLarge) {
            setSubmittingType("background");
            const displayFile = allNewMediaFiles.find((f) => f instanceof File && f.size >= LARGE_FILE_THRESHOLD);
            setUploadFileName(displayFile?.name || "Files");
            setUploadModalOpen(true);

            // Start rapid progress simulation
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 95) {
                    progress = 95;
                    clearInterval(interval);
                }
                setUploadPercent(Math.round(progress));
            }, 300);

            runBackgroundUploadAndSubmit();
        } else {
            // Normal Inertia submit for small files
            router.post(url, initialForm, {
                onStart: () => setSubmittingType(submitType),
                onFinish: () => setSubmittingType(null),
                onSuccess: () => {
                    clearDraft();
                    showPostToast({ mode: isEditMode ? "update" : "create" });
                },
            });
        }
    };

    const handleUploadModalClose = () => {
        setUploadModalOpen(false);
        setUploadDone(false);
        router.visit(safeRoute("user.posts.index"));
    };

    const tabItems = [
        {
            key: "1",
            label: <span>Thumbnail</span>,
            children: (
                <FileUploadComponent
                    field="thumbnail"
                    label="Thumbnail Image"
                    accept="image/*"
                    postFile={data.remove_thumbnail ? null : post?.thumbnail}
                    description="Optional. Formats: JPEG, PNG, JPG, GIF, WebP"
                    previewHeight="h-40"
                    onFileChange={handleFileChange}
                    onRemove={handleRemoveFile}
                    value={data.thumbnail}
                    error={errors.thumbnail}
                />
            ),
        },
        {
            key: "2",
            label: <span>Featured</span>,
            children: (
                <MultipleFeaturedImages
                    featuredImages={featuredImages}
                    onAddImage={handleAddFeaturedImage}
                    onRemoveImage={handleRemoveFeaturedImage}
                    onUpdateImage={handleUpdateFeaturedImage}
                    max={null}
                />
            ),
        },
        {
            key: "3",
            label: <span>Sponsor</span>,
            children: (
                <div title="Optional Images">
                    <Space
                        direction="vertical"
                        className="w-full"
                        size="middle"
                    >
                        <div
                            className={`sponsor-guard ${
                                !isMember ? "locked" : ""
                            }`}
                        >
                            <FileUploadComponent
                                field="sponsor"
                                label="Sponsor Image"
                                accept="image/*"
                                postFile={
                                    data.remove_sponsor ? null : post?.sponsor
                                }
                                required={false}
                                description="Optional.  Formats: JPEG, PNG, JPG, GIF, WebP"
                                previewHeight="h-32"
                                onFileChange={handleFileChange}
                                onRemove={handleRemoveFile}
                                value={data.sponsor}
                                error={errors.sponsor}
                            />

                            {!isMember && (
                                <div className="sponsor-overlay">
                                    <div className="sponsor-overlay-box">
                                        <div className="sponsor-lock-icon">
                                            🔒
                                        </div>
                                        <div className="sponsor-overlay-title">
                                            Members Only
                                        </div>
                                        <div className="sponsor-overlay-sub">
                                            Sponsor upload is available for
                                            members.
                                        </div>
                                        <a className="sponsor-join-btn">
                                            Member
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Space>
                </div>
            ),
        },
    ];

    const { uploads, addUpload } = useBackgroundUpload();

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Create Post">
            <div className="py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="font-semibold text-lg sm:text-xl text-gray-800 leading-tight">
                                    {isEditMode
                                        ? "Edit Post"
                                        : "Create New Posts"}
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
                                    href={safeRoute("user.posts.index")}
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

                    {/* Restore Draft */}
                    {showRestorePrompt && (
                        <div className="mb-6">
                            <Alert
                                message="Unfinished Draft Found"
                                type="warning"
                                showIcon
                                closable
                                onClose={() => setShowRestorePrompt(false)}
                                action={
                                    <div className="flex flex-col sm:flex-row gap-2 sm:mt-0">
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
                        <Col xs={24} lg={16}>
                            <Card
                                title="Post Information"
                                className="shadow-sm mb-6 rounded-lg"
                                extra={
                                    <Button
                                        type="primary"
                                        ghost
                                        icon={<SaveOutlined />}
                                        onClick={handleManualSaveDraft}
                                        loading={isSavingDraft}
                                        disabled={!hasUnsavedChanges}
                                        size="middle"
                                    >
                                        Save Draft
                                    </Button>
                                }
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

                            <Card className="shadow-sm rounded-lg">
                                <Tabs
                                    activeKey={mediaType}
                                    onChange={handleMediaTypeChange}
                                    className="media-tabs"
                                >
                                    <TabPane
                                        tab={
                                            <span className="flex items-center">
                                                <FileTextOutlined />
                                                <span className="ml-2">
                                                    Text Content
                                                </span>
                                            </span>
                                        }
                                        key="content"
                                    >
                                        <div className="mt-4 min-h-[400px]">
                                            <CustomQuillEditor
                                                value={data.content}
                                                onChange={(val) =>
                                                    handleFieldChange(
                                                        "content",
                                                        val,
                                                    )
                                                }
                                                placeholder="Start writing your amazing content here..."
                                            />
                                        </div>
                                    </TabPane>

                                    <TabPane
                                        tab={
                                            <span className="flex items-center">
                                                <FilePdfOutlined />
                                                <span className="ml-2">
                                                    PDF Documents
                                                </span>
                                            </span>
                                        }
                                        key="pdf"
                                    >
                                        <div className="mt-4">
                                            <MultipleMediaUpload
                                                type="pdf"
                                                files={pdfs}
                                                onAdd={(f) =>
                                                    handleAddMediaFile("pdf", f)
                                                }
                                                onRemove={(type, abs, id, isEx) =>
                                                    handleRemoveMediaFile(
                                                        type,
                                                        abs,
                                                        id,
                                                        isEx,
                                                    )
                                                }
                                                onUpdate={(type, abs, f, id, isEx) =>
                                                    handleUpdateMediaFile(
                                                        type,
                                                        abs,
                                                        f,
                                                        id,
                                                        isEx,
                                                    )
                                                }
                                                existingFiles={[]} // Already in pdfs state
                                                max={isMember ? null : 1}
                                            />
                                        </div>
                                    </TabPane>

                                    <TabPane
                                        tab={
                                            <span className="flex items-center">
                                                <VideoCameraOutlined />
                                                <span className="ml-2">
                                                    Videos
                                                </span>
                                            </span>
                                        }
                                        key="video"
                                    >
                                        <div className="mt-4 space-y-4">
                                            <Input
                                                size="large"
                                                prefix={<VideoCameraOutlined />}
                                                placeholder="Embed URL (YouTube/Vimeo)"
                                                value={data.video_url}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        "video_url",
                                                        e.target.value,
                                                    )
                                                }
                                            />

                                            <Divider>
                                                OR Upload Multiple Videos
                                            </Divider>

                                            <MultipleMediaUpload
                                                type="video"
                                                files={videos}
                                                onAdd={(f) =>
                                                    handleAddMediaFile(
                                                        "video",
                                                        f,
                                                    )
                                                }
                                                onRemove={(type, abs, id, isEx) =>
                                                    handleRemoveMediaFile(
                                                        type,
                                                        abs,
                                                        id,
                                                        isEx,
                                                    )
                                                }
                                                onUpdate={(type, abs, f, id, isEx) =>
                                                    handleUpdateMediaFile(
                                                        type,
                                                        abs,
                                                        f,
                                                        id,
                                                        isEx,
                                                    )
                                                }
                                                existingFiles={[]} // Already in videos state
                                                max={isMember ? null : 1}
                                            />
                                        </div>
                                    </TabPane>

                                    <TabPane
                                        tab={
                                            <span className="flex items-center">
                                                <AudioOutlined />
                                                <span className="ml-2">
                                                    Audio
                                                </span>
                                            </span>
                                        }
                                        key="audio"
                                    >
                                        <div className="mt-4">
                                            {isMember ? (
                                                <MultipleMediaUpload
                                                    type="audio"
                                                    files={audios}
                                                    onAdd={(f) =>
                                                        handleAddMediaFile(
                                                            "audio",
                                                            f,
                                                        )
                                                    }
                                                    onRemove={(type, abs, id, isEx) =>
                                                        handleRemoveMediaFile(
                                                            type,
                                                            abs,
                                                            id,
                                                            isEx,
                                                        )
                                                    }
                                                    onUpdate={(type, abs, f, id, isEx) =>
                                                        handleUpdateMediaFile(
                                                            type,
                                                            abs,
                                                            f,
                                                            id,
                                                            isEx,
                                                        )
                                                    }
                                                    existingFiles={[]} // Already in audios state
                                                    max={null}
                                                />
                                            ) : (
                                                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                                    <input
                                                        ref={audioInputRef}
                                                        type="file"
                                                        hidden
                                                        accept="audio/*"
                                                        onChange={(e) =>
                                                            handleAddMediaFile(
                                                                "audio",
                                                                e.target
                                                                    .files?.[0],
                                                            )
                                                        }
                                                    />

                                                    {(data.audio ||
                                                        post?.audio) &&
                                                    !data.remove_audio ? (
                                                        <div className="flex flex-col items-center">
                                                            <AudioOutlined className="text-4xl text-green-500 mb-2" />
                                                            <Text strong>
                                                                {data.audio
                                                                    ?.name ||
                                                                    "Current Audio"}
                                                            </Text>
                                                            <div className="mt-2">
                                                                <Button
                                                                    size="small"
                                                                    danger
                                                                    ghost
                                                                    icon={
                                                                        <DeleteOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        handleRemoveMediaFile(
                                                                            "audio",
                                                                        )
                                                                    }
                                                                    className="mr-2"
                                                                >
                                                                    Remove
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    icon={
                                                                        <UploadOutlined />
                                                                    }
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
                                                            <Button
                                                                icon={
                                                                    <AudioOutlined />
                                                                }
                                                                onClick={() =>
                                                                    audioInputRef.current?.click()
                                                                }
                                                                size="large"
                                                            >
                                                                Upload Audio
                                                                Track
                                                            </Button>
                                                            {/* <p className="text-gray-500 text-sm mt-2">
                                                                Maximum file
                                                                size: 20MB
                                                            </p> */}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TabPane>
                                </Tabs>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <Tabs
                                    defaultActiveKey="1"
                                    items={tabItems}
                                    className="wrapping-tabs"
                                />
                            </div>

                            <Card className="shadow-sm rounded-lg sticky top-6 mt-6">
                                <Space
                                    direction="vertical"
                                    className="w-full"
                                    size="middle"
                                >
                                    <div className="space-y-3">
                                        <div className="text-center mb-4">
                                            <h4 className="font-medium text-gray-700 mb-1">
                                                Submit Options
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                Choose how you want to save your
                                                post
                                            </p>
                                        </div>

                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            icon={<CloudUploadOutlined />}
                                            loading={
                                                processing &&
                                                submittingType === "publish"
                                            }
                                            onClick={() =>
                                                handleSubmit("publish")
                                            }
                                            className="h-12 bg-green-600 hover:bg-green-700 border-green-600 shadow-sm"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">
                                                    Save As Published
                                                </span>
                                                <span className="text-xs font-normal opacity-90">
                                                    Post will be visible to
                                                    everyone
                                                </span>
                                            </div>
                                        </Button>

                                        <Button
                                            type="default"
                                            size="large"
                                            block
                                            icon={<SaveOutlined />}
                                            loading={
                                                processing &&
                                                submittingType === "draft"
                                            }
                                            onClick={() =>
                                                handleSubmit("draft")
                                            }
                                            className="h-12 border-blue-300 hover:border-blue-400 text-blue-600 hover:text-blue-700 shadow-sm"
                                        >
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold">
                                                    Save As Draft
                                                </span>
                                                <span className="text-xs font-normal">
                                                    Only visible to you
                                                </span>
                                            </div>
                                        </Button>
                                    </div>

                                    <Divider className="my-2" />

                                    <Button
                                        size="large"
                                        block
                                        danger
                                        ghost
                                        onClick={() => {
                                            clearDraft();
                                            router.visit(
                                                safeRoute("user.posts.index"),
                                            );
                                        }}
                                        icon={<DeleteOutlined />}
                                        className="h-10"
                                    >
                                        Discard & Exit
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>

                <style jsx global>{`
                    .sponsor-guard {
                        position: relative;
                        border-radius: 12px;
                    }
                    .sponsor-guard.locked > *:not(.sponsor-overlay) {
                        filter: blur(6px);
                        pointer-events: none;
                        user-select: none;
                    }
                    .sponsor-overlay {
                        position: absolute;
                        inset: 0;
                        z-index: 10;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 14px;
                        background: rgba(15, 23, 42, 0.45);
                        border-radius: 12px;
                    }
                    .sponsor-overlay-box {
                        width: 100%;
                        max-width: 320px;
                        background: rgba(255, 255, 255, 0.95);
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        border-radius: 12px;
                        padding: 16px;
                        text-align: center;
                    }
                    .sponsor-lock-icon {
                        font-size: 22px;
                        margin-bottom: 6px;
                    }
                    .sponsor-overlay-title {
                        font-weight: 800;
                        font-size: 16px;
                        color: #0f172a;
                    }
                    .sponsor-overlay-sub {
                        margin-top: 6px;
                        font-size: 13px;
                        color: #475569;
                    }
                    .sponsor-join-btn {
                        display: inline-block;
                        margin-top: 12px;
                        background: #1b7a3a;
                        color: #fff;
                        padding: 8px 14px;
                        border-radius: 8px;
                        font-weight: 700;
                        font-size: 13px;
                        text-decoration: none;
                    }

                    .wrapping-tabs .ant-tabs-nav-list {
                        flex-wrap: wrap !important;
                    }
                    .wrapping-tabs .ant-tabs-nav-wrap {
                        overflow: visible !important;
                        white-space: normal !important;
                    }
                    .wrapping-tabs .ant-tabs-tab {
                        margin: 4px 24px 4px 0 !important;
                        padding: 4px 0 !important;
                    }
                    .wrapping-tabs .ant-tabs-nav {
                        margin-bottom: 8px !important;
                    }
                    .wrapping-tabs .ant-tabs-ink-bar {
                        display: none !important;
                    }
                    .wrapping-tabs .ant-tabs-tab-active {
                        border-bottom: 2px solid #1890ff !important;
                    }

                    .ql-container {
                        min-height: 350px;
                        font-size: 16px;
                    }
                    .ql-editor {
                        min-height: 350px;
                        white-space: pre-wrap !important;
                        overflow-wrap: anywhere;
                        word-break: break-word;
                        tab-size: 4;
                    }
                    /* Google Fonts for Arabic & Bangla */
                    @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Bengali:wght@300;400;600;700&display=swap");

                    @font-face {
                        font-family: "solaiman-lipi";
                        src: url("https://cdn.jsdelivr.net/npm/solaimanlipi@1.0.0/SolaimanLipi.woff2")
                            format("woff2");
                        font-weight: normal;
                    }

                    .ql-font-cairo {
                        font-family: "Cairo", sans-serif;
                    }
                    .ql-font-amiri {
                        font-family: "Amiri", serif;
                        direction: rtl;
                    }
                    .ql-font-solaiman-lipi {
                        font-family: "solaiman-lipi", sans-serif;
                    }
                    .ql-font-noto-sans-bengali {
                        font-family: "Noto Sans Bengali", sans-serif;
                    }
                    .ql-font-times-new-roman {
                        font-family: "Times New Roman", Times, serif;
                    }

                    /* Toolbar font picker labels */
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-item[data-value="cairo"]::before,
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-label[data-value="cairo"]::before {
                        content: "Cairo (عربي)";
                        font-family: "Cairo", sans-serif;
                    }
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-item[data-value="amiri"]::before,
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-label[data-value="amiri"]::before {
                        content: "Amiri (أميري)";
                        font-family: "Amiri", serif;
                    }
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-item[data-value="times-new-roman"]::before,
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-label[data-value="times-new-roman"]::before {
                        content: "Times New Roman";
                        font-family: "Times New Roman", Times, serif;
                    }
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-item[data-value="solaiman-lipi"]::before,
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-label[data-value="solaiman-lipi"]::before {
                        content: "সোলাইমান লিপি";
                        font-family: "solaiman-lipi", sans-serif;
                    }
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-item[data-value="noto-sans-bengali"]::before,
                    .ql-snow
                        .ql-picker.ql-font
                        .ql-picker-label[data-value="noto-sans-bengali"]::before {
                        content: "Noto Bengali";
                        font-family: "Noto Sans Bengali", sans-serif;
                    }
                    .ql-editor p {
                        margin: 0 0 0.75em;
                    }
                    .ql-toolbar.ql-snow {
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                        background: #fbfbfb;
                    }

                    .ql-container.ql-snow {
                        border-bottom-left-radius: 8px;
                        border-bottom-right-radius: 8px;
                    }
                    .ql-toolbar .ql-font {
                        min-width: 140px; /* ensures label fits */
                        max-width: 220px; /* optional */

                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }

                    @media (max-width: 768px) {
                        .ql-container {
                            min-height: 250px;
                            font-size: 14px;
                        }
                        .ql-editor {
                            min-height: 250px;
                        }
                    }
                `}</style>
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
        </FrontAuthenticatedLayout>
    );
}
