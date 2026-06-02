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
    Row,
    Col
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Edit({ post, auth }) {
    const [imagePreview, setImagePreview] = useState(
        post.image ? `/storage/${post.image}` : null
    );
    
    const { data, setData, post: inertiaPost, processing, errors, transform } = useForm({
        title: post.title || '',
        content: post.content || '',
        image: null,
        status: post.status || 'draft',
        _method: 'PUT',
    });

    // Transform the data before sending - THIS IS KEY FOR FILE UPLOADS
    transform((data) => ({
        ...data,
        _method: 'PUT',
    }));

    const handleSubmit = () => {
        console.log('Submitting data:', data);
        console.log('Image file:', data.image);

        inertiaPost(route('admin.communities.update', post.id), {
            forceFormData: true, // This enables proper file uploads
            preserveScroll: true,
            onSuccess: () => {
                message.success('Community post updated successfully!');
            },
            onError: (errors) => {
                console.error('Update errors:', errors);
                message.error('Error updating community post. Please check the form.');
            },
        });
    };

    const handleImageUpload = (file) => {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        // Validate file size (2MB)
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }

        // Set the image file directly in the form data
        setData('image', file);
        setImagePreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleImageRemove = () => {
        setData('image', null);
        setImagePreview(null);
    };

    const statusOptions = [
        { value: 'published', label: 'Published', icon: <EyeOutlined /> },
        { value: 'draft', label: 'Draft', icon: <EditOutlined /> },
        { value: 'archived', label: 'Archived', icon: <SaveOutlined /> }
    ];

    return (
        <Authenticated
            user={auth.user}
            header={
                <div className="flex items-center">
                    <Link href={route('admin.communities.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mr-4">
                            Back
                        </Button>
                    </Link>
                    <Title level={2} className="!mb-0">
                        Edit Community Post
                    </Title>
                </div>
            }
        >
            <Card className="shadow-sm">
                <Form
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        title: data.title,
                        content: data.content,
                        status: data.status,
                    }}
                    disabled={processing}
                >
                    <Row gutter={[24, 16]}>
                        <Col xs={24} lg={16}>
                            <Form.Item
                                label="Post Title"
                                name="title"
                                validateStatus={errors.title ? 'error' : ''}
                                help={errors.title}
                                rules={[{ required: true, message: 'Please enter a title!' }]}
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter post title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Post Content"
                                name="content"
                                validateStatus={errors.content ? 'error' : ''}
                                help={errors.content}
                                rules={[{ required: true, message: 'Please enter content!' }]}
                            >
                                <TextArea
                                    rows={6}
                                    placeholder="Write your post content here..."
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    showCount
                                    maxLength={5000}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Form.Item
                                label="Post Status"
                                name="status"
                                validateStatus={errors.status ? 'error' : ''}
                                help={errors.status}
                                rules={[{ required: true, message: 'Please select a status!' }]}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select status"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                >
                                    {statusOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            <Space>
                                                {option.icon}
                                                {option.label}
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Featured Image"
                                validateStatus={errors.image ? 'error' : ''}
                                help={errors.image}
                            >
                                <div className="space-y-3">
                                    <Upload
                                        beforeUpload={handleImageUpload}
                                        accept="image/*"
                                        showUploadList={false}
                                        disabled={processing}
                                    >
                                        <Button 
                                            icon={<PictureOutlined />}
                                            block
                                            type="dashed"
                                        >
                                            {data.image || post.image ? 'Change Image' : 'Upload Image'}
                                        </Button>
                                    </Upload>

                                    {(imagePreview || post.image) && (
                                        <div className="border rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <Text strong>Image Preview</Text>
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    onClick={handleImageRemove}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            <img 
                                                src={imagePreview || `/storage/${post.image}`}
                                                alt="Preview" 
                                                className="w-full h-32 object-cover rounded"
                                            />
                                        </div>
                                    )}

                                    {data.image && (
                                        <div className="bg-blue-50 p-2 rounded">
                                            <Text type="secondary">
                                                New image: {data.image.name}
                                            </Text>
                                        </div>
                                    )}

                                    <Text type="secondary">
                                        Supported formats: JPEG, PNG, JPG, GIF | Max size: 2MB
                                    </Text>
                                </div>
                            </Form.Item>
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
                            >
                                Update Post
                            </Button>
                            
                            <Link href={route('admin.communities.index')}>
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