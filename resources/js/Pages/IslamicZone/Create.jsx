import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    AudioOutlined,
    BookOutlined,
    CalendarOutlined,
    DeleteOutlined,
    EditOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    PictureOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    SaveOutlined,
    YoutubeOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    message,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    Upload,
} from "antd";
import UploadProgressModal from "@/Components/UploadProgressModal";
import MultipleMediaUpload from "@/Components/MultipleMediaUpload";
import { useState, useRef, useMemo, useEffect } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import MagicUrl from "quill-magic-url";
Quill.register("modules/magicUrl", MagicUrl);

const Font = Quill.import("formats/font");
Font.whitelist = [
    "cairo",
    "times-new-roman",
    "amiri",
    "noto-sans-bengali",
    "sans-serif",
    "serif",
    "monospace",
];
Quill.register(Font, true);

export const CustomQuillEditor = ({
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

    // Init Quill once
    useEffect(() => {
        if (!holderRef.current || quillRef.current) return;

        const q = new Quill(holderRef.current, {
            theme: "snow",
            placeholder: placeholder || "",
            modules,
        });

        // Tab bindings
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

        // Custom video handler
        const toolbar = q.getModule("toolbar");
        toolbar.addHandler("video", () => {
            const range = q.getSelection();
            const url = prompt("Enter Video URL (YouTube, Facebook):");
            if (url && range) q.insertEmbed(range.index, "video", url, "user");
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

    // Sync external value → editor
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
        } catch {
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

// ── Video URL Helper ──────────────────────────────────────────────────────────
const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("<iframe")) {
        const match = url.match(/src=["']([^"']+)["']/);
        if (match?.[1]) url = match[1];
    }
    url = url.trim();
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("watch?v="))
            videoId = url.split("watch?v=")[1]?.split("&")[0];
        else if (url.includes("youtu.be/"))
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        else if (url.includes("embed/"))
            videoId = url.split("embed/")[1]?.split("?")[0];
        else if (url.includes("shorts/"))
            videoId = url.split("shorts/")[1]?.split("?")[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
        if (url.includes("plugins/video.php")) return url;
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
    }
    return url;
};

// ── Custom Video Blot ─────────────────────────────────────────────────────────
const BlockEmbed = Quill.import("blots/block/embed");
class VideoBlot extends BlockEmbed {
    static create(url) {
        const node = super.create();
        const iframe = document.createElement("iframe");
        iframe.setAttribute("src", getEmbedUrl(url));
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

// ── HTML Sanitizer ────────────────────────────────────────────────────────────
const sanitizeHtmlForQuill = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rich = doc.querySelector(".rich-text");
    const container = document.createElement("div");
    container.innerHTML = rich ? rich.innerHTML : doc.body?.innerHTML || html;
    Array.from(container.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim()) {
            const p = document.createElement("p");
            p.textContent = n.textContent || "";
            container.replaceChild(p, n);
        }
    });
    container.innerHTML = container.innerHTML.replaceAll("<br>", "<br/>");
    container.innerHTML = container.innerHTML.replace(/\u200B/g, "");
    return container.innerHTML;
};













const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Create({ auth, langs }) {
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null); // Added PDF preview state
    const [contentType, setContentType] = useState("");
    const [calendarType, setCalendarType] = useState("");

    // Progress Modal State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadFileName, setUploadFileName] = useState("");
    const [uploadDone, setUploadDone] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        type: "",
        calendar_type: "",
        image: null,
        gallery: [],
        document_file: null,
        is_featured: false,
        status: "draft",
        lang_id: "",
        content_text: "",
        youtube_url: "",
        audio_file: null,
        video_file: null,
        pdf: null, // Added PDF field
        audios: [],
        videos: [],
        pdfs: [],
        remove_audios: [],
        remove_videos: [],
        remove_pdfs: [],
        audio_temp_paths: [],
        video_temp_paths: [],
        pdf_temp_paths: [],
    });

    /**
     * Chunked file upload using XHR for real-time per-byte progress tracking
     */
    const uploadFileInChunks = async (file, fileIndex, totalFiles) => {
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

            const result = await new Promise((resolve, reject) => {
                const uploadUrl = "/upload/chunk";
                const xhrChunk = new XMLHttpRequest();
                xhrChunk.open("POST", uploadUrl, true);
                xhrChunk.setRequestHeader("X-CSRF-TOKEN", csrfMeta?.content || "");
                xhrChunk.setRequestHeader("Accept", "application/json");

                if (chunkIndex === 0) setUploadProgress(1);

                xhrChunk.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const chunksDone = chunkIndex / totalChunks;
                        const withinChunk = (e.loaded / e.total) / totalChunks;
                        const fileProgress = (chunksDone + withinChunk) * 100;
                        const globalProgress = (fileIndex / totalFiles) * 100 + (fileProgress / totalFiles);
                        setUploadProgress(Math.max(2, Math.min(Math.round(globalProgress), 99)));
                    }
                };

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

            if (result.done) {
                setUploadProgress(Math.round(((fileIndex + 1) / totalFiles) * 100));
                return result.temp_path;
            }
        }
        throw new Error("Upload incomplete — server never sent done signal.");
    };

    const handleAddMediaFile = (type, files) => {
        const fileArray = Array.isArray(files) ? files : [files];
        setData(type + "s", [...data[type + "s"], ...fileArray]);
    };

    const handleRemoveMediaFile = (type, index, uidOrId, isExisting) => {
        if (isExisting) {
            setData({
                ...data,
                [type + "s"]: data[type + "s"].filter((f) => f.id !== uidOrId),
                ["remove_" + type + "s"]: [...data["remove_" + type + "s"], uidOrId],
            });
        } else {
            setData(
                type + "s",
                data[type + "s"].filter((_, i) => i !== index),
            );
        }
    };

    const handleUpdateMediaFile = (type, index, file, uidOrId, isExisting) => {
        if (isExisting) {
            // handle existing update if needed
        } else {
            setData(type + "s", data[type + "s"].map((f, i) => i === index ? file : f));
        }
    };

    const submit = async () => {
        const csrfToken =
            document.querySelector('meta[name="csrf-token"]')?.content || "";

        try {
            const CHUNK_THRESHOLD = 5 * 1024 * 1024; // 5MB
            const filesToUpload = [];
            const tempPaths = {
                videos: [],
                audios: [],
                pdfs: []
            };

            // Prep videos
            data.videos.forEach((file, idx) => {
                if (file instanceof File && file.size >= CHUNK_THRESHOLD) {
                    filesToUpload.push({ type: 'video', file, originalIdx: idx });
                }
            });

            // Prep audios
            data.audios.forEach((file, idx) => {
                if (file instanceof File && file.size >= CHUNK_THRESHOLD) {
                    filesToUpload.push({ type: 'audio', file, originalIdx: idx });
                }
            });

            // Prep pdfs
            data.pdfs.forEach((file, idx) => {
                if (file instanceof File && file.size >= CHUNK_THRESHOLD) {
                    filesToUpload.push({ type: 'pdf', file, originalIdx: idx });
                }
            });

            // 2. Perform chunked uploads if any
            if (filesToUpload.length > 0) {
                setIsUploading(true);
                for (let i = 0; i < filesToUpload.length; i++) {
                    const item = filesToUpload[i];
                    setUploadFileName(item.file.name);
                    const tPath = await uploadFileInChunks(item.file, i, filesToUpload.length);
                    tempPaths[item.type + 's'].push(tPath);
                }
                // setIsUploading(false); // keep it true for the final XHR
            } else {
                // Show modal for small files as well
                setUploadFileName("Media Files");
                setUploadProgress(0);
                setIsUploading(true);
            }

            // 3. Prepare final FormData
            const finalFormData = new FormData();

            Object.keys(data).forEach((key) => {
                const value = data[key];

                if (value === null || value === undefined) return;

                if (key === "gallery" && Array.isArray(value)) {
                    value.forEach((file, index) => {
                        finalFormData.append(`gallery[${index}]`, file);
                    });
                } else if (["videos", "audios", "pdfs"].includes(key) && Array.isArray(value)) {
                    value.forEach((file, index) => {
                        // Only append if NOT a large file (large files sent via temp_paths)
                        if (!(file instanceof File && file.size >= CHUNK_THRESHOLD)) {
                            finalFormData.append(`${key}[${index}]`, file);
                        }
                    });
                } else if (["remove_videos", "remove_audios", "remove_pdfs"].includes(key) && Array.isArray(value)) {
                    value.forEach((id, index) => {
                        finalFormData.append(`${key}[${index}]`, id);
                    });
                } else if (key === "is_featured") {
                    finalFormData.append(key, value ? "1" : "0");
                } else if (value instanceof File) {
                    finalFormData.append(key, value);
                } else {
                    finalFormData.append(key, value);
                }
            });

            // Append temp paths
            Object.keys(tempPaths).forEach(key => {
                tempPaths[key].forEach((path, idx) => {
                    finalFormData.append(`${key.slice(0, -1)}_temp_paths[${idx}]`, path);
                });
            });

            // 4. Submit via XHR with fresh CSRF token
            // Refresh CSRF token first to prevent 419 after long chunk uploads
            let freshCsrfToken = csrfToken;
            try {
                const tokenUrl = typeof route === 'function' ? route("csrf.refresh") : "/csrf-token";
                const tokenRes = await fetch(tokenUrl, { credentials: "same-origin" });
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    if (tokenData.token) {
                        freshCsrfToken = tokenData.token;
                        const metaTag = document.querySelector('meta[name="csrf-token"]');
                        if (metaTag) metaTag.setAttribute("content", freshCsrfToken);
                    }
                }
            } catch { /* use existing token on failure */ }

            const xhr = new XMLHttpRequest();
            // Fix: correct store URL — route maps to POST /admin/islamic-zone (not /store)
            const storeUrl = typeof route === 'function' ? route("admin.islamic-zone.store") : "/admin/islamic-zone";
            xhr.open("POST", storeUrl, true);
            xhr.setRequestHeader("X-CSRF-TOKEN", freshCsrfToken);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Accept", "application/json");

            // track final submission progress (important for small files/form data)
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && !filesToUpload.length) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // message.success("Item created successfully");
                    setUploadDone(true);
                    // window.location.href = route("admin.islamic-zone.index");
                } else if (xhr.status === 409) {
                     // Inertia Version Conflict - force refresh
                     window.location.href = route("admin.islamic-zone.index");
                } else {
                    const response = JSON.parse(xhr.responseText);
                    message.error(response.message || "Error creating item");
                }
            };

            xhr.onerror = function () {
                message.error("Network error occurred.");
            };

            xhr.send(finalFormData);

        } catch (error) {
            setIsUploading(false);
            message.error(error.message || "Upload failed");
        }
    };

    const resetForm = () => {
        setData({
            title: "",
            description: "",
            type: "",
            calendar_type: "",
            image: null,
            gallery: [],
            document_file: null,
            is_featured: false,
            status: "draft",
            content_text: "",
            youtube_url: "",
            audio_file: null,
            video_file: null,
            pdf: null,
            lang_id: "",
        });
        setMainImagePreview(null);
        setGalleryPreviews([]);
        setDocumentPreview(null);
        setPdfPreview(null);
        setContentType("");
        setCalendarType("");
        setData({
            ...data,
            audios: [],
            videos: [],
            pdfs: [],
        });
    };

    const handleMainImageUpload = (file) => {
        setData("image", file);
        setMainImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];
        setData("gallery", newGallery);
        setGalleryPreviews((prev) => [...prev, URL.createObjectURL(file)]);
        return false;
    };

    const handleGalleryRemove = (index) => {
        const newGallery = data.gallery.filter((_, i) => i !== index);
        const newPreviews = galleryPreviews.filter((_, i) => i !== index);
        setData("gallery", newGallery);
        setGalleryPreviews(newPreviews);
    };

    const handleDocumentUpload = (file) => {
        setData("document_file", file);
        setDocumentPreview(file);
        return false;
    };

    const handlePdfUpload = (file) => {
        if (file.type !== "application/pdf") {
            message.error("You can only upload PDF files!");
            return false;
        }
        setData("pdf", file);
        setPdfPreview(URL.createObjectURL(file));
        return false;
    };

    const handleDocumentRemove = () => {
        setData("document_file", null);
        setDocumentPreview(null);
    };

    const handleAudioUpload = (file) => {
        const isAudio = file.type.startsWith("audio/");
        if (!isAudio) {
            message.error("You can only upload audio files!");
            return false;
        }
        setData("audio_file", file);
        return false;
    };

    const handleVideoUpload = (file) => {
        const isVideo = file.type.startsWith("video/");
        if (!isVideo) {
            message.error("You can only upload video files!");
            return false;
        }
        setData("video_file", file);
        return false;
    };

    const handleContentTypeChange = (value) => {
        setContentType(value);
        setData("type", value);

        // Reset dependent fields when content type changes
        setData("document_file", null);
        setData("audio_file", null);
        setData("video_file", null);
        setData("pdf", null);
        setData("youtube_url", "");
        setData("content_text", "");
        setData("image", null);
        setData("calendar_type", "");
        setData("gallery", []);

        // Reset previews
        setDocumentPreview(null);
        setMainImagePreview(null);
        setGalleryPreviews([]);
        setPdfPreview(null);
        setCalendarType("");
    };

    const handleCalendarTypeChange = (value) => {
        setCalendarType(value);
        setData("calendar_type", value);
    };

    const contentTypesConfig = {
        islamicContent: {
            label: "Islamic Content",
            icon: <BookOutlined />,
            description: "Upload Posts thumbnail for Islamic Contents",
            allowedFiles: "image/*",
            fileType: "image",
        },
        calendar: {
            label: "Calendar",
            icon: <CalendarOutlined />,
            description: "Upload Islamic calendars for different purposes",
            allowedFiles: "image/*",
            fileType: "image",
        },
        quran: {
            label: "Quran",
            icon: <FileTextOutlined />,
            description:
                "Quranic content with text, audio, video, or YouTube links",
            allowedFiles: "audio/*,video/*",
            fileType: "mixed",
        },
        hadith: {
            label: "Hadith",
            icon: <FileTextOutlined />,
            description:
                "Hadith content with text, audio, video, or YouTube links",
            allowedFiles: "audio/*,video/*",
            fileType: "mixed",
        },
    };

    const calendarTypesConfig = {
        islamic: {
            label: "Islamic Calendar",
            description:
                "Hijri calendar with Islamic months and important dates",
            icon: <CalendarOutlined />,
        },
        ramadan: {
            label: "Ramadan Calendar",
            description:
                "Special calendar for Ramadan with prayer times and iftar schedules",
            icon: <CalendarOutlined />,
        },
        yearly: {
            label: "Yearly Calendar",
            description:
                "Complete yearly calendar with both Hijri and Gregorian dates",
            icon: <CalendarOutlined />,
        },
    };

    const renderContentTypeFields = () => {
        switch (contentType) {
            case "islamicContent":
                return (
                    <>
                        {/* IMAGE UPLOAD */}
                        <Col span={24}>
                            <Form.Item
                                label="Islamic Content Thumbnail Image"
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                                
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button
                                        icon={<PictureOutlined />}
                                        type="primary"
                                    >
                                        Upload Image
                                    </Button>
                                </Upload>

                                <Text type="secondary" className="block mt-1">
                                    Only image files are allowed. Max size: 2MB
                                </Text>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Image Preview:
                                        </Text>
                                        <img
                                            src={mainImagePreview}
                                            alt="Preview"
                                            style={{
                                                maxWidth: "300px",
                                                maxHeight: "200px",
                                                borderRadius: "8px",
                                                objectFit: "contain",
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <MultipleMediaUpload
                                type="pdf"
                                files={data.pdfs}
                                onAdd={(files) => handleAddMediaFile("pdf", files)}
                                onRemove={(type, index, idOrUid, isExisting) => handleRemoveMediaFile(type, index, idOrUid, isExisting)}
                                onUpdate={(type, index, file, idOrUid, isExisting) => handleUpdateMediaFile(type, index, file, idOrUid, isExisting)}
                            />
                        </Col>
                    </>
                );
            case "calendar":
                return (
                    <>
                        <Col span={24}>
                            <Form.Item
                                label="Calendar Type"
                                validateStatus={
                                    errors.calendar_type ? "error" : ""
                                }
                                help={errors.calendar_type}
                                
                            >
                                <Select
                                    size="large"
                                    value={calendarType}
                                    onChange={handleCalendarTypeChange}
                                    placeholder="Select Calendar Type"
                                >
                                    <Option value="islamic">
                                        <Space>
                                            <CalendarOutlined />
                                            Islamic Calendar
                                        </Space>
                                    </Option>
                                    <Option value="ramadan">
                                        <Space>
                                            <CalendarOutlined />
                                            Ramadan Calendar
                                        </Space>
                                    </Option>
                                    <Option value="yearly">
                                        <Space>
                                            <CalendarOutlined />
                                            Yearly Calendar
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        {calendarType && (
                            <Col span={24}>
                                <Card
                                    size="small"
                                    className="mb-4 bg-green-50 border-green-200"
                                >
                                    <Space>
                                        {
                                            calendarTypesConfig[calendarType]
                                                ?.icon
                                        }
                                        <Text strong className="text-green-700">
                                            {
                                                calendarTypesConfig[
                                                    calendarType
                                                ]?.label
                                            }
                                        </Text>
                                    </Space>
                                    <Text className="block text-green-600 mt-1">
                                        {
                                            calendarTypesConfig[calendarType]
                                                ?.description
                                        }
                                    </Text>
                                </Card>
                            </Col>
                        )}

                        <Col span={24}>
                            <Form.Item
                                label="Calendar Image"
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                                
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button
                                        icon={<PictureOutlined />}
                                        type="primary"
                                    >
                                        Upload Calendar Image
                                    </Button>
                                </Upload>
                                <Text type="secondary" className="block mt-1">
                                    Recommended: High-quality images for
                                    calendar printing
                                </Text>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Calendar Preview:
                                        </Text>
                                        <img
                                            src={mainImagePreview}
                                            alt="Calendar preview"
                                            style={{
                                                maxWidth: "300px",
                                                maxHeight: "200px",
                                                borderRadius: "8px",
                                                objectFit: "contain",
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Additional Calendar Images"
                                validateStatus={errors.gallery ? "error" : ""}
                                help={errors.gallery}
                            >
                                <Upload
                                    beforeUpload={handleGalleryUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button icon={<PlusOutlined />}>
                                        Add More Calendar Images
                                    </Button>
                                </Upload>

                                {galleryPreviews.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Additional Images:
                                        </Text>
                                        <div className="flex flex-wrap gap-4">
                                            {galleryPreviews.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`Calendar ${index + 1}`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                borderRadius:
                                                                    "8px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            className="border border-dashed border-gray-300"
                                                        />
                                                        <Button
                                                            type="link"
                                                            danger
                                                            size="small"
                                                            onClick={() =>
                                                                handleGalleryRemove(
                                                                    index,
                                                                )
                                                            }
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                top: -8,
                                                                right: -8,
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <Text
                                            type="secondary"
                                            className="block mt-2"
                                        >
                                            {galleryPreviews.length} additional
                                            image(s) selected
                                        </Text>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>
                    </>
                );
            case "quran":
            case "hadith":
                return (
                    <>
                        {/* <Col span={24}>
                            <Form.Item
                                label={`${contentType === "quran" ? "Quranic" : "Hadith"} Text`}
                                validateStatus={
                                    errors.content_text ? "error" : ""
                                }
                                help={errors.content_text}
                                required
                            >
                                <TextArea
                                    rows={8}
                                    placeholder={`Enter ${contentType === "quran" ? "Quranic verses and tafsir" : "Hadith text and explanation"} here...`}
                                    value={data.content_text}
                                    onChange={(e) =>
                                        setData("content_text", e.target.value)
                                    }
                                    showCount
                                    maxLength={10000}
                                />
                            </Form.Item>
                        </Col> */}

                        
                     <Col span={24}>
                            <Form.Item
                                label={`${contentType === "quran" ? "Quranic" : "Hadith"} Text`}
                                validateStatus={
                                    errors.content_text ? "error" : ""
                                }
                                help={errors.content_text}
                                
                            >
                                <CustomQuillEditor
                                    value={data.content_text}
                                    onChange={(val) =>
                                        setData("content_text", val)
                                    }
                                    placeholder={`Enter ${contentType === "quran" ? "Quranic verses and tafsir" : "Hadith text and explanation"} here...`}
                                />
                            </Form.Item>
                        </Col>


                        {/* THUMBNAIL IMAGE UPLOAD */}
                        <Col span={24}>
                            <Form.Item
                                label={`${contentType === "quran" ? "Quranic" : "Hadith"} Content Thumbnail Image`}
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                                
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button
                                        icon={<PictureOutlined />}
                                        type="primary"
                                    >
                                        Upload Thumbnail Image
                                    </Button>
                                </Upload>

                                <Text type="secondary" className="block mt-1">
                                    Only image files are allowed. Max size: 5MB
                                </Text>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Thumbnail Preview:
                                        </Text>
                                        <img
                                            src={mainImagePreview}
                                            alt="Preview"
                                            style={{
                                                maxWidth: "300px",
                                                maxHeight: "200px",
                                                borderRadius: "8px",
                                                objectFit: "contain",
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="YouTube URL"
                                validateStatus={
                                    errors.youtube_url ? "error" : ""
                                }
                                help={errors.youtube_url}
                            >
                                <Input
                                    size="large"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={data.youtube_url}
                                    onChange={(e) =>
                                        setData("youtube_url", e.target.value)
                                    }
                                    prefix={
                                        <YoutubeOutlined className="text-red-500" />
                                    }
                                />
                                <Text type="secondary" className="block mt-1">
                                    Enter YouTube video URL for related content
                                </Text>
                            </Form.Item>
                        </Col>
                        {/* MULTIPLE MEDIA UPLOAD SECTION */}
                        <Col span={24}>
                            <Divider orientation="left">Audio & Video Content</Divider>
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <Form.Item label="Multiple Audio Files">
                                        <MultipleMediaUpload
                                            type="audio"
                                            files={data.audios}
                                            existingFiles={[]}
                                            onAdd={(files) => handleAddMediaFile("audio", files)}
                                            onRemove={(type, index, idOrUid, isExisting) => handleRemoveMediaFile(type, index, idOrUid, isExisting)}
                                            onUpdate={(type, index, file, idOrUid, isExisting) => handleUpdateMediaFile(type, index, file, idOrUid, isExisting)}
                                        />
                                        <Text type="secondary" className="block mt-1">
                                            Upload multiple audio files. Large files will be processed automatically.
                                        </Text>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Multiple Video Files">
                                        <MultipleMediaUpload
                                            type="video"
                                            files={data.videos}
                                            existingFiles={[]}
                                            onAdd={(files) => handleAddMediaFile("video", files)}
                                            onRemove={(type, index, idOrUid, isExisting) => handleRemoveMediaFile(type, index, idOrUid, isExisting)}
                                            onUpdate={(type, index, file, idOrUid, isExisting) => handleUpdateMediaFile(type, index, file, idOrUid, isExisting)}
                                        />
                                        <Text type="secondary" className="block mt-1">
                                            Upload multiple video files. Large files will be processed automatically.
                                        </Text>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="Multiple PDF Files">
                                        <MultipleMediaUpload
                                            type="pdf"
                                            files={data.pdfs}
                                            existingFiles={[]}
                                            onAdd={(files) => handleAddMediaFile("pdf", files)}
                                            onRemove={(type, index, idOrUid, isExisting) => handleRemoveMediaFile(type, index, idOrUid, isExisting)}
                                            onUpdate={(type, index, file, idOrUid, isExisting) => handleUpdateMediaFile(type, index, file, idOrUid, isExisting)}
                                        />
                                        <Text type="secondary" className="block mt-1">
                                            Upload multiple PDF files.
                                        </Text>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Related Images"
                                validateStatus={errors.gallery ? "error" : ""}
                                help={errors.gallery}
                            >
                                <Upload
                                    beforeUpload={handleGalleryUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button icon={<PlusOutlined />}>
                                        Add Related Images
                                    </Button>
                                </Upload>

                                {galleryPreviews.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Image Previews:
                                        </Text>
                                        <div className="flex flex-wrap gap-4">
                                            {galleryPreviews.map(
                                                (preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`${contentType} ${index + 1}`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                borderRadius:
                                                                    "8px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            className="border border-dashed border-gray-300"
                                                        />
                                                        <Button
                                                            type="link"
                                                            danger
                                                            size="small"
                                                            onClick={() =>
                                                                handleGalleryRemove(
                                                                    index,
                                                                )
                                                            }
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                top: -8,
                                                                right: -8,
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <Text
                                            type="secondary"
                                            className="block mt-2"
                                        >
                                            {galleryPreviews.length} image(s)
                                            selected
                                        </Text>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Authenticated user={auth.user} header="Create Islamic Zone">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.islamic-zone.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Items
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Create New Islamic Zone
                    </Title>
                    <Text type="secondary">
                        Add Quran, Hadith, Islamic Calendars, or Islamic
                        Contents to your collection
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Content Type"
                                validateStatus={errors.type ? "error" : ""}
                                help={errors.type}
                                
                            >
                                <Select
                                    size="large"
                                    value={contentType}
                                    onChange={handleContentTypeChange}
                                    placeholder="Select Content Type"
                                >
                                    <Option value="">
                                        <Space>Select Content Type</Space>
                                    </Option>
                                    <Option value="quran">
                                        <Space>
                                            <FileTextOutlined />
                                            Quran
                                        </Space>
                                    </Option>
                                    <Option value="hadith">
                                        <Space>
                                            <FileTextOutlined />
                                            Hadith
                                        </Space>
                                    </Option>
                                    <Option value="calendar">
                                        <Space>
                                            <CalendarOutlined />
                                            Calendar
                                        </Space>
                                    </Option>
                                    <Option value="islamicContent">
                                        <Space>
                                            <BookOutlined />
                                            Islamic Content
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        {contentType && (
                            <Col span={24}>
                                <Card
                                    size="small"
                                    className="mb-6 bg-blue-50 border-blue-200"
                                    title={
                                        <Space>
                                            {
                                                contentTypesConfig[contentType]
                                                    ?.icon
                                            }
                                            <Text
                                                strong
                                                className="text-blue-700"
                                            >
                                                {
                                                    contentTypesConfig[
                                                        contentType
                                                    ]?.label
                                                }
                                            </Text>
                                        </Space>
                                    }
                                >
                                    <Text className="text-blue-600">
                                        {
                                            contentTypesConfig[contentType]
                                                ?.description
                                        }
                                    </Text>
                                </Card>
                            </Col>
                        )}

                        <Col span={24}>
                            <Form.Item
                                label="Title"
                                validateStatus={errors.title ? "error" : ""}
                                help={errors.title}
                                
                            >
                                <Input
                                    size="large"
                                    placeholder={`Enter ${contentType ? contentTypesConfig[contentType]?.label : "content"} title`}
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                     required
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Description"
                                validateStatus={
                                    errors.description ? "error" : ""
                                }
                                help={errors.description}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Enter description..."
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    showCount
                                    maxLength={2000}
                                />
                            </Form.Item>
                        </Col>

                        {/* <Col span={24}>
                            <Form.Item
                                label="Select Language"
                                validateStatus={errors.lang_id ? 'error' : ''}
                                help={errors.lang_id}
                                required
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)}
                                >
                                    {langs.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col> */}

                        {/* Content Type Specific Fields */}
                        {contentType && renderContentTypeFields()}

                        <br />

                        <Col span={12}>
                            <Form.Item label="Featured Item">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) =>
                                        setData("is_featured", checked)
                                    }
                                />
                                <Text className="ml-2">
                                    {data.is_featured ? "Featured" : "Regular"}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? "error" : ""}
                                help={errors.status}
                                
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) =>
                                        setData("status", value)
                                    }
                                    size="large"
                                >
                                    <Option value="draft">Draft</Option>
                                    <Option value="published">Published</Option>
                                    <Option value="archived">Archived</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />

                    <Form.Item className="mt-8">
                        <Space size="middle">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: "160px" }}
                                disabled={
                                    !contentType ||
                                    (contentType === "calendar" &&
                                        !calendarType)
                                }
                            >
                                Create{" "}
                                {contentType
                                    ? contentTypesConfig[contentType]?.label
                                    : "Item"}
                            </Button>

                            <Link href={route("admin.islamic-zone.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>

                            <Button
                                onClick={resetForm}
                                size="large"
                                type="text"
                            >
                                Reset Form
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
            <UploadProgressModal
                open={isUploading}
                fileName={uploadFileName}
                percent={uploadProgress}
                done={uploadDone}
                onClose={() => {
                    setIsUploading(false);
                    setUploadDone(false);
                    window.location.href = route("admin.islamic-zone.index");
                }}
            />
                        <style>
                {`
                @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&family=Noto+Sans+Bengali:wght@300;400;600;700&display=swap");
 
.ql-font-cairo            { font-family: "Cairo", sans-serif; }
.ql-font-amiri            { font-family: "Amiri", serif; direction: rtl; }
.ql-font-noto-sans-bengali { font-family: "Noto Sans Bengali", sans-serif; }
.ql-font-times-new-roman  { font-family: "Times New Roman", Times, serif; }
 
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="cairo"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="cairo"]::before        { content: "Cairo (عربي)";    font-family: "Cairo", sans-serif; }
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="amiri"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="amiri"]::before        { content: "Amiri (أميري)";   font-family: "Amiri", serif; }
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before { content: "Times New Roman"; font-family: "Times New Roman", Times, serif; }
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="noto-sans-bengali"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="noto-sans-bengali"]::before { content: "Noto Bengali";   font-family: "Noto Sans Bengali", sans-serif; }
 
.ql-container  { min-height: 350px; font-size: 16px; }
.ql-editor     { min-height: 350px; white-space: pre-wrap !important; overflow-wrap: anywhere; word-break: break-word; tab-size: 4; }
.ql-editor p   { margin: 0 0 0.75em; }
.ql-toolbar.ql-snow  { border-top-left-radius: 8px; border-top-right-radius: 8px; background: #fbfbfb; }
.ql-container.ql-snow { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
.ql-toolbar .ql-font  { min-width: 140px; max-width: 220px; white-space: nowrap; text-overflow: ellipsis; }
 
@media (max-width: 768px) {
    .ql-container { min-height: 250px; font-size: 14px; }
    .ql-editor    { min-height: 250px; }
}
                `}
            </style>

        </Authenticated>
    );
}
