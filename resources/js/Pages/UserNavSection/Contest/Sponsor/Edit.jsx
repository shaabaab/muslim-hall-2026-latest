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
    Alert,
    Switch
} from 'antd';

import { 
    PictureOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
} from '@ant-design/icons';

import { Link } from '@inertiajs/react';
import { useState } from 'react'; // Added missing import

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ sponsor, auth, langs, sponsors }) {
    const [previewImg, setPreviewImg] = useState( // Added missing state
        sponsor.img ? `/storage/${sponsor.img}` : null
    );

    const { data, setData, post, processing, errors } = useForm({
        name: sponsor.name,
        status: sponsor.status,
        img: sponsor.img || null,
        parent_id: sponsor.parent_id || null,
        description: sponsor.description,
        lang_id: sponsor.lang_id,
        _method: 'PUT',
    });

    const handlePhotoUpload = (file) => {
        setData('img', file);
        setPreviewImg(URL.createObjectURL(file)); // Fixed function name
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData('img', null);
        setPreviewImg(null);
    };

    const submit = () => {
        post(route('user.sponsors.update', sponsor.id), {
            forceFormData: true,  // file to be uploaded
            preserveScroll: true,
            onBefore: () => {
                console.log(data);
            },
            onSuccess: () => {
                message.success('Sponsor updated successfully');
            },
            onError: () => {
                message.error('Error updating sponsor');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Sponsor"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('user.sponsors.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Categories
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                Edit Sponsor: {sponsor.name}
                            </Title>
                            <Text type="secondary">
                                Update sponsor information
                            </Text>
                        </div>
                    </div>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={20}>
                            <Form.Item
                                label="Sponsor Name"
                                validateStatus={errors.name ? 'error' : ''}
                                help={errors.name}
                                required
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter sponsor name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="Sponsor Status">
                                <Space>
                                    <Switch 
                                        checked={data.status == 1}
                                        onChange={(checked) => setData('status', checked)}
                                    />
                                    <Text style={{ color: data.status == 1 ? 'green' : 'red' }}>
                                        {data.status == 1 ? 'Active' : 'Inactive'}
                                    </Text>
                                </Space>
                            </Form.Item>

                            <Form.Item
                                label="Parent Sponsor"
                                validateStatus={errors.parent_id ? 'error' : ''}
                                help={errors.parent_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Parent Sponsor"
                                    value={data.parent_id}
                                    onChange={(value) => setData('parent_id', value)} 
                                    allowClear
                                >
                                    {sponsors?.map((cat) => (
                                        <Option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Language"
                                validateStatus={errors.lang_id ? 'error' : ''}
                                help={errors.lang_id}
                                required
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)} // Fixed setData usage
                                    suffixIcon={<TeamOutlined />}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {langs?.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item 
                                label="Sponsor Description"
                                validateStatus={errors.description ? 'error' : ''}
                                help={errors.description}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Enter section description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={20}>
                            <Card title="Sponsor Image" size="default" className="mb-4">
                                <Form.Item
                                    validateStatus={errors.img ? 'error' : ''}
                                    help={errors.img}
                                >
                                    <Upload
                                        beforeUpload={(file) => {
                                            setData('img', file);
                                            setPreviewImg(URL.createObjectURL(file));
                                            return false; // prevent auto upload
                                        }}
                                        onRemove={() => {
                                            setData('img', null);
                                            setPreviewImg(null);
                                        }}
                                        accept="image/*"
                                        showUploadList={false}
                                        listType="picture"
                                    >
                                        <Button icon={<PictureOutlined />}>Select Image</Button>
                                    </Upload>

                                    {previewImg && (
                                        <div className="mt-2">
                                            <img
                                                src={previewImg}
                                                alt="Preview"
                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                className="mt-2 rounded shadow"
                                            />
                                        </div>
                                    )}

                                    {data.img && typeof data.img === 'string' && !previewImg && (
                                        <div className="mt-2">
                                            <img
                                                src={`/storage/${data.img}`}
                                                alt="Existing Sponsor"
                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                className="mt-2 rounded shadow"
                                            />
                                        </div>
                                    )}

                                    {data.img && typeof data.img !== 'string' && (
                                        <Text type="secondary" className="block mt-2">
                                            Selected: {data.img.name}
                                        </Text>
                                    )}
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <Form.Item className="mt-6">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                disabled={!data.name || !data.lang_id}
                            >
                                Update Sponsor
                            </Button>
                            <Link href={route('user.sponsors.index')}>
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