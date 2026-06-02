import { useForm } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';
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
    UploadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilePdfOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MagicUrl from 'quill-magic-url';
import { useState, useEffect } from 'react';
import MultipleMediaUpload from '@/Components/MultipleMediaUpload';
import axios from 'axios';

Quill.register('modules/magicUrl', MagicUrl);
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
        video: null,
        video_url: editPost.video_url || '',
        pdf: null,
        audios: [],
        remove_audios: [],
        existing_audios: editPost.audios || editPost.post_audios || [],
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
                return {
                    file: null,
                    preview: `/storage/${imagePath}`,
                    isExisting: true,
                    path: imagePath,
                    id: `existing-${index}`
                };
            });
            setImagePreviews(existingPreviews);
        } else {
            setImagePreviews([]); // Clear previews if no images
        }
    }, [editPost?.id]);

    const handleAddAudioFile = (file) => {
        const isMember = auth.user.role_id === 2 || auth.user.role_id === 1;
        if (!isMember && (data.audios.length > 0 || data.existing_audios.length > 0)) {
            message.warning('Normal users can only upload one audio file.');
            return;
        }
        setData('audios', [...data.audios, file]);
    };

    const handleRemoveAudioFile = (index, isExisting, fileId) => {
        if (isExisting) {
            setData('remove_audios', [...data.remove_audios, fileId]);
            setData('existing_audios', data.existing_audios.filter(audio => audio.id !== fileId));
        } else {
            const newAudios = [...data.audios];
            newAudios.splice(index, 1);
            setData('audios', newAudios);
        }
    };

    const handleUpdateAudioFile = (index, isExisting, fileId, updatedFile) => {
        if (isExisting) {
            const updatedExisting = data.existing_audios.map(audio => 
                audio.id === fileId ? { ...audio, ...updatedFile } : audio
            );
            setData('existing_audios', updatedExisting);
        } else {
            const newAudios = [...data.audios];
            newAudios[index] = updatedFile;
            setData('audios', newAudios);
        }
    };

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'images') {
                data.images.forEach(img => formData.append('images[]', img));
            } else if (key === 'existing_images') {
                data.existing_images.forEach(img => formData.append('existing_images[]', img));
            } else if (key === 'audios') {
                // Handled below
            } else if (key === 'remove_audios') {
                data.remove_audios.forEach(id => formData.append('remove_audios[]', id));
            } else {
                formData.append(key, data[key]);
            }
        });

        const newAudios = data.audios;
        const totalNewAudios = newAudios.length;

        if (totalNewAudios > 0) {
            const uploadModal = message.loading({ content: 'Preparing audio files...', duration: 0, key: 'uploading' });
            
            const uploadNextAudio = (index) => {
                if (index >= totalNewAudios) {
                    finishFormSubmission(formData);
                    return;
                }

                const file = newAudios[index];
                message.loading({ content: `Uploading audio ${index + 1} of ${totalNewAudios}...`, duration: 0, key: 'uploading' });

                if (file.size > 5 * 1024 * 1024) {
                    const chunkSize = 2 * 1024 * 1024;
                    const totalChunks = Math.ceil(file.size / chunkSize);
                    const fileIdentifier = `audio_${Date.now()}_${index}`;

                    const uploadChunk = (chunkIndex) => {
                        const start = chunkIndex * chunkSize;
                        const end = Math.min(start + chunkSize, file.size);
                        const chunk = file.slice(start, end);

                        const chunkFormData = new FormData();
                        chunkFormData.append('file_chunk', chunk);
                        chunkFormData.append('chunk_index', chunkIndex);
                        chunkFormData.append('total_chunks', totalChunks);
                        chunkFormData.append('file_identifier', fileIdentifier);
                        chunkFormData.append('file_name', file.name);
                        chunkFormData.append('file_type', 'audio');

                        axios.post('/upload/chunk', chunkFormData).then(res => {
                            if (chunkIndex + 1 < totalChunks) {
                                uploadChunk(chunkIndex + 1);
                            } else {
                                formData.append('audios[]', fileIdentifier);
                                formData.append('audio_names[]', file.name);
                                uploadNextAudio(index + 1);
                            }
                        }).catch(err => {
                            message.error(`Failed to upload audio ${index + 1}`);
                            message.destroy('uploading');
                        });
                    };
                    uploadChunk(0);
                } else {
                    formData.append('audios[]', file);
                    uploadNextAudio(index + 1);
                }
            };

            uploadNextAudio(0);
        } else {
            finishFormSubmission(formData);
        }
    };

    const finishFormSubmission = (formData) => {
        post(route('user.posts.update', editPost.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const flashMsg = page?.props?.flash?.success || '';
                const hasLargeFiles = flashMsg.includes('background');

                if (hasLargeFiles) {
                    message.success('Post updated successfully.');
                    message.info('Your video, audio, or PDF is uploading in the background. It will appear once processing is complete.', 8);
                } else {
                    message.success('Post updated successfully');
                }
                message.destroy('uploading');
            },
            onError: (err) => {
                message.error('Error updating post');
                message.destroy('uploading');
                console.error('Update errors:', err);
            }
        });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        // Validate file types and sizes
        const validFiles = files.filter(file => {
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
            return true;
        });

        if (validFiles.length === 0) return;

        // Create preview URLs
        const newPreviews = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            isExisting: false,
            id: `new-${Date.now()}-${Math.random()}`
        }));

        setImagePreviews(prev => [...prev, ...newPreviews]);
        setData('images', [...data.images, ...validFiles]);
    };

    const removeImage = (index) => {
        const imageToRemove = imagePreviews[index];

        if (imageToRemove.isExisting) {
            // For existing images, remove from existing_images array
            const updatedExisting = data.existing_images.filter(path => path !== imageToRemove.path);
            setData('existing_images', updatedExisting);
        } else {
            // Count how many new images are before this index
            const newImagesBeforeIndex = imagePreviews
                .slice(0, index)
                .filter(preview => !preview.isExisting).length;

            const updatedImages = data.images.filter((_, i) => i !== newImagesBeforeIndex);
            setData('images', updatedImages);

            // Revoke object URL to prevent memory leaks
            URL.revokeObjectURL(imageToRemove.preview);
        }

        // Remove from previews
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (fieldName, file) => {
        if (file) {
            // Basic file validation
            if (fieldName === 'pdf' && file.type !== 'application/pdf') {
                message.error('Please select a valid PDF file');
                return;
            }

            if (fieldName === 'video' && !file.type.startsWith('video/')) {
                message.error('Please select a valid video file');
                return;
            }

            // Size validation (10MB for video, 5MB for PDF)
            const maxSize = fieldName === 'video' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                message.error(`File is too large (max ${maxSize / 1024 / 1024}MB)`);
                return;
            }

            setData(fieldName, file);
        }
    };

    const clearFile = (fieldName) => {
        setData(fieldName, null);
        // Also clear the file input
        const fileInput = document.querySelector(`input[type="file"][name="${fieldName}"]`);
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Helper function to check if we have a file (either new or existing)
    const hasFile = (fieldName) => {
        return data[fieldName] instanceof File || editPost[fieldName];
    };

    // Get file preview URL for video and PDF
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
        magicUrl: true,
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
        ],
    };

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Edit Post"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('user.posts.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Posts
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Edit Post
                    </Title>
                    <Text type="secondary">
                        Update post information
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
                            value={categories.find(category => category.id == data.category_id)?.name || null}
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
                            value={langs.find(lang => lang.id == data.lang_id)?.name || null}
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
                        <Input
                            size="large"
                            prefix={<UploadOutlined />}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                        />
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            You can select multiple images. Maximum file size: 5MB per image.
                        </Text>
                        {existingImages.length > 0 && (
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                {existingImages.length} existing image(s) - click the delete icon to remove
                            </Text>
                        )}
                    </Form.Item>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                        <Form.Item label="Image Previews">
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
                                            borderRadius: '4px'
                                        }}>
                                            {preview.isExisting ? 'Existing' : 'New'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Form.Item>
                    )}

                    {/* PDF Upload */}
                    <Form.Item
                        label="Post PDF"
                        validateStatus={errors.pdf ? 'error' : ''}
                        help={errors.pdf}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                size="large"
                                prefix={<UploadOutlined />}
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => handleFileChange('pdf', e.target.files[0])}
                            />
                            {(data.pdf instanceof File || editPost.pdf) && (
                                <Button
                                    type="link"
                                    danger
                                    onClick={() => clearFile('pdf')}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            Maximum file size: 5MB
                        </Text>
                    </Form.Item>

                    {/* PDF Preview */}
                    {(data.pdf instanceof File || editPost.pdf) && (
                        <Form.Item label="PDF Preview">
                            <div style={{
                                padding: '5px 10px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '8px',
                                backgroundColor: '#fafafa',
                                display: 'flex',
                                alignItems: 'left',
                                gap: '10px'
                            }}>
                                <FilePdfOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
                                <div>
                                    <Text strong style={{ display: 'block' }}>
                                        {data.pdf instanceof File ? 'New PDF File:' : 'Existing PDF File:'}
                                    </Text>
                                    {data.pdf instanceof File ? (
                                        <Text style={{ display: 'block' }}>
                                            {data.pdf.name} ({(data.pdf.size / 1024 / 1024).toFixed(2)} MB)
                                        </Text>
                                    ) : editPost.pdf ? (
                                        <a
                                            href={`/storage/${editPost.pdf}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'block', }}
                                        >
                                            <Button icon={<EyeOutlined />} type="link">
                                                View Current PDF
                                            </Button>
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </Form.Item>
                    )}

                    {/* Audio Upload */}
                    <Form.Item
                        label="Post Audios"
                        validateStatus={errors.audios ? 'error' : ''}
                        help={errors.audios}
                    >
                        <MultipleMediaUpload
                            files={data.audios}
                            existingFiles={data.existing_audios}
                            onAdd={handleAddAudioFile}
                            onRemove={handleRemoveAudioFile}
                            onUpdate={handleUpdateAudioFile}
                            type="audio"
                            acceptedTypes="audio/*"
                            max={auth.user.role_id === 2 || auth.user.role_id === 1 ? null : (data.existing_audios.length > 0 ? 0 : 1)}
                        />
                    </Form.Item>

                    {/* Video Upload */}
                    <Form.Item
                        label="Post Video"
                        validateStatus={errors.video ? 'error' : ''}
                        help={errors.video}
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                size="large"
                                prefix={<UploadOutlined />}
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleFileChange('video', e.target.files[0])}
                            />
                            {(data.video instanceof File || editPost.video) && (
                                <Button
                                    type="link"
                                    danger
                                    onClick={() => clearFile('video')}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
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
                                        width="130px"
                                        height="130px"
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
                            <Link href={route('user.posts.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>

                </Form>
            </Card>
        </FrontAuthenticatedLayout>
    );
}