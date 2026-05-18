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
    Switch,
    InputNumber,
} from 'antd';
import { 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, badge }) { // Changed from 'bridge' to 'badge'

    const { data, setData, put, processing, errors } = useForm({
        name: badge?.name || '', // Added optional chaining
        min_amount: badge?.min_amount || '',
        max_amount: badge?.max_amount || '',
        color: badge?.color || '',
    });

    const { langs = [] } = usePage().props;

    const submit = () => {
        console.log(data);

        put(route('admin.badges.update', badge.id), { // Changed route to badges
            onSuccess: () => {
                message.success('Badge updated successfully'); // Updated message
            },
            onError: () => {
                message.error('Error updating badge'); // Updated message
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Badge" // Updated header
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.badges.index')}> 
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Badges 
                        </Button>
                    </Link>
                    <Title level={3}>
                        Edit Badge 
                    </Title>
                    <Text type="secondary">
                        Update badge information 
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                    initialValues={{
                        name: badge?.name,
                        min_amount: badge?.min_amount,
                        max_amount: badge?.max_amount,
                        color: badge?.color,
                    }}
                >
                    <Form.Item
                        label="Badge Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Badge name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled
                        />
                    </Form.Item>


                    <Form.Item
                        label="Minimum Amount"
                        validateStatus={errors.min_amount ? 'error' : ''}
                        help={errors.min_amount}
                        required
                    >
                        <InputNumber
                            size="large"
                            placeholder="Enter minimum amount"
                            value={data.min_amount}
                            onChange={(value) => setData('min_amount', value)}
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            prefix={<DollarOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Maximum Amount"
                        validateStatus={errors.max_amount ? 'error' : ''}
                        help={errors.max_amount}
                        required
                    >
                        <InputNumber
                            size="large"
                            placeholder="Enter maximum amount"
                            value={data.max_amount}
                            onChange={(value) => setData('max_amount', value)}
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            prefix={<DollarOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Color"
                        validateStatus={errors.color ? 'error' : ''}
                        help={errors.color}
                        required
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                                size="large"
                                placeholder="Enter color code (e.g., #FF5733)"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                            />
                            {data.color && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div 
                                        style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: 6,
                                            backgroundColor: data.color,
                                            border: '1px solid #d9d9d9',
                                        }}
                                    />
                                    <Text type="secondary">Color preview</Text>
                                </div>
                            )}
                        </Space>
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
                                Update Badge 
                            </Button>
                            <Link href={route('admin.badges.index')}>
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