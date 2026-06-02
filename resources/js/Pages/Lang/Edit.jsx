import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Typography, 
    Space,
    message,
    Row,
    Col,
    Switch
} from 'antd';
import { 
    UserOutlined, 
    CodeFilled, 
    TranslationOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;

export default function Edit({ lang, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        name: lang.name,
        code: lang.code,
        status: lang.status,
    });

    const submit = () => {
        put(route('admin.langs.update', lang.id), {
            onSuccess: () => {
                message.success('Language updated successfully');
            },
            onError: () => {
                message.error('Error updating language');
            }
        });
    };


    return (
        <Authenticated
            user={auth.user}
            header="Edit Language"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.langs.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Languages
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                <UserOutlined className="mr-2" />
                                Edit Language: {lang.name}
                            </Title>
                            <Text type="secondary">
                                Update language information
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
                                    label="Language Name"
                                    validateStatus={errors.name ? 'error' : ''}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        size="large"
                                        prefix={<TranslationOutlined />}
                                        placeholder="Enter language name"
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
                                        placeholder="Enter language code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item label="Lang Status">
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
                                disabled={!data.name || !data.code}
                            >
                                Update Lang
                            </Button>
                            <Link href={route('admin.langs.index')}>
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