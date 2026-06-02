import Authenticated from '@/Layouts/AuthenticatedLayout';
import {
    Card,
    Form,
    Switch,
    Select,
    InputNumber,
    Button,
    Typography,
    Space,
    Row,
    Col,
    message,
    Divider
} from 'antd';
import {
    FileImageOutlined,
    VideoCameraOutlined,
    FilePdfOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Index({ auth, setting }) {
    const { data, setData, post, processing, errors } = useForm({
        image_optimization_enabled: setting?.image_optimization_enabled ?? true,
        image_quality: setting?.image_quality ?? 80,
        video_optimization_enabled: setting?.video_optimization_enabled ?? true,
        video_quality: setting?.video_quality ?? 'medium',
        pdf_optimization_enabled: setting?.pdf_optimization_enabled ?? true,
        pdf_quality: setting?.pdf_quality ?? 'medium',
    });

    const handleSubmit = (e) => {
        post(route('admin.settings.optimization.update'), {
            onSuccess: () => message.success('Optimization settings updated successfully'),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2}>Media Optimization Settings</Title>
                        <Text type="secondary">
                            Manage quality and performance settings for images, videos, and PDF documents.
                        </Text>
                    </div>
                </div>

                <Form layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={[24, 24]}>
                        {/* Image Optimization */}
                        <Col xs={24} md={8}>
                            <Card
                                title={<Space><FileImageOutlined /> Image Optimization</Space>}
                                hoverable
                                className="h-full"
                            >
                                <Form.Item label="Enable Optimization">
                                    <Switch
                                        checked={data.image_optimization_enabled}
                                        onChange={(checked) => setData('image_optimization_enabled', checked)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Image Quality (1-100)"
                                    help={errors.image_quality || "Lower quality results in smaller file sizes."}
                                    validateStatus={errors.image_quality ? 'error' : ''}
                                >
                                    <InputNumber
                                        min={1}
                                        max={100}
                                        value={data.image_quality}
                                        className="w-full"
                                        disabled={!data.image_optimization_enabled}
                                        onChange={(val) => setData('image_quality', val)}
                                    />
                                </Form.Item>
                            </Card>
                        </Col>

                        {/* Video Optimization */}
                        <Col xs={24} md={8}>
                            <Card
                                title={<Space><VideoCameraOutlined /> Video Optimization</Space>}
                                hoverable
                                className="h-full"
                            >
                                <Form.Item label="Enable Optimization">
                                    <Switch
                                        checked={data.video_optimization_enabled}
                                        onChange={(checked) => setData('video_optimization_enabled', checked)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Compression Level"
                                    validateStatus={errors.video_quality ? 'error' : ''}
                                    help={errors.video_quality}
                                >
                                    <Select
                                        value={data.video_quality}
                                        className="w-full"
                                        disabled={!data.video_optimization_enabled}
                                        onChange={(val) => setData('video_quality', val)}
                                    >
                                        <Option value="low">Low (Fastest)</Option>
                                        <Option value="medium">Medium (Standard)</Option>
                                        <Option value="high">High (Maximum compression)</Option>
                                    </Select>
                                </Form.Item>
                            </Card>
                        </Col>

                        {/* PDF Optimization */}
                        <Col xs={24} md={8}>
                            <Card
                                title={<Space><FilePdfOutlined /> PDF Optimization</Space>}
                                hoverable
                                className="h-full"
                            >
                                <Form.Item label="Enable Optimization">
                                    <Switch
                                        checked={data.pdf_optimization_enabled}
                                        onChange={(checked) => setData('pdf_optimization_enabled', checked)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Quality Level"
                                    validateStatus={errors.pdf_quality ? 'error' : ''}
                                    help={errors.pdf_quality}
                                >
                                    <Select
                                        value={data.pdf_quality}
                                        className="w-full"
                                        disabled={!data.pdf_optimization_enabled}
                                        onChange={(val) => setData('pdf_quality', val)}
                                    >
                                        <Option value="low">Low</Option>
                                        <Option value="medium">Medium</Option>
                                        <Option value="high">High</Option>
                                    </Select>
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <Divider />

                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            size="large"
                            htmlType="submit"
                            loading={processing}
                        >
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </div>
        </Authenticated>
    );
}
