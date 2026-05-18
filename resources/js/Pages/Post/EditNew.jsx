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
    Upload,
    Image,
    App
} from 'antd';
import { 
    UserOutlined, 
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilePdfOutlined,
    PlayCircleOutlined,
    PictureOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, categories, langs, sections, editPost }) {
    const [imagePreviews, setImagePreviews] = useState([]);
    const { message } = App.useApp();

    // Safe parse existing images
    const existingImages = editPost?.images
        ? (Array.isArray(editPost.images)
            ? editPost.images
            : typeof editPost.images === 'string'
                ? JSON.parse(editPost.images)
                : [])
        : [];

    const { data, setData, post, processing, errors } = useForm({
        title: editPost.title || '',
        content: editPost.content || '',
        images: [], // New images to be uploaded
        existing_images: existingImages, // Existing images from database
        deleted_images: [], // Track images to be deleted
        video: null,
        video_url: editPost.video_url || '',
        pdf: null,
        category_id: editPost.category_id || '',
        section_id: editPost.section_id || '',
        lang_id: editPost.lang_id || '',
        status: editPost.status?.toString() || '',
        _method: 'PUT'
    });

    // Initialize image previews with existing images
    useEffect(() => {
        if (existingImages.length > 0) {
            const existingPreviews = existingImages.map((img, index) => {
                const imagePath = typeof img === 'object' ? img.image : img;
                const imageName = typeof img === 'object' ? img.name || `Image ${index + 1}` : `Image ${index + 1}`;
                
                return {
                    file: null, 
                    preview: `/storage/${imagePath}`,
                    isExisting: true,
                    path: imagePath,
                    name: imageName,
                    id: `existing-${index}`
                };
            });
            setImagePreviews(existingPreviews);
        } else {
            setImagePreviews([]);
        }
    }, [editPost?.id]);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => {
                if (!preview.isExisting && preview.preview && preview.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(preview.preview);
                }
            });
        };
    }, [imagePreviews]);

    const submit = () => {
        console.log('Submitting data:', {
            existing_images: data.existing_images,
            new_images: data.images,
            deleted_images: data.deleted_images
        });

        post(route('admin.posts.update', editPost.id), {
            forceFormData: true,  
            preserveScroll: true,
            onSuccess: () => {
                message.success('Post updated successfully');
                // Clean up new image preview URLs
                imagePreviews.forEach(preview => {
                    if (!preview.isExisting && preview.preview && preview.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(preview.preview);
                    }
                });
            },
            onError: (errors) => {
                message.error('Error updating post');
                console.error('Update errors:', errors);
            }
        });
    };

    const handleImageUpload = (file) => {
        // Validate file type and size
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        
        if (!isValidType) {
            message.error(`${file.name} is not a valid image file`);
            return false;
        }
        if (!isValidSize) {
            message.error(`${file.name} is too large (max 5MB)`);
            return false;
        }

        // Create preview URL and update state
        const previewUrl = URL.createObjectURL(file);
        
        const newPreview = {
            file,
            preview: previewUrl,
            isExisting: false,
            name: file.name,
            id: `new-${Date.now()}-${Math.random()}`
        };

        setImagePreviews(prev => [...prev, newPreview]);
        setData('images', [...data.images, file]);
        
        return false; // Prevent automatic upload
    };

    const removeImage = (index) => {
        const imageToRemove = imagePreviews[index];
        
        if (imageToRemove.isExisting) {
            // For existing images, add to deleted_images array and remove from existing_images
            const updatedExisting = data.existing_images.filter(path => path !== imageToRemove.path);
            const updatedDeleted = [...data.deleted_images, imageToRemove.path];
            
            setData('existing_images', updatedExisting);
            setData('deleted_images', updatedDeleted);
        } else {
            // For new images, find and remove from data.images array
            const newImageIndex = imagePreviews
                .slice(0, index)
                .filter(preview => !preview.isExisting).length;
            
            const updatedImages = data.images.filter((_, i) => i !== newImageIndex);
            setData('images', updatedImages);
            
            // Revoke object URL to prevent memory leaks
            if (imageToRemove.preview && imageToRemove.preview.startsWith('blob:')) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
        }
        
        // Remove from previews
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (fieldName, file) => {
        if (file) {
            // Basic file validation
            if (fieldName === 'pdf' && file.type !== 'application/pdf') {
                message.error('Please select a valid PDF file');
                return false;
            }
            
            if (fieldName === 'video' && !file.type.startsWith('video/')) {
                message.error('Please select a valid video file');
                return false;
            }

            // Size validation (10MB for video, 5MB for PDF)
            const maxSize = fieldName === 'video' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                message.error(`File is too large (max ${maxSize / 1024 / 1024}MB)`);
                return false;
            }

            setData(fieldName, file);
        }
        return false;
    };

    // Get file preview URL for video
    const getFilePreviewUrl = (fieldName) => {
        const currentFile = data[fieldName];
        const originalFile = editPost[fieldName];
        
        if (currentFile instanceof File) {
            return URL.createObjectURL(currentFile);
        } else if (originalFile) {
            return `/storage/${originalFile}`;
        }
        return null;
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
            header="Edit Post"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.posts.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Posts
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Edit Post
                    </Title>
                    <Text type="secondary">
                        Update post information - You can add new images while keeping existing ones
                    </Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                >

                    <Form.Item
                        label="Post Title"
                        validateStatus={errors.title ? 'error' : ''}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Post Title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Select Category"
                        validateStatus={errors.category_id ? 'error' : ''}
                        help={errors.category_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id}
                            onChange={(value) => setData('category_id', value)}
                            suffixIcon={<TeamOutlined />}
                        >
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

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

                    <Form.Item
                        label="Section (Optional)"
                        validateStatus={errors.section_id ? 'error' : ''}
                        help={errors.section_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Section"
                            value={data.section_id}
                            onChange={(value) => setData('section_id', value)}
                            suffixIcon={<TeamOutlined />}
                        >
                            {sections.map((section) => (
                                <Option key={section.id} value={section.id}>
                                    {section.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Post Status"
                        validateStatus={errors.status ? 'error' : ''}
                        help={errors.status}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select Status"
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            suffixIcon={<TeamOutlined />}
                        >
                            <Option value="1">Active</Option>
                            <Option value="0">Inactive</Option>
                        </Select>
                    </Form.Item>

                    {/* Multiple Image Upload */}
                    <Form.Item
                        label="Post Images"
                        validateStatus={errors.images ? 'error' : ''}
                        help={errors.images}
                    >
                        <Upload
                            beforeUpload={handleImageUpload}
                            accept="image/*"
                            multiple
                            showUploadList={false}
                            listType="picture"
                        >
                            <Button icon={<PictureOutlined />}>Add New Images</Button>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            You can add multiple new images. Maximum file size: 5MB per image.
                        </Text>
                        {existingImages.length > 0 && (
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                {existingImages.length} existing image(s) will be kept unless you delete them
                            </Text>
                        )}
                    </Form.Item>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                        <Form.Item label="All Images (Existing + New)">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                                {imagePreviews.map((preview, index) => (
                                    <div key={preview.id} style={{ position: 'relative', display: 'inline-block' }}>
                                        <Image
                                            width={100}
                                            height={100}
                                            src={preview.preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{ 
                                                objectFit: 'cover', 
                                                borderRadius: '8px',
                                                border: '1px solid #d9d9d9'
                                            }}
                                            preview={{
                                                mask: (
                                                    <div>
                                                        <EyeOutlined style={{ marginRight: '4px' }} />
                                                        View
                                                    </div>
                                                )
                                            }}
                                        />
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onClick={() => removeImage(index)}
                                        />
                                        <div style={{ 
                                            fontSize: '10px', 
                                            textAlign: 'center', 
                                            marginTop: '4px',
                                            padding: '2px 4px',
                                            backgroundColor: preview.isExisting ? '#e6f7ff' : '#f6ffed',
                                            borderRadius: '4px',
                                            maxWidth: '100px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {preview.isExisting ? 'Existing' : 'New'}
                                        </div>
                                        <div style={{ 
                                            fontSize: '9px', 
                                            textAlign: 'center', 
                                            marginTop: '2px',
                                            maxWidth: '100px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {preview.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                                Total images: {imagePreviews.length} ({imagePreviews.filter(p => p.isExisting).length} existing + {imagePreviews.filter(p => !p.isExisting).length} new)
                            </Text>
                        </Form.Item>
                    )}

                    {/* PDF Upload */}
                    <Form.Item
                        label="Post PDF"
                        validateStatus={errors.pdf ? 'error' : ''}
                        help={errors.pdf}
                    >
                        <Upload
                            beforeUpload={(file) => handleFileChange('pdf', file)}
                            accept="application/pdf"
                            showUploadList={false}
                            maxCount={1}
                        >
                            <Button icon={<FilePdfOutlined />}>
                                {editPost.pdf ? 'Replace PDF' : 'Select PDF'}
                            </Button>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            Maximum file size: 5MB
                        </Text>
                    </Form.Item>

                    {/* PDF Preview */}
                    {(data.pdf instanceof File || editPost.pdf) && (
                        <Form.Item label="PDF Preview">
                            <div style={{ 
                                padding: '12px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <Text strong>
                                    {data.pdf instanceof File ? 'New PDF:' : 'Existing PDF:'}
                                </Text>
                                <br />
                                {data.pdf instanceof File ? (
                                    <Text style={{ display: 'block', marginTop: '8px' }}>
                                        {data.pdf.name} ({(data.pdf.size / 1024 / 1024).toFixed(2)} MB)
                                    </Text>
                                ) : editPost.pdf ? (
                                    <a 
                                        href={`/storage/${editPost.pdf}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ marginTop: '8px', display: 'inline-block' }}
                                    >
                                        <Button icon={<EyeOutlined />} type="link">
                                            View Current PDF
                                        </Button>
                                    </a>
                                ) : null}
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    style={{ marginTop: '8px' }}
                                    onClick={() => setData('pdf', null)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </Form.Item>
                    )}

                    {/* Video Upload */}
                    <Form.Item
                        label="Post Video"
                        validateStatus={errors.video ? 'error' : ''}
                        help={errors.video}
                    >
                        <Upload
                            beforeUpload={(file) => handleFileChange('video', file)}
                            accept="video/*"
                            showUploadList={false}
                            maxCount={1}
                        >
                            <Button icon={<VideoCameraOutlined />}>
                                {editPost.video ? 'Replace Video' : 'Select Video'}
                            </Button>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            Maximum file size: 10MB
                        </Text>
                    </Form.Item>

                    {/* Video Preview */}
                    {(data.video instanceof File || editPost.video) && (
                        <Form.Item label="Video Preview">
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ 
                                    padding: '12px', 
                                    border: '1px solid #d9d9d9', 
                                    borderRadius: '8px',
                                    backgroundColor: '#fafafa',
                                    marginBottom: '8px'
                                }}>
                                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                                        {data.video instanceof File ? 'New Video:' : 'Existing Video:'}
                                    </Text>
                                    <video
                                        width="320"
                                        height="180"
                                        controls
                                        className="rounded shadow"
                                        style={{ marginBottom: '8px' }}
                                        src={getFilePreviewUrl('video')}
                                        onError={(e) => {
                                            console.error('Video loading error:', e);
                                            e.target.style.display = 'none';
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                    {data.video instanceof File && (
                                        <Text style={{ display: 'block', marginTop: '8px' }}>
                                            File: {data.video.name} ({(data.video.size / 1024 / 1024).toFixed(2)} MB)
                                        </Text>
                                    )}
                                    {editPost.video && !data.video && (
                                        <div style={{ marginTop: '8px' }}>
                                            <Text style={{ display: 'block', marginBottom: '4px' }}>Current video file:</Text>
                                            <Button 
                                                icon={<PlayCircleOutlined />} 
                                                type="primary" 
                                                size="small"
                                                href={`/storage/${editPost.video}`}
                                                target="_blank"
                                            >
                                                Play Video
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => setData('video', null)}
                                >
                                    Remove Video
                                </Button>
                            </div>
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Post Video URL"
                        validateStatus={errors.video_url ? 'error' : ''}
                        help={errors.video_url}
                    >
                        <Input
                            size="large"
                            placeholder="Enter embedded video URL (YouTube, Vimeo, etc.)"
                            value={data.video_url}
                            onChange={(e) => setData('video_url', e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Post Content"
                        validateStatus={errors.content ? 'error' : ''}
                        help={errors.content}
                    >
                        <ReactQuill
                            theme="snow"
                            value={data.content}
                            onChange={(value) => setData('content', value)}
                            placeholder="Write your post content..."
                            modules={quillModules}
                            style={{
                                background: '#fff',
                                borderRadius: '8px',
                                height: '300px',
                                marginBottom: '50px'
                            }}
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
                                Update Post
                            </Button>
                            <Link href={route('admin.posts.index')}>
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