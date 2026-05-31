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

export default function Edit({ auth, board }) {
    const getImageUrl = () => {
        if (board?.image_url) {
            return board.image_url;
        }

        if (board?.image) {
            if (board.image.startsWith("http")) {
                return board.image;
            }

            return `/storage/${board.image}`;
        }

        return null;
    };

    const [imagePreview, setImagePreview] = useState(getImageUrl());

    const { data, setData, post, processing, errors, reset } = useForm({
        _method: "put",
        title: board?.title || "",
        description: board?.description || "",
        image: null,
        is_active: board?.is_active ?? true,
    });

    const handleImageUpload = (file) => {
        setData("image", file);
        setImagePreview(URL.createObjectURL(file));
        return false;
    };

    const resetForm = () => {
        reset();
        setImagePreview(getImageUrl());
    };

    const submit = () => {
        post(route("user.exhibition-boards.update", board.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                message.success("Board updated successfully. Waiting for admin approval again.");
            },
            onError: () => {
                message.error("Please check the form errors.");
            },
        });
    };

    return (
        <Authenticated user={auth.user} header="Edit Exhibition Board">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibition-boards.index")}>
                        <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
                            Back to Boards
                        </Button>
                    </Link>

                    <Title level={3}>Edit Exhibition Board</Title>

                    <Text type="secondary">
                        Update board information. After update, this board will wait for admin approval again.
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
                            <Button icon={<UploadOutlined />}>Change Board Image</Button>
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
                        <Button onClick={resetForm}>
                            Reset
                        </Button>

                        <Link href={route("user.exhibition-boards.index")}>
                            <Button>Cancel</Button>
                        </Link>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={processing}
                            icon={<SaveOutlined />}
                        >
                            Update Board
                        </Button>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}