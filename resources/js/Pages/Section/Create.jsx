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

export default function Create({  auth }) {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        status: '',
        lang_id: '',
    });

    const { langs = [] } = usePage().props; // safe default

    const submit = () => {

        console.log(data);

        post(route('admin.sections.store'), {
            onSuccess: () => {
                message.success('Section created successfully');
            },
            onError: () => {
                message.error('Error creating section');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Section"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.sections.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Sections
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create New Section
                    </Title>
                    <Text type="secondary">
                        Add a new section to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >
                    <Form.Item
                        label="Section Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                    <Input
                        size="large"
                        placeholder="Enter Section name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}

                    />
                    </Form.Item>


                    <Form.Item
                        label="Section Status"
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


                    <Form.Item
                        label="Language Code"
                        validateStatus={errors.lang_id ? 'error' : ''}
                        help={errors.lang_id}
                        required
                        >
                        <Select
                            size="large"
                            placeholder="Select Language Code"
                            value={data.lang_id}
                            onChange={(value) => setData({ ...data, lang_id: value })}
                            suffixIcon={<TeamOutlined />}
                        >
                            {langs.map((lang) => (
                            <Option key={lang.id} value={lang.id}>
                                {lang.name} ({lang.code})
                            </Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Section Description"
                        validateStatus={errors.description ? 'error' : ''}
                        help={errors.description}
                        required
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Enter Section description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
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
                                Create Section
                            </Button>
                            <Link href={route('admin.sections.index')}>
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