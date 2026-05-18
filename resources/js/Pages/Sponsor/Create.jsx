import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Typography, 
    Space,
    message,
    Upload
} from 'antd';
import { 
    UserOutlined, 
    MailOutlined,
    PhoneOutlined,
    LockOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined,
    GlobalOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

export default function SponsorForm({ auth, sponsor = null, isEdit = false }) {
    
    const [photoPreview, setPhotoPreview] = useState(null);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: sponsor?.name || '',
        email: sponsor?.email || '',
        website: sponsor?.website || '',
        password: '',
        password_confirmation: '',
        phone_alternative: sponsor?.phone_alternative || '',
        photo: null,
        remove_photo: false,
        _method: isEdit ? 'PUT' : 'POST',
    });

    // Set photo preview if editing and sponsor has photo
    useEffect(() => {
        if (isEdit && sponsor?.photo) {
            setPhotoPreview(`/storage/${sponsor.photo}`);
        }
    }, [isEdit, sponsor]);

    const submit = () => {
        console.log('Submitting data at create:', data);

        if (isEdit) {
            // For editing, use post with _method: 'PUT' for multipart/form-data compatibility
            post(route('admin.sponsors.update', sponsor.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    message.success('Sponsor updated successfully');
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    message.error('Please check the form for errors');
                }
            });
        } else {
            post(route('admin.sponsors.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    message.success('Sponsor created successfully');
                    reset();
                    setPhotoPreview(null);
                },
                onError: (errors) => {
                    console.error('Create errors:', errors);
                    message.error('Please check the form for errors');
                }
            });
        }
    };

    const handlePhotoUpload = (file) => {
        console.log('File selected:', file);
        
        // Validate file type
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        // Validate file size (2MB)
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }

        setData(data => ({
            ...data,
            photo: file,
            remove_photo: false
        }));
        setPhotoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData(data => ({
            ...data,
            photo: null,
            remove_photo: sponsor?.photo ? true : false
        }));
        setPhotoPreview(null);
    };

    const pageTitle = isEdit ? `Edit Sponsor - ${sponsor?.name}` : 'Create New Sponsor';
    const submitButtonText = isEdit ? 'Update Sponsor' : 'Create Sponsor';

    return (
        <Authenticated
            user={auth.user}
            header={pageTitle}
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.sponsors.index')}>
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
                            readOnly={isEdit}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {isEdit && (
                            <Text type="secondary" className="block mt-1">
                                Email cannot be changed once the sponsor is created
                            </Text>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Website"
                        validateStatus={errors.website ? 'error' : ''}
                        help={errors.website}
                    >
                        <Input
                            size="large"
                            type="url"
                            placeholder="https://example.com"
                            prefix={<GlobalOutlined />}
                            value={data.website}
                            onChange={(e) => setData('website', e.target.value)}
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
                        <div className="space-y-4">
                            <Upload
                                beforeUpload={handlePhotoUpload}
                                accept="image/*"
                                showUploadList={false}
                                listType="picture"
                            >
                                <Button icon={<PictureOutlined />}>
                                    {photoPreview || sponsor?.photo ? 'Change Photo' : 'Select Photo'}
                                </Button>
                            </Upload>

                            {/* Photo Preview */}
                            {(photoPreview || (sponsor?.photo && !data.remove_photo)) && (
                                <div className="border border-dashed border-gray-300 rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <Text strong>Photo Preview</Text>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={handlePhotoRemove}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <img 
                                        src={photoPreview || `/storage/${sponsor.photo}`} 
                                        alt="Preview" 
                                        className="w-full h-48 object-cover rounded"
                                    />
                                </div>
                            )}

                            {/* Remove Photo Info */}
                            {data.remove_photo && sponsor?.photo && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                    <Text type="secondary" className="text-xs">
                                        Existing photo will be removed on save
                                    </Text>
                                </div>
                            )}

                            {/* File Info */}
                            {data.photo && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                    <Text type="secondary" className="text-xs">
                                        <strong>New file:</strong> {data.photo.name}
                                    </Text>
                                </div>
                            )}

                            <div className="bg-gray-50 border border-gray-200 rounded p-3">
                                <Text type="secondary" className="text-xs block">
                                    <strong>Supported formats:</strong> JPEG, PNG, JPG, GIF, SVG
                                </Text>
                                <Text type="secondary" className="text-xs block">
                                    <strong>Max file size:</strong> 2MB
                                </Text>
                            </div>
                        </div>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                disabled={!data.name}
                            >
                                {submitButtonText}
                            </Button>
                            <Link href={route('admin.sponsors.index')}>
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