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
    App,
    Alert,
    Switch,
    Tooltip
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FilePdfOutlined,
    PlayCircleOutlined,
    SaveFilled,
    ClearOutlined,
    HistoryOutlined,
    TeamOutlined,
    FileTextOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MagicUrl from 'quill-magic-url';
import { useState, useEffect, useCallback } from 'react';
import MultipleMediaUpload from '@/Components/MultipleMediaUpload';

Quill.register('modules/magicUrl', MagicUrl);
const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, categories, langs, sections, editPost }) {
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isDraftMode, setIsDraftMode] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasDraft, setHasDraft] = useState(false);
    const { message } = App.useApp();

    // Generate a unique storage key for this user and form with post ID
    const draftKey = `post_draft_${auth.user.id}_edit_${editPost.id}`;

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
                    id: `existing-${editPost.id}-${index}`
                };
            });
            setImagePreviews(existingPreviews);
        } else {
            setImagePreviews([]);
        }

        // Load draft if exists
        loadDraft();
    }, [editPost.id]);

    // Load draft from localStorage on component mount
    const loadDraft = () => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const draftData = JSON.parse(savedDraft);

                // Check if draft is less than 7 days old
                const draftAge = new Date().getTime() - (draftData.timestamp || 0);
                const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

                if (draftAge < maxAge) {
                    // Merge draft data with existing post data
                    const mergedData = {
                        ...data,
                        ...draftData.data,
                        existing_images: data.existing_images, // Preserve existing images
                        images: draftData.data.images || [] // Keep new images from draft
                    };

                    // Update form data
                    Object.keys(mergedData).forEach(key => {
                        setData(key, mergedData[key]);
                    });

                    // Load image previews from draft
                    if (draftData.data.imagePreviews) {
                        const draftPreviews = draftData.data.imagePreviews.map(preview => ({
                            ...preview,
                            preview: preview.isExisting
                                ? `/storage/${preview.path}`
                                : URL.createObjectURL(new Blob([preview.data]))
                        }));
                        setImagePreviews([...existingPreviews, ...draftPreviews]);
                    }

                    setHasDraft(true);
                    message.info('Draft loaded from previous session');
                } else {
                    clearDraft();
                }
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    };

    // Auto-save draft when data changes (debounced)
    useEffect(() => {
        if (!isDraftMode) return;

        const timeoutId = setTimeout(() => {
            saveDraft();
        }, 2000); // Auto-save after 2 seconds of inactivity

        return () => clearTimeout(timeoutId);
    }, [data, imagePreviews, isDraftMode]);

    // Function to save draft to localStorage
    const saveDraft = useCallback(() => {
        if (!isDraftMode) return;

        try {
            const draftData = {
                data: {
                    title: data.title,
                    content: data.content,
                    video_url: data.video_url,
                    category_id: data.category_id,
                    section_id: data.section_id,
                    lang_id: data.lang_id,
                    status: data.status,
                    // Store new images metadata (not the actual files)
                    images: data.images.map(img => ({
                        name: img.name,
                        size: img.size,
                        type: img.type,
                        lastModified: img.lastModified
                    })),
                    video: data.video ? {
                        name: data.video.name,
                        size: data.video.size,
                        type: data.video.type
                    } : null,
                    pdf: data.pdf ? {
                        name: data.pdf.name,
                        size: data.pdf.size,
                        type: data.pdf.type
                    } : null
                },
                timestamp: new Date().getTime(),
                user_id: auth.user.id,
                post_id: editPost.id,
                form_type: 'post_edit'
            };

            localStorage.setItem(draftKey, JSON.stringify(draftData));
            setLastSaved(new Date());
            setHasDraft(true);

            console.log('Draft saved at:', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }, [data, imagePreviews, isDraftMode, draftKey, auth.user.id, editPost.id]);

    // Function to clear draft
    const clearDraft = () => {
        try {
            localStorage.removeItem(draftKey);
            setHasDraft(false);
            setLastSaved(null);

            // Clear new image previews object URLs
            imagePreviews.forEach(preview => {
                if (!preview.isExisting && preview.preview) {
                    URL.revokeObjectURL(preview.preview);
                }
            });

            // Reset to original post data
            const newPreviews = existingImages.map((img, index) => {
                const imagePath = typeof img === 'object' ? img.image : img;
                return {
                    file: null,
                    preview: `/storage/${imagePath}`,
                    isExisting: true,
                    path: imagePath,
                    id: `existing-${editPost.id}-${index}`
                };
            });

            setImagePreviews(newPreviews);
            setData({
                title: editPost.title || '',
                content: editPost.content || '',
                images: [],
                existing_images: existingImages,
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

            message.success('Draft cleared successfully');
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    };

    // Function to manually save draft
    const handleManualSave = () => {
        saveDraft();
        message.success('Draft saved manually');
    };

    // Function to load draft (manual)
    const handleLoadDraft = () => {
        loadDraft();
        message.success('Draft loaded successfully');
    };

    const handleAddAudioFile = (file) => {
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
            // Update existing audio if needed (e.g., changing title)
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
                // Handled below for chunked upload
            } else if (key === 'remove_audios') {
                data.remove_audios.forEach(id => formData.append('remove_audios[]', id));
            } else if (key === 'existing_audios') {
                // We don't necessarily need to send existing_audios unless the backend expects it
                data.existing_audios.forEach(audio => formData.append('existing_audios[]', JSON.stringify(audio)));
            } else {
                formData.append(key, data[key]);
            }
        });

        const newAudios = data.audios;
        const totalNewAudios = newAudios.length;

        if (totalNewAudios > 0) {
            const uploadModal = message.loading({ content: 'Preparing audio files...', duration: 0, key: 'uploading' });
            let completedAudios = 0;

            const uploadNextAudio = (index) => {
                if (index >= totalNewAudios) {
                    // All audios uploaded, submit the form
                    finishFormSubmission(formData);
                    return;
                }

                const file = newAudios[index];
                message.loading({ content: `Uploading audio ${index + 1} of ${totalNewAudios}...`, duration: 0, key: 'uploading' });

                if (file.size > 5 * 1024 * 1024) { // Use chunked upload for > 5MB
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
        post(route('admin.posts.update', editPost.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success('Post updated successfully');
                message.destroy('uploading');
                clearDraft();
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
            const isValidSize = file.size <= 5 * 1024 * 1024;

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <Title level={3}>
                                <EditOutlined className="mr-2" />
                                Edit Post
                            </Title>
                            <Text type="secondary">
                                Update post information
                            </Text>
                        </div>

                        <Space>
                            <Tooltip title={isDraftMode ? "Auto-save is enabled" : "Auto-save is disabled"}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Text type="secondary">Auto-save:</Text>
                                    <Switch
                                        checked={isDraftMode}
                                        onChange={setIsDraftMode}
                                        checkedChildren="ON"
                                        unCheckedChildren="OFF"
                                    />
                                </div>
                            </Tooltip>

                            <Button
                                icon={<HistoryOutlined />}
                                onClick={handleLoadDraft}
                                disabled={!hasDraft}
                                size="small"
                            >
                                Load Draft
                            </Button>

                            <Button
                                icon={<SaveFilled />}
                                onClick={handleManualSave}
                                type="dashed"
                                size="small"
                            >
                                Save Draft
                            </Button>

                            <Button
                                icon={<ClearOutlined />}
                                onClick={clearDraft}
                                danger
                                disabled={!hasDraft}
                                size="small"
                            >
                                Clear Draft
                            </Button>
                        </Space>
                    </div>

                    {isDraftMode && (
                        <Alert
                            message={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>
                                        <SaveFilled /> Draft Auto-save is enabled
                                        {lastSaved && (
                                            <Text type="secondary" style={{ marginLeft: '8px' }}>
                                                Last saved: {lastSaved.toLocaleTimeString()}
                                            </Text>
                                        )}
                                    </span>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Your changes are automatically saved locally
                                    </Text>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: '16px' }}
                        />
                    )}
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
                            suffixIcon={<FileTextOutlined />}
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
                                            borderRadius: '4px',
                                            border: `1px solid ${preview.isExisting ? '#91d5ff' : '#b7eb8f'}`
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
                                padding: '12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <Text strong>
                                    {data.pdf instanceof File ? 'New PDF File:' : 'Existing PDF File:'}
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
                                        View Current PDF
                                    </a>
                                ) : null}
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    style={{ marginTop: '8px' }}
                                    onClick={() => clearFile('pdf')}
                                >
                                    Remove
                                </Button>
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
                            maxCount={10}
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
                                <video
                                    width="320"
                                    height="180"
                                    controls
                                    className="rounded shadow"
                                    style={{ marginBottom: '8px' }}
                                    src={getFilePreviewUrl('video')}
                                />
                                <br />
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => clearFile('video')}
                                >
                                    Remove Video
                                </Button>
                            </div>
                        </Form.Item>
                    )}

                    {/* Video URL */}
                    <Form.Item
                        label="Post Video URL"
                        validateStatus={errors.video_url ? 'error' : ''}
                        help={errors.video_url}
                    >
                        <Input
                            size="large"
                            placeholder="Enter embedded video URL (YouTube, Vimeo, etc.)"
                            value={data.video_url}
                            suffixIcon={<VideoCameraOutlined />}
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
                            <Button
                                onClick={handleManualSave}
                                icon={<SaveFilled />}
                                size="large"
                                type="dashed"
                            >
                                Save Draft
                            </Button>
                            <Button
                                onClick={clearDraft}
                                icon={<ClearOutlined />}
                                size="large"
                                danger
                                disabled={!hasDraft}
                            >
                                Clear Draft
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

            <style jsx>{`
                :global(.ant-upload-list-item) {
                    margin-top: 8px;
                }
                
                :global(.ant-image-preview-body) {
                    overflow: hidden;
                }
                
                :global(.ql-editor) {
                    min-height: 200px;
                }
                
                :global(.ant-form-item-label > label) {
                    font-weight: 500;
                }
            `}</style>
        </Authenticated>
    );
}