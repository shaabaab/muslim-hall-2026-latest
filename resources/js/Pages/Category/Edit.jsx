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
    Row,
    Col,
    Upload,
    Alert,
    Switch
} from 'antd';

import { 
    PictureOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    DeleteOutlined
} from '@ant-design/icons';

import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ category, auth, langs, categories }) {
    const [previewImg, setPreviewImg] = useState(
        category.img ? `/storage/${category.img}` : null
    );
    const [fileList, setFileList] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        name: category.name || '',
        status: category.status ?? 1,
        img: null, // Start with null for new image
        parent_id: category.parent_id || null,
        description: category.description || '',
        lang_id: category.lang_id || '',
        _method: 'PUT',
    });

    const handlePhotoUpload = (file) => {
        setData('img', file);
        setPreviewImg(URL.createObjectURL(file));
        setFileList([file]);
        return false; // Prevent automatic upload
    };

    const handlePhotoRemove = () => {
        setData('img', null);
        setPreviewImg(null);
        setFileList([]);
    };

    const removeExistingImage = () => {
        setData('img', ''); // Empty string to indicate removal
        setPreviewImg(null);
    };

    const submit = () => {
        const formData = new FormData();
        
        // Append all form data
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === 'img' && data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else if (key === 'img' && data[key] === '') {
                    formData.append('remove_img', 'true'); // Flag to remove existing image
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        post(route('admin.categories.update', category.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('Category updated successfully');
            },
            onError: (errors) => {
                console.error('Update errors:', errors);
                message.error('Error updating category');
            }
        });
    };

    return (
        <Authenticated
            user={auth.user}
            header="Edit Category"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.categories.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Categories
                        </Button>
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                Edit Category: {category.name}
                            </Title>
                            <Text type="secondary">
                                Update category information
                            </Text>
                        </div>
                    </div>
                </div>

                {errors && Object.keys(errors).length > 0 && (
                    <Alert
                        message="Please fix the following errors:"
                        description={
                            <ul>
                                {Object.keys(errors).map(key => (
                                    <li key={key}>{errors[key]}</li>
                                ))}
                            </ul>
                        }
                        type="error"
                        className="mb-4"
                    />
                )}

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-4xl"
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Form.Item
                                label="Category Name"
                                validateStatus={errors?.name ? 'error' : ''}
                                help={errors?.name}
                                required
                            >
                                <Input
                                    size="large"
                                    placeholder="Enter category name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                            </Form.Item>

                            <Form.Item label="Category Status">
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
                                label="Parent Category"
                                validateStatus={errors?.parent_id ? 'error' : ''}
                                help={errors?.parent_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Parent Category"
                                    value={data.parent_id}
                                    onChange={(value) => setData('parent_id', value)} 
                                    allowClear
                                >
                                    {categories?.map((cat) => (
                                        <Option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Language"
                                validateStatus={errors?.lang_id ? 'error' : ''}
                                help={errors?.lang_id}
                                required
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)}
                                    suffixIcon={<TeamOutlined />}
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {langs?.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item 
                                label="Category Description"
                                validateStatus={errors?.description ? 'error' : ''}
                                help={errors?.description}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Enter category description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card title="Category Image" size="default" className="mb-4">
                                <Form.Item
                                    validateStatus={errors?.img ? 'error' : ''}
                                    help={errors?.img}
                                >
                                    {/* Existing image display */}
                                    {category.img && !previewImg && data.img !== '' && (
                                        <div className="mb-4">
                                            <Text strong className="block mb-2">Current Image:</Text>
                                            <div className="relative inline-block">
                                                <img
                                                    src={`/storage/${category.img}`}
                                                    alt="Current Category"
                                                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                    className="rounded shadow"
                                                />
                                                <Button
                                                    type="primary"
                                                    danger
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    className="absolute top-0 right-0"
                                                    onClick={removeExistingImage}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload area */}
                                    <Upload
                                        beforeUpload={handlePhotoUpload}
                                        onRemove={handlePhotoRemove}
                                        accept="image/*"
                                        showUploadList={false}
                                        listType="picture"
                                        fileList={fileList}
                                        multiple={false}
                                    >
                                        <Button icon={<PictureOutlined />} type="dashed" block>
                                            Select New Image
                                        </Button>
                                    </Upload>

                                    {/* New image preview */}
                                    {previewImg && (
                                        <div className="mt-4">
                                            <Text strong className="block mb-2">New Image Preview:</Text>
                                            <img
                                                src={previewImg}
                                                alt="Preview"
                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                className="rounded shadow"
                                            />
                                            <Button
                                                type="link"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={handlePhotoRemove}
                                                className="mt-2"
                                            >
                                                Remove New Image
                                            </Button>
                                        </div>
                                    )}

                                    {/* File info */}
                                    {data.img && data.img instanceof File && (
                                        <Text type="secondary" className="block mt-2">
                                            Selected: {data.img.name}
                                        </Text>
                                    )}
                                </Form.Item>
                            </Card>
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
                                Update Category
                            </Button>
                            <Link href={route('admin.categories.index')}>
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