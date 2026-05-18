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
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth, categories }) {
    
    
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        parent_id: '',
        description: '',
    });

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        post(route('admin.contest.category.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Contest category created successfully');
                setData({
                    name: '',
                    parent_id: '',
                    description: '',
                });
            },
            onError: (errors) => {
                message.error(errors.error || 'Error creating category');
            }
        });
    };



    return (
        <Authenticated
            user={auth.user}
            header="Create Contest Category" 
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.contest.category.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Categories
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Contest Category
                    </Title>
                    <Text type="secondary">
                        Add a new Contest category to your application
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
                            value={data.parent_id || undefined} 
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
                            <Link href={route('admin.contest.category.index')}>
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