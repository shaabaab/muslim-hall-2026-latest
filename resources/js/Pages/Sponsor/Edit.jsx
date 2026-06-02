import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import {
    Input,
    Button,
    Card,
    Typography,
    Space,
    message,
    Row,
    Col,
    Upload
} from 'antd';
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    PictureOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    UserOutlined,
    GlobalOutlined,
    PhoneOutlined,
    MailOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function Edit({ sponsor, auth }) {
    const [previewImg, setPreviewImg] = useState(
        sponsor.photo ? getS3PublicUrl(sponsor.photo) : null
    );

    const { data, setData, post, processing, errors } = useForm({
        name: sponsor.name || '',
        email: sponsor.email || '',
        phone: sponsor.phone || '',
        phone_alternative: sponsor.phone_alternative || '',
        website: sponsor.website || '',
        remove_photo: false,
        password: '',
        password_confirmation: '',
        photo: null,
        _method: 'PUT',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log('Submitting data at edit:', data);

        // For updates with files, we must use POST with _method: 'PUT'
        post(route('admin.sponsors.update', sponsor.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('Sponsor updated successfully!');
            },
            onError: (errors) => {
                console.error('Update errors:', errors);
                message.error('Error updating sponsor. Please check the form.');
            },
        });
    };

    const handleImageUpload = (file) => {
        console.log('File selected:', file);

        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
            return false;
        }

        // Set the image file
        setData(data => ({
            ...data,
            photo: file,
            remove_photo: false
        }));
        setPreviewImg(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleImageRemove = () => {
        setData(data => ({
            ...data,
            photo: null,
            remove_photo: sponsor.photo ? true : false
        }));
        setPreviewImg(null);
    };

    // Add some CSS for form items
    const formItemStyle = {
        marginBottom: '16px'
    };

    const errorTextStyle = {
        color: '#ff4d4f',
        fontSize: '14px',
        marginTop: '4px'
    };

    return (
        <Authenticated
            user={auth.user}
            header={
                <div className="flex items-center">
                    <Link href={route('admin.sponsors.index')}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mr-4"
                        >
                            Back to Sponsors
                        </Button>
                    </Link>
                    <Title level={2} className="!mb-0">
                        Edit Sponsor: {sponsor.name}
                    </Title>
                </div>
            }
        >
            <Card className="shadow-sm">
                <div className="mb-6">
                    <Text type="secondary">
                        Update sponsor information and contact details
                    </Text>
                </div>

                <form onSubmit={handleSubmit}>
                    <Row gutter={[24, 16]}>
                        <Col xs={24} lg={16}>
                            {/* Basic Information */}
                            <Card title="Basic Information" className="mb-4">
                                <div style={formItemStyle}>
                                    <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Sponsor Name
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="Enter sponsor name"
                                        prefix={<UserOutlined />}
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        status={errors.name ? 'error' : ''}
                                    />
                                    {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
                                </div>

                                <div style={formItemStyle}>
                                    <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Email Address
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="Enter email address"
                                        prefix={<MailOutlined />}
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        status={errors.email ? 'error' : ''}
                                    />
                                    {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
                                </div>
                            </Card>

                            {/* Contact Information */}
                            <Card title="Contact Information" className="mb-4">
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <div style={formItemStyle}>
                                            <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                                Phone Number
                                            </label>
                                            <Input
                                                size="large"
                                                placeholder="Enter phone number"
                                                prefix={<PhoneOutlined />}
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                status={errors.phone ? 'error' : ''}
                                            />
                                            {errors.phone && <div style={errorTextStyle}>{errors.phone}</div>}
                                        </div>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <div style={formItemStyle}>
                                            <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                                Alternative Phone
                                            </label>
                                            <Input
                                                size="large"
                                                placeholder="Enter alternative phone"
                                                prefix={<PhoneOutlined />}
                                                value={data.phone_alternative}
                                                onChange={(e) => setData('phone_alternative', e.target.value)}
                                                status={errors.phone_alternative ? 'error' : ''}
                                            />
                                            {errors.phone_alternative && <div style={errorTextStyle}>{errors.phone_alternative}</div>}
                                        </div>
                                    </Col>
                                </Row>

                                <div style={formItemStyle}>
                                    <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Website
                                    </label>
                                    <Input
                                        size="large"
                                        placeholder="https://example.com"
                                        prefix={<GlobalOutlined />}
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        status={errors.website ? 'error' : ''}
                                    />
                                    {errors.website && <div style={errorTextStyle}>{errors.website}</div>}
                                </div>
                            </Card>

                            {/* Password Update */}
                            <Card title="Password Update" className="mb-4">
                                <Text type="secondary" className="block mb-4">
                                    Leave password fields blank if you don't want to change the password.
                                </Text>

                                <div style={formItemStyle}>
                                    <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        New Password
                                    </label>
                                    <Input.Password
                                        size="large"
                                        placeholder="Enter new password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        status={errors.password ? 'error' : ''}
                                    />
                                    {errors.password && <div style={errorTextStyle}>{errors.password}</div>}
                                </div>

                                <div style={formItemStyle}>
                                    <label className="ant-form-item-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        Confirm Password
                                    </label>
                                    <Input.Password
                                        size="large"
                                        placeholder="Confirm new password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        status={errors.password_confirmation ? 'error' : ''}
                                    />
                                    {errors.password_confirmation && <div style={errorTextStyle}>{errors.password_confirmation}</div>}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            {/* Photo Upload */}
                            <Card title="Sponsor Photo" className="mb-4">
                                <div className="space-y-4">
                                    <Upload
                                        beforeUpload={handleImageUpload}
                                        accept="image/*"
                                        showUploadList={false}
                                        listType="picture"
                                        disabled={processing}
                                    >
                                        <Button
                                            icon={<PictureOutlined />}
                                            type="dashed"
                                            block
                                            size="large"
                                        >
                                            {data.photo || sponsor.photo ? 'Change Photo' : 'Upload Photo'}
                                        </Button>
                                    </Upload>

                                    {/* Photo Preview */}
                                    {(previewImg || (sponsor.photo && !data.remove_photo)) && (
                                        <div className="border border-dashed border-gray-300 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <Text strong>Photo Preview</Text>
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    onClick={handleImageRemove}
                                                    disabled={processing}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            <img
                                                src={previewImg || `/storage/${sponsor.photo}`}
                                                alt="Sponsor preview"
                                                className="w-full h-48 object-cover rounded"
                                            />
                                        </div>
                                    )}

                                    {data.remove_photo && sponsor.photo && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                            <Text type="secondary" className="text-xs">
                                                Existing photo will be removed on save
                                            </Text>
                                        </div>
                                    )}

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
                            </Card>
                        </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div className="mt-6 border-t pt-6">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: '140px' }}
                            >
                                Update Sponsor
                            </Button>

                            <Link href={route('admin.sponsors.index')}>
                                <Button
                                    size="large"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </div>
                </form>
            </Card>
        </Authenticated>
    );
}