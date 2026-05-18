import { useForm } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';
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
    Upload
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined 
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth, plans, users }) {
    
    
    const { data, setData, post, processing, errors } = useForm({
        plan_id : '',
        payment_method : '',
        transaction_id : ''
    });


    const STATUS_ACTIVE = 1;
    const STATUS_EXPIRED = 2;
    const STATUS_CANCELLED = 3;
    const STATUS_PENDING = 4;

    const statusOptions = [
        { label: 'Active', value: STATUS_ACTIVE },
        { label: 'Expired', value: STATUS_EXPIRED },
        { label: 'Cancelled', value: STATUS_CANCELLED },
        { label: 'Pending', value: STATUS_PENDING },
    ];

    const submit = () => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    post(route('user.subscriptions.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Subscription created & Payment recorded successfully');
                setData({
                    plan_id: '',
                    payment_method: '',
                    transaction_id: ''
                });
            },
            onError: (errors) => {
                console.log(errors);
                message.error(errors.user_id || 'Failed to create subscription');
            }
        });
    };

  

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Add Subscription" 
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('user.subscriptions.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Subscription
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Subscription
                    </Title>
                    <Text type="secondary">
                        Add a new Subscription to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Col span={24} >


                        <Form.Item
                            label="Plan Assigned To"
                            validateStatus={errors.plan_id ? 'error' : ''}
                            help={errors.plan_id}
                            required
                        >
                            <Select
                                size="large"
                                placeholder="Select Plan"
                                value={data.plan_id || undefined} 
                                onChange={(value) => setData('plan_id', value)}
                            >
                                {plans.map((plan) => (
                                    <Option key={plan.id} value={plan.id}>
                                    <strong>{plan.name} </strong>  - ( Tk {plan.price} - {plan.validity} days)
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>


                    <Col span={24} >

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
                                placeholder="Enter Transaction ID"
                                value={data.transaction_id || ''}
                                onChange={(e) => setData('transaction_id', e.target.value)}
                            />
                        </Form.Item>

                    </Col>


                    {/* <Form.Item
                        label="Subscription Status"
                        validateStatus={errors.status ? 'error' : ''}
                        help={errors.status}
                    >
                        {statusOptions.map(option => (
                            <Button
                                key={option.value}
                                className='gap-2 mr-2 mb-2'
                                type={data.status === option.value ? 'primary' : 'default'}
                                onClick={() => setData('status', option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </Form.Item> */}


                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create Subscription
                            </Button>
                            <Link href={route('user.subscriptions.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>

                </Form>
            </Card>
        </FrontAuthenticatedLayout>
    );
}