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
    Tag,
    Alert,
    Switch,
    InputNumber,
    Upload,
    Tabs,
    Divider
} from 'antd';

import {
    UserOutlined,
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    FileTextOutlined,
    PictureOutlined,
    UploadOutlined,
    GlobalOutlined,
    TwitterOutlined,
    LineChartOutlined,
    EyeOutlined,
} from '@ant-design/icons';

import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function Edit({ book, auth, seo, langs }) {
    const [photoPreview, setPhotoPreview] = useState(
        book.photo ? `/storage/${book.photo}` : null
    );
    const [ogImagePreview, setOgImagePreview] = useState(
        seo?.og_image ? `/storage/${seo.og_image}` : null
    );
    const [twitterImagePreview, setTwitterImagePreview] = useState(
        seo?.twitter_image ? `/storage/${seo.twitter_image}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        // Book Data
        title: book.title,
        photo: book.photo || null,
        description: book.description,
        original_pdf: book.original_pdf || null,
        compressed_pdf: book.compressed_pdf || null,
        page_count: book.page_count,
        lang_id: book.lang_id || '',
        // SEO Data
        seo_active: seo ? 1 : 0,
        meta_title: seo?.meta_title || '',
        meta_description: seo?.meta_description || '',
        meta_keywords: seo?.meta_keywords ? JSON.parse(seo.meta_keywords) : [],
        meta_robots: seo?.meta_robots || 'index, follow',

        // Open Graph
        og_title: seo?.og_title || '',
        og_description: seo?.og_description || '',
        og_image: seo?.og_image || null,
        og_type: seo?.og_type || 'website',
        og_url: seo?.og_url || '',
        og_site_name: seo?.og_site_name || '',

        // Twitter
        twitter_title: seo?.twitter_title || '',
        twitter_description: seo?.twitter_description || '',
        twitter_image: seo?.twitter_image || null,
        twitter_card: seo?.twitter_card || 'summary_large_image',
        twitter_site: seo?.twitter_site || '',
        twitter_creator: seo?.twitter_creator || '',
        twitter_url: seo?.twitter_url || '',

        // Additional SEO
        canonical_url: seo?.canonical_url || '',
        structured_data: seo?.structured_data || '',
        focus_keywords: seo?.focus_keywords ? JSON.parse(seo.focus_keywords) : [],

        _method: 'PUT',
    });

    // Handle Image Uploads
    const handlePhotoUpload = (file) => {
        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
        setData('photo', file);
        return false;
    };

    const handlePhotoRemove = () => {
        setPhotoPreview(null);
        setData('photo', null);
    };

    const handleOgImageUpload = (file) => {
        const previewUrl = URL.createObjectURL(file);
        setOgImagePreview(previewUrl);
        setData('og_image', file);
        return false;
    };

    const handleOgImageRemove = () => {
        setOgImagePreview(null);
        setData('og_image', null);
    };

    const handleTwitterImageUpload = (file) => {
        const previewUrl = URL.createObjectURL(file);
        setTwitterImagePreview(previewUrl);
        setData('twitter_image', file);
        return false;
    };

    const handleTwitterImageRemove = () => {
        setTwitterImagePreview(null);
        setData('twitter_image', null);
    };

    // Handle PDF Uploads
    const handleOriginalPdfUpload = (file) => {
        setData('original_pdf', file);
        return false;
    };

    const handleCompressedPdfUpload = (file) => {
        setData('compressed_pdf', file);
        return false;
    };

    // Handle Keywords Input
    const handleMetaKeywordsChange = (value) => {
        setData('meta_keywords', value);
    };

    const handleFocusKeywordsChange = (value) => {
        setData('focus_keywords', value);
    };

    const submit = () => {
        post(route('admin.books.update', book.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('Book updated successfully');
            },
            onError: () => {
                message.error('Error updating book');
            }
        });
    };

    // SEO Preview Function
    const renderSeoPreview = () => {
        const title = data.meta_title || data.title;
        const description = data.meta_description || data.description?.substring(0, 160);
        const url = data.canonical_url || window.location.origin + '/books/' + book.id;

        return (
            <Card title="SEO Preview" size="small" className="mb-4">
                <div className="space-y-3">
                    <div>
                        <Text strong className="text-blue-600 text-sm">{url}</Text>
                    </div>
                    <div>
                        <Text strong className="text-lg text-blue-800 block hover:underline cursor-pointer">
                            {title || 'Page Title'}
                        </Text>
                    </div>
                    <div>
                        <Text className="text-gray-600 text-sm">
                            {description || 'Page description will appear here...'}
                        </Text>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Book"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.books.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Books
                        </Button>
                    </Link>

                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                Edit Book: {book.title}
                            </Title>
                            <Text type="secondary">
                                Update book information and SEO settings
                            </Text>
                        </div>
                    </div>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-6xl"
                >
                    <Tabs defaultActiveKey="book-info" type="card">
                        {/* Book Information Tab */}
                        <TabPane tab="Book Information" key="book-info">
                            <Row gutter={24}>
                                <Col xs={24} lg={16}>
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
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Description"
                                        validateStatus={errors.description ? 'error' : ''}
                                        help={errors.description}
                                    >
                                        <TextArea
                                            rows={4}
                                            placeholder="Enter book description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Page Count"
                                        validateStatus={errors.page_count ? 'error' : ''}
                                        help={errors.page_count}
                                        required
                                    >
                                        <InputNumber
                                            size="large"
                                            min={1}
                                            placeholder="Enter page count"
                                            value={data.page_count}
                                            onChange={(value) => setData('page_count', value)}
                                            style={{ width: '100%' }}
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
                                            suffixIcon={<TeamOutlined />}
                                        >
                                            {langs.map((lang) => (
                                                <Option key={lang.id} value={lang.id}>
                                                    {lang.name} ({lang.code})
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} lg={8}>
                                    <Card title="Book Cover Image" size="default" className="mb-4">
                                        <Form.Item
                                            validateStatus={errors.photo ? 'error' : ''}
                                            help={errors.photo}
                                        >
                                            <div className="space-y-4">
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
                                                            className="mt-2 rounded shadow"
                                                        />
                                                        <div className="mt-2">
                                                            <Button
                                                                type="link"
                                                                danger
                                                                onClick={handlePhotoRemove}
                                                                size="small"
                                                            >
                                                                Remove Image
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {book.photo && !photoPreview && (
                                                    <div className="mt-2">
                                                        <Text type="secondary">Current Image:</Text>
                                                        <div className="mt-2">
                                                            <img
                                                                src={`/storage/${book.photo}`}
                                                                alt="Current Cover"
                                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                                className="rounded shadow"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Form.Item>
                                    </Card>

                                    <Card title="PDF Files" size="default">
                                        <Row gutter={16}>
                                            <Col xs={24}>
                                                <Form.Item
                                                    label="PDF File"
                                                    validateStatus={errors.original_pdf ? 'error' : ''}
                                                    help={errors.original_pdf}
                                                >
                                                    <Upload
                                                        beforeUpload={handleOriginalPdfUpload}
                                                        accept=".pdf"
                                                        showUploadList={false}
                                                    >
                                                        <Button icon={<UploadOutlined />}>Select PDF</Button>
                                                    </Upload>

                                                    {(data.original_pdf || book.original_pdf) && (
                                                        <div className="mt-2">
                                                            <Tag icon={<FileTextOutlined />} color="blue">
                                                                {data.original_pdf instanceof File
                                                                    ? data.original_pdf.name
                                                                    : book.original_pdf
                                                                        ? `Current: ${book.original_pdf.split('/').pop()}`
                                                                        : 'PDF Selected'
                                                                }
                                                            </Tag>
                                                        </div>
                                                    )}
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* SEO Settings Tab */}
                        <TabPane tab="SEO Settings" key="seo-settings">
                            <Row gutter={24}>
                                <Col xs={24} lg={12}>
                                    <Card title="Basic SEO" size="default" className="mb-4">
                                        <Form.Item
                                            label="Meta Title"
                                            help="Title tag for search engines (50-60 characters recommended)"
                                            validateStatus={errors.meta_title ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="Meta title for search engines"
                                                value={data.meta_title}
                                                onChange={(e) => setData('meta_title', e.target.value)}
                                                maxLength={60}
                                                showCount
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Meta Description"
                                            help="Description for search results (150-160 characters recommended)"
                                            validateStatus={errors.meta_description ? 'error' : ''}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="Meta description for search engines"
                                                value={data.meta_description}
                                                onChange={(e) => setData('meta_description', e.target.value)}
                                                maxLength={160}
                                                showCount
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Meta Keywords"
                                            help="Separate keywords with commas"
                                            validateStatus={errors.meta_keywords ? 'error' : ''}
                                        >
                                            <Select
                                                mode="tags"
                                                placeholder="Add keywords"
                                                value={data.meta_keywords}
                                                onChange={handleMetaKeywordsChange}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Meta Robots"
                                            validateStatus={errors.meta_robots ? 'error' : ''}
                                        >
                                            <Select
                                                value={data.meta_robots}
                                                onChange={(value) => setData('meta_robots', value)}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="index, follow">Index, Follow</Option>
                                                <Option value="noindex, follow">Noindex, Follow</Option>
                                                <Option value="index, nofollow">Index, Nofollow</Option>
                                                <Option value="noindex, nofollow">Noindex, Nofollow</Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            label="Canonical URL"
                                            help="Preferred URL for this content"
                                            validateStatus={errors.canonical_url ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="https://example.com/books/book-title"
                                                value={data.canonical_url}
                                                onChange={(e) => setData('canonical_url', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Card>

                                    <Card title="Open Graph (Social Media)" size="default" className="mb-4">
                                        <Form.Item
                                            label="OG Title"
                                            help="Title for social media sharing"
                                            validateStatus={errors.og_title ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="Open Graph title"
                                                value={data.og_title}
                                                onChange={(e) => setData('og_title', e.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="OG Description"
                                            help="Description for social media sharing"
                                            validateStatus={errors.og_description ? 'error' : ''}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="Open Graph description"
                                                value={data.og_description}
                                                onChange={(e) => setData('og_description', e.target.value)}
                                            />
                                        </Form.Item>

                                        {/* <Form.Item
                                            label="OG Image"
                                            help="Recommended size: 1200x630 pixels"
                                            validateStatus={errors.og_image ? 'error' : ''}
                                        >
                                            <div className="space-y-4">
                                                <Upload
                                                    beforeUpload={handleOgImageUpload}
                                                    onRemove={handleOgImageRemove}
                                                    accept="image/*"
                                                    showUploadList={false}
                                                >
                                                    <Button icon={<PictureOutlined />}>Select OG Image</Button>
                                                </Upload>
                                                
                                                {ogImagePreview && (
                                                    <div className="mt-2">
                                                        <img 
                                                            src={ogImagePreview} 
                                                            alt="OG Preview" 
                                                            style={{ maxWidth: '200px', maxHeight: '105px' }}
                                                            className="mt-2 rounded shadow"
                                                        />
                                                        <div className="mt-2">
                                                            <Button 
                                                                type="link" 
                                                                danger 
                                                                onClick={handleOgImageRemove}
                                                                size="small"
                                                            >
                                                                Remove Image
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {seo?.og_image && !ogImagePreview && (
                                                    <div className="mt-2">
                                                        <Text type="secondary">Current OG Image:</Text>
                                                        <div className="mt-2">
                                                            <img 
                                                                src={`/storage/${seo.og_image}`} 
                                                                alt="Current OG" 
                                                                style={{ maxWidth: '200px', maxHeight: '105px' }}
                                                                className="rounded shadow"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Form.Item> */}
                                    </Card>
                                </Col>

                                <Col xs={24} lg={12}>
                                    {renderSeoPreview()}

                                    <Card title="Twitter Card" size="default" className="mb-4">
                                        <Form.Item
                                            label="Twitter Card Type"
                                            validateStatus={errors.twitter_card ? 'error' : ''}
                                        >
                                            <Select
                                                value={data.twitter_card}
                                                onChange={(value) => setData('twitter_card', value)}
                                                style={{ width: '100%' }}
                                            >
                                                <Option value="summary">Summary</Option>
                                                <Option value="summary_large_image">Summary Large Image</Option>
                                                <Option value="app">App</Option>
                                                <Option value="player">Player</Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            label="Twitter Title"
                                            validateStatus={errors.twitter_title ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="Twitter card title"
                                                value={data.twitter_title}
                                                onChange={(e) => setData('twitter_title', e.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Twitter Description"
                                            validateStatus={errors.twitter_description ? 'error' : ''}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="Twitter card description"
                                                value={data.twitter_description}
                                                onChange={(e) => setData('twitter_description', e.target.value)}
                                            />
                                        </Form.Item>

                                        {/* <Form.Item
                                            label="Twitter Image"
                                            help="Recommended size: 1200x600 pixels"
                                            validateStatus={errors.twitter_image ? 'error' : ''}
                                        >
                                            <div className="space-y-4">
                                                <Upload
                                                    beforeUpload={handleTwitterImageUpload}
                                                    onRemove={handleTwitterImageRemove}
                                                    accept="image/*"
                                                    showUploadList={false}
                                                >
                                                    <Button icon={<PictureOutlined />}>Select Twitter Image</Button>
                                                </Upload>
                                                
                                                {twitterImagePreview && (
                                                    <div className="mt-2">
                                                        <img 
                                                            src={twitterImagePreview} 
                                                            alt="Twitter Preview" 
                                                            style={{ maxWidth: '200px', maxHeight: '100px' }}
                                                            className="mt-2 rounded shadow"
                                                        />
                                                        <div className="mt-2">
                                                            <Button 
                                                                type="link" 
                                                                danger 
                                                                onClick={handleTwitterImageRemove}
                                                                size="small"
                                                            >
                                                                Remove Image
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {seo?.twitter_image && !twitterImagePreview && (
                                                    <div className="mt-2">
                                                        <Text type="secondary">Current Twitter Image:</Text>
                                                        <div className="mt-2">
                                                            <img 
                                                                src={`/storage/${seo.twitter_image}`} 
                                                                alt="Current Twitter" 
                                                                style={{ maxWidth: '200px', maxHeight: '100px' }}
                                                                className="rounded shadow"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Form.Item> */}

                                        <Form.Item
                                            label="Twitter Site"
                                            help="@username for the website used in the card footer"
                                            validateStatus={errors.twitter_site ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="@username"
                                                value={data.twitter_site}
                                                onChange={(e) => setData('twitter_site', e.target.value)}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Twitter Creator"
                                            help="@username for the content creator"
                                            validateStatus={errors.twitter_creator ? 'error' : ''}
                                        >
                                            <Input
                                                placeholder="@username"
                                                value={data.twitter_creator}
                                                onChange={(e) => setData('twitter_creator', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Card>

                                    <Card title="Advanced SEO" size="default">
                                        <Form.Item
                                            label="Focus Keywords"
                                            help="Primary keywords for this content"
                                            validateStatus={errors.focus_keywords ? 'error' : ''}
                                        >
                                            <Select
                                                mode="tags"
                                                placeholder="Add focus keywords"
                                                value={data.focus_keywords}
                                                onChange={handleFocusKeywordsChange}
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Structured Data"
                                            help="JSON-LD structured data (advanced)"
                                            validateStatus={errors.structured_data ? 'error' : ''}
                                        >
                                            <TextArea
                                                rows={4}
                                                placeholder='{"@context": "https://schema.org", ...}'
                                                value={data.structured_data}
                                                onChange={(e) => setData('structured_data', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>
                    </Tabs>

                    <Divider />

                    <Form.Item className="mt-6">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                disabled={!data.title || !data.page_count}
                            >
                                Update Book
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