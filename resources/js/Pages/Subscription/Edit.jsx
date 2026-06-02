import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Select, 
    Typography, 
    Space,
    message,
    Col,
    Spin,
    Alert
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, subscription, plans = [], users = [] }) {
    // Initialize form with subscription data or empty values
    const { data, setData, put, processing, errors } = useForm({
        plan_id: subscription?.plan_id || '',
        user_id: subscription?.user_id || '',
        email: subscription?.user?.email || '',
        payment_method: subscription?.payment_method || '',
        transaction_id: subscription?.transaction_id || '',
    });

    const submit = () => {
        put(route('admin.subscriptions.update', subscription.id), {
            onSuccess: () => {
                message.success('Subscription updated successfully');
            },
            onError: () => {
                message.error('Failed to update subscription');
            }
        });
    };

    // Show loading state if data is not available
    if (!subscription) {
        return (
            <AuthenticatedLayout user={auth.user} header="Renew Subscription">
                <Card>
                    <div className="text-center">
                        <Spin size="large" />
                        <Text>Loading subscription data...</Text>
                    </div>
                </Card>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Renew Subscription"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.subscriptions.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Subscriptions
                        </Button>
                    </Link>
                    <Title level={3}>
                        Renew Subscription   
                    </Title>
                    <Text type="secondary">
                       <strong>Current Plan:</strong> {subscription.plan.name} -- ({subscription.plan.validity} days - Tk {subscription.plan.price}) <br />
                       <strong>Renew subscription for</strong>  {` ${subscription.user.name} (${subscription.user.email})`}
                    </Text>
                </div>

                {(plans.length === 0 || subscription.user.length === 0) && (
                    <Alert
                        message="Missing Data"
                        description="Plans or users data is not available. Please check your backend response."
                        type="warning"
                        showIcon
                        className="mb-4"
                    />
                )}

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >
                    <span>{errors.user}</span>

                    <Col span={24}>
                      <Form.Item
                            label="Plan Assigned To"
                            validateStatus={errors.plan_id ? 'error' : ''}
                            help={errors.plan_id}
                            required
                        >
                            <Select
                                size="large"
                                placeholder="Select Plan"
                                // value={data.plan_id || undefined}
                                value={plans.find(plan => plan.id == subscription.plan_id)?.name}
                                onChange={(value) => setData('plan_id', value)}
                                disabled={true}   
                            >
                                {plans.map((plan) => (
                                    <Option key={plan.id} value={plan.id}>
                                        <strong>{plan.name}</strong> - ( Tk {plan.price} - {plan.validity} days)
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>


                        {/* <Form.Item
                            label="User Assigned To (Selected)"
                            validateStatus={errors.user_id ? 'error' : ''}
                            help={errors.user_id}
                            required
                        >
                            <Select
                                size="large"
                                placeholder="Select User"
                                value={data.user_id || undefined}
                                onChange={(value) => setData('user_id', value)}
                                disabled={users.length === 0}
                            >
                                {users.map((user) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </Option>
                                ))}
                            </Select>
                            {users.length === 0 && (
                                <Text type="danger">No users available</Text>
                            )}
                        </Form.Item> */}

                        <Form.Item
                            label="User Assigned To (Manual)"
                            validateStatus={errors.email ? 'error' : ''}
                            help={errors.email}
                        >
                            <Input
                                type="email"
                                size="large"
                                placeholder="Enter User Email"
                                value={data.email || ''}
                                disabled={true}  
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <h4>Payment Information</h4>
                        <Form.Item
                            label="Payment Method"
                            validateStatus={errors.payment_method ? 'error' : ''}
                            help={errors.payment_method}
                            required
                        >
                            <Select
                                size="large"
                                placeholder="Select Payment Method"
                                value={data.payment_method || undefined}
                                onChange={(value) => setData('payment_method', value)}
                            >
                                <Option value="cash">Cash</Option>
                                <Option value="bikash">Bikash</Option>
                                <Option value="nagad">Nagad</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Transaction ID"
                            validateStatus={errors.transaction_id ? 'error' : ''}
                            help={errors.transaction_id}
                            required
                        >
                            <Input
                                size="large"
                                placeholder="Enter Transaction ID : muslimhall-digitcode"
                                value={data.transaction_id || ''}
                                onChange={(e) => setData('transaction_id', e.target.value)}
                            />
                        </Form.Item>
                    </Col>

                  

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Renew Subscription
                            </Button>
                            <Link href={route('admin.subscriptions.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </AuthenticatedLayout>
    );
}