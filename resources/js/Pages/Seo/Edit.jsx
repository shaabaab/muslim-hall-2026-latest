import { useForm, usePage } from '@inertiajs/react';
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
    Upload,
    Switch
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function Edit({ seo, auth }) {
    // Initialize form data with SEO data
    const { data, setData, put, processing, errors } = useForm({
        title: seo.title || '',
        fav_icon: seo.fav_icon || null,
        header_logo: seo.header_logo || null,
        footer_logo: seo.footer_logo || null,
        meta_title: seo.meta_title || '',
        meta_description: seo.meta_description || '',
        meta_keywords: seo.meta_keywords || [],
        meta_robots: seo.meta_robots || 'index, follow',
        og_title: seo.og_title || '',
        og_description: seo.og_description || '',
        og_image: seo.og_image || null,
        og_type: seo.og_type || 'website',
        og_url: seo.og_url || '',
        og_site_name: seo.og_site_name || '',
        twitter_card: seo.twitter_card || 'summary_large_image',
        twitter_title: seo.twitter_title || '',
        twitter_description: seo.twitter_description || '',
        twitter_image: seo.twitter_image || null,
        twitter_site: seo.twitter_site || '',
        twitter_creator: seo.twitter_creator || '',
        canonical_url: seo.canonical_url || '',
        structured_data: seo.structured_data || '',
        focus_keywords: seo.focus_keywords || [],
        _method: 'PUT',
    });

    // Preview states
    const [favIconPreview, setFavIconPreview] = useState(null);
    const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
    const [footerLogoPreview, setFooterLogoPreview] = useState(null);
    const [ogImagePreview, setOgImagePreview] = useState(null);
    const [twitterImagePreview, setTwitterImagePreview] = useState(null);

    // Keyword states
    const [metaKeywords, setMetaKeywords] = useState(seo.meta_keywords || ['']);
    const [focusKeywords, setFocusKeywords] = useState(seo.focus_keywords || ['']);

    // Set initial previews from existing images
    useEffect(() => {
        if (seo.fav_icon) setFavIconPreview(`/storage/${seo.fav_icon}`);
        if (seo.header_logo) setHeaderLogoPreview(`/storage/${seo.header_logo}`);
        if (seo.footer_logo) setFooterLogoPreview(`/storage/${seo.footer_logo}`);
        if (seo.og_image) setOgImagePreview(`/storage/${seo.og_image}`);
        if (seo.twitter_image) setTwitterImagePreview(`/storage/${seo.twitter_image}`);
    }, [seo]);

    // Handle file upload with preview
    const handleFileUpload = (file, fieldName, previewSetter) => {
        const previewUrl = URL.createObjectURL(file);
        previewSetter(previewUrl);
        setData(fieldName, file);
        return false;
    };

    // Handle file removal
    const handleFileRemove = (fieldName, previewSetter) => {
        setData(fieldName, null);
        previewSetter(null);
        
        // Revoke object URL to avoid memory leaks
        const previews = {
            fav_icon: favIconPreview,
            header_logo: headerLogoPreview,
            footer_logo: footerLogoPreview,
            og_image: ogImagePreview,
            twitter_image: twitterImagePreview
        };
        
        if (previews[fieldName]) {
            URL.revokeObjectURL(previews[fieldName]);
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
                        className="max-h-32 rounded border"
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

    // Keyword management
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

    const submit = () => {
        put(route('admin.seos.update', seo.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('SEO updated successfully');
                // Clean up preview URLs
                [favIconPreview, headerLogoPreview, footerLogoPreview, ogImagePreview, twitterImagePreview].forEach(preview => {
                    if (preview && preview.startsWith('blob:')) {
                        URL.revokeObjectURL(preview);
                    }
                });
            },
            onError: () => {
                message.error('Error updating SEO');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit SEO"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.seos.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to SEO
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                Edit SEO: {seo.title || 'Untitled'}
                            </Title>
                            <Text type="secondary">
                                Update SEO settings and metadata
                            </Text>
                        </div>
                    </div>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    {/* Basic Information */}
                    <Card title="Basic Information" className="mb-6">
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
                    </Card>

                    {/* Media Files */}
                    <Card title="Media Files" className="mb-6">
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
                    </Card>

                    {/* Basic Meta Tags */}
                    <Card title="Basic Meta Tags" className="mb-6">
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
                                                icon={<ArrowLeftOutlined />}
                                                onClick={() => removeKeywordField(index, 'meta')}
                                            />
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    icon={<SaveOutlined />}
                                    onClick={() => addKeywordField('meta')}
                                >
                                    Add Keyword
                                </Button>
                            </div>
                        </Form.Item>
                    </Card>

                    {/* Open Graph Tags */}
                    <Card title="Open Graph Tags" className="mb-6">
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
                    </Card>

                    {/* Twitter Card Tags */}
                    <Card title="Twitter Card Tags" className="mb-6">
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
                    </Card>

                    {/* Additional SEO Fields */}
                    <Card title="Additional SEO Fields" className="mb-6">
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
                                                icon={<ArrowLeftOutlined />}
                                                onClick={() => removeKeywordField(index, 'focus')}
                                            />
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    icon={<SaveOutlined />}
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
                    </Card>

                    <Form.Item className="mt-6">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Update SEO
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