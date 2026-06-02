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
    // PaletteOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth }) {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        min_amount: '',
        max_amount: '',
        color: '',
        status: '',
        lang_id: '',
    });

    const { langs = [] } = usePage().props; // safe default

    const submit = () => {
        console.log(data);

        post(route('admin.badges.store'), {
            onSuccess: () => {
                message.success('Badge created successfully');
            },
            onError: () => {
                message.error('Error creating Badge');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Badge"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.badges.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Badges
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Badge
                    </Title>
                    <Text type="secondary">
                        Add a new Badge to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
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
                        <Input
                            size="large"
                            placeholder="Enter color code (e.g., #FF5733)"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                            // prefix={<PaletteOutlined />}
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
                                Create Badge
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

