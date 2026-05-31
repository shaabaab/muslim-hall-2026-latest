import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
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
    InputNumber
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    EditOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Create({ auth, langs }) {
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [documentPreview, setDocumentPreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        type: 'product',
        image: null,
        gallery: [],
        document_file: null,
        price: null,
        currency: 'USD',
        is_available: true,
        is_featured: false,
        dimensions: '',
        material: '',
        status: 'draft',
        lang_id: '',
    });

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === 'gallery' && Array.isArray(data[key])) {
                    data[key].forEach((file, index) => {
                        formData.append(`gallery[${index}]`, file);
                    });
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        post(route('admin.exhibitions.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Exhibition item created successfully');
                resetForm();
            },
            onError: () => {
                message.error('Error creating exhibition item');
            }
        });
    };

    const resetForm = () => {
        setData({
            title: '',
            description: '',
            type: 'product',
            image: null,
            gallery: [],
            document_file: null,
            price: null,
            currency: 'USD',
            is_available: true,
            is_featured: false,
            dimensions: '',
            material: '',
            status: 'draft',
        });
        setMainImagePreview(null);
        setGalleryPreviews([]);
        setDocumentPreview(null);
    };

    const handleMainImageUpload = (file) => {
        setData('image', file);
        setMainImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];
        setData('gallery', newGallery);
        setGalleryPreviews([...galleryPreviews, URL.createObjectURL(file)]);
        return false;
    };

    const handleGalleryRemove = (index) => {
        const newGallery = data.gallery.filter((_, i) => i !== index);
        const newPreviews = galleryPreviews.filter((_, i) => i !== index);
        setData('gallery', newGallery);
        setGalleryPreviews(newPreviews);
    };

    const handleDocumentUpload = (file) => {
        setData('document_file', file);
        setDocumentPreview(file);
        return false;
    };

    const handleDocumentRemove = () => {
        setData('document_file', null);
        setDocumentPreview(null);
    };

    const currencyOptions = [
        { value: 'BDT', label: 'BDT (৳)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'SAR', label: 'SAR (﷼)' },
        { value: 'AED', label: 'AED (د.إ)' },
    ];

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

    return (
        <Authenticated user={auth.user} header="Create Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.exhibitions.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Exhibitions
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Create New Exhibition Item
                    </Title>
                    <Text type="secondary">
                        Showcase products, documents, art, photography, or crafts
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Item Type"
                                validateStatus={errors.type ? 'error' : ''}
                                help={errors.type}
                                required
                            >
                                <Select
                                    size="large"
                                    value={data.type}
                                    onChange={(value) => setData('type', value)}
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
                                validateStatus={errors.lang_id ? 'error' : ''}
                                help={errors.lang_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)}
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
                                validateStatus={errors.image ? 'error' : ''}
                                help={errors.image}
                                required
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        Select Main Image
                                    </Button>
                                </Upload>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Main Image Preview:</Text>
                                        <img
                                            src={mainImagePreview}
                                            alt="Main preview"
                                            style={{
                                                maxWidth: '300px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'cover'
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Gallery Images"
                                validateStatus={errors.gallery ? 'error' : ''}
                                help={errors.gallery}
                            >
                                <Upload
                                    beforeUpload={handleGalleryUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button icon={<PlusOutlined />}>
                                        Add to Gallery
                                    </Button>
                                </Upload>

                                {galleryPreviews.length > 0 && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Gallery Previews:</Text>
                                        <div className="flex flex-wrap gap-4">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={preview}
                                                        alt={`Gallery ${index + 1}`}
                                                        style={{
                                                            width: '100px',
                                                            height: '100px',
                                                            borderRadius: '8px',
                                                            objectFit: 'cover'
                                                        }}
                                                        className="border border-dashed border-gray-300"
                                                    />
                                                    <Button
                                                        type="link"
                                                        danger
                                                        size="small"
                                                        onClick={() => handleGalleryRemove(index)}
                                                        style={{ position: 'absolute', top: -8, right: -8 }}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Text type="secondary" className="block mt-2">
                                            {galleryPreviews.length} image(s) selected
                                        </Text>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Price"
                                validateStatus={errors.price ? 'error' : ''}
                                help={errors.price}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="0.00"
                                    value={data.price}
                                    onChange={(value) => setData('price', value)}
                                    min={0}
                                    step={0.01}
                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Currency"
                                validateStatus={errors.currency ? 'error' : ''}
                                help={errors.currency}
                                required
                            >
                                <Select
                                    value={data.currency}
                                    onChange={(value) => setData('currency', value)}
                                >
                                    {currencyOptions.map(currency => (
                                        <Option key={currency.value} value={currency.value}>
                                            {currency.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Link (Url)"
                                validateStatus={errors.link ? 'error' : ''}
                                help={errors.link}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Link (Url)"
                                    value={data.link}
                                    onChange={(value) => setData('link', value)}
                                    min={0}
                                    step={0.01}
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        {(data.type === 'art' || data.type === 'product') && (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Dimensions"
                                        validateStatus={errors.dimensions ? 'error' : ''}
                                        help={errors.dimensions}
                                    >
                                        <Input
                                            placeholder="e.g., 24x36 inches, 50x70 cm"
                                            value={data.dimensions}
                                            onChange={(e) => setData('dimensions', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Material"
                                        validateStatus={errors.material ? 'error' : ''}
                                        help={errors.material}
                                    >
                                        <Input
                                            placeholder="e.g., Oil on canvas, Wood, Metal"
                                            value={data.material}
                                            onChange={(e) => setData('material', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24}>
                            <Form.Item label="Document File (Optional)">
                                <Upload
                                    beforeUpload={handleDocumentUpload}
                                    onRemove={handleDocumentRemove}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        Select Document
                                    </Button>
                                </Upload>

                                {documentPreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Document:</Text>
                                        <div className="p-3 border rounded bg-gray-50">
                                            <FileTextOutlined className="text-2xl text-blue-500 mr-2" />
                                            <Text>{documentPreview.name}</Text>
                                        </div>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Available for Sale">
                                <Switch
                                    checked={data.is_available}
                                    onChange={(checked) => setData('is_available', checked)}
                                />
                                <Text className="ml-2">
                                    {data.is_available ? 'Available' : 'Not Available'}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Featured Item">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) => setData('is_featured', checked)}
                                />
                                <Text className="ml-2">
                                    {data.is_featured ? 'Featured' : 'Regular'}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? 'error' : ''}
                                help={errors.status}
                                required
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
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
                                style={{ minWidth: '160px' }}
                            >
                                Create Exhibition Item
                            </Button>

                            <Link href={route('admin.exhibitions.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}