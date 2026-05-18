import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import { Link, router, useForm } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
    Progress,
    Row,
    Select,
    Space,
    Tabs,
    Tag,
    Typography,
} from "antd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { Text } = Typography;
const { TabPane } = Tabs;

// Draft storage key generator
const getDraftKey = (postId = null) => {
    return postId ? `user_draft_post_${postId}` : "user_draft_new_post";
};

/**
 * ✅ FIX: Make Enter / Tab / Space work properly
 */
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

        editor.keyboard.addBinding({ key: 9, shiftKey: false }, (range) => {
            editor.format("indent", "+1", "user");
            return false;
        });

        editor.keyboard.addBinding({ key: 9, shiftKey: true }, (range) => {
            editor.format("indent", "-1", "user");
            return false;
        });
    }, []);

    const handleEditorChange = useCallback(
        (content) => {
            onChange(content);
        },
        [onChange],
    );

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ font: [] }],
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
        clipboard: {
            matchVisual: false,
        },
    };

    const formats = [
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
    ];

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

// Enhanced File Upload Component
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
        if (file && onFileChange) {
            onFileChange(field, file);
        }
    };

    const handleRemove = () => {
        if (onRemove) {
            onRemove(field);
        }
    };

    const getPreviewUrl = () => {
        if (value instanceof File) {
            return URL.createObjectURL(value);
        }
        if (postFile) {
            return `/storage/${postFile}`;
        }
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
                        <p className="text-gray-400 text-xs mt-1">
                            Recommended: 1200x630px
                        </p>
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

// Multiple Featured Images Component with Enhanced Preview - FIXED VERSION
const MultipleFeaturedImages = ({
    featuredImages,
    onAddImage,
    onRemoveImage,
    onUpdateImage,
    postFeaturedImages = [],
}) => {
    const [images, setImages] = useState([]);

    // Initialize images from props - FIXED
    useEffect(() => {
        console.log("Featured images props:", {
            featuredImages,
            postFeaturedImages,
        });

        if (featuredImages && featuredImages.length > 0) {
            // If images are passed directly from parent
            setImages(featuredImages);
        } else if (postFeaturedImages && postFeaturedImages.length > 0) {
            // If editing existing post with saved images
            const formattedImages = postFeaturedImages.map((img) => {
                // Handle both object and string formats
                const imageUrl = img.image || img;
                const imageName =
                    img.name ||
                    (typeof img === "string"
                        ? img.split("/").pop()
                        : "Featured Image");
                const imageId = img.id || Date.now() + Math.random();

                return {
                    id: imageId,
                    url: imageUrl.startsWith("http")
                        ? imageUrl
                        : `/storage/${imageUrl}`,
                    name: imageName,
                    isExisting: true,
                    originalData: img,
                };
            });
            console.log("Formatted images:", formattedImages);
            setImages(formattedImages);
        } else {
            setImages([]);
        }
    }, [featuredImages, postFeaturedImages]);

    const handleFileSelect = (e, index = null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            message.error("File size should not exceed 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            message.error("Only image files are allowed");
            return;
        }

        if (index !== null) {
            // Replace existing image
            onUpdateImage(index, file);
        } else {
            // Add new image
            onAddImage(file);
        }
    };

    const handleRemove = (index) => {
        onRemoveImage(index);
    };

    const getPreviewUrl = (image) => {
        if (image instanceof File) {
            return URL.createObjectURL(image);
        }
        if (image.url) {
            return image.url;
        }
        if (image.file instanceof File) {
            return URL.createObjectURL(image.file);
        }
        if (image.image) {
            return image.image.startsWith("http")
                ? image.image
                : `/storage/${image.image}`;
        }
        return null;
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700">
                        Featured Images
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Add multiple images (Max 5). Drag to reorder.
                    </p>
                </div>
                <Tag color="blue">{images.length} / 5</Tag>
            </div>

            <div className="space-y-3">
                {/* Image Grid Preview */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                        {images.map((image, index) => {
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
                                    {/* Image Preview */}
                                    <div className="aspect-square relative">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt={`Featured ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src =
                                                        "https://via.placeholder.com/300x300?text=Image+Error";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <PictureOutlined className="text-gray-400 text-2xl" />
                                            </div>
                                        )}

                                        {/* Image Overlay Actions */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => {
                                                        if (previewUrl) {
                                                            Modal.info({
                                                                title: `Featured Image ${index + 1}`,
                                                                content: (
                                                                    <div className="text-center">
                                                                        <img
                                                                            src={
                                                                                previewUrl
                                                                            }
                                                                            alt={`Featured ${index + 1}`}
                                                                            className="max-w-full max-h-96 mx-auto"
                                                                            onError={(
                                                                                e,
                                                                            ) => {
                                                                                e.target.src =
                                                                                    "https://via.placeholder.com/600x400?text=Image+Error";
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ),
                                                                width: 600,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    View
                                                </Button>
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
                                            </Space>
                                        </div>

                                        {/* Image Number Badge */}
                                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Image Info Footer */}
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
                                                    handleRemove(index)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            />
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        id={`replace-featured-${index}`}
                                        hidden
                                        accept="image/*"
                                        onChange={(e) =>
                                            handleFileSelect(e, index)
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add More Button - Only show if less than 5 images */}
                {images.length < 5 && (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() =>
                            document
                                .getElementById("add-featured-image")
                                ?.click()
                        }
                    >
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                                <PlusOutlined className="text-2xl text-blue-600" />
                            </div>
                            <p className="text-gray-700 font-medium">
                                Add Featured Image
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                Click to upload another image
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                                {5 - images.length} more can be added • Max 5MB
                                each
                            </p>
                        </div>
                        <input
                            type="file"
                            id="add-featured-image"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e)}
                        />
                    </div>
                )}
            </div>

            {images.length >= 5 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <ExclamationCircleOutlined className="text-blue-500 mr-2" />
                        <p className="text-sm text-blue-700">
                            Maximum 5 featured images reached. Remove existing
                            images to add more.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Create({ auth, languages, categories, post = null }) {
    const isEditMode = !!post;
    const draftKey = getDraftKey(post?.id);

    // Refs
    const autoSaveIntervalRef = useRef(null);
    const lastSavedRef = useRef(null);
    const isInitialMount = useRef(true);
    const statusBoxRef = useRef(null);

    // State
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(null);
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
    const [submittingType, setSubmittingType] = useState(null); // 'draft' or 'publish'

    // Filtered categories
    const [filteredCategories, setFilteredCategories] = useState(categories);

    // Form data with statusBox included - UPDATED
    const {
        data,
        setData,
        post: submitForm,
        processing,
        errors,
    } = useForm({
        statusBox: post?.statusBox != undefined ? post.statusBox : 0,
        title: post?.title || "",
        lang_id: post?.lang_id || "",
        category_id: post?.category_id || "",
        status: post?.status != undefined ? post.status : 0,
        thumbnail: null,
        sponsor: null,
        content: post?.content || "",
        pdf: null,
        video: null,
        audio: null,
        video_url: post?.video_url || "",
        featured_images: [], // Array for new featured images
        remove_featured_images: [], // Array for images to remove
        existing_featured_images:
            post?.featured_images?.map((img) => img.id) || [], // Keep track of existing images
        _method: isEditMode ? "PUT" : "POST",
    });

    // Function to set statusBox
    const setStatusBox = (value) => {
        setData("statusBox", value);
        setHasUnsavedChanges(true);
    };

    // Filter categories by language
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

    // Initialize featured images from post - FIXED
    useEffect(() => {
        if (post?.featured_images && post.featured_images.length > 0) {
            console.log(
                "Initializing featured images from post:",
                post.featured_images,
            );
            setFeaturedImages(
                post.featured_images.map((img) => ({
                    id: img.id,
                    file: null,
                    image: img.image,
                    name: img.name || img.image.split("/").pop(),
                    url: img.url || `/storage/${img.image}`,
                    isExisting: true,
                })),
            );
        }
    }, [post]);

    // Serialize form data for change tracking
    const serializeFormData = useCallback(
        (formData) => ({
            title: formData.title,
            lang_id: formData.lang_id,
            category_id: formData.category_id,
            status: formData.status,
            statusBox: formData.statusBox,
            content: formData.content,
            video_url: formData.video_url,
            mediaType: mediaType,
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
        [mediaType, featuredImages.length],
    );

    // Init snapshot
    useEffect(() => {
        if (isInitialMount.current) {
            lastSavedRef.current = JSON.stringify(serializeFormData(data));
            isInitialMount.current = false;
        }
    }, []);

    // Draft detect + autosave
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
            if (hasUnsavedChanges) {
                saveDraftToSession();
                e.preventDefault();
                e.returnValue =
                    "You have unsaved changes. Your draft has been saved.";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(autoSaveIntervalRef.current);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (hasUnsavedChanges) saveDraftToSession();
        };
    }, [draftKey, hasUnsavedChanges]);

    // Track changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const currentSerialized = JSON.stringify(serializeFormData(data));
            const lastSavedSerialized = lastSavedRef.current;
            setHasUnsavedChanges(currentSerialized !== lastSavedSerialized);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [data, serializeFormData, featuredImages]);

    // Save draft to session storage
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
                mediaType: mediaType,
                featuredImages: featuredImages,
                thumbnail:
                    data.thumbnail instanceof File
                        ? { name: data.thumbnail.name }
                        : data.thumbnail,
                sponsor:
                    data.sponsor instanceof File
                        ? { name: data.sponsor.name }
                        : data.sponsor,
                pdf:
                    data.pdf instanceof File
                        ? { name: data.pdf.name }
                        : data.pdf,
                video:
                    data.video instanceof File
                        ? { name: data.video.name }
                        : data.video,
                audio:
                    data.audio instanceof File
                        ? { name: data.audio.name }
                        : data.audio,
                savedAt: new Date().toISOString(),
                postId: post?.id || null,
                version: "1.3",
            };

            sessionStorage.setItem(draftKey, JSON.stringify(draftData));
            lastSavedRef.current = JSON.stringify(serializeFormData(data));
            setHasUnsavedChanges(false);
            setLastSavedTime(new Date());
            setDraftExists(true);
        } catch (error) {
            console.error("Error saving draft:", error);
            message.error("Failed to save draft");
        } finally {
            setIsSavingDraft(false);
        }
    }, [
        data,
        draftKey,
        hasUnsavedChanges,
        mediaType,
        post?.id,
        serializeFormData,
        featuredImages,
    ]);

    // Load draft from session storage
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

            lastSavedRef.current = JSON.stringify(
                serializeFormData({
                    ...data,
                    title: draft.title || "",
                    lang_id: draft.lang_id || "",
                    category_id: draft.category_id || "",
                    status: draft.status !== undefined ? draft.status : 0,
                    statusBox:
                        draft.statusBox !== undefined ? draft.statusBox : 0,
                    content: draft.content || "",
                    video_url: draft.video_url || "",
                }),
            );

            setHasUnsavedChanges(true);
        } catch (error) {
            console.error("Error loading draft:", error);
            message.error("Failed to load draft");
        }
    }, [data, draftKey, serializeFormData, setData]);

    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(draftKey);
        setShowRestorePrompt(false);
        setLastSavedTime(null);
        setHasUnsavedChanges(false);
        setDraftExists(false);
        lastSavedRef.current = JSON.stringify(serializeFormData(data));
    }, [draftKey, data, serializeFormData]);

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

    // Handle featured image operations - FIXED
    const handleAddFeaturedImage = (file) => {
        if (featuredImages.length >= 5) {
            message.error("Maximum 5 featured images allowed");
            return;
        }

        const newImage = {
            id: `new-${Date.now()}`,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        const updatedImages = [...featuredImages, newImage];
        setFeaturedImages(updatedImages);
        setHasUnsavedChanges(true);

        // Update form data - only include new files
        const newImages = updatedImages.filter((img) => !img.isExisting);
        setData(
            "featured_images",
            newImages.map((img) => img.file),
        );
    };

    const handleRemoveFeaturedImage = (index) => {
        const imageToRemove = featuredImages[index];
        const updatedImages = [...featuredImages];
        updatedImages.splice(index, 1);

        setFeaturedImages(updatedImages);
        setHasUnsavedChanges(true);

        // If it's an existing image, add to remove list
        if (imageToRemove.isExisting && imageToRemove.id) {
            const removeList = [
                ...(data.remove_featured_images || []),
                imageToRemove.id,
            ];
            setData("remove_featured_images", removeList);
        }

        // Update form data with remaining new images
        const newImages = updatedImages.filter((img) => !img.isExisting);
        setData(
            "featured_images",
            newImages.map((img) => img.file),
        );
    };

    const handleUpdateFeaturedImage = (index, file) => {
        const updatedImages = [...featuredImages];
        const oldImage = updatedImages[index];

        const newImage = {
            ...oldImage,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            isExisting: false,
        };

        updatedImages[index] = newImage;
        setFeaturedImages(updatedImages);
        setHasUnsavedChanges(true);

        // If old image was existing, add to remove list
        if (oldImage.isExisting && oldImage.id) {
            const removeList = [
                ...(data.remove_featured_images || []),
                oldImage.id,
            ];
            setData("remove_featured_images", removeList);
        }

        // Update form data
        const newImages = updatedImages.filter((img) => !img.isExisting);
        setData(
            "featured_images",
            newImages.map((img) => img.file),
        );
    };

    // Handle form submission
    const handleSubmit = (submitType = "draft") => {
        // Validate required fields
        if (!data.title) {
            message.error("Title is required!");
            return;
        }
        if (!data.lang_id) {
            message.error("Language is required!");
            return;
        }
        if (!data.category_id) {
            message.error("Category is required!");
            return;
        }

        if (!isEditMode && !data.thumbnail && !post?.thumbnail) {
            message.error("Thumbnail Image is required!");
            return;
        }

        // Set submitting type
        setSubmittingType(submitType);

        // Set status based on submit type
        const finalStatus = submitType === "publish" ? 1 : 0;

        // Update both status and statusBox
        setData("status", finalStatus);
        setData("statusBox", finalStatus);

        const url = isEditMode
            ? route("user.posts.update", post.id)
            : route("user.posts.store");

        clearDraft();

        const loadingMessage = isEditMode
            ? `Updating post as ${submitType === "publish" ? "Published" : "Draft"}...`
            : `Creating post as ${submitType === "publish" ? "Published" : "Draft"}...`;

        message.loading(loadingMessage, 0);

        submitForm(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.destroy();
                const successMsg = isEditMode
                    ? `Post updated as ${submitType === "publish" ? "Published" : "Draft"} successfully!`
                    : `Post created as ${submitType === "publish" ? "Published" : "Draft"} successfully!`;
                message.success(successMsg);
                router.visit(route("user.posts.index"));
            },
            onError: (errs) => {
                message.destroy();
                setSubmittingType(null);
                message.error(
                    errs?.error ||
                        errs?.pdf ||
                        errs?.video ||
                        errs?.title ||
                        errs?.thumbnail ||
                        errs?.featured_images ||
                        errs?.lang_id ||
                        errs?.category_id ||
                        "There has something error",
                );
            },
            onFinish: () => {
                message.destroy();
                setSubmittingType(null);
            },
        });
    };

    const handleFileChange = (field, file) => {
        if (!file) return;
        setData(field, file);
        lastSavedRef.current = null;
        setHasUnsavedChanges(true);
    };

    const handleRemoveFile = (field) => {
        setData(field, null);
        setHasUnsavedChanges(true);
    };

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

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Create Post">
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                {isEditMode ? "Edit Post" : "Create New Post"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {isEditMode
                                    ? "Modify your post details"
                                    : "Create a new article"}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            {draftExists && !hasUnsavedChanges && (
                                <Tag color="blue" icon={<CloudSyncOutlined />}>
                                    Draft Saved
                                </Tag>
                            )}
                            <Link href={route("user.posts.index")}>
                                <Button icon={<ArrowLeftOutlined />}>
                                    Back to My Posts
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Draft Status Banner */}
                    {hasUnsavedChanges && (
                        <div className="mb-6">
                            <Alert
                                message={
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <CloudSyncOutlined className="mr-2" />
                                            <span className="whitespace-normal">
                                                You have unsaved changes •
                                                Auto-save every 5 seconds
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            {isSavingDraft && (
                                                <>
                                                    <Progress
                                                        percent={80}
                                                        size="small"
                                                        className="mr-2 w-20"
                                                    />
                                                    <span className="text-gray-500 text-sm">
                                                        Saving...
                                                    </span>
                                                </>
                                            )}
                                            {lastSavedTime &&
                                                !isSavingDraft && (
                                                    <span className="text-gray-500 text-sm">
                                                        Last saved:{" "}
                                                        {lastSavedTime.toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                }
                                type="info"
                                showIcon={false}
                                className="border border-blue-200 bg-blue-50 [&_.ant-alert-message]:whitespace-normal"
                            />
                        </div>
                    )}

                    {/* Restore Draft Prompt */}
                    {showRestorePrompt && (
                        <div className="mb-6">
                            <div className="hidden md:block">
                                <Alert
                                    message="Unfinished Draft Found"
                                    description={
                                        <div>
                                            <p>
                                                You have a previously saved
                                                draft. Would you like to restore
                                                it?
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Note: File uploads will need to
                                                be re-selected.
                                            </p>
                                        </div>
                                    }
                                    type="warning"
                                    showIcon
                                    action={
                                        <Space>
                                            <Button
                                                size="small"
                                                type="primary"
                                                onClick={loadDraftFromSession}
                                                icon={<HistoryOutlined />}
                                            >
                                                Restore Draft
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={discardDraft}
                                                danger
                                            >
                                                Discard
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    setShowRestorePrompt(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </Space>
                                    }
                                    closable
                                    onClose={() => setShowRestorePrompt(false)}
                                />
                            </div>

                            <div className="md:hidden">
                                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <ExclamationCircleOutlined className="text-yellow-500 text-lg mr-3 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-yellow-800 mb-1">
                                                Unfinished Draft Found
                                            </h4>
                                            <p className="text-yellow-700 text-sm mb-3">
                                                You have a previously saved
                                                draft. Would you like to restore
                                                it?
                                            </p>
                                            <p className="text-yellow-600 text-xs mb-4">
                                                Note: File uploads will need to
                                                be re-selected after restoring.
                                            </p>
                                            <div className="flex flex-col space-y-2">
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    onClick={
                                                        loadDraftFromSession
                                                    }
                                                    icon={<HistoryOutlined />}
                                                    block
                                                >
                                                    Restore Draft
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={discardDraft}
                                                    danger
                                                    block
                                                >
                                                    Discard
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        setShowRestorePrompt(
                                                            false,
                                                        )
                                                    }
                                                    block
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <Row gutter={[24, 24]}>
                            {/* Main Content Column */}
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
                                                Post Title *
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
                                                status={
                                                    errors.title ? "error" : ""
                                                }
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

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Language *
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
                                                filterOption={(input, option) =>
                                                    (
                                                        option?.children?.toString?.() ||
                                                        ""
                                                    )
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase(),
                                                        )
                                                }
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
                                        </div>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Category *
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
                                                    filterOption={(
                                                        input,
                                                        option,
                                                    ) =>
                                                        (
                                                            option?.children?.toString?.() ||
                                                            ""
                                                        )
                                                            .toLowerCase()
                                                            .includes(
                                                                input.toLowerCase(),
                                                            )
                                                    }
                                                >
                                                    {filteredCategories.map(
                                                        (c) => (
                                                            <Select.Option
                                                                key={c.id}
                                                                value={c.id}
                                                            >
                                                                <div className="flex items-center">
                                                                    <TagOutlined className="mr-2" />
                                                                    {c.name}
                                                                </div>
                                                            </Select.Option>
                                                        ),
                                                    )}
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

                                            <Col xs={24} md={12}>
                                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Current Status
                                                        </span>
                                                        <Tag
                                                            color={
                                                                data.status == 1
                                                                    ? "green"
                                                                    : "orange"
                                                            }
                                                        >
                                                            {data.status == 1
                                                                ? "Published"
                                                                : "Draft"}
                                                        </Tag>
                                                    </div>
                                                    <Text
                                                        type="secondary"
                                                        className="text-xs"
                                                    >
                                                        This indicates the
                                                        current status of your
                                                        post. Use the submit
                                                        buttons below to change
                                                        status.
                                                    </Text>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Status Box Control Field */}
                                        {/* <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status Box
                      </label>
                      <Switch
                        checked={data.statusBox == 1}
                        onChange={(checked) => setStatusBox(checked ? 1 : 0)}
                        checkedChildren="Active"
                        unCheckedChildren="Inactive"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Controls the visibility of status box for this post
                      </p>
                    </div> */}
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
                                                        PDF Document
                                                    </span>
                                                </span>
                                            }
                                            key="pdf"
                                        >
                                            <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-lg mt-4">
                                                <input
                                                    type="file"
                                                    id="pdf-upload"
                                                    hidden
                                                    accept=".pdf"
                                                    onChange={(e) =>
                                                        handleFileChange(
                                                            "pdf",
                                                            e.target.files?.[0],
                                                        )
                                                    }
                                                />
                                                {data.pdf || post?.pdf ? (
                                                    <div className="flex flex-col items-center">
                                                        <FilePdfOutlined className="text-5xl text-red-500 mb-2" />
                                                        <Text strong>
                                                            {data.pdf?.name ||
                                                                "Current PDF Attachment"}
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
                                                                    handleRemoveFile(
                                                                        "pdf",
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
                                                                    document
                                                                        .getElementById(
                                                                            "pdf-upload",
                                                                        )
                                                                        ?.click()
                                                                }
                                                            >
                                                                Replace
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <FilePdfOutlined className="text-5xl text-gray-300 mb-4" />
                                                        <Button
                                                            icon={
                                                                <UploadOutlined />
                                                            }
                                                            onClick={() =>
                                                                document
                                                                    .getElementById(
                                                                        "pdf-upload",
                                                                    )
                                                                    ?.click()
                                                            }
                                                            size="large"
                                                        >
                                                            Upload PDF File
                                                        </Button>
                                                        <p className="text-gray-500 text-sm mt-2">
                                                            Maximum file size:
                                                            10MB
                                                        </p>
                                                    </div>
                                                )}
                                                {errors.pdf && (
                                                    <Text
                                                        type="danger"
                                                        className="text-xs"
                                                    >
                                                        {errors.pdf}
                                                    </Text>
                                                )}
                                            </div>
                                        </TabPane>

                                        <TabPane
                                            tab={
                                                <span className="flex items-center">
                                                    <VideoCameraOutlined />
                                                    <span className="ml-2">
                                                        Video
                                                    </span>
                                                </span>
                                            }
                                            key="video"
                                        >
                                            <div className="mt-4 space-y-4">
                                                <Input
                                                    size="large"
                                                    prefix={
                                                        <VideoCameraOutlined />
                                                    }
                                                    placeholder="Embed URL (YouTube/Vimeo)"
                                                    value={data.video_url}
                                                    onChange={(e) =>
                                                        handleFieldChange(
                                                            "video_url",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <Divider>OR</Divider>
                                                <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                                    <input
                                                        type="file"
                                                        id="vid-upload"
                                                        hidden
                                                        accept="video/*"
                                                        onChange={(e) =>
                                                            handleFileChange(
                                                                "video",
                                                                e.target
                                                                    .files?.[0],
                                                            )
                                                        }
                                                    />
                                                    {data.video ||
                                                    post?.video ? (
                                                        <div className="flex flex-col items-center">
                                                            <VideoCameraOutlined className="text-4xl text-blue-500 mb-2" />
                                                            <Text strong>
                                                                {data.video
                                                                    ?.name ||
                                                                    "Current Video"}
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
                                                                        handleRemoveFile(
                                                                            "video",
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
                                                                        document
                                                                            .getElementById(
                                                                                "vid-upload",
                                                                            )
                                                                            ?.click()
                                                                    }
                                                                >
                                                                    Replace
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <VideoCameraOutlined className="text-4xl text-gray-300 mb-2" />
                                                            <Button
                                                                icon={
                                                                    <UploadOutlined />
                                                                }
                                                                onClick={() =>
                                                                    document
                                                                        .getElementById(
                                                                            "vid-upload",
                                                                        )
                                                                        ?.click()
                                                                }
                                                            >
                                                                Upload Video
                                                                File
                                                            </Button>
                                                            <p className="text-gray-500 text-sm mt-2">
                                                                Maximum file
                                                                size: 50MB
                                                            </p>
                                                        </div>
                                                    )}
                                                    {errors.video && (
                                                        <Text
                                                            type="danger"
                                                            className="text-xs mt-2 block"
                                                        >
                                                            {errors.video}
                                                        </Text>
                                                    )}
                                                </div>
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
                                            <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-lg mt-4">
                                                <input
                                                    type="file"
                                                    id="aud-upload"
                                                    hidden
                                                    accept="audio/*"
                                                    onChange={(e) =>
                                                        handleFileChange(
                                                            "audio",
                                                            e.target.files?.[0],
                                                        )
                                                    }
                                                />
                                                {data.audio || post?.audio ? (
                                                    <div className="flex flex-col items-center">
                                                        <AudioOutlined className="text-4xl text-green-500 mb-2" />
                                                        <Text strong>
                                                            {data.audio?.name ||
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
                                                                    handleRemoveFile(
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
                                                                    document
                                                                        .getElementById(
                                                                            "aud-upload",
                                                                        )
                                                                        ?.click()
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
                                                                document
                                                                    .getElementById(
                                                                        "aud-upload",
                                                                    )
                                                                    ?.click()
                                                            }
                                                            size="large"
                                                        >
                                                            Upload Audio Track
                                                        </Button>
                                                        <p className="text-gray-500 text-sm mt-2">
                                                            Maximum file size:
                                                            20MB
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabPane>
                                    </Tabs>
                                </Card>
                            </Col>

                            {/* Sidebar Column */}
                            <Col xs={24} lg={8}>
                                {/* Required Thumbnail Image */}
                                <Card
                                    title="Required Image"
                                    className="shadow-sm mb-6 rounded-lg"
                                >
                                    <FileUploadComponent
                                        field="thumbnail"
                                        label="Thumbnail Image"
                                        accept="image/*"
                                        postFile={post?.thumbnail}
                                        required={true}
                                        description="Required. Max size: 5MB. Formats: JPEG, PNG, JPG, GIF, WebP"
                                        previewHeight="h-40"
                                        onFileChange={handleFileChange}
                                        onRemove={handleRemoveFile}
                                        value={data.thumbnail}
                                        error={errors.thumbnail}
                                    />
                                </Card>

                                {/* Multiple Featured Images Section - FIXED */}
                                <Card
                                    title="Featured Images"
                                    className="shadow-sm mb-6 rounded-lg"
                                    extra={
                                        <span className="text-xs text-gray-500">
                                            Optional (Max 5)
                                        </span>
                                    }
                                >
                                    <MultipleFeaturedImages
                                        featuredImages={featuredImages}
                                        onAddImage={handleAddFeaturedImage}
                                        onRemoveImage={
                                            handleRemoveFeaturedImage
                                        }
                                        onUpdateImage={
                                            handleUpdateFeaturedImage
                                        }
                                        postFeaturedImages={
                                            post?.featured_images
                                        }
                                    />
                                </Card>

                                {/* Sponsor Image */}
                                <Card
                                    title="Optional Images"
                                    className="shadow-sm mb-6 rounded-lg"
                                    extra={
                                        <span className="text-xs text-gray-500">
                                            Optional
                                        </span>
                                    }
                                >
                                    <Space
                                        direction="vertical"
                                        className="w-full"
                                        size="middle"
                                    >
                                        <FileUploadComponent
                                            field="sponsor"
                                            label="Sponsor Image"
                                            accept="image/*"
                                            postFile={post?.sponsor}
                                            required={false}
                                            description="Optional. Max size: 5MB. Formats: JPEG, PNG, JPG, GIF, WebP"
                                            previewHeight="h-32"
                                            onFileChange={handleFileChange}
                                            onRemove={handleRemoveFile}
                                            value={data.sponsor}
                                            error={errors.sponsor}
                                        />
                                    </Space>
                                </Card>

                                {/* Action Buttons */}
                                <Card className="shadow-sm rounded-lg sticky top-6">
                                    <Space
                                        direction="vertical"
                                        className="w-full"
                                        size="middle"
                                    >
                                        {/* Submit Buttons Section */}
                                        <div className="space-y-3">
                                            <div className="text-center mb-4">
                                                <h4 className="font-medium text-gray-700 mb-1">
                                                    Submit Options
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    Choose how you want to save
                                                    your post
                                                </p>
                                            </div>

                                            {/* Save As Published Button */}
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

                                            {/* Save As Draft Button */}
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

                                        {/* Divider */}
                                        <Divider className="my-2" />

                                        {/* Discard Button */}
                                        <Button
                                            size="large"
                                            block
                                            danger
                                            ghost
                                            onClick={() => {
                                                clearDraft();
                                                router.visit(
                                                    route("user.posts.index"),
                                                );
                                            }}
                                            icon={<DeleteOutlined />}
                                            className="h-10"
                                        >
                                            Discard & Exit
                                        </Button>

                                        {/* Status Info */}
                                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">
                                                    Current Status:
                                                </span>
                                                <Tag
                                                    color={
                                                        data.status == 1
                                                            ? "green"
                                                            : "orange"
                                                    }
                                                >
                                                    {data.status == 1
                                                        ? "Published"
                                                        : "Draft"}
                                                </Tag>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-gray-600">
                                                    Status Box:
                                                </span>
                                                <Tag
                                                    color={
                                                        data.statusBox == 1
                                                            ? "green"
                                                            : "orange"
                                                    }
                                                >
                                                    {data.statusBox == 1
                                                        ? "Active"
                                                        : "Inactive"}
                                                </Tag>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                These will be updated based on
                                                your choice above
                                            </p>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Editor CSS */}
                <style jsx global>{`
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

                    @media (max-width: 768px) {
                        .ql-container {
                            min-height: 250px;
                            font-size: 14px;
                        }
                        .ql-editor {
                            min-height: 250px;
                        }
                        .mobile-quill .ql-toolbar {
                            padding: 8px !important;
                        }
                    }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}
