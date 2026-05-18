import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Select, 
    Typography, 
    Space,
    message,
    Row,
    Col,
    Upload
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PlusOutlined,
    CloseOutlined,
    PictureOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function Create({ auth }) {
    const [metaKeywords, setMetaKeywords] = useState(['']);
    const [focusKeywords, setFocusKeywords] = useState(['']);
    
    // Preview states
    const [favIconPreview, setFavIconPreview] = useState(null);
    const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
    const [footerLogoPreview, setFooterLogoPreview] = useState(null);
    const [ogImagePreview, setOgImagePreview] = useState(null);
    const [twitterImagePreview, setTwitterImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        fav_icon: null,
        header_logo: null,
        footer_logo: null,
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

    const submit = () => {
        post(route('admin.seos.store'), {
            onSuccess: () => {
                message.success('SEO created successfully');
                
                // Clean up preview URLs
                [favIconPreview, headerLogoPreview, footerLogoPreview, ogImagePreview, twitterImagePreview].forEach(preview => {
                    if (preview) URL.revokeObjectURL(preview);
                });
            },
            onError: () => {
                message.error('Error creating SEO');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create SEO"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.seos.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to SEO
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New SEO
                    </Title>
                    <Text type="secondary">
                        Add SEO settings for your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    {/* Basic Information */}
                    <Title level={4}>Basic Information</Title>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Title"
                                validateStatus={errors.title ? 'error' : ''}
                                help={errors.title}
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter page title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
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

                    {/* Media Files */}
                    <Title level={4}>Media Files</Title>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Favicon"
                                validateStatus={errors.fav_icon ? 'error' : ''}
                                help={errors.fav_icon}
                            >
                                {renderFileUpload(
                                    'fav_icon',
                                    favIconPreview,
                                    setFavIconPreview,
                                    "image/*,.ico",
                                    "Favicon"
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Header Logo"
                                validateStatus={errors.header_logo ? 'error' : ''}
                                help={errors.header_logo}
                            >
                                {renderFileUpload(
                                    'header_logo',
                                    headerLogoPreview,
                                    setHeaderLogoPreview,
                                    "image/*",
                                    "Header Logo"
                                )}
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="Footer Logo"
                                validateStatus={errors.footer_logo ? 'error' : ''}
                                help={errors.footer_logo}
                            >
                                {renderFileUpload(
                                    'footer_logo',
                                    footerLogoPreview,
                                    setFooterLogoPreview,
                                    "image/*",
                                    "Footer Logo"
                                )}
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Basic Meta Tags */}
                    <Title level={4}>Basic Meta Tags</Title>
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
                                label="Meta Robots"
                                validateStatus={errors.meta_robots ? 'error' : ''}
                                help={errors.meta_robots}
                            >
                                <Select
                                    size="large"
                                    value={data.meta_robots}
                                    onChange={(value) => setData('meta_robots', value)}
                                >
                                    <Option value="index, follow">Index, Follow</Option>
                                    <Option value="noindex, follow">Noindex, Follow</Option>
                                    <Option value="index, nofollow">Index, Nofollow</Option>
                                    <Option value="noindex, nofollow">Noindex, Nofollow</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

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

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create SEO
                            </Button>
                            <Link href={route('admin.seos.index')}>
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