import { useForm, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers"; // ✅ HERE
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
    Image,
    Divider,
    Tag,
} from "antd";
import {
    ArrowLeftOutlined,
    SaveOutlined,
    PictureOutlined,
    DeleteOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ auth, langs, setting }) {
    /**
     * ✅ URL resolver (Storage + S3 supported)
     * - If full URL (http) => keep
     * - Else try S3 helper
     * - Else fallback to /storage/
     */
    const resolveImageUrl = (path) => {
        if (!path) return null;
        if (typeof path !== "string") return null;

        // already full url
        if (path.startsWith("http://") || path.startsWith("https://")) return path;

        // if you store s3 key like: uploads/logo.png
        // getS3PublicUrl should return full url
        try {
            const s3Url = getS3PublicUrl(path);
            if (s3Url) return s3Url;
        } catch (e) {
            // ignore, fallback to local
        }

        // local storage fallback
        if (path.startsWith("/storage/")) return path;
        if (path.startsWith("storage/")) return `/${path}`;
        return `/storage/${path}`;
    };

    // ✅ Existing image urls (server)
    const existing = useMemo(() => {
        return {
            favicon: resolveImageUrl(setting?.favicon),
            header_logo: resolveImageUrl(setting?.header_logo),
            footer_logo: resolveImageUrl(setting?.footer_logo),
        };
    }, [setting]);

    // ✅ New preview (selected file)
    const [faviconNewPreview, setFaviconNewPreview] = useState(null);
    const [headerNewPreview, setHeaderNewPreview] = useState(null);
    const [footerNewPreview, setFooterNewPreview] = useState(null);

    const { data, setData, post, processing, errors } = useForm({
        header_title: setting?.header_title || "",
        footer_title: setting?.footer_title || "",
        footer_content: setting?.footer_content || "",
        lang_id: setting?.lang_id || null,

        favicon: null,
        header_logo: null,
        footer_logo: null,

        // ✅ remove flags (IMPORTANT for edit)
        remove_favicon: false,
        remove_header_logo: false,
        remove_footer_logo: false,

        _method: "PUT",
    });

    // ✅ clean objectURL leaks
    useEffect(() => {
        return () => {
            if (faviconNewPreview) URL.revokeObjectURL(faviconNewPreview);
            if (headerNewPreview) URL.revokeObjectURL(headerNewPreview);
            if (footerNewPreview) URL.revokeObjectURL(footerNewPreview);
        };
    }, [faviconNewPreview, headerNewPreview, footerNewPreview]);

    const submit = () => {
        const formData = new FormData();

        Object.keys(data).forEach((key) => {
            const val = data[key];

            // skip null/undefined
            if (val === null || val === undefined) return;

            // files: only append if File
            if (["favicon", "header_logo", "footer_logo"].includes(key)) {
                if (val instanceof File) formData.append(key, val);
                return;
            }

            // booleans: send as 1/0
            if (
                ["remove_favicon", "remove_header_logo", "remove_footer_logo"].includes(
                    key,
                )
            ) {
                formData.append(key, val ? 1 : 0);
                return;
            }

            formData.append(key, val);
        });

        formData.append("_method", "PUT");

        post(route("admin.settings.update", setting.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => message.success("Setting updated successfully"),
            onError: () => message.error("Error updating setting"),
        });
    };

    // ---------- Upload handlers ----------
    const handlePickImage = (field, file, setPreview) => {
        if (!file) return false;

        setData(field, file);

        // if user selects file => remove flag false
        if (field === "favicon") setData("remove_favicon", false);
        if (field === "header_logo") setData("remove_header_logo", false);
        if (field === "footer_logo") setData("remove_footer_logo", false);

        // preview
        const url = URL.createObjectURL(file);
        setPreview(url);

        return false; // prevent auto upload
    };

    const handleRemoveNewFile = (field, setPreview) => {
        setData(field, null);
        setPreview(null);
    };

    const removeCurrent = (field) => {
        // mark remove
        if (field === "favicon") setData("remove_favicon", true);
        if (field === "header_logo") setData("remove_header_logo", true);
        if (field === "footer_logo") setData("remove_footer_logo", true);

        // also clear any picked file
        setData(field, null);

        if (field === "favicon") setFaviconNewPreview(null);
        if (field === "header_logo") setHeaderNewPreview(null);
        if (field === "footer_logo") setFooterNewPreview(null);
    };

    // ✅ show existing only if not marked remove AND no new preview selected
    const canShowExistingFavicon =
        existing.favicon && !data.remove_favicon && !faviconNewPreview;
    const canShowExistingHeader =
        existing.header_logo && !data.remove_header_logo && !headerNewPreview;
    const canShowExistingFooter =
        existing.footer_logo && !data.remove_footer_logo && !footerNewPreview;

    return (
        <Authenticated user={auth.user} header="Edit Setting">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.settings.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Settings
                        </Button>
                    </Link>

                    <Title level={3} style={{ marginBottom: 0 }}>
                        Edit Site Setting
                    </Title>
                    <Text type="secondary">Update the settings for your site</Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    className="max-w-2xl"
                    initialValues={{
                        header_title: setting?.header_title,
                        footer_title: setting?.footer_title,
                        footer_content: setting?.footer_content,
                        lang_id: setting?.lang_id,
                    }}
                >
                    <Form.Item
                        label="Header Title"
                        validateStatus={errors.header_title ? "error" : ""}
                        help={errors.header_title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Header title"
                            value={data.header_title}
                            onChange={(e) => setData("header_title", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Footer Title"
                        validateStatus={errors.footer_title ? "error" : ""}
                        help={errors.footer_title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Footer title"
                            value={data.footer_title}
                            onChange={(e) => setData("footer_title", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Footer Content"
                        validateStatus={errors.footer_content ? "error" : ""}
                        help={errors.footer_content}
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Enter Footer content"
                            value={data.footer_content}
                            onChange={(e) => setData("footer_content", e.target.value)}
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Language"
                        validateStatus={errors.lang_id ? "error" : ""}
                        help={errors.lang_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Language"
                            value={data.lang_id || undefined}
                            onChange={(value) => setData("lang_id", value)}
                            suffixIcon={<TeamOutlined />}
                            allowClear
                        >
                            {langs?.map((lang) => (
                                <Option key={lang.id} value={lang.id}>
                                    {lang.name} ({lang.code})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Divider />

                    {/* ---------------- FAVICON ---------------- */}
                    <Form.Item
                        label={
                            <div className="flex items-center gap-2">
                                <span>Favicon</span>
                                {data.remove_favicon && <Tag color="red">Will remove</Tag>}
                            </div>
                        }
                        validateStatus={errors.favicon ? "error" : ""}
                        help={errors.favicon}
                    >
                        <div className="space-y-3">
                            {canShowExistingFavicon && (
                                <div className="flex items-center space-x-4">
                                    <Image
                                        width={50}
                                        height={50}
                                        src={existing.favicon}
                                        alt="Current Favicon"
                                        fallback="https://via.placeholder.com/50?text=No+Img"
                                        style={{
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                        }}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeCurrent("favicon")}
                                    >
                                        Remove Current
                                    </Button>
                                </div>
                            )}

                            <Upload
                                beforeUpload={(file) =>
                                    handlePickImage("favicon", file, setFaviconNewPreview)
                                }
                                onRemove={() =>
                                    handleRemoveNewFile("favicon", setFaviconNewPreview)
                                }
                                accept="image/*"
                                showUploadList={false}
                            >
                                <Button icon={<PictureOutlined />}>
                                    {existing.favicon ? "Change Favicon" : "Select Favicon"}
                                </Button>
                            </Upload>

                            {faviconNewPreview && (
                                <div className="mt-2">
                                    <Text strong className="block mb-2">
                                        New Preview:
                                    </Text>
                                    <img
                                        src={faviconNewPreview}
                                        alt="Favicon Preview"
                                        style={{
                                            maxWidth: "100px",
                                            maxHeight: "100px",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </Form.Item>

                    {/* ---------------- HEADER LOGO ---------------- */}
                    <Form.Item
                        label={
                            <div className="flex items-center gap-2">
                                <span>Header Logo</span>
                                {data.remove_header_logo && (
                                    <Tag color="red">Will remove</Tag>
                                )}
                            </div>
                        }
                        validateStatus={errors.header_logo ? "error" : ""}
                        help={errors.header_logo}
                    >
                        <div className="space-y-3">
                            {canShowExistingHeader && (
                                <div className="flex items-center space-x-4">
                                    <Image
                                        width={140}
                                        height={70}
                                        src={existing.header_logo}
                                        alt="Current Header Logo"
                                        fallback="https://via.placeholder.com/140x70?text=No+Img"
                                        style={{
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                            objectFit: "contain",
                                        }}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeCurrent("header_logo")}
                                    >
                                        Remove Current
                                    </Button>
                                </div>
                            )}

                            <Upload
                                beforeUpload={(file) =>
                                    handlePickImage("header_logo", file, setHeaderNewPreview)
                                }
                                onRemove={() =>
                                    handleRemoveNewFile("header_logo", setHeaderNewPreview)
                                }
                                accept="image/*"
                                showUploadList={false}
                            >
                                <Button icon={<PictureOutlined />}>
                                    {existing.header_logo
                                        ? "Change Header Logo"
                                        : "Select Header Logo"}
                                </Button>
                            </Upload>

                            {headerNewPreview && (
                                <div className="mt-2">
                                    <Text strong className="block mb-2">
                                        New Preview:
                                    </Text>
                                    <img
                                        src={headerNewPreview}
                                        alt="Header Logo Preview"
                                        style={{
                                            maxWidth: "220px",
                                            maxHeight: "120px",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                            objectFit: "contain",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </Form.Item>

                    {/* ---------------- FOOTER LOGO ---------------- */}
                    <Form.Item
                        label={
                            <div className="flex items-center gap-2">
                                <span>Footer Logo</span>
                                {data.remove_footer_logo && (
                                    <Tag color="red">Will remove</Tag>
                                )}
                            </div>
                        }
                        validateStatus={errors.footer_logo ? "error" : ""}
                        help={errors.footer_logo}
                    >
                        <div className="space-y-3">
                            {canShowExistingFooter && (
                                <div className="flex items-center space-x-4">
                                    <Image
                                        width={140}
                                        height={70}
                                        src={existing.footer_logo}
                                        alt="Current Footer Logo"
                                        fallback="https://via.placeholder.com/140x70?text=No+Img"
                                        style={{
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                            objectFit: "contain",
                                        }}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeCurrent("footer_logo")}
                                    >
                                        Remove Current
                                    </Button>
                                </div>
                            )}

                            <Upload
                                beforeUpload={(file) =>
                                    handlePickImage("footer_logo", file, setFooterNewPreview)
                                }
                                onRemove={() =>
                                    handleRemoveNewFile("footer_logo", setFooterNewPreview)
                                }
                                accept="image/*"
                                showUploadList={false}
                            >
                                <Button icon={<PictureOutlined />}>
                                    {existing.footer_logo
                                        ? "Change Footer Logo"
                                        : "Select Footer Logo"}
                                </Button>
                            </Upload>

                            {footerNewPreview && (
                                <div className="mt-2">
                                    <Text strong className="block mb-2">
                                        New Preview:
                                    </Text>
                                    <img
                                        src={footerNewPreview}
                                        alt="Footer Logo Preview"
                                        style={{
                                            maxWidth: "220px",
                                            maxHeight: "120px",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "6px",
                                            padding: "4px",
                                            objectFit: "contain",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
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
                                Update Setting
                            </Button>

                            <Link href={route("admin.settings.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}
