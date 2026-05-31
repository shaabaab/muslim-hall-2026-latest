import { useForm, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
    Alert,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    EditOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, exhibition, langs = [], boards = [], member }) {
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

        return `/storage/${path}`;
    };

    const buildGalleryPreviews = () => {
        if (Array.isArray(exhibition?.gallery_urls) && exhibition.gallery_urls.length > 0) {
            return exhibition.gallery_urls.map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return item?.url || item?.path || null;
            }).filter(Boolean);
        }

        if (Array.isArray(exhibition?.gallery) && exhibition.gallery.length > 0) {
            return exhibition.gallery.map((item) => {
                if (!item) {
                    return null;
                }

                if (typeof item === "string" && item.startsWith("http")) {
                    return item;
                }

                return `/storage/${item}`;
            }).filter(Boolean);
        }

        return [];
    };

    const [mainImagePreview, setMainImagePreview] = useState(
        getFileUrl(exhibition?.image_url, exhibition?.image)
    );

    const [sponsorImagePreview, setSponsorImagePreview] = useState(
        getFileUrl(exhibition?.sponsor_image_url, exhibition?.sponsor_image)
    );

    const [galleryPreviews, setGalleryPreviews] = useState(buildGalleryPreviews());

    const [documentPreview, setDocumentPreview] = useState(
        exhibition?.document_file
            ? {
                  name: exhibition.document_file.split("/").pop(),
                  url: getFileUrl(exhibition?.document_file_url, exhibition?.document_file),
                  isOld: true,
              }
            : null
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        _method: "put",
        exhibition_board_id: exhibition?.exhibition_board_id || "",
        title: exhibition?.title || "",
        description: exhibition?.description || "",
        type: exhibition?.type || "product",
        image: null,
        sponsor_image: null,
        gallery: [],
        document_file: null,
        price: exhibition?.price || null,
        currency: exhibition?.currency || "USD",
        is_available: exhibition?.is_available ?? true,
        is_featured: exhibition?.is_featured ?? false,
        dimensions: exhibition?.dimensions || "",
        material: exhibition?.material || "",
        status: exhibition?.status || "draft",
        lang_id: exhibition?.lang_id || "",
        link: exhibition?.link || "",
    });

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

    const currencyOptions = [
        { value: "BDT", label: "BDT (৳)" },
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (€)" },
        { value: "GBP", label: "GBP (£)" },
        { value: "SAR", label: "SAR (﷼)" },
        { value: "AED", label: "AED (د.إ)" },
    ];

    const submit = () => {
        post(route("user.exhibitions.update", exhibition.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success("Exhibition item updated successfully. Waiting for admin approval again.");
            },
            onError: () => {
                message.error("Please check form errors.");
            },
        });
    };

    const resetForm = () => {
        reset();

        setMainImagePreview(getFileUrl(exhibition?.image_url, exhibition?.image));
        setSponsorImagePreview(getFileUrl(exhibition?.sponsor_image_url, exhibition?.sponsor_image));
        setGalleryPreviews(buildGalleryPreviews());

        setDocumentPreview(
            exhibition?.document_file
                ? {
                      name: exhibition.document_file.split("/").pop(),
                      url: getFileUrl(exhibition?.document_file_url, exhibition?.document_file),
                      isOld: true,
                  }
                : null
        );
    };

    const handleMainImageUpload = (file) => {
        setData("image", file);
        setMainImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleSponsorImageUpload = (file) => {
        setData("sponsor_image", file);
        setSponsorImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];
        setData("gallery", newGallery);

        const newPreviews = [
            ...galleryPreviews,
            URL.createObjectURL(file),
        ];

        setGalleryPreviews(newPreviews);

        return false;
    };

    const handleGalleryRemove = (index) => {
        const oldGalleryPreviewCount = buildGalleryPreviews().length;

        if (index < oldGalleryPreviewCount && data.gallery.length === 0) {
            message.warning("Old gallery image remove needs backend remove_gallery support. Upload new gallery to replace old gallery.");
            return;
        }

        const newPreviews = galleryPreviews.filter((_, i) => i !== index);

        const newGalleryStartIndex = Math.max(0, index - oldGalleryPreviewCount);
        const newGallery = data.gallery.filter((_, i) => i !== newGalleryStartIndex);

        setGalleryPreviews(newPreviews);
        setData("gallery", newGallery);
    };

    const handleDocumentUpload = (file) => {
        setData("document_file", file);
        setDocumentPreview({
            name: file.name,
            url: null,
            file,
            isOld: false,
        });
        return false;
    };

    const handleDocumentRemove = () => {
        setData("document_file", null);

        if (exhibition?.document_file) {
            setDocumentPreview({
                name: exhibition.document_file.split("/").pop(),
                url: getFileUrl(exhibition?.document_file_url, exhibition?.document_file),
                isOld: true,
            });
        } else {
            setDocumentPreview(null);
        }
    };

    return (
        <Authenticated user={auth.user} header="Edit Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibitions.index")}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Exhibitions
                        </Button>
                    </Link>

                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Edit Exhibition Item
                    </Title>

                    <Text type="secondary">
                        Update your exhibition item. After update it will wait for admin approval again.
                    </Text>
                </div>

                {boards.length === 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        className="mb-6"
                        message="No approved board found"
                        description="You need an approved board or approved access to another user's board before updating an exhibition."
                    />
                )}

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Exhibition Board"
                                validateStatus={errors.exhibition_board_id ? "error" : ""}
                                help={errors.exhibition_board_id}
                                required
                            >
                                <Select
                                    size="large"
                                    placeholder="Select approved board"
                                    value={data.exhibition_board_id || undefined}
                                    onChange={(value) => setData("exhibition_board_id", value)}
                                >
                                    {boards.map((board) => (
                                        <Option key={board.id} value={board.id}>
                                            {board.title}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

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
                                    onChange={(value) => setData("type", value)}
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
                                    onChange={(value) => setData("title", value)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write title. You can use bold, font size, color..."
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Description with Embedded Link"
                                validateStatus={errors.description ? "error" : ""}
                                help={errors.description}
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.description}
                                    onChange={(value) => setData("description", value)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Write description. Select text and click link icon to embed a link."
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Main Image"
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />}>Change Main Image</Button>
                                </Upload>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={mainImagePreview}
                                            alt="Main Preview"
                                            style={{
                                                width: 220,
                                                height: 140,
                                                objectFit: "cover",
                                                borderRadius: 8,
                                                border: "1px solid #ddd",
                                            }}
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Sponsor Image"
                                validateStatus={errors.sponsor_image ? "error" : ""}
                                help={errors.sponsor_image}
                            >
                                <Upload
                                    beforeUpload={handleSponsorImageUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />}>Change Sponsor Image</Button>
                                </Upload>

                                {sponsorImagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={sponsorImagePreview}
                                            alt="Sponsor Preview"
                                            style={{
                                                width: 220,
                                                height: 80,
                                                objectFit: "contain",
                                                borderRadius: 8,
                                                border: "1px solid #ddd",
                                                background: "#fff",
                                            }}
                                        />
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
                                    showUploadList={false}
                                    accept="image/*"
                                    multiple
                                >
                                    <Button icon={<UploadOutlined />}>Add Gallery Image</Button>
                                </Upload>

                                <div className="mt-2">
                                    <Text type="secondary">
                                        New gallery upload will replace old gallery in backend when submitted.
                                    </Text>
                                </div>

                                {galleryPreviews.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            marginTop: 16,
                                        }}
                                    >
                                        {galleryPreviews.map((preview, index) => (
                                            <div key={index} style={{ position: "relative" }}>
                                                <img
                                                    src={preview}
                                                    alt={`Gallery ${index + 1}`}
                                                    style={{
                                                        width: 120,
                                                        height: 90,
                                                        objectFit: "cover",
                                                        borderRadius: 8,
                                                        border: "1px solid #ddd",
                                                    }}
                                                />

                                                <Button
                                                    size="small"
                                                    danger
                                                    onClick={() => handleGalleryRemove(index)}
                                                    style={{
                                                        position: "absolute",
                                                        top: -8,
                                                        right: -8,
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Document File"
                                validateStatus={errors.document_file ? "error" : ""}
                                help={errors.document_file}
                            >
                                <Upload
                                    beforeUpload={handleDocumentUpload}
                                    showUploadList={false}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                >
                                    <Button icon={<UploadOutlined />}>Change Document</Button>
                                </Upload>

                                {documentPreview && (
                                    <div className="mt-3">
                                        <Space>
                                            <FileTextOutlined />

                                            {documentPreview.url ? (
                                                <a
                                                    href={documentPreview.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {documentPreview.name}
                                                </a>
                                            ) : (
                                                <Text>{documentPreview.name}</Text>
                                            )}

                                            {!documentPreview.isOld && (
                                                <Button size="small" danger onClick={handleDocumentRemove}>
                                                    Remove
                                                </Button>
                                            )}
                                        </Space>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Price"
                                validateStatus={errors.price ? "error" : ""}
                                help={errors.price}
                            >
                                <InputNumber
                                    size="large"
                                    min={0}
                                    style={{ width: "100%" }}
                                    value={data.price}
                                    onChange={(value) => setData("price", value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Currency"
                                validateStatus={errors.currency ? "error" : ""}
                                help={errors.currency}
                            >
                                <Select
                                    size="large"
                                    value={data.currency}
                                    onChange={(value) => setData("currency", value)}
                                >
                                    {currencyOptions.map((currency) => (
                                        <Option key={currency.value} value={currency.value}>
                                            {currency.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Dimensions"
                                validateStatus={errors.dimensions ? "error" : ""}
                                help={errors.dimensions}
                            >
                                <Input
                                    size="large"
                                    value={data.dimensions}
                                    onChange={(e) => setData("dimensions", e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Material"
                                validateStatus={errors.material ? "error" : ""}
                                help={errors.material}
                            >
                                <Input
                                    size="large"
                                    value={data.material}
                                    onChange={(e) => setData("material", e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="External Link"
                                validateStatus={errors.link ? "error" : ""}
                                help={errors.link}
                            >
                                <Input
                                    size="large"
                                    placeholder="https://example.com"
                                    value={data.link}
                                    onChange={(e) => setData("link", e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Language"
                                validateStatus={errors.lang_id ? "error" : ""}
                                help={errors.lang_id}
                            >
                                <Select
                                    size="large"
                                    allowClear
                                    placeholder="Select language"
                                    value={data.lang_id || undefined}
                                    onChange={(value) => setData("lang_id", value || "")}
                                >
                                    {langs.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Available">
                                <Switch
                                    checked={data.is_available}
                                    onChange={(checked) => setData("is_available", checked)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Featured">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) => setData("is_featured", checked)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Status">
                                <Select
                                    value={data.status}
                                    onChange={(value) => setData("status", value)}
                                >
                                    <Option value="draft">Draft</Option>
                                    <Option value="published">Published</Option>
                                    <Option value="sold">Sold</Option>
                                    <Option value="archived">Archived</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={resetForm}>
                            Reset
                        </Button>

                        <Link href={route("user.exhibitions.index")}>
                            <Button>Cancel</Button>
                        </Link>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            icon={<SaveOutlined />}
                            disabled={boards.length === 0}
                        >
                            Update for Approval
                        </Button>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}