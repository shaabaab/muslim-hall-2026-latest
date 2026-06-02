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
    Switch,
    Upload
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined 
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth, categories, langs }) {
    
    const [photoPreview, setPhotoPreview] = useState(null);
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        parent_id: '',
        img: null,
        lang_id: '',
        description: '',
        status: 0, // Default to inactive
    });

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        post(route('admin.categories.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Category created successfully');
                setData({
                    name: '',
                    parent_id: '',
                    img: null,
                    lang_id: '',
                    description: '',
                    status: 0,
                });
                setPhotoPreview(null);
            },
            onError: (errors) => {
                message.error(errors.img || 'Error creating category');
                console.log(errors.img);
            }
        });
    };

    const handlePhotoUpload = (file) => {
        setData('img', file);
        setPhotoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData('img', null);
        setPhotoPreview(null);
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Category" // Fixed header text
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.categories.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Categories
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Category
                    </Title>
                    <Text type="secondary">
                        Add a new category to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Category Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Category name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category Parent"
                        validateStatus={errors.parent_id ? 'error' : ''}
                        help={errors.parent_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Parent Category"
                            value={data.parent_id || undefined} // Handle empty value
                            onChange={(value) => setData('parent_id', value)}
                            suffixIcon={<TeamOutlined />}
                            allowClear
                        >
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Language"
                        validateStatus={errors.lang_id ? 'error' : ''}
                        help={errors.lang_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Language"
                            value={data.lang_id || undefined} // Handle empty value
                            onChange={(value) => setData('lang_id', value)}
                            suffixIcon={<TeamOutlined />}
                            allowClear
                        >
                            {langs.map((lang) => (
                                <Option key={lang.id} value={lang.id}>
                                    {lang.name} ({lang.code})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Category Status"
                        validateStatus={errors.status ? 'error' : ''}
                        help={errors.status}
                    >
                        <Space>
                            <Switch
                                checked={data.status == 1}
                                onChange={(checked) => setData('status', checked ? 1 : 0)}
                            />
                            <Text style={{ color: data.status == 1 ? 'green' : 'red' }}>
                                {data.status == 1 ? 'Active' : 'Inactive'}
                            </Text>
                        </Space>
                    </Form.Item>

                    <Form.Item
                        label="Category Image"
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
                            <Button icon={<PictureOutlined />}>Select Photo</Button>
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
                        label="Category Description"
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                    >
                         <Input.TextArea
                            size="large"
                            rows={4}
                            placeholder="Enter Category Description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
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
                                Create Category
                            </Button>
                            <Link href={route('admin.categories.index')}>
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