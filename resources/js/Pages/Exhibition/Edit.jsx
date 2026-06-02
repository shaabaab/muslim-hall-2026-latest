import { useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Form,
    Input,
    Button,
    Card,
    Select,
    Typography,
    Space,
    message,
    Upload,
    Switch,
    Row,
    Col,
    InputNumber,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    EditOutlined,
    PlusOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, exhibition, langs }) {
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [newGalleryPreviews, setNewGalleryPreviews] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [existingGallery, setExistingGallery] = useState([]);

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ size: ["small", false, "large", "huge"] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link"],
            ["clean"],
        ],
    };

    const quillFormats = [
        "header",
        "size",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "list",
        "bullet",
        "align",
        "link",
    ];

    const getFileUrl = (url, path) => {
        if (url) {
            return url;
        }

        if (!path) {
            return null;
        }

        if (typeof path === "string" && path.startsWith("http")) {
            return path;
        }

        if (typeof path === "string" && path.startsWith("/storage/")) {
            return path;
        }

        if (typeof path === "string" && path.startsWith("storage/")) {
            return `/${path}`;
        }

        return `/storage/${path}`;
    };

    const { data, setData, post, processing, errors } = useForm({
        title: exhibition.title || "",
        description: exhibition.description || "",
        type: exhibition.type || "product",
        image: null,
        gallery: [],
        document_file: null,
        price: exhibition.price || null,
        currency: exhibition.currency || "USD",
        is_available: exhibition.is_available ?? true,
        is_featured: exhibition.is_featured ?? false,
        dimensions: exhibition.dimensions || "",
        material: exhibition.material || "",
        status: exhibition.status || "draft",
        lang_id: exhibition.lang_id || "",
        link: exhibition.link || "",
        remove_gallery_images: [],
        remove_document: false,
        _method: "PUT",
    });

    useEffect(() => {
        if (exhibition.image_url) {
            setMainImagePreview(exhibition.image_url);
        } else if (exhibition.image) {
            setMainImagePreview(getFileUrl(null, exhibition.image));
        }

        if (exhibition.gallery_urls && exhibition.gallery_urls.length > 0) {
            const galleryUrls = exhibition.gallery_urls.map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return item?.url || getFileUrl(null, item?.path);
            });

            setExistingGallery(galleryUrls.filter(Boolean));
        } else if (exhibition.gallery && exhibition.gallery.length > 0) {
            const galleryUrls = exhibition.gallery.map((img) =>
                getFileUrl(null, img)
            );

            setExistingGallery(galleryUrls);
        }

        if (exhibition.document_file_url) {
            setDocumentPreview({
                name: exhibition.document_file
                    ? exhibition.document_file.split("/").pop()
                    : "Document",
                url: exhibition.document_file_url,
                isOld: true,
            });
        } else if (exhibition.document_file) {
            setDocumentPreview({
                name: exhibition.document_file.split("/").pop(),
                url: getFileUrl(null, exhibition.document_file),
                isOld: true,
            });
        }
    }, [exhibition]);

    const submit = () => {
        const formData = new FormData();

        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === "gallery" && Array.isArray(data[key])) {
                    data[key].forEach((file, index) => {
                        formData.append(`gallery[${index}]`, file);
                    });
                } else if (
                    key === "remove_gallery_images" &&
                    Array.isArray(data[key])
                ) {
                    data[key].forEach((imagePath, index) => {
                        formData.append(
                            `remove_gallery_images[${index}]`,
                            imagePath
                        );
                    });
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        post(route("admin.exhibitions.update", exhibition.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success("Exhibition item updated successfully");
            },
            onError: (errors) => {
                console.error("Update errors:", errors);
                message.error("Error updating exhibition item");
            },
        });
    };

    const handleMainImageUpload = (file) => {
        setData("image", file);
        setMainImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleMainImageRemove = () => {
        setData("image", null);

        if (exhibition.image) {
            setMainImagePreview(
                exhibition.image_url || getFileUrl(null, exhibition.image)
            );
        } else {
            setMainImagePreview(null);
        }
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];

        setData("gallery", newGallery);
        setNewGalleryPreviews([
            ...newGalleryPreviews,
            URL.createObjectURL(file),
        ]);

        return false;
    };

    const handleNewGalleryRemove = (index) => {
        const newGallery = data.gallery.filter((_, i) => i !== index);
        const newPreviews = newGalleryPreviews.filter((_, i) => i !== index);

        setData("gallery", newGallery);
        setNewGalleryPreviews(newPreviews);
    };

    const handleExistingGalleryRemove = (index) => {
        const updatedExisting = [...existingGallery];
        updatedExisting.splice(index, 1);
        setExistingGallery(updatedExisting);

        const imageToRemove = exhibition.gallery?.[index];

        if (imageToRemove) {
            const removedImages = [
                ...(data.remove_gallery_images || []),
                imageToRemove,
            ];

            setData("remove_gallery_images", removedImages);
        }
    };

    const handleDocumentUpload = (file) => {
        setData("document_file", file);
        setData("remove_document", false);
        setDocumentPreview({
            name: file.name,
            file,
            isOld: false,
        });

        return false;
    };

    const handleDocumentRemove = () => {
        setData("document_file", null);
        setData("remove_document", true);
        setDocumentPreview(null);
    };

    const currencyOptions = [
        { value: "BDT", label: "BDT (৳)" },
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (€)" },
        { value: "GBP", label: "GBP (£)" },
        { value: "SAR", label: "SAR (﷼)" },
        { value: "AED", label: "AED (د.إ)" },
    ];

    return (
        <Authenticated user={auth.user} header="Edit Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.exhibitions.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Exhibitions
                        </Button>
                    </Link>

                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Edit Exhibition Item
                    </Title>

                    <Text type="secondary">
                        Update product, document, art, photography, or craft
                        details
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Item Type"
                                validateStatus={errors.type ? "error" : ""}
                                help={errors.type}
                                required
                            >
                                <Select
                                    size="large"
                                    value={data.type}
                                    onChange={(value) =>
                                        setData("type", value)
                                    }
                                >
                                    <Option value="product">
                                        <Space>
                                            <ShoppingOutlined />
                                            Product
                                        </Space>
                                    </Option>

                                    <Option value="document">
                                        <Space>
                                            <FileTextOutlined />
                                            Document
                                        </Space>
                                    </Option>

                                    <Option value="art">
                                        <Space>
                                            <PictureOutlined />
                                            Art
                                        </Space>
                                    </Option>

                                    <Option value="photography">
                                        <Space>
                                            <PictureOutlined />
                                            Photography
                                        </Space>
                                    </Option>

                                    <Option value="craft">
                                        <Space>
                                            <EditOutlined />
                                            Craft
                                        </Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Title Text Editor"
                                validateStatus={errors.title ? "error" : ""}
                                help={errors.title}
                                required
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.title}
                                    onChange={(value) =>
                                        setData("title", value)
                                    }
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write title. You can use bold, font size, color..."
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Description Text Editor"
                                validateStatus={errors.description ? "error" : ""}
                                help={errors.description}
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.description}
                                    onChange={(value) => setData("description", value)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write description. You can use bold, font size, color, list, alignment and link..."
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Select Language"
                                validateStatus={errors.lang_id ? "error" : ""}
                                help={errors.lang_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) =>
                                        setData("lang_id", value)
                                    }
                                    suffixIcon={<FileTextOutlined />}
                                >
                                    {langs.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Main Image"
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                                extra={
                                    mainImagePreview &&
                                    "New image will replace the existing one"
                                }
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        {mainImagePreview
                                            ? "Change Main Image"
                                            : "Select Main Image"}
                                    </Button>
                                </Upload>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            {data.image
                                                ? "New Image Preview:"
                                                : "Current Image:"}
                                        </Text>

                                        <div className="relative inline-block">
                                            <img
                                                src={mainImagePreview}
                                                alt="Main preview"
                                                style={{
                                                    maxWidth: "300px",
                                                    maxHeight: "200px",
                                                    borderRadius: "8px",
                                                    objectFit: "cover",
                                                }}
                                                className="border border-dashed border-gray-300"
                                                onError={(e) => {
                                                    console.error(
                                                        "Failed to load image:",
                                                        mainImagePreview
                                                    );
                                                    e.target.style.display =
                                                        "none";
                                                }}
                                            />

                                            {data.image && (
                                                <Button
                                                    type="link"
                                                    danger
                                                    size="small"
                                                    onClick={
                                                        handleMainImageRemove
                                                    }
                                                    style={{
                                                        position: "absolute",
                                                        top: -8,
                                                        right: -8,
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Gallery Images"
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
                                        Add More Images
                                    </Button>
                                </Upload>

                                {existingGallery.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Current Gallery Images:
                                        </Text>

                                        <div className="flex flex-wrap gap-4">
                                            {existingGallery.map(
                                                (imageUrl, index) => (
                                                    <div
                                                        key={`existing-${index}`}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Gallery ${index + 1
                                                                }`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                borderRadius:
                                                                    "8px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            className="border border-dashed border-gray-300"
                                                            onError={(e) => {
                                                                console.error(
                                                                    "Failed to load gallery image:",
                                                                    imageUrl
                                                                );
                                                                e.target.style.display =
                                                                    "none";
                                                            }}
                                                        />

                                                        <Button
                                                            type="link"
                                                            danger
                                                            size="small"
                                                            onClick={() =>
                                                                handleExistingGalleryRemove(
                                                                    index
                                                                )
                                                            }
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                top: -8,
                                                                right: -8,
                                                            }}
                                                        >
                                                            <DeleteOutlined />
                                                        </Button>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <Text
                                            type="secondary"
                                            className="block mt-2"
                                        >
                                            {existingGallery.length} existing
                                            image(s)
                                        </Text>
                                    </div>
                                )}

                                {newGalleryPreviews.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            New Gallery Images:
                                        </Text>

                                        <div className="flex flex-wrap gap-4">
                                            {newGalleryPreviews.map(
                                                (preview, index) => (
                                                    <div
                                                        key={`new-${index}`}
                                                        className="relative"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`New Gallery ${index + 1
                                                                }`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                borderRadius:
                                                                    "8px",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            className="border border-dashed border-blue-300"
                                                        />

                                                        <Button
                                                            type="link"
                                                            danger
                                                            size="small"
                                                            onClick={() =>
                                                                handleNewGalleryRemove(
                                                                    index
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
                                                )
                                            )}
                                        </div>

                                        <Text
                                            type="secondary"
                                            className="block mt-2"
                                        >
                                            {newGalleryPreviews.length} new
                                            image(s) added
                                        </Text>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Price"
                                validateStatus={errors.price ? "error" : ""}
                                help={errors.price}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    placeholder="0.00"
                                    value={data.price}
                                    onChange={(value) =>
                                        setData("price", value)
                                    }
                                    min={0}
                                    step={0.01}
                                    formatter={(value) =>
                                        `$ ${value}`.replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ","
                                        )
                                    }
                                    parser={(value) =>
                                        value.replace(/\$\s?|(,*)/g, "")
                                    }
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Currency"
                                validateStatus={
                                    errors.currency ? "error" : ""
                                }
                                help={errors.currency}
                                required
                            >
                                <Select
                                    value={data.currency}
                                    onChange={(value) =>
                                        setData("currency", value)
                                    }
                                >
                                    {currencyOptions.map((currency) => (
                                        <Option
                                            key={currency.value}
                                            value={currency.value}
                                        >
                                            {currency.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Link (Url)"
                                validateStatus={errors.link ? "error" : ""}
                                help={errors.link}
                            >
                                <Input
                                    placeholder="https://example.com"
                                    value={data.link}
                                    onChange={(e) =>
                                        setData("link", e.target.value)
                                    }
                                    size="large"
                                />
                            </Form.Item>
                        </Col>

                        {(data.type === "art" || data.type === "product") && (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Dimensions"
                                        validateStatus={
                                            errors.dimensions ? "error" : ""
                                        }
                                        help={errors.dimensions}
                                    >
                                        <Input
                                            placeholder="e.g., 24x36 inches, 50x70 cm"
                                            value={data.dimensions}
                                            onChange={(e) =>
                                                setData(
                                                    "dimensions",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label="Material"
                                        validateStatus={
                                            errors.material ? "error" : ""
                                        }
                                        help={errors.material}
                                    >
                                        <Input
                                            placeholder="e.g., Oil on canvas, Wood, Metal"
                                            value={data.material}
                                            onChange={(e) =>
                                                setData(
                                                    "material",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24}>
                            <Form.Item label="Document File">
                                <Upload
                                    beforeUpload={handleDocumentUpload}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        {documentPreview
                                            ? "Change Document"
                                            : "Select Document"}
                                    </Button>
                                </Upload>

                                {documentPreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">
                                            Document:
                                        </Text>

                                        <div className="p-3 border rounded bg-gray-50 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <FileTextOutlined className="text-2xl text-blue-500 mr-2" />

                                                {documentPreview.url ? (
                                                    <a
                                                        href={
                                                            documentPreview.url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {documentPreview.name}
                                                    </a>
                                                ) : (
                                                    <Text>
                                                        {documentPreview.name}
                                                    </Text>
                                                )}
                                            </div>

                                            <Button
                                                type="link"
                                                danger
                                                size="small"
                                                onClick={handleDocumentRemove}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Available for Sale">
                                <Switch
                                    checked={data.is_available}
                                    onChange={(checked) =>
                                        setData("is_available", checked)
                                    }
                                />

                                <Text className="ml-2">
                                    {data.is_available
                                        ? "Available"
                                        : "Not Available"}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Featured Item">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) =>
                                        setData("is_featured", checked)
                                    }
                                />

                                <Text className="ml-2">
                                    {data.is_featured
                                        ? "Featured"
                                        : "Regular"}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? "error" : ""}
                                help={errors.status}
                                required
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) =>
                                        setData("status", value)
                                    }
                                >
                                    <Option value="draft">Draft</Option>
                                    <Option value="published">Published</Option>
                                    <Option value="sold">Sold</Option>
                                    <Option value="archived">Archived</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mt-8">
                        <Space size="middle">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: "160px" }}
                            >
                                Update Exhibition Item
                            </Button>

                            <Link href={route("admin.exhibitions.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}