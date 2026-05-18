import { useState } from 'react'; // Add this import at the top
import { useForm } from '@inertiajs/react';
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
    Divider
} from 'antd';
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ contests, auth }) {
    const [prizeSections, setPrizeSections] = useState([0]); // Start with one section

    const { data, setData, post, processing, errors } = useForm({
        prizes: [{
            position: '',
            description: '',
            amount: '',
            contest_id: '',
        }]
    });

    // Add a new prize section
    const addPrizeSection = () => {
        const newIndex = prizeSections.length;
        setPrizeSections([...prizeSections, newIndex]);
        
        // Add new empty prize data
        const updatedPrizes = [...data.prizes, {
            position: '',
            description: '',
            amount_normal_user: '',
            amount_premium_user: '',
        }];
        setData('prizes', updatedPrizes);
    };

    // Remove a prize section
    const removePrizeSection = (index) => {
        if (prizeSections.length === 1) {
            message.warning('At least one prize section is required');
            return;
        }

        const updatedSections = prizeSections.filter((_, i) => i !== index);
        setPrizeSections(updatedSections);

        // Remove corresponding prize data
        const updatedPrizes = data.prizes.filter((_, i) => i !== index);
        setData('prizes', updatedPrizes);
    };

    // Update specific prize data
    const updatePrizeData = (index, field, value) => {
        const updatedPrizes = [...data.prizes];
        updatedPrizes[index] = {
            ...updatedPrizes[index],
            [field]: value
        };
        setData('prizes', updatedPrizes);
    };

    const submit = () => {
        console.log('Submitting prizes:', data.prizes);

        post(route('admin.prizes.store'), {
            onSuccess: () => {
                message.success('Prizes created successfully');
            },
            onError: (errors) => {
                console.error('Error creating prizes:', errors);
                message.error('Error creating prizes');
            }
        });
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

    return (
        <Authenticated
            user={auth.user}
            header="Create Prizes"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.prizes.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Prizes
                        </Button>
                    </Link>
                    <Title level={3}>
                        Create Multiple Prizes
                    </Title>
                    <Text type="secondary">
                        Add multiple prizes to your application
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >
                    {prizeSections.map((section, index) => (
                        <div key={index} className="prize-section mb-8 p-4 border rounded-lg relative">
                            {/* Remove button */}
                            {prizeSections.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removePrizeSection(index)}
                                    className="absolute top-2 right-2"
                                    size="small"
                                >
                                    Remove
                                </Button>
                            )}

                            <Title level={4} className="mb-4">
                                Prize #{index + 1}
                            </Title>

                            <Form.Item
                                label="Position Title"
                                validateStatus={errors[`prizes.${index}.position`] ? 'error' : ''}
                                help={errors[`prizes.${index}.position`]}
                                required
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter Position title"
                                    value={data.prizes[index]?.position || ''}
                                    onChange={(e) => updatePrizeData(index, 'position', e.target.value)}
                                />
                            </Form.Item>


                            <Form.Item
                                label="Amount Normal Users"
                                validateStatus={errors[`prizes.${index}.amount_normal_user`] ? 'error' : ''}
                                help={errors[`prizes.${index}.amount_normal_user`]}
                                required
                            >
                                <Input
                                    size="large"
                                    type="number"
                                    placeholder="Enter Normal Users Amount"
                                    value={data.prizes[index]?.amount_normal_user || ''}
                                    onChange={(e) => updatePrizeData(index, 'amount_normal_user', e.target.value)}
                                />
                            </Form.Item>


                            <Form.Item
                                label="Amount Premium Users"
                                validateStatus={errors[`prizes.${index}.amount_premium_user`] ? 'error' : ''}
                                help={errors[`prizes.${index}.amount_premium_user`]}
                                required
                            >
                                <Input
                                    size="large"
                                    type="number"
                                    placeholder="Enter Premium Users Amount"
                                    value={data.prizes[index]?.amount_premium_user || ''}
                                    onChange={(e) => updatePrizeData(index, 'amount_premium_user', e.target.value)}
                                />
                            </Form.Item>


                            <Form.Item
                                label="Description"
                                validateStatus={errors[`prizes.${index}.description`] ? 'error' : ''}
                                help={errors[`prizes.${index}.description`]}
                            >
                                <ReactQuill
                                    theme="snow"
                                    value={data.prizes[index]?.description || ''}
                                    onChange={(value) => updatePrizeData(index, 'description', value)}
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
                        </div>
                    ))}

                    {/* Add More Prize Button */}
                    <div className="mb-6">
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={addPrizeSection}
                            block
                            size="large"
                        >
                            Add Another Prize
                        </Button>
                    </div>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create All Prizes ({prizeSections.length})
                            </Button>
                            <Link href={route('admin.prizes.index')}>
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