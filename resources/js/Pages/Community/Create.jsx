import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    EditOutlined,
    EyeOutlined,
    PictureOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import {
    Button,
    Card,
    Form,
    Input,
    message,
    Select,
    Space,
    Typography,
    Upload,
} from "antd";
import { useState } from "react";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Create({ auth }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        title: "",
        content: "",
        image: null,
        status: "published", // Default to published
    });

    const submit = () => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        post(route("admin.communities.store"), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success("Community post created successfully");
                setData({
                    title: "",
                    content: "",
                    image: null,
                    status: "published",
                });
                setImagePreview(null);
            },
            onError: () => {
                message.error("Error creating community post");
            },
        });
    };

    const handleImageUpload = (file) => {
        setData("image", file);
        setImagePreview(URL.createObjectURL(file));
        return false; // Prevent automatic upload
    };

    const handleImageRemove = () => {
        setData("image", null);
        setImagePreview(null);
    };

    return (
        <Authenticated user={auth.user} header="Create Community Post">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.communities.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Community
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined className="mr-2" />
                        Create New Community Post
                    </Title>
                    <Text type="secondary">
                        Share your thoughts and engage with the community
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Form.Item
                        label="Post Title"
                        validateStatus={errors.title ? "error" : ""}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter post title"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            prefix={<EditOutlined />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Post Content"
                        validateStatus={errors.content ? "error" : ""}
                        help={errors.content}
                        required
                    >
                        <TextArea
                            size="large"
                            rows={6}
                            placeholder="Write your post content here..."
                            value={data.content}
                            onChange={(e) => setData("content", e.target.value)}
                            showCount
                            maxLength={5000}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Post Status"
                        validateStatus={errors.status ? "error" : ""}
                        help={errors.status}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select post status"
                            value={data.status}
                            onChange={(value) => setData("status", value)}
                        >
                            <Option value="published">
                                <Space>
                                    <EyeOutlined />
                                    Published
                                </Space>
                            </Option>
                            <Option value="draft">
                                <Space>
                                    <EditOutlined />
                                    Draft
                                </Space>
                            </Option>
                            <Option value="archived">
                                <Space>
                                    <SaveOutlined />
                                    Archived
                                </Space>
                            </Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Featured Image"
                        validateStatus={errors.image ? "error" : ""}
                        help={errors.image}
                    >
                        <Upload
                            beforeUpload={handleImageUpload}
                            onRemove={handleImageRemove}
                            accept="image/*"
                            showUploadList={false}
                            listType="picture"
                            maxCount={1}
                        >
                            <Button icon={<PictureOutlined />}>
                                Select Image
                            </Button>
                        </Upload>

                        {imagePreview && (
                            <div className="mt-4">
                                <Text strong className="block mb-2">
                                    Image Preview:
                                </Text>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{
                                        maxWidth: "300px",
                                        maxHeight: "200px",
                                        borderRadius: "8px",
                                        objectFit: "contain",
                                    }}
                                    className="border border-dashed border-gray-300"
                                />
                            </div>
                        )}

                        {data.image && (
                            <Text type="secondary" className="block mt-2">
                                Selected file: {data.image.name}
                            </Text>
                        )}

                        <Text type="secondary" className="block mt-1">
                            Supported formats: JPEG, PNG, JPG, GIF | Max size:
                            2MB
                        </Text>
                    </Form.Item>

                    <Form.Item className="mt-8">
                        <Space size="middle">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                style={{ minWidth: "160px" }}
                            >
                                {data.status === "draft"
                                    ? "Save as Draft"
                                    : "Publish Post"}
                            </Button>

                            <Link href={route("admin.communities.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>

                            {data.status === "draft" && (
                                <Button
                                    type="default"
                                    size="large"
                                    onClick={() => {
                                        setData("status", "published");
                                        // Submit the form after a short delay to ensure status is updated
                                        setTimeout(submit, 100);
                                    }}
                                    loading={processing}
                                >
                                    Publish Now
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}
