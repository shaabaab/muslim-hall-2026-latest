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
    DatePicker,
    Switch
} from 'antd';
import { 
    UserOutlined, 
    ArrowLeftOutlined,
    SaveOutlined,
    BulbOutlined,
    ClockCircleOutlined,
    SecurityScanOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Edit({ blockedip, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        ip_address: blockedip.ip_address,
        reason: blockedip.reason,
        blocked_until: blockedip.blocked_until ? dayjs(blockedip.blocked_until) : null,
        is_permanent: blockedip.is_permanent,
        blocked_by: blockedip.blocked_by,
        _method: 'PUT',
    });

    const submit = () => {
        put(route('admin.blockedips.update', blockedip.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Blocked IP updated successfully');
            },
            onError: () => {
                message.error('Error updating blocked IP');
            }
        });
    };

    const handleDateChange = (date) => {
        setData('blocked_until', date ? date.format('YYYY-MM-DD HH:mm:ss') : null);
    };

    const handlePermanentChange = (checked) => {
        setData('is_permanent', checked);
        // If permanent, clear the blocked_until date
        if (checked) {
            setData('blocked_until', null);
        }
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Blocked IP"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.blockedips.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Blocked IPs
                        </Button>
                    </Link>
                    <Title level={3}>
                        <SecurityScanOutlined className="mr-2" />
                        Edit Blocked IP: {blockedip.ip_address}
                    </Title>
                    <Text type="secondary">
                        Update blocked IP information
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="IP Address"
                        validateStatus={errors.ip_address ? 'error' : ''}
                        help={errors.ip_address}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter IP address (e.g., 192.168.1.1)"
                            value={data.ip_address}
                            onChange={(e) => setData('ip_address', e.target.value)}
                            prefix={<BulbOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Reason for Blocking"
                        validateStatus={errors.reason ? 'error' : ''}
                        help={errors.reason}
                    >
                        <TextArea
                            size="large"
                            rows={4}
                            placeholder="Enter reason for blocking this IP address"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Permanent Block"
                        validateStatus={errors.is_permanent ? 'error' : ''}
                        help={errors.is_permanent}
                    >
                        <div className="flex items-center">
                            <Switch
                                checked={data.is_permanent}
                                onChange={handlePermanentChange}
                                checkedChildren="Yes"
                                unCheckedChildren="No"
                            />
                            <Text type="secondary" className="ml-2">
                                If enabled, this IP will be blocked indefinitely
                            </Text>
                        </div>
                    </Form.Item>

                    {!data.is_permanent && (
                        <Form.Item
                            label="Block Until"
                            validateStatus={errors.blocked_until ? 'error' : ''}
                            help={errors.blocked_until}
                        >
                            <DatePicker
                                size="large"
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                placeholder="Select date and time"
                                value={data.blocked_until ? dayjs(data.blocked_until) : null}
                                onChange={handleDateChange}
                                disabledDate={(current) => {
                                    return current && current < dayjs().startOf('day');
                                }}
                                style={{ width: '100%' }}
                                suffixIcon={<ClockCircleOutlined />}
                            />
                        </Form.Item>
                    )}


                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Update Blocked IP
                            </Button>
                            <Link href={route('admin.blockedips.index')}>
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