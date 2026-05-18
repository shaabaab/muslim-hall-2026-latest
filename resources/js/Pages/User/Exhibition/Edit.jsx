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
    Switch,
    Row,
    Col,
    InputNumber
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PictureOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    EditOutlined,
    CameraOutlined,
    PlusOutlined,
    DeleteOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Edit({ exhibition, auth, langs,member }) {
    const [mainImagePreview, setMainImagePreview] = useState(
        exhibition.image ? `/storage/${exhibition.image}` : null
    );
    const [galleryPreviews, setGalleryPreviews] = useState(
        exhibition.gallery ? exhibition.gallery.map(img => `/storage/${img}`) : []
    );
    const [documentPreview, setDocumentPreview] = useState(
        exhibition.document_file ? exhibition.document_file : null
    );

    const { data, setData, post, processing, errors } = useForm({
        title: exhibition.title,
        description: exhibition.description,
        type: exhibition.type,
        image: null,
        gallery: [],
        document_file: null,
        price: exhibition.price,
        currency: exhibition.currency,
        is_available: exhibition.is_available,
        is_featured: exhibition.is_featured,
        dimensions: exhibition.dimensions,
        material: exhibition.material,
        status: exhibition.status,
        lang_id: exhibition.lang_id || '',
        _method: 'PUT',
    });

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                if (key === 'gallery' && Array.isArray(data[key])) {
                    data[key].forEach((file, index) => {
                        formData.append(`gallery[${index}]`, file);
                    });
                } else {
                    formData.append(key, data[key]);
                }
            }
        });

        post(route('user.exhibitions.update', exhibition.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('Exhibition item updated successfully');
            },
            onError: () => {
                message.error('Error updating exhibition item');
            }
        });
    };

    const handleMainImageUpload = (file) => {
        setData('image', file);
        setMainImagePreview(URL.createObjectURL(file));
        return false;
    };

    const handleMainImageRemove = () => {
        setData('image', null);
        setMainImagePreview(exhibition.image ? `/storage/${exhibition.image}` : null);
    };

    const handleGalleryUpload = (file) => {
        const newGallery = [...data.gallery, file];
        setData('gallery', newGallery);
        setGalleryPreviews([...galleryPreviews, URL.createObjectURL(file)]);
        return false;
    };

    const handleGalleryRemove = (index) => {
        const newGallery = data.gallery.filter((_, i) => i !== index);
        const newPreviews = galleryPreviews.filter((_, i) => i !== index);
        setData('gallery', newGallery);
        setGalleryPreviews(newPreviews);
    };

    const handleExistingGalleryRemove = (index) => {
        const currentGallery = exhibition.gallery || [];
        const newGallery = currentGallery.filter((_, i) => i !== index);

        // Update the form data to indicate removal
        setData('gallery_removed', [...(data.gallery_removed || []), currentGallery[index]]);

        // Update previews
        const newPreviews = galleryPreviews.filter((_, i) => i !== index);
        setGalleryPreviews(newPreviews);
    };

    const handleDocumentUpload = (file) => {
        setData('document_file', file);
        setDocumentPreview(file);
        return false;
    };

    const handleDocumentRemove = () => {
        setData('document_file', null);
        setDocumentPreview(exhibition.document_file ? exhibition.document_file : null);
    };

    const currencyOptions = [
        { value: 'BDT', label: 'BDT (৳)' },
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'SAR', label: 'SAR (﷼)' },
        { value: 'AED', label: 'AED (د.إ)' },
    ];

    const getTypeIcon = (type) => {
        switch (type) {
            case 'product': return <ShoppingOutlined />;
            case 'document': return <FileTextOutlined />;
            case 'art': return <PictureOutlined />;
            case 'photography': return <CameraOutlined />;
            case 'craft': return <EditOutlined />;
            default: return <ShoppingOutlined />;
        }
    };

    return (
        <Authenticated user={auth.user} header="Edit Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route('user.exhibitions.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Exhibitions
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Edit Exhibition Item
                    </Title>
                    <Text type="secondary">
                        Update {exhibition.type}: {exhibition.title}
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item
                                label="Item Type"
                                validateStatus={errors.type ? 'error' : ''}
                                help={errors.type}
                                required
                            >
                                <Select
                                    size="large"
                                    value={data.type}
                                    onChange={(value) => setData('type', value)}
                                >
                                    <Option value="product">
                                        <Space><ShoppingOutlined />Product</Space>
                                    </Option>
                                    <Option value="document">
                                        <Space><FileTextOutlined />Document</Space>
                                    </Option>
                                    <Option value="art">
                                        <Space><PictureOutlined />Art</Space>
                                    </Option>
                                    <Option value="photography">
                                        <Space><CameraOutlined />Photography</Space>
                                    </Option>
                                    <Option value="craft">
                                        <Space><EditOutlined />Craft</Space>
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Select Language"
                                validateStatus={errors.lang_id ? 'error' : ''}
                                help={errors.lang_id}
                            >
                                <Select
                                    size="large"
                                    placeholder="Select Language"
                                    value={data.lang_id}
                                    onChange={(value) => setData('lang_id', value)}
                                    suffixIcon={<TeamOutlined />}
                                >
                                    {langs.map((lang) => (
                                        <Option key={lang.id} value={lang.id}>
                                            {lang.name} ({lang.code})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>



                        <Col span={24}>
                            <Form.Item
                                label="Description"
                                validateStatus={errors.description ? 'error' : ''}
                                help={errors.description}
                            >
                                <TextArea
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    showCount
                                    maxLength={2000}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Main Image"
                                validateStatus={errors.image ? 'error' : ''}
                                help={errors.image}
                            >
                                <Upload
                                    beforeUpload={handleMainImageUpload}
                                    onRemove={handleMainImageRemove}
                                    accept="image/*"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<UploadOutlined />}>
                                        {exhibition.image ? 'Change Main Image' : 'Select Main Image'}
                                    </Button>
                                </Upload>

                                {mainImagePreview && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Main Image Preview:</Text>
                                        <img
                                            src={mainImagePreview}
                                            alt="Main preview"
                                            style={{
                                                maxWidth: '300px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'cover'
                                            }}
                                            className="border border-dashed border-gray-300"
                                        />
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Gallery Images"
                                validateStatus={errors.gallery ? 'error' : ''}
                                help={errors.gallery}
                            >
                                <Upload
                                    beforeUpload={handleGalleryUpload}
                                    accept="image/*"
                                    showUploadList={false}
                                    multiple
                                >
                                    <Button icon={<PlusOutlined />}>
                                        Add to Gallery
                                    </Button>
                                </Upload>

                                {(galleryPreviews.length > 0 || (exhibition.gallery && exhibition.gallery.length > 0)) && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Gallery Images:</Text>
                                        <div className="flex flex-wrap gap-4">
                                            {galleryPreviews.map((preview, index) => (
                                                <div key={`new-${index}`} className="relative">
                                                    <img
                                                        src={preview}
                                                        alt={`New Gallery ${index + 1}`}
                                                        style={{
                                                            width: '100px',
                                                            height: '100px',
                                                            borderRadius: '8px',
                                                            objectFit: 'cover'
                                                        }}
                                                        className="border border-dashed border-blue-300"
                                                    />
                                                    <Button
                                                        type="link"
                                                        danger
                                                        size="small"
                                                        onClick={() => handleGalleryRemove(index)}
                                                        style={{ position: 'absolute', top: -8, right: -8 }}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ))}
                                            {exhibition.gallery && exhibition.gallery.map((img, index) => (
                                                !data.gallery_removed?.includes(img) && (
                                                    <div key={`existing-${index}`} className="relative">
                                                        <img
                                                            src={`/storage/${img}`}
                                                            alt={`Existing Gallery ${index + 1}`}
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                borderRadius: '8px',
                                                                objectFit: 'cover'
                                                            }}
                                                            className="border border-dashed border-gray-300"
                                                        />
                                                        <Button
                                                            type="link"
                                                            danger
                                                            size="small"
                                                            onClick={() => handleExistingGalleryRemove(index)}
                                                            style={{ position: 'absolute', top: -8, right: -8 }}
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                        <Text type="secondary" className="block mt-2">
                                            {galleryPreviews.length + (exhibition.gallery ? exhibition.gallery.length : 0)} image(s) in gallery
                                        </Text>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                       {member ? (
  <>
    <Col span={12} style={{ marginBottom: 8 }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Price"
        validateStatus={errors.price ? 'error' : ''}
        help={errors.price}
      >
        <InputNumber
          style={{ width: '100%' }}
          value={data.price}
          onChange={(value) => setData('price', value)}
          min={0}
          step={0.01}
          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      </Form.Item>
    </Col>

    <Col span={12} style={{ marginBottom: 8 }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Currency"
        validateStatus={errors.currency ? 'error' : ''}
        help={errors.currency}
        required
      >
        <Select
          value={data.currency}
          onChange={(value) => setData('currency', value)}
        >
          {currencyOptions.map(currency => (
            <Option key={currency.value} value={currency.value}>
              {currency.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Col>

    <Col span={12} style={{ marginBottom: 8 }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Link (Url)"
        validateStatus={errors.link ? 'error' : ''}
        help={errors.link}
        required
      >
        <Input
          style={{ width: '100%' }}
          placeholder="https://example.com"
          value={data.link}
          onChange={(e) => setData('link', e.target.value)}
        />
      </Form.Item>
    </Col>
  </>
) : (
  <>
    <Col span={12} style={{ opacity: 0.5, marginBottom: 8, pointerEvents: 'none' }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Price"
        validateStatus={errors.price ? 'error' : ''}
        help={errors.price}
      >
        <InputNumber
          style={{ width: '100%' }}
          value={data.price}
          onChange={(value) => setData('price', value)}
          min={0}
          step={0.01}
          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      </Form.Item>
    </Col>

    <Col span={12} style={{ opacity: 0.5, marginBottom: 8, pointerEvents: 'none' }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Currency"
        validateStatus={errors.currency ? 'error' : ''}
        help={errors.currency}
        required
      >
        <Select
          value={data.currency}
          onChange={(value) => setData('currency', value)}
        >
          {currencyOptions.map(currency => (
            <Option key={currency.value} value={currency.value}>
              {currency.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Col>

    <Col span={12} style={{ opacity: 0.5, marginBottom: 8, pointerEvents: 'none' }}>
      <div>
        <code style={{
          fontSize: '12px',
          color: '#faad14',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}>
          Premium
        </code>
      </div>
      <Form.Item
        label="Link (Url)"
        validateStatus={errors.link ? 'error' : ''}
        help={errors.link}
        required
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Link (Url)"
          value={data.link}
          onChange={(value) => setData('link', value)}
          min={0}
          step={0.01}
        />
      </Form.Item>
    </Col>
  </>
)}

                        {(data.type === 'art' || data.type === 'product') && (
                            <>
                                <Col span={12}>
                                    <Form.Item
                                        label="Dimensions"
                                        validateStatus={errors.dimensions ? 'error' : ''}
                                        help={errors.dimensions}
                                    >
                                        <Input
                                            value={data.dimensions}
                                            onChange={(e) => setData('dimensions', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Material"
                                        validateStatus={errors.material ? 'error' : ''}
                                        help={errors.material}
                                    >
                                        <Input
                                            value={data.material}
                                            onChange={(e) => setData('material', e.target.value)}
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}

                        <Col span={24}>
                            <Form.Item label="Document File">
                                <Upload
                                    beforeUpload={handleDocumentUpload}
                                    onRemove={handleDocumentRemove}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    showUploadList={false}
                                    maxCount={1}
                                >
                                    <Button icon={<FileTextOutlined />}>
                                        {exhibition.document_file ? 'Change Document' : 'Select Document'}
                                    </Button>
                                </Upload>

                                {(documentPreview || exhibition.document_file) && (
                                    <div className="mt-4">
                                        <Text strong className="block mb-2">Document:</Text>
                                        <div className="p-3 border rounded bg-gray-50">
                                            <FileTextOutlined className="text-2xl text-blue-500 mr-2" />
                                            <Text>
                                                {typeof documentPreview === 'object' ? documentPreview.name : exhibition.document_file}
                                            </Text>
                                        </div>
                                    </div>
                                )}
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Available for Sale">
                                <Switch
                                    checked={data.is_available}
                                    onChange={(checked) => setData('is_available', checked)}
                                />
                                <Text className="ml-2">
                                    {data.is_available ? 'Available' : 'Not Available'}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item label="Featured Item">
                                <Switch
                                    checked={data.is_featured}
                                    onChange={(checked) => setData('is_featured', checked)}
                                />
                                <Text className="ml-2">
                                    {data.is_featured ? 'Featured' : 'Regular'}
                                </Text>
                            </Form.Item>
                        </Col>

                        <Col span={8}>
                            <Form.Item
                                label="Status"
                                validateStatus={errors.status ? 'error' : ''}
                                help={errors.status}
                                required
                            >
                                <Select
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                >
                                    <Option value="draft">Draft</Option>
                                    <Option value="published">Published</Option>
                                    <Option value="sold">Sold</Option>
                                    <Option value="archived">Archived</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mt-8">
                        <Space size="middle">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: '160px' }}
                            >
                                Update Item
                            </Button>

                            <Link href={route('user.exhibitions.index')}>
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