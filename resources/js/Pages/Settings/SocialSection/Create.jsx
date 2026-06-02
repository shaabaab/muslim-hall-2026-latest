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
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({  auth }) {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        icon: '',
        url: '',
    });

    const { langs = [] } = usePage().props; // safe default

    const submit = () => {

        console.log(data);

        post(route('admin.settings.sociallinks.store'), {
            onSuccess: () => {
                message.success('Social link created successfully');
            },
            onError: () => {
                message.error('Error creating social link');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Social Link"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.settings.sociallinks.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Social Links
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Social Link
                    </Title>
                    <Text type="secondary">
                        Add a new social link to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >
                    <Form.Item
                        label="Social Link Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                    <Input
                        size="large"
                        placeholder="Enter Social Link name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}

                    />
                    </Form.Item>

                    <Form.Item
                        label="Social Link Icon(Optional)"
                        validateStatus={errors.icon ? 'error' : ''}
                        help={errors.icon}
                    >
                    <Input
                        size="large"
                        placeholder="Enter ant design icon class (e.g., FacebookOutlined)"
                        value={data.icon}
                        onChange={(e) => setData('icon', e.target.value)}
                    />
                    </Form.Item>

                    <Form.Item
                        label="Social Link URL"
                        validateStatus={errors.url ? 'error' : ''}
                        help={errors.url}
                        required
                    >
                    <Input
                        size="large"
                        placeholder="Enter Social Link URL"
                        value={data.url}
                        onChange={(e) => setData('url', e.target.value)}
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
                                Create Social Link
                            </Button>
                            <Link href={route('admin.settings.sociallinks.index')}>
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