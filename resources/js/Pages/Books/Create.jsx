import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    Space,
    message,
    Upload,
    Row,
    Col,
    Checkbox,
    Select,
    Collapse
} from 'antd';
import {
    BookOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined,
    FilePdfOutlined,
    PlusOutlined,
    CloseOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

export default function Create({ auth,langs }) {
    // Book related states
    const [photoPreview, setPhotoPreview] = useState(null);
    const [originalPdf, setOriginalPdf] = useState(null);
    const [compressedPdf, setCompressedPdf] = useState(null);

    // SEO related states
    const [showSeo, setShowSeo] = useState(false);
    const [metaKeywords, setMetaKeywords] = useState(['']);
    const [focusKeywords, setFocusKeywords] = useState(['']);

    // Preview states
    const [favIconPreview, setFavIconPreview] = useState(null);
    const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
    const [footerLogoPreview, setFooterLogoPreview] = useState(null);
    const [ogImagePreview, setOgImagePreview] = useState(null);
    const [twitterImagePreview, setTwitterImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        // Book fields
        title: '',
        photo: null,
        description: '',
        pdf_file: null,
        compressed_pdf: null,
        seo_active: false,
        lang_id: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: [],
        meta_robots: 'index, follow',
        og_title: '',
        og_description: '',
        og_image: null,
        og_type: 'website',
        og_url: '',
        og_site_name: '',
        twitter_card: 'summary_large_image',
        twitter_title: '',
        twitter_description: '',
        twitter_image: null,
        twitter_site: '',
        twitter_creator: '',
        canonical_url: '',
        structured_data: '',
        focus_keywords: [],
    });

    const submit = () => {
        const formData = new FormData();

        // Append all data to formData
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (Array.isArray(data[key])) {
                    // Handle arrays (keywords)
                    data[key].forEach(item => {
                        formData.append(`${key}[]`, item);
                    });
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        post(route('admin.books.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Book created successfully');
                // Reset form
                setData({
                    title: '',
                    photo: null,
                    description: '',
                    pdf_file: null,
                    compressed_pdf: null,
                    seo_active: false,
                    meta_title: '',
                    meta_description: '',
                    meta_keywords: [],
                    meta_robots: 'index, follow',
                    og_title: '',
                    og_description: '',
                    og_image: null,
                    og_type: 'website',
                    og_url: '',
                    og_site_name: '',
                    twitter_card: 'summary_large_image',
                    twitter_title: '',
                    twitter_description: '',
                    twitter_image: null,
                    twitter_site: '',
                    twitter_creator: '',
                    canonical_url: '',
                    structured_data: '',
                    focus_keywords: [],
                });
                setPhotoPreview(null);
                setOriginalPdf(null);
                setCompressedPdf(null);
                setShowSeo(false);
                setMetaKeywords(['']);
                setFocusKeywords(['']);
                // Clear previews
                setFavIconPreview(null);
                setHeaderLogoPreview(null);
                setFooterLogoPreview(null);
                setOgImagePreview(null);
                setTwitterImagePreview(null);
            },
            onError: () => {
                message.error('Error creating book');
            }
        });
    };

    // Book related handlers
    const handlePhotoUpload = (file) => {
        setData('photo', file);
        setPhotoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData('photo', null);
        setPhotoPreview(null);
    };

    const handleOriginalPdfUpload = (file) => {
        setData('pdf_file', file);
        setOriginalPdf(file);
        return false;
    };

    const handleOriginalPdfRemove = () => {
        setData('pdf_file', null);
        setOriginalPdf(null);
    };

    // SEO related handlers
    const handleSeoToggle = (checked) => {
        setShowSeo(checked);
        setData('seo_active', checked);
    };

    const addKeywordField = (type) => {
        if (type === 'meta') {
            setMetaKeywords([...metaKeywords, '']);
        } else {
            setFocusKeywords([...focusKeywords, '']);
        }
    };

    const removeKeywordField = (index, type) => {
        if (type === 'meta') {
            const newKeywords = metaKeywords.filter((_, i) => i !== index);
            setMetaKeywords(newKeywords);
            setData('meta_keywords', newKeywords.filter(kw => kw.trim() !== ''));
        } else {
            const newKeywords = focusKeywords.filter((_, i) => i !== index);
            setFocusKeywords(newKeywords);
            setData('focus_keywords', newKeywords.filter(kw => kw.trim() !== ''));
        }
    };

    const handleKeywordChange = (value, index, type) => {
        if (type === 'meta') {
            const newKeywords = [...metaKeywords];
            newKeywords[index] = value;
            setMetaKeywords(newKeywords);
            setData('meta_keywords', newKeywords.filter(kw => kw.trim() !== ''));
        } else {
            const newKeywords = [...focusKeywords];
            newKeywords[index] = value;
            setFocusKeywords(newKeywords);
            setData('focus_keywords', newKeywords.filter(kw => kw.trim() !== ''));
        }
    };

    // Handle file upload with preview
    const handleFileUpload = (file, fieldName, previewSetter) => {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        previewSetter(previewUrl);

        // Set data
        setData(fieldName, file);

        return false; // Prevent default upload behavior
    };

    // Handle file removal
    const handleFileRemove = (fieldName, previewSetter) => {
        setData(fieldName, null);
        previewSetter(null);

        // Revoke object URL to avoid memory leaks
        if (previewSetter === setFavIconPreview && favIconPreview) {
            URL.revokeObjectURL(favIconPreview);
        } else if (previewSetter === setHeaderLogoPreview && headerLogoPreview) {
            URL.revokeObjectURL(headerLogoPreview);
        } else if (previewSetter === setFooterLogoPreview && footerLogoPreview) {
            URL.revokeObjectURL(footerLogoPreview);
        } else if (previewSetter === setOgImagePreview && ogImagePreview) {
            URL.revokeObjectURL(ogImagePreview);
        } else if (previewSetter === setTwitterImagePreview && twitterImagePreview) {
            URL.revokeObjectURL(twitterImagePreview);
        }
    };

    // Render file upload with preview component
    const renderFileUpload = (fieldName, preview, previewSetter, accept = "image/*", label) => (
        <div>
            <Upload
                accept={accept}
                showUploadList={false}
                beforeUpload={(file) => handleFileUpload(file, fieldName, previewSetter)}
            >
                <Button icon={<PictureOutlined />}>Select {label}</Button>
            </Upload>
            {preview && (
                <div className="mt-3">
                    <img
                        src={preview}
                        alt={`${label} Preview`}
                        className="max-h-48 rounded border"
                    />
                    <Button
                        type="link"
                        danger
                        onClick={() => handleFileRemove(fieldName, previewSetter)}
                        className="mt-2"
                    >
                        Remove {label}
                    </Button>
                </div>
            )}
            {errors[fieldName] && (
                <div className="ant-form-item-explain-error">
                    {errors[fieldName]}
                </div>
            )}
        </div>
    );

    return (
        <Authenticated
            user={auth.user}
            header="Create Book"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.books.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Books
                        </Button>
                    </Link>
                    <Title level={3}>
                        <BookOutlined className="mr-2" />
                        Create New Book
                    </Title>
                    <Text type="secondary">
                        Add a new book to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    {/* Basic Book Information */}
                    <Title level={4}>Book Information</Title>

                    <Form.Item
                        label="Book Title"
                        validateStatus={errors.title ? 'error' : ''}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter book title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            prefix={<BookOutlined />}
                        />
                    </Form.Item>

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

                    <Form.Item
                        label="Book Cover Image"
                        validateStatus={errors.photo ? 'error' : ''}
                        help={errors.photo}
                    >
                        <Upload
                            beforeUpload={handlePhotoUpload}
                            onRemove={handlePhotoRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>Select Cover Image</Button>
                        </Upload>

                        {photoPreview && (
                            <div className="mt-2">
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                                    className="mt-2"
                                />
                            </div>
                        )}

                        {data.photo && (
                            <Text type="secondary" className="block mt-2">
                                Selected: {data.photo.name}
                            </Text>
                        )}
                    </Form.Item>

                    <Form.Item
                        label=" PDF"
                        validateStatus={errors.pdf_file ? 'error' : ''}
                        help={errors.pdf_file}
                        required
                    >
                        <Upload
                            beforeUpload={handleOriginalPdfUpload}
                            onRemove={handleOriginalPdfRemove}
                            accept=".pdf"
                            showUploadList={false}
                        >
                            <Button icon={<FilePdfOutlined />}>Select Original PDF</Button>
                        </Upload>

                        {originalPdf && (
                            <Text type="secondary" className="block mt-2">
                                Selected: {originalPdf.name}
                            </Text>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Book Description"
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                    >
                        <TextArea
                            size="large"
                            rows={4}
                            placeholder="Enter book description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </Form.Item>

                    {/* SEO Toggle */}
                    <Form.Item>
                        <Checkbox
                            checked={showSeo}
                            onChange={(e) => handleSeoToggle(e.target.checked)}
                        >
                            Enable SEO Optimization {showSeo ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </Checkbox>
                    </Form.Item>

                    {/* SEO Section - Conditionally Rendered */}
                    {showSeo && (
                        <Collapse defaultActiveKey={['1']} className="mb-6">
                            <Panel header="SEO Optimization Settings" key="1">
                                {/* Basic Information */}
                                <Title level={4}>Basic Information</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Meta Title"
                                            validateStatus={errors.meta_title ? 'error' : ''}
                                            help={errors.meta_title}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter meta title"
                                                value={data.meta_title}
                                                onChange={(e) => setData('meta_title', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Canonical URL"
                                            validateStatus={errors.canonical_url ? 'error' : ''}
                                            help={errors.canonical_url}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter canonical URL"
                                                value={data.canonical_url}
                                                onChange={(e) => setData('canonical_url', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>


                                {/* Basic Meta Tags */}
                                <Title level={4}>Basic Meta Tags</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Meta Description"
                                            validateStatus={errors.meta_description ? 'error' : ''}
                                            help={errors.meta_description}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="Enter meta description"
                                                value={data.meta_description}
                                                onChange={(e) => setData('meta_description', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Meta Robots"
                                            validateStatus={errors.meta_robots ? 'error' : ''}
                                            help={errors.meta_robots}
                                        >
                                            <Select
                                                size="large"
                                                value={data.meta_robots}
                                                onChange={(value) => setData('meta_robots', value)}
                                                placeholder="Select meta robots"
                                                allowClear
                                            >
                                                <Option value="index, follow">Index, Follow</Option>
                                                <Option value="noindex, follow">Noindex, Follow</Option>
                                                <Option value="index, nofollow">Index, Nofollow</Option>
                                                <Option value="noindex, nofollow">Noindex, Nofollow</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Meta Keywords */}
                                <Form.Item
                                    label="Meta Keywords"
                                    validateStatus={errors.meta_keywords ? 'error' : ''}
                                    help={errors.meta_keywords}
                                >
                                    <div className="space-y-2">
                                        {metaKeywords.map((keyword, index) => (
                                            <div key={index} className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="Enter meta keyword"
                                                    value={keyword}
                                                    onChange={(e) => handleKeywordChange(e.target.value, index, 'meta')}
                                                />
                                                {metaKeywords.length > 1 && (
                                                    <Button
                                                        danger
                                                        type="text"
                                                        icon={<CloseOutlined />}
                                                        onClick={() => removeKeywordField(index, 'meta')}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={() => addKeywordField('meta')}
                                        >
                                            Add Keyword
                                        </Button>
                                    </div>
                                </Form.Item>

                                {/* Open Graph Tags */}
                                <Title level={4}>Open Graph Tags</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="OG Title"
                                            validateStatus={errors.og_title ? 'error' : ''}
                                            help={errors.og_title}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter OG title"
                                                value={data.og_title}
                                                onChange={(e) => setData('og_title', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="OG Type"
                                            validateStatus={errors.og_type ? 'error' : ''}
                                            help={errors.og_type}
                                        >
                                            <Select
                                                size="large"
                                                value={data.og_type}
                                                onChange={(value) => setData('og_type', value)}
                                                placeholder="Select OG type"
                                                allowClear
                                            >
                                                <Option value="website">Website</Option>
                                                <Option value="article">Article</Option>
                                                <Option value="product">Product</Option>
                                                <Option value="profile">Profile</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="OG URL"
                                            validateStatus={errors.og_url ? 'error' : ''}
                                            help={errors.og_url}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter OG URL"
                                                value={data.og_url}
                                                onChange={(e) => setData('og_url', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="OG Site Name"
                                            validateStatus={errors.og_site_name ? 'error' : ''}
                                            help={errors.og_site_name}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter OG site name"
                                                value={data.og_site_name}
                                                onChange={(e) => setData('og_site_name', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="OG Description"
                                    validateStatus={errors.og_description ? 'error' : ''}
                                    help={errors.og_description}
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Enter OG description"
                                        value={data.og_description}
                                        onChange={(e) => setData('og_description', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="OG Image"
                                    validateStatus={errors.og_image ? 'error' : ''}
                                    help={errors.og_image}
                                >
                                    {renderFileUpload(
                                        'og_image',
                                        ogImagePreview,
                                        setOgImagePreview,
                                        "image/*",
                                        "OG Image"
                                    )}
                                </Form.Item>

                                {/* Twitter Card Tags */}
                                <Title level={4}>Twitter Card Tags</Title>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Twitter Card Type"
                                            validateStatus={errors.twitter_card ? 'error' : ''}
                                            help={errors.twitter_card}
                                        >
                                            <Select
                                                size="large"
                                                value={data.twitter_card}
                                                onChange={(value) => setData('twitter_card', value)}
                                                placeholder="Select Twitter card type"
                                                allowClear
                                            >
                                                <Option value="summary">Summary</Option>
                                                <Option value="summary_large_image">Summary Large Image</Option>
                                                <Option value="app">App</Option>
                                                <Option value="player">Player</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Twitter Site"
                                            validateStatus={errors.twitter_site ? 'error' : ''}
                                            help={errors.twitter_site}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="@username"
                                                value={data.twitter_site}
                                                onChange={(e) => setData('twitter_site', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Twitter Title"
                                            validateStatus={errors.twitter_title ? 'error' : ''}
                                            help={errors.twitter_title}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter Twitter title"
                                                value={data.twitter_title}
                                                onChange={(e) => setData('twitter_title', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Twitter Creator"
                                            validateStatus={errors.twitter_creator ? 'error' : ''}
                                            help={errors.twitter_creator}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="@username"
                                                value={data.twitter_creator}
                                                onChange={(e) => setData('twitter_creator', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Twitter Description"
                                    validateStatus={errors.twitter_description ? 'error' : ''}
                                    help={errors.twitter_description}
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Enter Twitter description"
                                        value={data.twitter_description}
                                        onChange={(e) => setData('twitter_description', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Twitter Image"
                                    validateStatus={errors.twitter_image ? 'error' : ''}
                                    help={errors.twitter_image}
                                >
                                    {renderFileUpload(
                                        'twitter_image',
                                        twitterImagePreview,
                                        setTwitterImagePreview,
                                        "image/*",
                                        "Twitter Image"
                                    )}
                                </Form.Item>

                                {/* Additional SEO Fields */}
                                <Title level={4}>Additional SEO Fields</Title>

                                {/* Focus Keywords */}
                                <Form.Item
                                    label="Focus Keywords"
                                    validateStatus={errors.focus_keywords ? 'error' : ''}
                                    help={errors.focus_keywords}
                                >
                                    <div className="space-y-2">
                                        {focusKeywords.map((keyword, index) => (
                                            <div key={index} className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="Enter focus keyword"
                                                    value={keyword}
                                                    onChange={(e) => handleKeywordChange(e.target.value, index, 'focus')}
                                                />
                                                {focusKeywords.length > 1 && (
                                                    <Button
                                                        danger
                                                        type="text"
                                                        icon={<CloseOutlined />}
                                                        onClick={() => removeKeywordField(index, 'focus')}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={() => addKeywordField('focus')}
                                        >
                                            Add Focus Keyword
                                        </Button>
                                    </div>
                                </Form.Item>

                                <Form.Item
                                    label="Structured Data (JSON-LD)"
                                    validateStatus={errors.structured_data ? 'error' : ''}
                                    help={errors.structured_data}
                                >
                                    <TextArea
                                        rows={6}
                                        placeholder="Enter structured data in JSON format"
                                        value={data.structured_data}
                                        onChange={(e) => setData('structured_data', e.target.value)}
                                    />
                                </Form.Item>
                            </Panel>
                        </Collapse>
                    )}

                    {/* Submit Button */}
                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create Book {showSeo && 'with SEO'}
                            </Button>
                            <Link href={route('admin.books.index')}>
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