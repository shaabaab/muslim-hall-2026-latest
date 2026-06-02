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
    Upload
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined 
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth, langs }) {

    const [faviconPreview, setFaviconPreview] = useState(null);
    const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
    const [footerLogoPreview, setFooterLogoPreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        header_title: '',
        footer_title: '',
        footer_content: '',
        header_logo: null,
        footer_logo: null,
        favicon: null,
        lang_id: null,
    });


    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        post(route('admin.settings.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success('Slider created successfully');
                setData({
                    header_title: '',
                    footer_title: '',
                    footer_content: '',
                    header_logo: null,
                    footer_logo: null,
                    favicon: null,
                    lang_id: null,
                });
                setFaviconPreview(null);
                setHeaderLogoPreview(null);
                setFooterLogoPreview(null);
            },
            onError: () => {
                message.error('Error creating slider');
            }
        });
    };

    const handleFaviconUpload = (file) => {
        setData('favicon', file);
        setFaviconPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleFaviconRemove = () => {
        setData('favicon', null);
        setFaviconPreview(null);
    };

    const handleHeaderLogoUpload = (file) => {
        setData('header_logo', file);
        setHeaderLogoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleHeaderLogoRemove = () => {
        setData('header_logo', null);
        setHeaderLogoPreview(null);
    };

    const handleFooterLogoUpload = (file) => {
        setData('footer_logo', file);
        setFooterLogoPreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleFooterLogoRemove = () => {
        setData('footer_logo', null);
        setFooterLogoPreview(null);
    };

    return (
        <Authenticated
            user={auth.user}
            header="Create Slider"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.settings.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Settings
                        </Button>
                    </Link>
                    <Title level={3}>
                        Set Site Setting
                    </Title>
                    <Text type="secondary">
                        Configure the settings for your site
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Header Title"
                        validateStatus={errors.header_title ? 'error' : ''}
                        help={errors.header_title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Header title"
                            value={data.header_title}
                            onChange={(e) => setData('header_title', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Footer Title"
                        validateStatus={errors.footer_title ? 'error' : ''}
                        help={errors.footer_title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Footer title"
                            value={data.footer_title}
                            onChange={(e) => setData('footer_title', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Footer Content"
                        validateStatus={errors.footer_content ? 'error' : ''}
                        help={errors.footer_content}
                        required
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Enter Footer content"
                            value={data.footer_content}
                            onChange={(e) => setData('footer_content', e.target.value)}
                        />
                    </Form.Item>


                    <Form.Item
                        label="Language"
                        validateStatus={errors.lang_id ? 'error' : ''}
                        help={errors.lang_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Language"
                            value={data.lang_id || undefined} 
                            onChange={(value) => setData('lang_id', value)}
                            suffixIcon={<TeamOutlined />}
                            allowClear
                        >
                            {langs.map((lang) => (
                                <Option key={lang.id} value={lang.id}>
                                    {lang.name} ({lang.code})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        label="Favicon"
                        validateStatus={errors.favicon ? 'error' : ''}
                        help={errors.favicon}
                    >
                        <Upload
                            beforeUpload={handleFaviconUpload}
                            onRemove={handleFaviconRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>Select Favicon</Button>
                        </Upload>
                        
                        {faviconPreview && (
                            <div className="mt-2">
                                <img 
                                    src={faviconPreview} 
                                    alt="Favicon Preview" 
                                    style={{ 
                                        maxWidth: '100px', 
                                        maxHeight: '100px',
                                        marginTop: '8px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        padding: '4px'
                                    }}
                                />
                            </div>
                        )}

                        {!data.favicon && !faviconPreview && (
                            <Text type="secondary" className="block mt-2">
                                No favicon selected
                            </Text>
                        )}
                    </Form.Item>


                    <Form.Item
                        label="Header Logo"
                        validateStatus={errors.header_logo ? 'error' : ''}
                        help={errors.header_logo}
                    >
                        <Upload
                            beforeUpload={handleHeaderLogoUpload}
                            onRemove={handleHeaderLogoRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>Select Header Logo</Button>
                        </Upload>
                        
                        {headerLogoPreview && (
                            <div className="mt-2">
                                <img
                                    src={headerLogoPreview}
                                    alt="Header Logo Preview"
                                    style={{
                                        maxWidth: '200px', 
                                        maxHeight: '100px',
                                        marginTop: '8px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        padding: '4px'
                                    }}
                                />
                            </div>
                        )}

                        {!data.header_logo && !headerLogoPreview && (
                            <Text type="secondary" className="block mt-2">
                                No header logo selected
                            </Text>
                        )}
                    </Form.Item>

                    
                    <Form.Item
                        label="Footer Logo"
                        validateStatus={errors.footer_logo ? 'error' : ''}
                        help={errors.footer_logo}
                    >
                        <Upload
                            beforeUpload={handleFooterLogoUpload}
                            onRemove={handleFooterLogoRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>Select Footer Logo</Button>
                        </Upload>
                        
                        {footerLogoPreview && (
                            <div className="mt-2">
                                <img
                                    src={footerLogoPreview}
                                    alt="Footer Logo Preview"
                                    style={{
                                        maxWidth: '200px', 
                                        maxHeight: '100px',
                                        marginTop: '8px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        padding: '4px'
                                    }}
                                />
                            </div>
                        )}

                        {!data.footer_logo && !footerLogoPreview && (
                            <Text type="secondary" className="block mt-2">
                                No footer logo selected
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
                               Set Site Setting
                            </Button>
                            <Link href={route('admin.settings.index')}>
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