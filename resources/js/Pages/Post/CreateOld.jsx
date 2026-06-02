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
    UploadOutlined,
    FilePdfOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth ,categories, langs , sections}) {

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content : '',
        image : '',
        video : '',
        video_url : '',
        pdf : '',
        category_id: '',
        section_id: '',
        lang_id: '',
        status: '',
    });

    const submit = () => {


        post(route('admin.posts.store'), {

            forceFormData: true,

            onSuccess: () => {
                message.success('Post created successfully');
            },
            onError: () => {
                message.error('Error creating post');
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
            header="Create Language"
        >
            <Card>
                <div className="mb-6">
                    <Link href={route('admin.posts.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Posts
                        </Button>
                    </Link>
                    <Title level={3}>
                        <UserOutlined className="mr-2" />
                        Create New Post
                    </Title>
                    <Text type="secondary">
                        Add a new post to your application
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
                        suffixIcon={<FileTextOutlined />}
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
                        validateStatus={errors.category_id  ? 'error' : ''}
                        help={errors.category_id }
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id}
                            onChange={(value) => setData('category_id', value)}
                            suffixIcon={<FileTextOutlined />}
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
                            suffixIcon={<FileTextOutlined />}
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
                        validateStatus={errors.section_id  ? 'error' : ''}
                        help={errors.section_id }
                    >
                        <Select
                            size="large"
                            placeholder="Select Section"
                            value={data.section_id}
                            onChange={(value) => setData('section_id', value)}
                            suffixIcon={<FileTextOutlined />}
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
                                suffixIcon={<FileTextOutlined />}
                            >
                                <Option value="1">Active</Option>
                                <Option value="0">Inactive</Option>
                            </Select>
                    </Form.Item>



                    {/* multiple image upload  */}
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
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                setData('images', files);
                            }}
                        />
                    </Form.Item>


                    {/* Preview */}
                    {data.image && (
                    <div className="mt-3">
                        <h4>Preview Image:</h4>
                        <img
                        src={
                            typeof data.image === 'string'
                            ? `/storage/${data.image}` // existing image from server
                            : URL.createObjectURL(data.image) // new image preview
                        }
                        alt="Post Preview"
                        style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8 }}
                        />
                    </div>
                    )}

                 
                
                    {/* PDF Preview */}
                        
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
                            <Button icon={<FilePdfOutlined />}>Select PDF</Button>
                        </Upload>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
                            Maximum file size: 5MB
                        </Text>
                    </Form.Item>

                    {data.pdf && (
                        <Form.Item label="PDF Preview">
                            <div style={{ 
                                padding: '12px', 
                                border: '1px solid #d9d9d9', 
                                borderRadius: '8px',
                                backgroundColor: '#fafafa'
                            }}>
                                <Text strong>
                                    {typeof data.pdf === 'string' ? 'Existing PDF:' : 'Selected PDF:'}
                                </Text>
                                <br />
                                {typeof data.pdf === 'string' ? (
                                    <a 
                                        href={`/storage/${data.pdf}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ marginTop: '8px', display: 'inline-block' }}
                                    >
                                        View PDF
                                    </a>
                                ) : (
                                    <Text style={{ display: 'block', marginTop: '8px' }}>
                                        {data.pdf.name} ({(data.pdf.size / 1024 / 1024).toFixed(2)} MB)
                                    </Text>
                                )}
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



                        {/** Post video upload and preview */}

                        <Form.Item
                        label="Post Video"
                        validateStatus={errors.video ? 'error' : ''}
                        help={errors.video}
                        >
                        <Input
                            size="large"
                            prefix={<UploadOutlined />}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setData('video', file); // store the actual File object
                            }
                            }}
                        />
                        </Form.Item>

                        {data.video && (
                        <video
                            width="320"
                            height="240"
                            controls
                            className="mt-3 rounded shadow"
                            src={
                            typeof data.video === 'string'
                                ? `/storage/${data.video}` // existing video path
                                : URL.createObjectURL(data.video) // new file preview
                            }
                        />
                        )}


                    

                        <Form.Item
                            label="Post Video URL"
                            
                            validateStatus={errors.video_url ? 'error' : ''}
                            help={errors.video_url}
                        >
                            <Input
                                size="large"
                                prefix={<UploadOutlined />}
                                accept='url'
                                placeholder="Enter embedded video URL"
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
                                    height: '200px', // increase height
                                }}
                            />
                        </Form.Item>

                    <br /> <br />


                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    icon={<SaveOutlined />}
                                    size="large"
                                >
                                    Create Post
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