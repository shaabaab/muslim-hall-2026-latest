import { useForm } from "@inertiajs/react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
  Button,
  Card,
  Col,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
  Grid,
  Dropdown,
} from "antd";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import UploadProgressModal from "@/Components/UploadProgressModal";
import {
  ArrowLeftOutlined,
  AudioOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  SaveOutlined,
  TeamOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_REJECTED = "rejected";

const statusOptions = [
  { label: "Pending", value: STATUS_PENDING },
  { label: "Approved", value: STATUS_APPROVED },
  { label: "Rejected", value: STATUS_REJECTED },
];

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

// ✅ Mobile dropdown switch (same design you sent)
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
      <MediaDropdown value={activeKey} onChange={onChange} items={items} />
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
      return getS3PublicUrl(postFile);
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
const MultipleFeaturedImages = ({ featuredImages, onAddImages, onRemoveImage }) => {
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

    // Optional: per-file validation
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        message.error("Only image files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.error("Each file size should not exceed 5MB");
        return;
      }
    }

    onAddImages(files);
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

        {/* Count show */}
        <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded-full">
          {featuredImages.length}
        </span>
      </div>

      {featuredImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {featuredImages.map((image, index) => {
            const previewUrl = getPreviewUrl(image);
            const imageName = image.name || image.file?.name || `Image ${index + 1}`;

            return (
              <div
                key={image.id || index}
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
                    <p className="text-xs font-medium truncate">{imageName}</p>
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

      {/* Unlimited: always show add-box */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
        onClick={() => document.getElementById("admin-entry-gallery-image")?.click()}
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
          id="admin-entry-gallery-image"
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
export default function Create({ auth, contests, users }) {
  const pdfInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const [isMounted, setIsMounted] = useState(false);
  const [mediaType, setMediaType] = useState("content");
  const [featuredImages, setFeaturedImages] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);

  // ── useForm ───────────────────────────────────────────────────────────────
  const { data, setData, post, processing, errors } = useForm({
    title: "",
    content: "",
    user_id: "",
    contest_id: "",
    status: STATUS_PENDING,

    thumbnail: null,
    remove_thumbnail: false,

    pdf: null,
    remove_pdf: false,

    video: null,
    remove_video: false,

    audio: null,
    remove_audio: false,

    images: [],
  });

  // Upload progress modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Contest type helpers ──────────────────────────────────────────────────
  const isManual = selectedContest?.type === "manual";
  const isGoogleForm = selectedContest?.type === "google_form";

  // ── Contest formats ───────────────────────────────────────────────────────
  const contestFormats = useMemo(() => {
    if (!selectedContest) return [];
    const raw = selectedContest.formats;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((f) => f.toLowerCase());
    try {
      return JSON.parse(raw).map((f) => f.toLowerCase());
    } catch {
      return [];
    }
  }, [selectedContest]);

  const hasImageFormat = isManual && contestFormats.includes("image");

  // ── File handlers ─────────────────────────────────────────────────────────
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
      resetInputForField(field);
    },
    [setData, resetInputForField],
  );

  const handleRemoveFile = useCallback(
    (field) => {
      setData(field, null);
      setData(`remove_${field}`, true);
      resetInputForField(field);
    },
    [setData, resetInputForField],
  );

  // ── Gallery handlers ──────────────────────────────────────────────────────
  const handleAddGalleryImages = (files) => {
    const newOnes = files.map((file) => ({
      id: `new-${Date.now()}-${file.name}`,
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    const updated = [...featuredImages, ...newOnes];
    setFeaturedImages(updated);

    setData("images", updated.map((img) => img.file));
  };

  const handleRemoveGalleryImage = (index) => {
    const updated = featuredImages.filter((_, i) => i !== index);
    setFeaturedImages(updated);
    setData(
      "images",
      updated.map((img) => img.file),
    );
  };

  // ── Sidebar tabs ──────────────────────────────────────────────────────────
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
            postFile={data.remove_thumbnail ? null : null}
            onFileChange={(f, file) => {
              setData("remove_thumbnail", false);
              setData(f, file);
            }}
            onRemove={(f) => {
              setData(f, null);
              setData("remove_thumbnail", true);
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
            onAddImages={handleAddGalleryImages}
            onRemoveImage={handleRemoveGalleryImage}
          />
        ),
      },
    ];
  }, [
    data.thumbnail,
    data.remove_thumbnail,
    featuredImages,
    errors.thumbnail,
    hasImageFormat,
  ]);

  // ── Media items (formats based) ───────────────────────────────────────────
  const allMediaItems = useMemo(
    () => ({
      content: {
        key: "content",
        label: (
          <span className="flex items-center gap-2">
            <FileTextOutlined /> Text Content
          </span>
        ),
        children: (
          <div className="mt-4">
            {isMounted ? (
              // ✅ Wrapper class for Quill (so you can control height from CSS)
              <div className="entry-quill rounded-lg overflow-hidden bg-white">
                <ReactQuill
                  theme="snow"
                  value={data.content}
                  onChange={(val) => setData("content", val)}
                  placeholder="Write your content..."
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            ) : (
              <Input.TextArea
                rows={6}
                placeholder="Write your content..."
                value={data.content}
                onChange={(e) => setData("content", e.target.value)}
              />
            )}
          </div>
        ),
      },

      pdf: {
        key: "pdf",
        label: (
          <span className="flex items-center gap-2">
            <FilePdfOutlined /> PDF
          </span>
        ),
        children: (
          <div className="mt-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-10 overflow-hidden">
              <input
                ref={pdfInputRef}
                type="file"
                hidden
                accept=".pdf,application/pdf"
                onChange={(e) => handleFileChange("pdf", e.target.files?.[0])}
              />

              {data.pdf && !data.remove_pdf ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <FilePdfOutlined className="text-5xl text-red-500" />

                  <Text strong className="break-all">
                    {data.pdf?.name || "PDF Attachment"}
                  </Text>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      size="middle"
                      danger
                      ghost
                      icon={<DeleteOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => handleRemoveFile("pdf")}
                    >
                      Remove
                    </Button>

                    <Button
                      size="middle"
                      icon={<UploadOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <FilePdfOutlined className="text-5xl text-gray-300" />

                  <Button
                    icon={<UploadOutlined />}
                    size="large"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm "
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    Upload PDF File
                  </Button>
                </div>
              )}
            </div>
          </div>
        ),
      },

      video: {
        key: "video",
        label: (
          <span className="flex items-center gap-2">
            <VideoCameraOutlined /> Video
          </span>
        ),
        children: (
          <div className="mt-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-10 overflow-hidden">
              <input
                ref={videoInputRef}
                type="file"
                hidden
                accept="video/*"
                onChange={(e) => handleFileChange("video", e.target.files?.[0])}
              />

              {data.video && !data.remove_video ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <VideoCameraOutlined className="text-5xl text-blue-500" />

                  <Text strong className="break-all">
                    {data.video?.name || "Video File"}
                  </Text>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      size="middle"
                      danger
                      ghost
                      icon={<DeleteOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => handleRemoveFile("video")}
                    >
                      Remove
                    </Button>

                    <Button
                      size="middle"
                      icon={<UploadOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <VideoCameraOutlined className="text-5xl text-gray-300" />

                  <Button
                    icon={<UploadOutlined />}
                    size="large"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm "
                    onClick={() => videoInputRef.current?.click()}
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
            <AudioOutlined /> Audio
          </span>
        ),
        children: (
          <div className="mt-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-10 overflow-hidden">
              <input
                ref={audioInputRef}
                type="file"
                hidden
                accept="audio/*"
                onChange={(e) => handleFileChange("audio", e.target.files?.[0])}
              />

              {data.audio && !data.remove_audio ? (
                <div className="flex flex-col items-center text-center gap-3">
                  <AudioOutlined className="text-5xl text-green-500" />

                  <Text strong className="break-all">
                    {data.audio?.name || "Audio File"}
                  </Text>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      size="middle"
                      danger
                      ghost
                      icon={<DeleteOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => handleRemoveFile("audio")}
                    >
                      Remove
                    </Button>

                    <Button
                      size="middle"
                      icon={<UploadOutlined />}
                      className="w-full sm:w-auto flex items-center justify-center gap-2"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <AudioOutlined className="text-5xl text-gray-300" />

                  <Button
                    icon={<AudioOutlined />}
                    size="large"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm "
                    onClick={() => audioInputRef.current?.click()}
                  >
                    Upload Audio Track
                  </Button>
                </div>
              )}
            </div>
          </div>
        ),
      },
    }),
    [
      data.content,
      data.pdf,
      data.remove_pdf,
      data.video,
      data.remove_video,
      data.audio,
      data.remove_audio,
      isMounted,
      handleFileChange,
      handleRemoveFile,
      setData,
    ]
  );

  const mediaItems = useMemo(() => {
    if (!selectedContest || !isManual) return [];
    const formatKeyMap = {
      text: "content",
      pdf: "pdf",
      video: "video",
      audio: "audio",
    };
    return contestFormats
      .map((fmt) => formatKeyMap[fmt])
      .filter(Boolean)
      .map((key) => allMediaItems[key])
      .filter(Boolean);
  }, [selectedContest, isManual, contestFormats, allMediaItems]);

  // auto pick first available media type
  useEffect(() => {
    if (mediaItems.length > 0) {
      const keys = mediaItems.map((t) => t.key);
      if (!keys.includes(mediaType)) setMediaType(keys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItems]);

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
              document.querySelector('meta[name="csrf-token"]')?.content || "",
            Accept: "application/json",
          },
          body: chunkFormData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed at chunk ${chunkIndex + 1}`);
        }

        const result = await response.json();

        // Update Progress percentage
        const percentCompleted = Math.round(((chunkIndex + 1) / totalChunks) * 100);
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!data.title) return message.error("Title is required!");
    if (!data.contest_id) return message.error("Please select a contest!");
    if (!data.user_id) return message.error("Please select a user!");

    const hasLargeFile = !!(data.video || data.audio || data.pdf);
    const url = route("admin.entries.store");

    const formData = new FormData();
    formData.append("title", data.title || "");
    formData.append("content", data.content || "");
    formData.append("user_id", data.user_id || "");
    formData.append("contest_id", data.contest_id || "");
    formData.append("status", data.status || STATUS_PENDING);

    formData.append("remove_thumbnail", data.remove_thumbnail ? "1" : "0");
    formData.append("remove_pdf", data.remove_pdf ? "1" : "0");
    formData.append("remove_video", data.remove_video ? "1" : "0");
    formData.append("remove_audio", data.remove_audio ? "1" : "0");

    if (data.thumbnail instanceof File) formData.append("thumbnail", data.thumbnail);
    
    // Large files logic: if it's small, attach directly. If large, use chunking.
    if (data.pdf instanceof File && data.pdf.size < 5000000) formData.append("pdf", data.pdf);
    if (data.video instanceof File && data.video.size < 5000000) formData.append("video", data.video);
    if (data.audio instanceof File && data.audio.size < 5000000) formData.append("audio", data.audio);

    if (Array.isArray(data.images)) {
      data.images.forEach((f) => {
        if (f instanceof File) formData.append("images[]", f);
      });
    }

    const largeFileForProgress =
      data.video instanceof File
        ? data.video
        : data.audio instanceof File
        ? data.audio
        : data.pdf instanceof File
        ? data.pdf
        : null;

    setUploadFileName(largeFileForProgress?.name || "");
    setUploadPercent(0);
    setUploadDone(false);

    // ── 1. HANDLE CHUNKED UPLOADS BEFORE SUBMIT ──
    try {
      if (data.video instanceof File && data.video.size >= 5000000) {
        setUploadModalOpen(true);
        const tempPath = await uploadFileInChunks(data.video, setUploadPercent);
        formData.append("video_temp_path", tempPath);
        setUploadPercent(100);
      }
      if (data.audio instanceof File && data.audio.size >= 5000000) {
        setUploadModalOpen(true);
        const tempPath = await uploadFileInChunks(data.audio, setUploadPercent);
        formData.append("audio_temp_path", tempPath);
        setUploadPercent(100);
      }
      if (data.pdf instanceof File && data.pdf.size >= 5000000) {
        setUploadModalOpen(true);
        const tempPath = await uploadFileInChunks(data.pdf, setUploadPercent);
        formData.append("pdf_temp_path", tempPath);
        setUploadPercent(100);
      }
    } catch (error) {
      setUploadModalOpen(false);
      return message.error("Large file chunk upload failed. Please try again.");
    }

    if (largeFileForProgress && uploadModalOpen) {
      setUploadPercent(100); // chunking done, keep modal up
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader(
      "X-CSRF-TOKEN",
      document.querySelector('meta[name="csrf-token"]')?.content || ""
    );
    xhr.setRequestHeader("X-Inertia", "true");
    xhr.setRequestHeader(
      "X-Inertia-Version",
      document.head.querySelector('[name="inertia-version"]')?.content || ""
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && !largeFileForProgress) {
        setUploadPercent(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 400) {
        if (largeFileForProgress) {
          setUploadDone(true);
        } else {
          setUploadModalOpen(false);
          message.success("Entry created successfully!");
          window.location.href = route("admin.entries.index");
        }
      } else if (xhr.status === 409) {
        window.location.href = route("admin.entries.index");
      } else {
        setUploadModalOpen(false);
        try {
          const res = JSON.parse(xhr.responseText);
          message.error(res?.message || res?.error || "Upload failed.");
        } catch {
          message.error("Upload failed. Please try again.");
        }
      }
    };

    xhr.onerror = () => {
      setUploadModalOpen(false);
      message.error("Network error during upload. Please try again.");
    };

    xhr.send(formData);
  };

  const handleUploadModalClose = () => {
    setUploadModalOpen(false);
    setUploadDone(false);
    router.visit(route("admin.entries.index"));
  };

  return (
    <Authenticated user={auth.user} header="Create Contest Entry">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back button */}
          <Link href={route("admin.entries.index")}>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              className="mb-6"
            >
              Back to Entries
            </Button>
          </Link>

          <div className="mb-6">
            <Title level={3}>Create New Entry</Title>
            <Text type="secondary">
              Add a new entry to a contest
            </Text>
          </div>

          <Row gutter={[24, 24]}>
            {/* ── Main Column ── */}
            <Col xs={24} lg={16}>
              {/* Basic Info */}
              <Card
                title="Entry Information"
                className="shadow-sm mb-6 rounded-lg"
              >
                <Space
                  direction="vertical"
                  className="w-full"
                  size="large"
                >
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Entry Title{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>
                    <Input
                      size="large"
                      placeholder="Enter entry title"
                      value={data.title}
                      onChange={(e) =>
                        setData("title", e.target.value)
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

                  {/* User */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      User{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>
                    <Select
                      size="large"
                      className="w-full"
                      placeholder="Select User"
                      value={data.user_id || undefined}
                      onChange={(value) =>
                        setData("user_id", value)
                      }
                      suffixIcon={<TeamOutlined />}
                      showSearch
                      optionFilterProp="children"
                      status={
                        errors.user_id ? "error" : ""
                      }
                    >
                      {users?.map((user) => (
                        <Option
                          key={user.id}
                          value={user.id}
                        >
                          {user.name} ({user.email})
                        </Option>
                      ))}
                    </Select>
                    {errors.user_id && (
                      <Text
                        type="danger"
                        className="text-xs"
                      >
                        {errors.user_id}
                      </Text>
                    )}
                  </div>

                  {/* Contest */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contest{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>
                    <Select
                      size="large"
                      className="w-full"
                      placeholder="Select Contest"
                      value={data.contest_id || undefined}
                      onChange={(value) => {
                        setData("contest_id", value);
                        const contest = contests?.find(
                          (c) => c.id === value,
                        );
                        setSelectedContest(
                          contest || null,
                        );
                      }}
                      suffixIcon={<TeamOutlined />}
                      showSearch
                      optionFilterProp="children"
                      status={
                        errors.contest_id ? "error" : ""
                      }
                    >
                      {contests?.map((contest) => (
                        <Option
                          key={contest.id}
                          value={contest.id}
                        >
                          {contest.title}
                        </Option>
                      ))}
                    </Select>
                    {errors.contest_id && (
                      <Text
                        type="danger"
                        className="text-xs"
                      >
                        {errors.contest_id}
                      </Text>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      size="large"
                      className="w-full"
                      value={data.status}
                      onChange={(value) =>
                        setData("status", value)
                      }
                    >
                      {statusOptions.map((opt) => (
                        <Option
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Space>
              </Card>

              {/* Media / Content Card */}
              <Card className="shadow-sm rounded-lg">
                {!selectedContest ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileTextOutlined
                      style={{ fontSize: "32px" }}
                      className="mb-2 block"
                    />
                    <Text type="secondary">
                      Select a contest to see media
                      options.
                    </Text>
                  </div>
                ) : isGoogleForm ? (
                  <div className="text-center py-8">
                    <LinkOutlined
                      style={{
                        fontSize: "48px",
                        color: "#1890ff",
                      }}
                      className="mb-4 block"
                    />
                    <Title level={4}>
                      Google Form Contest
                    </Title>
                    <Text
                      type="secondary"
                      className="block mb-6"
                    >
                      This contest uses a Google Form for
                      submissions.
                    </Text>
                    {selectedContest.form_url ? (
                      <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-lg mx-auto">
                        <LinkOutlined className="text-blue-500 shrink-0" />
                        <a
                          href={
                            selectedContest.form_url.startsWith(
                              "http",
                            )
                              ? selectedContest.form_url
                              : `https://${selectedContest.form_url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline font-medium break-all"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          Click here to open the
                          submission form →
                        </a>
                      </div>
                    ) : (
                      <Text
                        type="secondary"
                        className="italic"
                      >
                        No form URL configured for this
                        contest.
                      </Text>
                    )}
                  </div>
                ) : mediaItems.length > 0 ? (
                  // ✅ EXACT same dropdown design on mobile
                  <ResponsiveMediaSwitch
                    activeKey={mediaType}
                    onChange={(key) => setMediaType(key)}
                    items={mediaItems}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileTextOutlined
                      style={{ fontSize: "32px" }}
                      className="mb-2 block"
                    />
                    <Text type="secondary">
                      No media formats configured for this
                      contest.
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
                    Create Entry
                  </Button>
                  <Link
                    href={route("admin.entries.index")}
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
        </div>

        <UploadProgressModal
          open={uploadModalOpen}
          percent={uploadPercent}
          done={uploadDone}
          fileName={uploadFileName}
          onClose={handleUploadModalClose}
        />

      </div>
    </Authenticated>
  );
}