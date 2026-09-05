import { useForm, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { useMemo, useState } from "react";
import ReactQuill from "react-quill";
import CharacterCount from "@/Components/CharacterCount";
import {
    plainTextLength,
    EXHIBITION_TITLE_MAX,
} from "@/Utils/richText";
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
    Divider,
    Tag,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    EditOutlined,
    TeamOutlined,
    VideoCameraOutlined,
    AudioOutlined,
} from "@ant-design/icons";
import { buildS3UrlAlways } from "@/Utils/s3Helpers";

const { Title, Text } = Typography;
const { Option } = Select;
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif,image/*";
const VIDEO_ACCEPT = ".mp4,.mov,.avi,.mkv,.webm,.m4v,video/*";
const AUDIO_ACCEPT = ".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*";
const DOC_ACCEPT =
    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.rar,application/pdf";

export default function Edit({ auth, exhibition, langs = [], boards = [] }) {
    // Media is on S3; resolve the key rather than using /storage/.
    const fileUrl = (url, path) =>
        url || (path ? buildS3UrlAlways(path) : null);
    const oldGallery = Array.isArray(exhibition?.gallery_urls)
        ? exhibition.gallery_urls
              .map((x) => x?.url || x?.path || x)
              .filter(Boolean)
        : [];
    const [mainImagePreview, setMainImagePreview] = useState(
        fileUrl(exhibition?.image_url, exhibition?.image),
    );
    const [sponsorImagePreview, setSponsorImagePreview] = useState(
        fileUrl(exhibition?.sponsor_image_url, exhibition?.sponsor_image),
    );
    const [galleryPreviews, setGalleryPreviews] = useState(oldGallery);
    const [documentPreview, setDocumentPreview] = useState(
        exhibition?.document_file
            ? {
                  name: exhibition.document_file.split("/").pop(),
                  url: fileUrl(
                      exhibition?.document_file_url || exhibition?.document_url,
                      exhibition?.document_file,
                  ),
                  isOld: true,
              }
            : null,
    );
    const [videoNames, setVideoNames] = useState([]);
    const [audioNames, setAudioNames] = useState([]);
    const [pdfNames, setPdfNames] = useState([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        _method: "put",
        exhibition_board_id: exhibition?.exhibition_board_id || "",
        board_request_message: "",
        title: exhibition?.title || "",
        description: exhibition?.description || "",
        type: exhibition?.type || "product",
        image: null,
        sponsor_image: null,
        gallery: [],
        document_file: null,
        videos: [],
        audios: [],
        pdfs: [],
        price: exhibition?.price || null,
        currency: exhibition?.currency || "USD",
        is_available: exhibition?.is_available ?? true,
        dimensions: exhibition?.dimensions || "",
        material: exhibition?.material || "",
        lang_id: exhibition?.lang_id || "",
        link: exhibition?.link || "",
    });

    const selectedBoard = useMemo(
        () =>
            boards.find(
                (board) =>
                    String(board.id) === String(data.exhibition_board_id),
            ),
        [boards, data.exhibition_board_id],
    );
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

    const submit = () => {
        post(route("user.exhibitions.update", exhibition.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () =>
                message.success("Exhibition updated for approval."),
            // `submission` is the server's catch-all when the save itself failed
            // rather than a single field; without it the user only saw the form
            // sit there doing nothing.
            onError: (errors) =>
                message.error(errors.submission || "Please check form errors."),
        });
    };

    const setFile = (field, file, previewSetter = null) => {
        setData(field, file);
        if (previewSetter && file) previewSetter(URL.createObjectURL(file));
        return false;
    };

    const addMultiFile = (field, file, namesSetter, previewSetter = null) => {
        const newFiles = [...(data[field] || []), file];
        setData(field, newFiles);
        namesSetter(newFiles.map((item) => item.name));
        if (previewSetter)
            previewSetter((prev) => [...prev, URL.createObjectURL(file)]);
        return false;
    };

    const removeMultiFile = (
        field,
        index,
        namesSetter,
        previewSetter = null,
    ) => {
        const newFiles = (data[field] || []).filter((_, i) => i !== index);
        setData(field, newFiles);
        namesSetter(newFiles.map((item) => item.name));
        if (previewSetter)
            previewSetter((prev) => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        reset();
        setMainImagePreview(fileUrl(exhibition?.image_url, exhibition?.image));
        setSponsorImagePreview(
            fileUrl(exhibition?.sponsor_image_url, exhibition?.sponsor_image),
        );
        setGalleryPreviews(oldGallery);
        setDocumentPreview(
            exhibition?.document_file
                ? {
                      name: exhibition.document_file.split("/").pop(),
                      url: fileUrl(
                          exhibition?.document_file_url ||
                              exhibition?.document_url,
                          exhibition?.document_file,
                      ),
                      isOld: true,
                  }
                : null,
        );
        setVideoNames([]);
        setAudioNames([]);
        setPdfNames([]);
    };

    const permissionNotice =
        selectedBoard && !selectedBoard.is_owner && !selectedBoard.can_post_now;

    return (
        <Authenticated user={auth.user} header="Edit Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibitions.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Exhibitions
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" /> Edit Exhibition Item
                    </Title>
                    <Text type="secondary">
                        After edit, this item returns to pending approval. User
                        status remains Draft/Pending until admin publishes.
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-5xl">
                    <Card
                        size="small"
                        className="mb-6"
                        title={
                            <Space>
                                <TeamOutlined /> Board Selection
                            </Space>
                        }
                    >
                        <Form.Item
                            label="Exhibition Board"
                            required
                            validateStatus={
                                errors.exhibition_board_id ? "error" : ""
                            }
                            help={errors.exhibition_board_id}
                        >
                            <Select
                                size="large"
                                showSearch
                                optionFilterProp="children"
                                value={data.exhibition_board_id || undefined}
                                onChange={(value) =>
                                    setData("exhibition_board_id", value)
                                }
                            >
                                {boards.map((board) => (
                                    <Option key={board.id} value={board.id}>
                                        {board.title}{" "}
                                        {board.is_owner
                                            ? "(My Board)"
                                            : "(Other Member Board)"}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {selectedBoard && (
                            <Space wrap className="mb-3">
                                <Tag
                                    color={
                                        selectedBoard.is_owner
                                            ? "green"
                                            : "orange"
                                    }
                                >
                                    {selectedBoard.is_owner
                                        ? "My Board"
                                        : "Other Member"}
                                </Tag>
                                <Tag>{selectedBoard.permission_text}</Tag>
                            </Space>
                        )}
                        {permissionNotice && (
                            <Form.Item
                                label="Message for Board Owner/Admin"
                                validateStatus={
                                    errors.board_request_message ? "error" : ""
                                }
                                help={errors.board_request_message}
                            >
                                <Input.TextArea
                                    rows={3}
                                    value={data.board_request_message}
                                    onChange={(e) =>
                                        setData(
                                            "board_request_message",
                                            e.target.value,
                                        )
                                    }
                                />
                            </Form.Item>
                        )}
                        {permissionNotice && (
                            <Alert
                                type="warning"
                                showIcon
                                message="Another member board selected"
                                description="Board owner approval and admin board-access approval are required before exhibition admin can publish."
                            />
                        )}
                    </Card>

                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Item Type"
                                required
                                validateStatus={errors.type ? "error" : ""}
                                help={errors.type}
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
                                required
                                validateStatus={errors.title ? "error" : ""}
                                help={errors.title}
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.title}
                                    onChange={(value) =>
                                        setData("title", value)
                                    }
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                                <CharacterCount
                                    length={plainTextLength(data.title)}
                                    max={EXHIBITION_TITLE_MAX}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label="Description with Embedded Link"
                                validateStatus={
                                    errors.description ? "error" : ""
                                }
                                help={errors.description}
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.description}
                                    onChange={(value) =>
                                        setData("description", value)
                                    }
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Main Image"
                                validateStatus={errors.image ? "error" : ""}
                                help={errors.image}
                            >
                                <Upload
                                    beforeUpload={(file) =>
                                        setFile(
                                            "image",
                                            file,
                                            setMainImagePreview,
                                        )
                                    }
                                    showUploadList={false}
                                    accept={IMAGE_ACCEPT}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Change Main Image
                                    </Button>
                                </Upload>
                                {mainImagePreview && (
                                    <img
                                        src={mainImagePreview}
                                        alt="Main"
                                        style={{
                                            width: 220,
                                            height: 140,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            marginTop: 12,
                                        }}
                                    />
                                )}
                            </Form.Item>
                        </Col>
                        {/* <Col xs={24} md={12}>
                            <Form.Item
                                label="Sponsor Image"
                                validateStatus={
                                    errors.sponsor_image ? "error" : ""
                                }
                                help={errors.sponsor_image}
                            >
                                <Upload
                                    beforeUpload={(file) =>
                                        setFile(
                                            "sponsor_image",
                                            file,
                                            setSponsorImagePreview,
                                        )
                                    }
                                    showUploadList={false}
                                    accept={IMAGE_ACCEPT}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Change Sponsor Image
                                    </Button>
                                </Upload>
                                {sponsorImagePreview && (
                                    <img
                                        src={sponsorImagePreview}
                                        alt="Sponsor"
                                        style={{
                                            width: 220,
                                            height: 90,
                                            objectFit: "contain",
                                            borderRadius: 8,
                                            marginTop: 12,
                                        }}
                                    />
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
                                    beforeUpload={(file) =>
                                        addMultiFile(
                                            "gallery",
                                            file,
                                            () => {},
                                            setGalleryPreviews,
                                        )
                                    }
                                    showUploadList={false}
                                    accept={IMAGE_ACCEPT}
                                    multiple
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Add Gallery Image
                                    </Button>
                                </Upload>
                                <Text type="secondary" className="block mt-2">
                                    Uploading new gallery will replace previous
                                    gallery on submit.
                                </Text>
                                {galleryPreviews.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            marginTop: 16,
                                        }}
                                    >
                                        {galleryPreviews.map((src, i) => (
                                            <img
                                                key={i}
                                                src={src}
                                                alt="Gallery"
                                                style={{
                                                    width: 120,
                                                    height: 90,
                                                    objectFit: "cover",
                                                    borderRadius: 8,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Form.Item>
                        </Col> */}

                        {/* <Col span={24}>
                            <Divider orientation="left">Media Files</Divider>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Document File"
                                validateStatus={
                                    errors.document_file ? "error" : ""
                                }
                                help={errors.document_file}
                            >
                                <Upload
                                    beforeUpload={(file) => {
                                        setData("document_file", file);
                                        setDocumentPreview({
                                            name: file.name,
                                            isOld: false,
                                        });
                                        return false;
                                    }}
                                    showUploadList={false}
                                    accept={DOC_ACCEPT}
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        Change Document
                                    </Button>
                                </Upload>
                                {documentPreview && (
                                    <div className="mt-2">
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
                                    </div>
                                )}
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="PDF Files"
                                validateStatus={errors.pdfs ? "error" : ""}
                                help={errors.pdfs}
                            >
                                <Upload
                                    beforeUpload={(file) =>
                                        addMultiFile("pdfs", file, setPdfNames)
                                    }
                                    showUploadList={false}
                                    accept={DOC_ACCEPT}
                                    multiple
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        Add PDF
                                    </Button>
                                </Upload>
                                {pdfNames.map((name, i) => (
                                    <div key={i} className="mt-1">
                                        <Text>{name}</Text>{" "}
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() =>
                                                removeMultiFile(
                                                    "pdfs",
                                                    i,
                                                    setPdfNames,
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Video Files"
                                validateStatus={errors.videos ? "error" : ""}
                                help={errors.videos}
                            >
                                <Upload
                                    beforeUpload={(file) =>
                                        addMultiFile(
                                            "videos",
                                            file,
                                            setVideoNames,
                                        )
                                    }
                                    showUploadList={false}
                                    accept={VIDEO_ACCEPT}
                                    multiple
                                >
                                    <Button icon={<VideoCameraOutlined />}>
                                        Add Video
                                    </Button>
                                </Upload>
                                {videoNames.map((name, i) => (
                                    <div key={i} className="mt-1">
                                        <Text>{name}</Text>{" "}
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() =>
                                                removeMultiFile(
                                                    "videos",
                                                    i,
                                                    setVideoNames,
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Audio Files"
                                validateStatus={errors.audios ? "error" : ""}
                                help={errors.audios}
                            >
                                <Upload
                                    beforeUpload={(file) =>
                                        addMultiFile(
                                            "audios",
                                            file,
                                            setAudioNames,
                                        )
                                    }
                                    showUploadList={false}
                                    accept={AUDIO_ACCEPT}
                                    multiple
                                >
                                    <Button icon={<AudioOutlined />}>
                                        Add Audio
                                    </Button>
                                </Upload>
                                {audioNames.map((name, i) => (
                                    <div key={i} className="mt-1">
                                        <Text>{name}</Text>{" "}
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() =>
                                                removeMultiFile(
                                                    "audios",
                                                    i,
                                                    setAudioNames,
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </Form.Item>
                        </Col> */}

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
                                    onChange={(value) =>
                                        setData("price", value)
                                    }
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
                                    onChange={(value) =>
                                        setData("currency", value)
                                    }
                                >
                                    {[
                                        "BDT",
                                        "USD",
                                        "EUR",
                                        "GBP",
                                        "SAR",
                                        "AED",
                                    ].map((item) => (
                                        <Option key={item} value={item}>
                                            {item}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Dimensions"
                                validateStatus={
                                    errors.dimensions ? "error" : ""
                                }
                                help={errors.dimensions}
                            >
                                <Input
                                    size="large"
                                    value={data.dimensions}
                                    onChange={(e) =>
                                        setData("dimensions", e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setData("material", e.target.value)
                                    }
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
                                    value={data.link}
                                    onChange={(e) =>
                                        setData("link", e.target.value)
                                    }
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
                                    value={data.lang_id || undefined}
                                    onChange={(value) =>
                                        setData("lang_id", value || "")
                                    }
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
                                    onChange={(checked) =>
                                        setData("is_available", checked)
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Alert
                        type="info"
                        showIcon
                        className="mb-4"
                        message="User status is locked"
                        description="Member exhibition is always Draft/Pending after edit. Admin will publish after required approvals."
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={resetForm}>Reset</Button>
                        <Link href={route("user.exhibitions.index")}>
                            <Button>Cancel</Button>
                        </Link>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            icon={<SaveOutlined />}
                        >
                            Update for Approval
                        </Button>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}
