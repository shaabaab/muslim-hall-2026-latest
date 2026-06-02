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


export default function Edit({ section, auth,langs }) {
    const { data, setData, put, processing, errors } = useForm({
        name: section.name,
        status: section.status,
        description: section.description,
        lang_id: section.lang_id,
    });

    const submit = () => {
        put(route('admin.sections.update', section.id), {
            onBefore: () => {
                console.log(data);
            },
            onSuccess: () => {
                message.success('Section updated successfully');
            },
            onError: () => {
                message.error('Error updating section');
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
                    <Link href={route('admin.sections.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Sections
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                <UserOutlined className="mr-2" />
                                Edit Section: {section.name}
                            </Title>
                            <Text type="secondary">
                                Update section information
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
                                    label="Section Name"
                                    validateStatus={errors.name ? 'error' : ''}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        size="large"
                                        placeholder="Enter section name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item label="Section Status">
                                    <Space>
                                        <Switch 
                                            checked={data.status}
                                            onChange={(checked) => setData('status', checked)}
                                        />
                                        <Text style={{ color: data.status == 1 ? 'green' : 'red' }}>
                                            {data.status ? 'Active' : 'Inactive'}
                                        </Text>
                                    </Space>
                                </Form.Item>


                                <Form.Item
                                    label="Language"
                                    validateStatus={errors.lang_id ? 'error' : ''}
                                    help={errors.lang_id}
                                    required
                                    >
                                    <Select
                                        size="large"
                                        placeholder="Select Language"
                                        value={data.lang_id}
                                        onChange={(value) => setData('lang_id', value)}
                                        suffixIcon={<CodeFilled />}
                                        selected={data.lang_id}
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {langs?.map((lang) => (
                                        <Select.Option  key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>



                                <Form.Item label="Section Description"
                                    validateStatus={errors.description ? 'error' : ''}
                                    help={errors.description}
                                    required >
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="Enter section description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
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
                                disabled={!data.name || !data.lang_id}
                            >
                                Update Section
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