import { useForm ,usePage } from '@inertiajs/react';
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
} from 'antd';
import { 
    TeamOutlined,
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

export default function Create({  auth }) {

    const [planFeatures, setplanFeatures] = useState(['']);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        status: '',
        validity: '',
        plan_type : '',
        price: '',
        features: []
    });

    const addKeywordField = (type) => {
            setplanFeatures([...planFeatures, '']);
    };

    const removeKeywordField = (index, type) => {
            const newKeywords = planFeatures.filter((_, i) => i !== index);
            setplanFeatures(newKeywords);
            setData('features', newKeywords.filter(kw => kw.trim() !== ''));
    };

    const handleKeywordChange = (value, index, type) => {
            const newKeywords = [...planFeatures];
            newKeywords[index] = value;
            setplanFeatures(newKeywords);
            setData('features', newKeywords.filter(kw => kw.trim() !== ''));
    };


    const submit = () => {

        console.log(data);

        post(route('admin.plans.store'), {
            onSuccess: () => {
                message.success('Plan created successfully');
            },
            onError: () => {
                message.error('Error creating plan');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Plan"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.plans.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Plans
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Plan
                    </Title>
                    <Text type="secondary">
                        Add a new plan to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Plan Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                    <Input
                        size="large"
                        placeholder="Enter Plan name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}

                    />
                    </Form.Item>


                    <Form.Item
                        label="Plan Type"
                        validateStatus={errors.plan_type ? 'error' : ''}
                        help={errors.plan_type}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select Plan Type"
                            value={data.plan_type}
                            onChange={(value) => setData({ ...data, plan_type: value })}
                        >
                            <Option value="1">Free</Option>
                            <Option value="2">Premium</Option>
                        </Select>

                    </Form.Item>

                    <Form.Item
                        label="Plan Validity (in days)"
                        validateStatus={errors.validity ? 'error' : ''}
                        help={errors.validity}
                        required
                    >
                        <Input
                            size="large"
                            type="number"
                            placeholder="Enter Plan validity in days"
                            value={data.validity}
                            onChange={(e) => setData('validity', e.target.value)}
                        />
                    </Form.Item>

                    
                    <Form.Item
                        label="Plan Price (in Tk)"
                        validateStatus={errors.price ? 'error' : ''}
                        help={errors.price}
                        required
                    >
                        <Input
                            size="large"
                            type="number"
                            placeholder="Enter Plan price in Tk"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                        />
                    </Form.Item>


                    <Form.Item
                        label="Plan Status"
                        validateStatus={errors.status ? 'error' : ''}
                        help={errors.status}
                        required
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
                        label="Plan Description"
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                        required
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Enter Plan description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Plan Features"
                        validateStatus={errors.features ? 'error' : ''}
                        help={errors.features}
                    >
                        <div className="space-y-2">
                            {planFeatures.map((keyword, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <Input
                                        placeholder="Enter Plan Features"
                                        value={keyword}
                                        onChange={(e) => handleKeywordChange(e.target.value, index, 'meta')}
                                    />
                                    {planFeatures.length > 1 && (
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
                                onClick={() => addKeywordField('features')}
                            >
                                Add Feature
                            </Button>
                        </div>
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
                                Create Plan
                            </Button>
                            <Link href={route('admin.plans.index')}>
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
