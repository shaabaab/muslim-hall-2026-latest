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

export default function Create({contests, auth }) {

    const { data, setData, post, processing, errors } = useForm({
        summary: '',
        contest_id: '',
    });


    const submit = () => {

        console.log(data);

        post(route('admin.archived.store'), {
            onSuccess: () => {
                message.success('Contest archived successfully');
            },
            onError: () => {
                message.error('Error archived contest');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Contest archived Section"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.archived.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Archived Contest
                        </Button>
                    </Link>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >
                    
                    <Form.Item
                        label="Select Contest"
                        validateStatus={errors.contest_id ? 'error' : ''}
                        help={errors.contest_id}
                        required
                        >
                        <Select
                            size="large"
                            placeholder="Select Contest"
                            value={data.contest_id}
                            onChange={(value) => setData({ ...data, contest_id: value })}
                            suffixIcon={<TeamOutlined />}
                        >
                            {contests.map((contest) => (
                            <Option key={contest.id} value={contest.id}>
                                {contest.title} 
                            </Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Contest archived summary"
                        validateStatus={errors.summary ? 'error' : ''}
                        help={errors.summary}
                        required
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Enter Contest archived summary"
                            value={data.summary}
                            onChange={(e) => setData('summary', e.target.value)}
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
                                Archived Contest
                            </Button>
                            <Link href={route('admin.archived.index')}>
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