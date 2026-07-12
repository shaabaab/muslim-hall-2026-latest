import { useForm, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { useMemo, useState } from "react";
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
    Divider,
    Radio,
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
    PlusOutlined,
    TeamOutlined,
    VideoCameraOutlined,
    AudioOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif,image/*";
const VIDEO_ACCEPT = ".mp4,.mov,.avi,.mkv,.webm,.m4v,video/*";
const AUDIO_ACCEPT = ".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/*";
const DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.rar,application/pdf";

export default function Create({ auth, langs = [], boards = [] }) {
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [sponsorImagePreview, setSponsorImagePreview] = useState(null);
    const [boardImagePreview, setBoardImagePreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);
    const [videoNames, setVideoNames] = useState([]);
    const [audioNames, setAudioNames] = useState([]);
    const [pdfNames, setPdfNames] = useState([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        board_mode: "existing",
        exhibition_board_id: "",
        new_board_title: "",
        new_board_description: "",
        new_board_image: null,
        board_request_message: "",
        title: "",
        description: "",
        type: "product",
        image: null,
        sponsor_image: null,
        gallery: [],
        document_file: null,
        videos: [],
        audios: [],
        pdfs: [],
        price: null,
        currency: "USD",
        is_available: true,
        is_featured: false,
        dimensions: "",
        material: "",
        lang_id: "",
        link: "",
    });

    const selectedBoard = useMemo(
        () => boards.find((board) => String(board.id) === String(data.exhibition_board_id)),
        [boards, data.exhibition_board_id]
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
        "header", "size", "bold", "italic", "underline", "strike", "color", "background",
        "list", "bullet", "align", "link",
    ];

    const currencyOptions = ["BDT", "USD", "EUR", "GBP", "SAR", "AED"];

    const submit = () => {
        post(route("user.exhibitions.store"), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success("Exhibition submitted for approval.");
                resetForm();
            },
            onError: () => message.error("Please check form errors."),
        });
    };

    const resetForm = () => {
        reset();
        setMainImagePreview(null);
        setSponsorImagePreview(null);
        setBoardImagePreview(null);
        setGalleryPreviews([]);
        setDocumentPreview(null);
        setVideoNames([]);
        setAudioNames([]);
        setPdfNames([]);
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
        if (previewSetter) previewSetter((prev) => [...prev, URL.createObjectURL(file)]);
        return false;
    };

    const removeMultiFile = (field, index, namesSetter, previewSetter = null) => {
        const newFiles = (data[field] || []).filter((_, i) => i !== index);
        setData(field, newFiles);
        namesSetter(newFiles.map((item) => item.name));
        if (previewSetter) previewSetter((prev) => prev.filter((_, i) => i !== index));
    };

    const boardPermissionNotice = () => {
        if (data.board_mode === "new") {
            return (
                <Alert
                    type="info"
                    showIcon
                    className="mb-4"
                    message="New board flow"
                    description="New board will be created from this page. Only admin approval is needed for the new board. Your exhibition will also wait for admin approval."
                />
            );
        }

        if (!selectedBoard) return null;

        if (selectedBoard.is_owner) {
            return <Alert type="success" showIcon className="mb-4" message="Your own board selected" description="Only exhibition admin approval is needed." />;
        }

        if (selectedBoard.can_post_now) {
            return <Alert type="success" showIcon className="mb-4" message="Approved member board selected" description="You already have board permission. Only exhibition admin approval is needed." />;
        }

        return (
            <Alert
                type="warning"
                showIcon
                className="mb-4"
                message="Another member board selected"
                description="After submit, board owner approval and admin board-access approval are required. Then admin can approve/publish the exhibition."
            />
        );
    };

    return (
        <Authenticated user={auth.user} header="Create Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibitions.index")}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">Back to Exhibitions</Button>
                    </Link>
                    <Title level={3}><EditOutlined className="mr-2" /> Create New Exhibition Item</Title>
                    <Text type="secondary">Create a new board or use another member board from this same page.</Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-5xl">
                    <Card size="small" className="mb-6" title={<Space><TeamOutlined /> Board Selection</Space>}>
                        <Form.Item label="Board Option" required>
                            <Radio.Group
                                value={data.board_mode}
                                onChange={(e) => {
                                    setData("board_mode", e.target.value);
                                    if (e.target.value === "new") setData("exhibition_board_id", "");
                                }}
                            >
                                <Radio.Button value="existing">Use Existing / Another Member Board</Radio.Button>
                                <Radio.Button value="new"><PlusOutlined /> Create New Board</Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        {data.board_mode === "existing" ? (
                            <>
                                {boards.length === 0 && <Alert type="warning" showIcon className="mb-4" message="No approved boards found" description="You can create a new board from this page." />}
                                <Form.Item label="Exhibition Board" validateStatus={errors.exhibition_board_id ? "error" : ""} help={errors.exhibition_board_id} required>
                                    <Select
                                        size="large"
                                        placeholder="Select your board or another member approved board"
                                        value={data.exhibition_board_id || undefined}
                                        onChange={(value) => setData("exhibition_board_id", value)}
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {boards.map((board) => (
                                            <Option key={board.id} value={board.id}>
                                                {board.title} {board.is_owner ? "(My Board)" : "(Other Member Board)"}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                {selectedBoard && (
                                    <div className="mb-4">
                                        <Space wrap>
                                            <Tag color={selectedBoard.is_owner ? "green" : "orange"}>{selectedBoard.is_owner ? "My Board" : "Other Member"}</Tag>
                                            <Tag>{selectedBoard.permission_text}</Tag>
                                        </Space>
                                    </div>
                                )}
                                {!selectedBoard?.is_owner && selectedBoard && !selectedBoard?.can_post_now && (
                                    <Form.Item label="Message for Board Owner/Admin" validateStatus={errors.board_request_message ? "error" : ""} help={errors.board_request_message}>
                                        <Input.TextArea rows={3} value={data.board_request_message} onChange={(e) => setData("board_request_message", e.target.value)} placeholder="Why do you want to post on this board?" />
                                    </Form.Item>
                                )}
                            </>
                        ) : (
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="New Board Title" required validateStatus={errors.new_board_title ? "error" : ""} help={errors.new_board_title}>
                                        <Input size="large" value={data.new_board_title} onChange={(e) => setData("new_board_title", e.target.value)} placeholder="Board title" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label="New Board Image" validateStatus={errors.new_board_image ? "error" : ""} help={errors.new_board_image}>
                                        <Upload beforeUpload={(file) => setFile("new_board_image", file, setBoardImagePreview)} showUploadList={false} accept={IMAGE_ACCEPT}>
                                            <Button icon={<UploadOutlined />}>Select Board Image</Button>
                                        </Upload>
                                        {boardImagePreview && <img src={boardImagePreview} alt="Board" style={{ width: 180, height: 90, objectFit: "cover", marginTop: 12, borderRadius: 8 }} />}
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item label="New Board Description" validateStatus={errors.new_board_description ? "error" : ""} help={errors.new_board_description}>
                                        <Input.TextArea rows={3} value={data.new_board_description} onChange={(e) => setData("new_board_description", e.target.value)} placeholder="Board description" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                        {boardPermissionNotice()}
                    </Card>

                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item label="Item Type" required validateStatus={errors.type ? "error" : ""} help={errors.type}>
                                <Select size="large" value={data.type} onChange={(value) => setData("type", value)}>
                                    <Option value="product"><Space><ShoppingOutlined />Product</Space></Option>
                                    <Option value="document"><Space><FileTextOutlined />Document</Space></Option>
                                    <Option value="art"><Space><PictureOutlined />Art</Space></Option>
                                    <Option value="photography"><Space><PictureOutlined />Photography</Space></Option>
                                    <Option value="craft"><Space><EditOutlined />Craft</Space></Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label="Title Text Editor" required validateStatus={errors.title ? "error" : ""} help={errors.title}>
                                <ReactQuill theme="snow" value={data.title} onChange={(value) => setData("title", value)} modules={quillModules} formats={quillFormats} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label="Description with Embedded Link" required validateStatus={errors.description ? "error" : ""} help={errors.description}>
                                <ReactQuill theme="snow" value={data.description} onChange={(value) => setData("description", value)} modules={quillModules} formats={quillFormats} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Main Image" required validateStatus={errors.image ? "error" : ""} help={errors.image}>
                                <Upload beforeUpload={(file) => setFile("image", file, setMainImagePreview)} showUploadList={false} accept={IMAGE_ACCEPT}>
                                    <Button icon={<UploadOutlined />}>Select Main Image</Button>
                                </Upload>
                                {mainImagePreview && <img src={mainImagePreview} alt="Main" style={{ width: 220, height: 140, objectFit: "cover", borderRadius: 8, marginTop: 12 }} />}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Sponsor Image" validateStatus={errors.sponsor_image ? "error" : ""} help={errors.sponsor_image}>
                                <Upload beforeUpload={(file) => setFile("sponsor_image", file, setSponsorImagePreview)} showUploadList={false} accept={IMAGE_ACCEPT}>
                                    <Button icon={<UploadOutlined />}>Select Sponsor Image</Button>
                                </Upload>
                                {sponsorImagePreview && <img src={sponsorImagePreview} alt="Sponsor" style={{ width: 220, height: 90, objectFit: "contain", borderRadius: 8, marginTop: 12 }} />}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item label="Gallery Images" validateStatus={errors.gallery ? "error" : ""} help={errors.gallery}>
                                <Upload beforeUpload={(file) => addMultiFile("gallery", file, () => {}, setGalleryPreviews)} showUploadList={false} accept={IMAGE_ACCEPT} multiple>
                                    <Button icon={<UploadOutlined />}>Add Gallery Image</Button>
                                </Upload>
                                {galleryPreviews.length > 0 && <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>{galleryPreviews.map((src, i) => <div key={i} style={{ position: "relative" }}><img src={src} alt="Gallery" style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8 }} /><Button size="small" danger style={{ position: "absolute", top: -8, right: -8 }} onClick={() => removeMultiFile("gallery", i, () => {}, setGalleryPreviews)}>×</Button></div>)}</div>}
                            </Form.Item>
                        </Col>

                        <Col span={24}><Divider orientation="left">Media Files</Divider></Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Document File" validateStatus={errors.document_file ? "error" : ""} help={errors.document_file}>
                                <Upload beforeUpload={(file) => { setData("document_file", file); setDocumentPreview(file); return false; }} showUploadList={false} accept={DOC_ACCEPT}>
                                    <Button icon={<FileTextOutlined />}>Select Document</Button>
                                </Upload>
                                {documentPreview && <div className="mt-2"><Text>{documentPreview.name}</Text> <Button size="small" danger onClick={() => { setData("document_file", null); setDocumentPreview(null); }}>Remove</Button></div>}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="PDF Files" validateStatus={errors.pdfs ? "error" : ""} help={errors.pdfs}>
                                <Upload beforeUpload={(file) => addMultiFile("pdfs", file, setPdfNames)} showUploadList={false} accept={DOC_ACCEPT} multiple>
                                    <Button icon={<FileTextOutlined />}>Add PDF</Button>
                                </Upload>
                                {pdfNames.map((name, i) => <div key={i} className="mt-1"><Text>{name}</Text> <Button size="small" danger onClick={() => removeMultiFile("pdfs", i, setPdfNames)}>Remove</Button></div>)}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Video Files" validateStatus={errors.videos ? "error" : ""} help={errors.videos}>
                                <Upload beforeUpload={(file) => addMultiFile("videos", file, setVideoNames)} showUploadList={false} accept={VIDEO_ACCEPT} multiple>
                                    <Button icon={<VideoCameraOutlined />}>Add Video</Button>
                                </Upload>
                                {videoNames.map((name, i) => <div key={i} className="mt-1"><Text>{name}</Text> <Button size="small" danger onClick={() => removeMultiFile("videos", i, setVideoNames)}>Remove</Button></div>)}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Audio Files" validateStatus={errors.audios ? "error" : ""} help={errors.audios}>
                                <Upload beforeUpload={(file) => addMultiFile("audios", file, setAudioNames)} showUploadList={false} accept={AUDIO_ACCEPT} multiple>
                                    <Button icon={<AudioOutlined />}>Add Audio</Button>
                                </Upload>
                                {audioNames.map((name, i) => <div key={i} className="mt-1"><Text>{name}</Text> <Button size="small" danger onClick={() => removeMultiFile("audios", i, setAudioNames)}>Remove</Button></div>)}
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}><Form.Item label="Price" validateStatus={errors.price ? "error" : ""} help={errors.price}><InputNumber size="large" min={0} style={{ width: "100%" }} value={data.price} onChange={(value) => setData("price", value)} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Currency" validateStatus={errors.currency ? "error" : ""} help={errors.currency}><Select size="large" value={data.currency} onChange={(value) => setData("currency", value)}>{currencyOptions.map((item) => <Option key={item} value={item}>{item}</Option>)}</Select></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Dimensions" validateStatus={errors.dimensions ? "error" : ""} help={errors.dimensions}><Input size="large" value={data.dimensions} onChange={(e) => setData("dimensions", e.target.value)} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Material" validateStatus={errors.material ? "error" : ""} help={errors.material}><Input size="large" value={data.material} onChange={(e) => setData("material", e.target.value)} /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="External Link" validateStatus={errors.link ? "error" : ""} help={errors.link}><Input size="large" value={data.link} onChange={(e) => setData("link", e.target.value)} placeholder="https://example.com" /></Form.Item></Col>
                        <Col xs={24} md={12}><Form.Item label="Language" validateStatus={errors.lang_id ? "error" : ""} help={errors.lang_id}><Select size="large" allowClear value={data.lang_id || undefined} onChange={(value) => setData("lang_id", value || "")}>{langs.map((lang) => <Option key={lang.id} value={lang.id}>{lang.name}</Option>)}</Select></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item label="Available"><Switch checked={data.is_available} onChange={(checked) => setData("is_available", checked)} /></Form.Item></Col>
                    </Row>

                    <Alert type="info" showIcon className="mb-4" message="User status is locked" description="Member exhibition is always saved as Draft/Pending. Admin will publish after required approvals." />

                    <div className="flex justify-end gap-3 mt-6">
                        <Link href={route("user.exhibitions.index")}><Button>Cancel</Button></Link>
                        <Button type="default" onClick={resetForm}>Reset</Button>
                        <Button type="primary" htmlType="submit" loading={processing} icon={<SaveOutlined />}>Submit for Approval</Button>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}
