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
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;

export default function Edit({ auth, contactInfo }) {
    const { data, setData, put, processing, errors } = useForm({
        phone_one: contactInfo.phone_one || '',
        phone_two: contactInfo.phone_two || '',
        email_one: contactInfo.email_one || '',
        email_two: contactInfo.email_two || '',
        street: contactInfo.address?.street || '',
        state: contactInfo.address?.state || '',
        city: contactInfo.address?.city || '',
        zip: contactInfo.address?.zip || '',
    });

    const submit = () => {
        put(route('admin.settings.contactinfo.update', contactInfo.id), {
            onSuccess: () => {
                message.success('Contact information updated successfully!');
            },
            onError: () => {
                message.error('Error updating contact information');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Contact Information"
        >
            <Card 
                className="shadow-md"
                styles={{
                    body: {
                        padding: '24px',
                    }
                }}
            >
                <div className="mb-6">
                    <Link href={route('admin.settings.contactinfo.index')}>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            type="text" 
                            className="mb-4"
                        >
                            Back to Contact Info List
                        </Button>
                    </Link>
                    <Title level={3} className="text-gray-800">
                        Edit Contact Information
                    </Title>
                    <Text type="secondary" className="text-base">
                        Update the contact information for your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    {/* Phone Information Section */}
                    <Card 
                        title={
                            <span className="text-blue-600 font-semibold">
                                <PhoneOutlined className="mr-2" />
                                Phone Information
                            </span>
                        }
                        className="mb-6"
                        styles={{
                            header: {
                                borderBottom: '2px solid #f0f0f0',
                                padding: '16px 24px',
                            }
                        }}
                    >
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Primary Phone Number"
                                    validateStatus={errors.phone_one ? 'error' : ''}
                                    help={errors.phone_one}
                                    required
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="+1 (555) 123-4567"
                                        prefix={<PhoneOutlined className="text-blue-500" />}
                                        value={data.phone_one}
                                        onChange={(e) => setData('phone_one', e.target.value)}
                                        className="hover:border-blue-400 transition-colors duration-200"
                                    />
                                    <Text type="secondary" className="text-sm mt-1 block">
                                        This will be the primary contact number displayed on the website.
                                    </Text>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Secondary Phone Number"
                                    validateStatus={errors.phone_two ? 'error' : ''}
                                    help={errors.phone_two}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="+1 (555) 987-6543"
                                        prefix={<PhoneOutlined className="text-green-500" />}
                                        value={data.phone_two}
                                        onChange={(e) => setData('phone_two', e.target.value)}
                                        className="hover:border-green-400 transition-colors duration-200"
                                    />
                                    <Text type="secondary" className="text-sm mt-1 block">
                                        This will be the secondary contact number displayed on the website.
                                    </Text>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Email Information Section */}
                    <Card 
                        title={
                            <span className="text-green-600 font-semibold">
                                <MailOutlined className="mr-2" />
                                Email Information
                            </span>
                        }
                        className="mb-6"
                        styles={{
                            header: {
                                borderBottom: '2px solid #f0f0f0',
                                padding: '16px 24px',
                            }
                        }}
                    >
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Primary Email Address"
                                    validateStatus={errors.email_one ? 'error' : ''}
                                    help={errors.email_one}
                                    required
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="contact@company.com"
                                        prefix={<MailOutlined className="text-green-500" />}
                                        value={data.email_one}
                                        onChange={(e) => setData('email_one', e.target.value)}
                                        className="hover:border-green-400 transition-colors duration-200"
                                    />
                                    <Text type="secondary" className="text-sm mt-1 block">
                                        This will be the primary email displayed on the website.
                                    </Text>
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Secondary Email Address"
                                    validateStatus={errors.email_two ? 'error' : ''}
                                    help={errors.email_two}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="info@company.com"
                                        prefix={<MailOutlined className="text-orange-500" />}
                                        value={data.email_two}
                                        onChange={(e) => setData('email_two', e.target.value)}
                                        className="hover:border-orange-400 transition-colors duration-200"
                                    />
                                    <Text type="secondary" className="text-sm mt-1 block">
                                        This will be the secondary email displayed on the website.
                                    </Text>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Address Information Section */}
                    <Card 
                        title={
                            <span className="text-purple-600 font-semibold">
                                <EnvironmentOutlined className="mr-2" />
                                Address Information
                            </span>
                        }
                        className="mb-6"
                        styles={{
                            header: {
                                borderBottom: '2px solid #f0f0f0',
                                padding: '16px 24px',
                            }
                        }}
                    >
                        <Row gutter={[24, 16]}>
                            <Col xs={24}>
                                <Form.Item
                                    label="Street Address"
                                    validateStatus={errors.street ? 'error' : ''}
                                    help={errors.street}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="123 Main Street"
                                        prefix={<EnvironmentOutlined className="text-purple-500" />}
                                        value={data.street}
                                        onChange={(e) => setData('street', e.target.value)}
                                        className="hover:border-purple-400 transition-colors duration-200"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="City"
                                    validateStatus={errors.city ? 'error' : ''}
                                    help={errors.city}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="New York"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        className="hover:border-blue-400 transition-colors duration-200"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="State"
                                    validateStatus={errors.state ? 'error' : ''}
                                    help={errors.state}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="NY"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        className="hover:border-blue-400 transition-colors duration-200"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="ZIP Code"
                                    validateStatus={errors.zip ? 'error' : ''}
                                    help={errors.zip}
                                    className="font-semibold"
                                >
                                    <Input
                                        size="large"
                                        placeholder="10001"
                                        value={data.zip}
                                        onChange={(e) => setData('zip', e.target.value)}
                                        className="hover:border-blue-400 transition-colors duration-200"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Action Buttons */}
                    <Card className="bg-gray-50 border-0">
                        <Form.Item>
                            <Space size="middle">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    icon={<SaveOutlined />}
                                    size="large"
                                    className="bg-blue-600 hover:bg-blue-700 border-0 font-semibold"
                                >
                                    Update Contact Information
                                </Button>
                                <Link href={route('admin.settings.contactinfo.index')}>
                                    <Button 
                                        size="large"
                                        className="font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </Space>
                        </Form.Item>
                    </Card>
                </Form>
            </Card>
        </Authenticated>
    );
}