import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/FrontAuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Select, 
    Typography, 
    Space,
    message,
    Upload,
    Switch
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PauseOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_UPCOMING = 1;
const STATUS_RUNNING  = 2;
const STATUS_ENDED    = 3;
const STATUS_ARCHIVED = 4;

const statusOptions = [
    { value: STATUS_UPCOMING, label: 'Upcoming' },
    { value: STATUS_RUNNING,  label: 'Running' },
    { value: STATUS_ENDED,    label: 'Ended' },
    { value: STATUS_ARCHIVED, label: 'Holded' },
];

const paymentTypeOptions = [
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
];

const userTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'user', label: 'Users' },
    { value: 'member', label: 'Members' },
];

export default function Create({ auth, prizes ,sponsors, categories }) {

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description : '',
        start_date: '',
        end_date: '',
        category_id : '',
        prizes : [],
        sponsor_id: null,
    });

    // State for hold confirmation
    const [holdConfirmVisible, setHoldConfirmVisible] = useState(false);
    const getSponsors = () => Array.isArray(sponsors) ? sponsors : [];


    const submit = () => {
        post(route('user.contests.store'), {
            onSuccess: () => {
                message.success('Contest created successfully');
            },
            onError: () => {
                message.error('Error creating contest');
            }
        });
    };



    // Handle hold function
    const handleHold = (holdStatus) => {
        setData('is_on_hold', holdStatus);
        
        if (holdStatus) {
            message.warning('Contest will be created on hold');
        } else {
            message.info('Contest will be created as active');
        }
    };

    // Handle hold with confirmation
    const handleHoldWithConfirm = (holdStatus) => {
        if (holdStatus) {
            // Show confirmation for putting on hold
            setHoldConfirmVisible(true);
        } else {
            handleHold(false);
        }
    };

    // Confirm hold action
    const confirmHold = () => {
        handleHold(true);
        setHoldConfirmVisible(false);
        message.warning('Contest will be created on hold - users cannot participate');
    };

    // Cancel hold action
    const cancelHold = () => {
        setHoldConfirmVisible(false);
        setData('is_on_hold', false);
    };

    const quillModules = {
        toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
        ],
    };

    // Check if payment type is paid
    const isPaidContest = data.payment_type === 'paid';

    return (
        <Authenticated
            user={auth.user}
            header="Create Contest"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('user.contests.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Contests
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Contest
                    </Title>
                    <Text type="secondary">
                        Add a new contest to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Contest Title"
                        validateStatus={errors.title ? 'error' : ''}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Contest title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        validateStatus={errors.category_id ? 'error' : ''}
                        help={errors.category_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id}
                            onChange={(value) => setData('category_id', value)}
                        >
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Sponsor"
                        validateStatus={errors.sponsor_id ? 'error' : ''}
                        help={errors.sponsor_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Sponsor"
                            value={data.sponsor_id}
                            onChange={(value) => setData('sponsor_id', value)}
                            suffixIcon={<UserOutlined />}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            disabled={!getSponsors().length}
                        >
                            {getSponsors().map((sponsor) => (
                                <Option key={sponsor.id} value={sponsor.id}>
                                    {sponsor.name || `Sponsor #${sponsor.id}`}
                                </Option>
                            ))}
                        </Select>
                        {!getSponsors().length && (
                            <Text type="warning" className="text-xs">
                                No sponsors available.
                            </Text>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Prizes Poll Add"
                        validateStatus={errors.prizes ? 'error' : ''}
                        help={errors.prizes}
                        required
                    >
                        <Select
                            mode="multiple" 
                            size="large"
                            placeholder="Select Prizes"
                            value={data.prizes || []}
                            onChange={(value) => setData('prizes', value)}
                        >
                            {prizes.map((prize) => (
                                <Option key={prize.id} value={prize.id}>
                                    {prize.position} - {prize.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Contest Duration"
                        validateStatus={errors.start_date || errors.end_date ? 'error' : ''}
                        help={errors.start_date || errors.end_date}
                    >
                        <DatePicker.RangePicker
                            size="large"
                            style={{ width: '100%' }}
                            placeholder={['Start Date', 'End Date']}
                              dropdownClassName="contest-range-popup"
  getPopupContainer={() => document.body}
                            value={[
                                data.start_date ? dayjs(data.start_date) : null,
                                data.end_date ? dayjs(data.end_date) : null
                            ]}
                            onChange={(dates, dateStrings) => {
                                setData('start_date', dateStrings[0]);
                                setData('end_date', dateStrings[1]);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                        >
                        <ReactQuill
                            theme="snow"
                            value={data.description}
                            onChange={(value) => setData('description', value)}
                            placeholder="Write your description..."
                            modules={quillModules}
                            style={{
                                background: '#fff',
                                borderRadius: '8px',
                                height: '200px', 
                            }}
                        />
                    </Form.Item>

                    <br /><br />

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                {data.is_on_hold ? 'Create Contest (On Hold)' : 'Create Contest'}
                            </Button>
                            
                            <Button
                                type="default"
                                onClick={cancelHold}
                                size="large"
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>

                </Form>

                {/* Hold Confirmation Modal */}
                {holdConfirmVisible && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <Card 
                            title="Confirm Hold Contest" 
                            style={{ width: 400 }}
                            actions={[
                                <Button key="cancel" onClick={cancelHold}>
                                    Cancel
                                </Button>,
                                <Button key="confirm" type="primary" danger onClick={confirmHold}>
                                    Confirm Hold
                                </Button>
                            ]}
                        >
                            <Text>
                                Are you sure you want to create this contest on hold? 
                                Users will not be able to participate until you activate it.
                            </Text>
                        </Card>
                    </div>
                )}
            </Card>
        </Authenticated>
    );
}