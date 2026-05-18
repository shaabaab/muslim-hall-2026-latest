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
    Switch,
    Upload
} from 'antd';
import { 
    UserOutlined, 
    MailOutlined,
    PhoneOutlined,
    LockOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined 
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SponsorForm({ auth, sponsor = null, isEdit = false }) {
    
    const [photoPreview, setPhotoPreview] = useState(null);
    
    const { data, setData, post, put, processing, errors } = useForm({
        name: sponsor?.name || '',
        email: sponsor?.email || '',
        website: sponsor?.website || '',
        password: '',
        password_confirmation: '',
        phone: sponsor?.phone || '',
        phone_alternative: sponsor?.phone_alternative || '',
        photo: null,
    });

    // Set photo preview if editing and sponsor has photo
    useEffect(() => {
        if (isEdit && sponsor?.photo) {
            setPhotoPreview(`/storage/${sponsor.photo}`);
        }
    }, [isEdit, sponsor]);

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                // For password, only include if not empty (in edit mode)
                if (key === 'password' && isEdit && !data[key]) {
                    return; // Skip password if empty in edit mode
                }
                formData.append(key, data[key]);
            }
        });

        const url = isEdit 
            ? route('user.sponsors.update', sponsor.id)
            : route('user.sponsors.store');

        const method = isEdit ? put : post;

        method(url, {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success(`Sponsor ${isEdit ? 'updated' : 'created'} successfully`);
                if (!isEdit) {
                    // Reset form for create mode
                    setData({
                        name: '',
                        email: '',
                        password: '',
                        password_confirmation: '',
                        phone: '',
                        phone_alternative: '',
                        photo: null,
                    });
                    setPhotoPreview(null);
                }
            },
            onError: (errors) => {
                message.error('Error processing request');
                console.log(errors);
            }
        });
    };

    const handlePhotoUpload = (file) => {
        setData('photo', file);
        setPhotoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData('photo', null);
        setPhotoPreview(null);
    };

    const pageTitle = isEdit ? 'Edit Sponsor' : 'Create New Sponsor';
    const submitButtonText = isEdit ? 'Update Sponsor' : 'Create Sponsor';

    return (
        <Authenticated
            user={auth.user}
            header={pageTitle}
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('user.sponsors.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Sponsors
                        </Button>
                    </Link>
                    <Title level={3}>
                        {pageTitle}
                    </Title>
                    <Text type="secondary">
                        {isEdit 
                            ? `Update sponsor information for ${sponsor?.name}`
                            : 'Add a new sponsor to your application'
                        }
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Sponsor Name"
                        validateStatus={errors.name ? 'error' : ''}
                        help={errors.name}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter sponsor name"
                            prefix={<UserOutlined />}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Email Address"
                        validateStatus={errors.email ? 'error' : ''}
                        help={errors.email}
                       
                    >
                        <Input
                            size="large"
                            type="email"
                            placeholder="Enter email address"
                            prefix={<MailOutlined />}
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={isEdit} 
                        />
                    </Form.Item>

                        <Form.Item
                            label="Website"
                            validateStatus={errors.website ? 'error' : ''}
                            help={errors.website}
                            required
                        >
                            <Input
                                size="large"
                                type="url"
                                placeholder="Enter website URL"
                                prefix={<MailOutlined />}
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                                disabled={isEdit} 
                            />
                        </Form.Item>
                  

                    {!isEdit && (
                        <>
                            <Form.Item
                                label="Password"
                                validateStatus={errors.password ? 'error' : ''}
                                help={errors.password}
                             
                            >
                                <Input.Password
                                    size="large"
                                    placeholder="Enter password"
                                    prefix={<LockOutlined />}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Confirm Password"
                                validateStatus={errors.password_confirmation ? 'error' : ''}
                                help={errors.password_confirmation}
                             
                            >
                                <Input.Password
                                    size="large"
                                    placeholder="Confirm password"
                                    prefix={<LockOutlined />}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                            </Form.Item>
                        </>
                    )}

                    {isEdit && (
                        <Form.Item
                            label="New Password"
                            validateStatus={errors.password ? 'error' : ''}
                            help={errors.password}
                        >
                            <Input.Password
                                size="large"
                                placeholder="Leave blank to keep current password"
                                prefix={<LockOutlined />}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <Text type="secondary" className="block mt-1">
                                Leave blank if you don't want to change the password
                            </Text>
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Phone Number"
                        validateStatus={errors.phone ? 'error' : ''}
                        help={errors.phone}
                    >
                        <Input
                            size="large"
                            placeholder="Enter phone number"
                            prefix={<PhoneOutlined />}
                            type='tel'
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Alternative Phone Number"
                        validateStatus={errors.phone_alternative ? 'error' : ''}
                        help={errors.phone_alternative}
                    >
                        <Input
                            size="large"
                            type='tel'
                            placeholder="Enter alternative phone number"
                            prefix={<PhoneOutlined />}
                            value={data.phone_alternative}
                            onChange={(e) => setData('phone_alternative', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Sponsor Photo"
                        validateStatus={errors.photo ? 'error' : ''}
                        help={errors.photo}
                    >
                        <Upload
                            beforeUpload={handlePhotoUpload}
                            onRemove={handlePhotoRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>
                                {photoPreview ? 'Change Photo' : 'Select Photo'}
                            </Button>
                        </Upload>
                        
                        {photoPreview && (
                            <div className="mt-2">
                                <img 
                                    src={photoPreview} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '200px', 
                                        maxHeight: '200px',
                                        borderRadius: '8px'
                                    }}
                                    className="mt-2"
                                />
                            </div>
                        )}
                        
                        {data.photo && typeof data.photo === 'object' && (
                            <Text type="secondary" className="block mt-2">
                                Selected: {data.photo.name}
                            </Text>
                        )}
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
                                {submitButtonText}
                            </Button>
                            <Link href={route('user.sponsors.index')}>
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