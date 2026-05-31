import { Link, useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { useState } from "react";
import {
    Button,
    Card,
    Form,
    Input,
    Switch,
    Typography,
    Upload,
    message,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Create({ auth }) {
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        image: null,
        is_active: true,
    });

    const handleImageUpload = (file) => {
        setData("image", file);
        setImagePreview(URL.createObjectURL(file));
        return false;
    };

    const submit = () => {
        post(route("user.exhibition-boards.store"), {
            forceFormData: true,
            onSuccess: () => {
                message.success("Board created successfully. Waiting for admin approval.");
            },
            onError: () => {
                message.error("Please check the form errors.");
            },
        });
    };

    return (
        <Authenticated user={auth.user} header="Create Exhibition Board">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibition-boards.index")}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Boards
                        </Button>
                    </Link>

                    <Title level={3}>Create New Exhibition Board</Title>
                    <Text type="secondary">
                        First create a board. After admin approval, you can post exhibitions under this board.
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Form.Item
                        label="Board Title"
                        validateStatus={errors.title ? "error" : ""}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter board title"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Board Description"
                        validateStatus={errors.description ? "error" : ""}
                        help={errors.description}
                    >
                        <TextArea
                            rows={5}
                            placeholder="Write board description"
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Board Image"
                        validateStatus={errors.image ? "error" : ""}
                        help={errors.image}
                    >
                        <Upload
                            beforeUpload={handleImageUpload}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />}>Select Board Image</Button>
                        </Upload>

                        {imagePreview && (
                            <div className="mt-4">
                                <img
                                    src={imagePreview}
                                    alt="Board preview"
                                    style={{
                                        width: 220,
                                        height: 140,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        border: "1px solid #ddd",
                                    }}
                                />
                            </div>
                        )}
                    </Form.Item>

                    <Form.Item label="Active">
                        <Switch
                            checked={data.is_active}
                            onChange={(checked) => setData("is_active", checked)}
                        />
                    </Form.Item>

                    <div className="flex justify-end gap-3">
                        <Link href={route("user.exhibition-boards.index")}>
                            <Button>Cancel</Button>
                        </Link>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            icon={<SaveOutlined />}
                        >
                            Save Board
                        </Button>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}