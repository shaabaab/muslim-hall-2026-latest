import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Form,
    Input,
    Button,
    Checkbox,
    Card,
    Typography,
    Space,
    Divider,
    Alert,
    Layout,
    Flex,
    theme,
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    MailOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [form] = Form.useForm();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (values) => {
        post(route('login'));
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Head title="Log in" />
            
            <Content>
                <Flex 
                    justify="center" 
                    align="center" 
                    style={{ 
                        minHeight: '100vh',
                        padding: '20px'
                    }}
                >
                    <Card
                    className='login'
                        style={{
                            width: 400,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            border: 'none',
                            borderRadius: borderRadiusLG,
                        }}
                        bodyStyle={{
                            padding: '40px 32px',
                        }}
                    >
                        {/* Header Section */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{ 
                                marginBottom: 16,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <TeamOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                            </div>
                            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                                Welcome Back
                            </Title>
                            <Text type="secondary" style={{ marginTop: 8 }}>
                                Sign in to your account to continue
                            </Text>
                        </div>

                        {/* Status Alert */}
                        {status && (
                            <Alert
                                message={status}
                                type="success"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* Login Form */}
                        <Form
                            form={form}
                            name="login"
                            onFinish={submit}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                            size="large"
                            initialValues={{
                                remember: data.remember,
                            }}
                        >
                            <Form.Item
                                name="email"
                                validateStatus={errors.email ? 'error' : ''}
                                help={errors.email}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please input your email!',
                                    },
                                    {
                                        type: 'email',
                                        message: 'Please enter a valid email!',
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                                    placeholder="Email address"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    style={{
                                        height: '48px',
                                        borderRadius: '8px',
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                validateStatus={errors.password ? 'error' : ''}
                                help={errors.password}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please input your password!',
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                    placeholder="Password"
                                    iconRender={(visible) => 
                                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                                    }
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    style={{
                                        height: '48px',
                                        borderRadius: '8px',
                                    }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                        >
                                            Remember me
                                        </Checkbox>
                                    </Form.Item>
                                </div>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    block
                                    style={{
                                        height: '48px',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        border: 'none',
                                    }}
                                >
                                    {processing ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Flex>
            </Content>
        </Layout>
    );
}