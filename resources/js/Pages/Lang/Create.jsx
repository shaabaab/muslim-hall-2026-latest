import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Row,
    Col,
    Typography, 
    Space,
    Switch,
    message
} from 'antd';
import { 
    UserOutlined, 
    ArrowLeftOutlined,
    SaveOutlined,
    CodeFilled,
    TranslationOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;

export default function Create({ auth }) {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        status: '',
    });

    const submit = () => {

        console.log(data);

        post(route('admin.langs.store'), {
            onSuccess: () => {
                message.success('Language created successfully');
            },
            onError: () => {
                message.error('Error creating language');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Language"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.langs.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Language
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Language
                    </Title>
                    <Text type="secondary">
                        Add a new language to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                     <Row gutter={24}>
                        <Col xs={24} lg={20}>
                    <Form.Item
                        label="Language Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                    <Input
                        size="large"
                        prefix={<TranslationOutlined />}
                        placeholder="Enter Language name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    </Form.Item>

                    <Form.Item
                        label="Language Code"
                        validateStatus={errors.code ? 'error' : ''}
                        help={errors.code}
                        required
                    >
                        <Input
                            size="large"
                            prefix={<CodeFilled />}
                            type="text"
                            placeholder="Enter Language code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                        />
                    </Form.Item>


                    <Form.Item
                        label="Language Status"
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



                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create Lang
                            </Button>
                            <Link href={route('admin.langs.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                    </Col>
                    </Row>
                </Form>
            </Card>
        </Authenticated>
    );
}