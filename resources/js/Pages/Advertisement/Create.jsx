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
    Upload,
    Switch,
    Row,
    Col,
    InputNumber,
    DatePicker,
    ColorPicker,
    Collapse
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    VideoCameraOutlined,
    DollarOutlined,
    UserOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export default function Create({ auth }) {
    const [imagePreview, setImagePreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [form] = Form.useForm();

    const { data, setData, post, processing, errors, transform } = useForm({
        title: '',
        description: '',
        type: 'banner',
        position: 'header',
        image: null,
        video: null,
        video_url: '',
        target_url: '',
        button_text: 'Learn More',
        background_color: '#ffffff',
        text_color: '#000000',
        start_date: null,
        end_date: null,
        max_impressions: null,
        max_clicks: null,
        cost_per_impression: null,
        cost_per_click: null,
        total_budget: null,
        advertiser_name: '',
        advertiser_email: '',
        advertiser_phone: '',
        is_active: true,
        is_featured: false,
        status: 'pending',
        targeting: {}
    });

    const submit = () => {
        transform((data) => {
            const transformedData = {
                ...data,
                start_date: data.start_date ? data.start_date.format('YYYY-MM-DD HH:mm:ss') : null,
                end_date: data.end_date ? data.end_date.format('YYYY-MM-DD HH:mm:ss') : null,
                is_active: data.is_active ? 1 : 0,
                is_featured: data.is_featured ? 1 : 0,
            };

            // Remove null files to avoid validation errors
            if (transformedData.image === null) delete transformedData.image;
            if (transformedData.video === null) delete transformedData.video;

            return transformedData;
        });

        post(route('admin.advertisements.store'), {
            forceFormData: true,
            onSuccess: () => {
                message.success('Advertisement created successfully!');
                resetForm();
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                message.error('There were errors creating the advertisement. Please check the form.');
            }
        });
    };

    const resetForm = () => {
        setData({
            title: '',
            description: '',
            type: 'banner',
            position: 'header',
            image: null,
            video: null,
            video_url: '',
            target_url: '',
            button_text: 'Learn More',
            background_color: '#ffffff',
            text_color: '#000000',
            start_date: null,
            end_date: null,
            max_impressions: null,
            max_clicks: null,
            cost_per_impression: null,
            cost_per_click: null,
            total_budget: null,
            advertiser_name: '',
            advertiser_email: '',
            advertiser_phone: '',
            is_active: true,
            is_featured: false,
            status: 'pending',
            targeting: {}
        });
        setImagePreview(null);
        form.resetFields();
    };

    const handleVideoUpload = (file) => {
        setData('video', file);
        setVideoPreview(URL.createObjectURL(file));
        return false;
    };

    const handleVideoRemove = () => {
        setData('video', null);
        setVideoPreview(null);
    };

    const handleImageUpload = (file) => {
        console.log('File selected:', file);
        setData('image', file);
        setImagePreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleImageRemove = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const handleDateRangeChange = (dates) => {
        console.log('Date range changed:', dates);
        if (dates && dates[0] && dates[1]) {
            setData('start_date', dates[0]);
            setData('end_date', dates[1]);
        } else {
            setData('start_date', null);
            setData('end_date', null);
        }
    };

    const adTypes = [
        { value: 'banner', label: 'Banner Ad', icon: <PictureOutlined /> },
        { value: 'video_ad', label: 'Video Ad', icon: <VideoCameraOutlined /> },
    ];

    // Only header and in_content positions available
    const positions = {
        banner: ['header', 'in_content'],
        video_ad: ['header', 'in_content']
    };

    // Test function to check if button is clickable
    const testClick = () => {
        console.log('Button clicked!');
        message.info('Button click detected!');
    };

    return (
        <Authenticated user={auth.user} header="Create Advertisement">
            <Card >
                <div className="mb-6">
                    <Link href={route('admin.advertisements.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Advertisements
                        </Button>
                    </Link>
                    <Title level={3}>
                        <PictureOutlined className="mr-2" />
                        Create New Advertisement
                    </Title>
                    <Text type="secondary">
                        Set up banners and video advertisements for header and in-content positions
                    </Text>
                </div>

                {/* Test Button */}
                <div className="mb-4">
                    <Button
                        type="dashed"
                        onClick={testClick}
                        style={{ marginBottom: '16px' }}
                    >
                        Test Click - This should work
                    </Button>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                    disabled={processing}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                label="Ad Title"
                                validateStatus={errors.title ? 'error' : ''}
                                help={errors.title}
                                required
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter advertisement title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    disabled={processing}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Ad Type"
                                validateStatus={errors.type ? 'error' : ''}
                                help={errors.type}
                                required
                            >
                                <Select
                                    size="large"
                                    value={data.type}
                                    onChange={(value) => {
                                        setData('type', value);
                                    }}
                                    disabled={processing}
                                >
                                    {adTypes.map(type => (
                                        <Option key={type.value} value={type.value}>
                                            <Space>
                                                {type.icon}
                                                {type.label}
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Position"
                                validateStatus={errors.position ? 'error' : ''}
                                help={errors.position}
                                required
                            >
                                <Select
                                    value={data.position}
                                    onChange={(value) => setData('position', value)}
                                    disabled={processing}
                                >
                                    <Option value="header">
                                        Header (Top of the page)
                                    </Option>
                                    <Option value="in_content">
                                        In-Content (Between content sections)
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? 'error' : ''}
                                help={errors.status}
                                required
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    disabled={processing}
                                >
                                    <Option value="pending">Pending Review</Option>
                                    <Option value="approved">Approved</Option>
                                    <Option value="rejected">Rejected</Option>
                                    <Option value="paused">Paused</Option>
                                    <Option value="completed">Completed</Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Description"
                                validateStatus={errors.description ? 'error' : ''}
                                help={errors.description}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Describe the advertisement content..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    maxLength={500}
                                    disabled={processing}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Target URL"
                                validateStatus={errors.target_url ? 'error' : ''}
                                help={errors.target_url}
                                required
                            >
                                <Input
                                    placeholder="https://example.com"
                                    value={data.target_url}
                                    onChange={(e) => setData('target_url', e.target.value)}
                                    addonBefore="https://"
                                    disabled={processing}
                                />
                            </Form.Item>
                        </Col>

                        {data.type === 'video_ad' && (
                            <Col span={24}>
                                <Form.Item
                                    label="Upload Video File"
                                    validateStatus={errors.video ? 'error' : ''}
                                    help={errors.video || "Upload a video file (mp4, mov, avi, etc.)"}
                                >
                                    <Upload
                                        beforeUpload={handleVideoUpload}
                                        onRemove={handleVideoRemove}
                                        accept="video/*"
                                        showUploadList={true}
                                        maxCount={1}
                                        fileList={data.video ? [{
                                            uid: '-1',
                                            name: data.video.name || 'video.mp4',
                                            status: 'done',
                                        }] : []}
                                        disabled={processing}
                                    >
                                        <Button icon={<UploadOutlined />} disabled={processing}>
                                            Select Video File
                                        </Button>
                                    </Upload>

                                    {videoPreview && (
                                        <div className="mt-4">
                                            <Text strong className="block mb-2">Video Preview:</Text>
                                            <video
                                                src={videoPreview}
                                                controls
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '200px',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </div>
                                    )}
                                </Form.Item>

                                <Form.Item
                                    label="Or Video URL"
                                    validateStatus={errors.video_url ? 'error' : ''}
                                    help={errors.video_url}
                                >
                                    <Input
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={data.video_url}
                                        onChange={(e) => setData('video_url', e.target.value)}
                                        disabled={processing}
                                    />
                                </Form.Item>
                            </Col>
                        )}

                        {data.type !== 'video_ad' && (
                            <Col span={24}>
                                <Form.Item
                                    label="Ad Image"
                                    validateStatus={errors.image ? 'error' : ''}
                                    help={errors.image}
                                    required={data.type !== 'video_ad'}
                                >
                                    <Upload
                                        beforeUpload={handleImageUpload}
                                        onRemove={handleImageRemove}
                                        accept="image/*"
                                        showUploadList={true}
                                        maxCount={1}
                                        fileList={data.image ? [{
                                            uid: '-1',
                                            name: data.image.name || 'image.jpg',
                                            status: 'done',
                                        }] : []}
                                        disabled={processing}
                                    >
                                        <Button icon={<UploadOutlined />} disabled={processing}>
                                            Select Ad Image
                                        </Button>
                                    </Upload>

                                    {imagePreview && (
                                        <div className="mt-4">
                                            <Text strong className="block mb-2">Image Preview:</Text>
                                            <img
                                                src={imagePreview}
                                                alt="Ad preview"
                                                style={{
                                                    maxWidth: '300px',
                                                    maxHeight: '150px',
                                                    borderRadius: '8px',
                                                    objectFit: 'contain'
                                                }}
                                                className="border border-dashed border-gray-300"
                                            />
                                        </div>
                                    )}
                                </Form.Item>
                            </Col>
                        )}

                        {/* Button + Colors Section */}
                        <Col span={24}>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                    {/* Button Text */}
                                    <Form.Item
                                        label="Button Text"
                                        validateStatus={errors.button_text ? "error" : ""}
                                        help={errors.button_text}
                                        className="mb-0"
                                    >
                                        <Input
                                            placeholder="Learn More"
                                            value={data.button_text}
                                            onChange={(e) => setData("button_text", e.target.value)}
                                            disabled={processing}
                                        />
                                    </Form.Item>

                                    {/* Background Color */}
                                    <Form.Item label="Background Color" className="mb-0">
                                        <div className="w-full">
                                            <ColorPicker
                                                value={data.background_color}
                                                onChange={(color) =>
                                                    setData("background_color", color.toHexString())
                                                }
                                                showText
                                                disabled={processing}
                                            />
                                        </div>
                                    </Form.Item>

                                    {/* Text Color */}
                                    <Form.Item label="Text Color" className="mb-0">
                                        <div className="w-full">
                                            <ColorPicker
                                                value={data.text_color}
                                                onChange={(color) =>
                                                    setData("text_color", color.toHexString())
                                                }
                                                showText
                                                disabled={processing}
                                            />
                                        </div>
                                    </Form.Item>

                                </div>

                            </div>
                        </Col>

                        <Col span={24} className='my-2'>
                            <Form.Item
                                label="Campaign Period"
                                validateStatus={errors.start_date || errors.end_date ? 'error' : ''}
                                help={errors.start_date || errors.end_date}
                            >
                                <RangePicker
                                    style={{ width: '100%' }}
                                    showTime
                                    value={[data.start_date, data.end_date]}
                                    onChange={handleDateRangeChange}
                                    placeholder={['Start Date', 'End Date']}
                                    disabled={processing}
                                />
                            </Form.Item>
                        </Col>

                        {/* Advertiser Information Section */}
                        <Col span={24}>
                            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">

                                {/* Section Title */}
                                <div className="mb-4">
                                    <Title level={4} className="!mb-1">
                                        <UserOutlined className="mr-2" />
                                        Advertiser Information
                                    </Title>
                                    <p className="text-sm text-gray-500">
                                        Provide contact details of the advertiser
                                    </p>
                                </div>

                                {/* Responsive Grid */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                    {/* Advertiser Name */}
                                    <Form.Item
                                        label="Advertiser Name"
                                        validateStatus={errors.advertiser_name ? "error" : ""}
                                        help={errors.advertiser_name}
                                        className="mb-0"
                                    >
                                        <Input
                                            placeholder="Company or individual name"
                                            value={data.advertiser_name}
                                            onChange={(e) =>
                                                setData("advertiser_name", e.target.value)
                                            }
                                            disabled={processing}
                                        />
                                    </Form.Item>

                                    {/* Advertiser Email */}
                                    <Form.Item
                                        label="Advertiser Email"
                                        validateStatus={errors.advertiser_email ? "error" : ""}
                                        help={errors.advertiser_email}
                                        className="mb-0"
                                    >
                                        <Input
                                            type="email"
                                            placeholder="advertiser@example.com"
                                            value={data.advertiser_email}
                                            onChange={(e) =>
                                                setData("advertiser_email", e.target.value)
                                            }
                                            disabled={processing}
                                        />
                                    </Form.Item>

                                    {/* Advertiser Phone */}
                                    <Form.Item
                                        label="Advertiser Phone"
                                        validateStatus={errors.advertiser_phone ? "error" : ""}
                                        help={errors.advertiser_phone}
                                        className="mb-0"
                                    >
                                        <Input
                                            placeholder="+1234567890"
                                            value={data.advertiser_phone}
                                            onChange={(e) =>
                                                setData("advertiser_phone", e.target.value)
                                            }
                                            disabled={processing}
                                        />
                                    </Form.Item>

                                </div>

                            </div>
                        </Col>

                        {/* Advanced Settings */}
                        <Col span={24}>
                            <Collapse
                                ghost
                                onChange={(key) => setShowAdvanced(key.length > 0)}
                                className="mb-4"
                            >
                                <Panel
                                    header={
                                        <Space>
                                            <SettingOutlined />
                                            <Text strong>Advanced Settings</Text>
                                        </Space>
                                    }
                                    key="1"
                                >
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                label="Max Impressions"
                                                validateStatus={errors.max_impressions ? 'error' : ''}
                                                help={errors.max_impressions}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="Unlimited"
                                                    value={data.max_impressions}
                                                    onChange={(value) => setData('max_impressions', value)}
                                                    min={1}
                                                    disabled={processing}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={8}>
                                            <Form.Item
                                                label="Max Clicks"
                                                validateStatus={errors.max_clicks ? 'error' : ''}
                                                help={errors.max_clicks}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="Unlimited"
                                                    value={data.max_clicks}
                                                    onChange={(value) => setData('max_clicks', value)}
                                                    min={1}
                                                    disabled={processing}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={8}>
                                            <Form.Item
                                                label="Total Budget"
                                                validateStatus={errors.total_budget ? 'error' : ''}
                                                help={errors.total_budget}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="0.00"
                                                    value={data.total_budget}
                                                    onChange={(value) => setData('total_budget', value)}
                                                    min={0}
                                                    step={0.01}
                                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                                    addonBefore={<DollarOutlined />}
                                                    disabled={processing}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={12}>
                                            <Form.Item
                                                label="Cost Per Impression (CPI)"
                                                validateStatus={errors.cost_per_impression ? 'error' : ''}
                                                help={errors.cost_per_impression}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="0.0000"
                                                    value={data.cost_per_impression}
                                                    onChange={(value) => setData('cost_per_impression', value)}
                                                    min={0}
                                                    step={0.0001}
                                                    formatter={value => `$ ${value}`}
                                                    parser={value => value.replace(/\$\s?/, '')}
                                                    addonBefore={<DollarOutlined />}
                                                    disabled={processing}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col span={12}>
                                            <Form.Item
                                                label="Cost Per Click (CPC)"
                                                validateStatus={errors.cost_per_click ? 'error' : ''}
                                                help={errors.cost_per_click}
                                            >
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    placeholder="0.0000"
                                                    value={data.cost_per_click}
                                                    onChange={(value) => setData('cost_per_click', value)}
                                                    min={0}
                                                    step={0.0001}
                                                    formatter={value => `$ ${value}`}
                                                    parser={value => value.replace(/\$\s?/, '')}
                                                    addonBefore={<DollarOutlined />}
                                                    disabled={processing}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Panel>
                            </Collapse>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Active Status">
                                <Switch
                                    checked={data.is_active}
                                    onChange={(checked) => setData('is_active', checked)}
                                    disabled={processing}
                                />
                                <Text className="ml-2">
                                    {data.is_active ? 'Active' : 'Inactive'}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Featured Ad">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) => setData('is_featured', checked)}
                                    disabled={processing}
                                />
                                <Text className="ml-2">
                                    {data.is_featured ? 'Featured' : 'Regular'}
                                </Text>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mt-8 !mb-0">
                        {/* Mobile: column | Desktop: row */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                className="w-full sm:w-auto"
                                style={{ minWidth: "160px" }}
                                onClick={() => console.log("Submit button clicked")}
                            >
                                {processing ? "Creating..." : "Create Advertisement"}
                            </Button>

                            <Link href={route("admin.advertisements.index")} className="w-full sm:w-auto">
                                <Button
                                    size="large"
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            </Link>

                            <Button
                                type="default"
                                onClick={resetForm}
                                size="large"
                                disabled={processing}
                                className="w-full sm:w-auto"
                            >
                                Reset Form
                            </Button>
                        </div>
                    </Form.Item>
                </Form >

            </Card >
        </Authenticated >
    );
}