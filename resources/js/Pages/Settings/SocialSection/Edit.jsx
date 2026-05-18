import { useForm , usePage} from '@inertiajs/react';
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
    Tag,
    Alert,
    Switch
} from 'antd';

import { 
    UserOutlined, 
    MailOutlined, 
    CodeFilled,
    ArrowLeftOutlined,
    SaveOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';

import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;
// const { langs = [] } = usePage().props;


export default function Edit({ socialLink, auth,langs }) {
    const { data, setData, put, processing, errors } = useForm({
        name: socialLink.name,
        url: socialLink.url,
        icon: socialLink.icon,
    });

    const submit = () => {
        put(route('admin.settings.sociallinks.update', socialLink.id), {
            onBefore: () => {
                console.log(data);
            },
            onSuccess: () => {
                message.success('Social Link updated successfully');
            },
            onError: () => {
                message.error('Error updating Social Link');
            }
        });
    };


    return (
        <Authenticated
            user={auth.user}
            header="Edit Section"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.settings.sociallinks.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Social Links
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                Edit Social Link: {socialLink.name}
                            </Title>
                            <Text type="secondary">
                                Update social link information
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
                                    label="Social Link Name"
                                    validateStatus={errors.name ? 'error' : ''}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        size="large"
                                        placeholder="Enter social link name"
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
                                        placeholder="Enter social link icon"
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
                                        placeholder="Enter social link URL"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                    />
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
                                disabled={!data.name || !data.url}
                            >
                                Update Social Link
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