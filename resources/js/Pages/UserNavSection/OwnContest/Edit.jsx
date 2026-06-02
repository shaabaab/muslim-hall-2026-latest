import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    EditOutlined,
    MailOutlined,
    PhoneOutlined,
    LinkOutlined,
    SaveOutlined,
    UploadOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Typography,
    Upload,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_UPCOMING = 1;
const STATUS_RUNNING = 2;
const STATUS_ENDED = 3;
const STATUS_ARCHIVED = 4;

const statusOptions = [
    { value: STATUS_UPCOMING, label: "Upcoming" },
    { value: STATUS_RUNNING, label: "Running" },
    { value: STATUS_ENDED, label: "Ended" },
    { value: STATUS_ARCHIVED, label: "Holded" },
];

const paymentTypeOptions = [
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
];

const userTypeOptions = [
    { value: "all", label: "All" },
    { value: "user", label: "Users" },
    { value: "member", label: "Members" },
];

const submissionTypeOptions = [
    { value: "manual", label: "Manual" },
    { value: "google_form", label: "Google Form" },
];

const formatOptions = [
    { value: "image", label: "Image" },
    { value: "audio", label: "Audio" },
    { value: "video", label: "Video" },
    { value: "pdf", label: "PDF" },
    { value: "text", label: "Text" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseFormats = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((f) => f.toLowerCase());
    try {
        return JSON.parse(raw).map((f) => f.toLowerCase());
    } catch {
        return [];
    }
};

export default function Edit({ auth, contest, sponsors, categories, prizes }) {
    console.log("contest data:", contest);
    const existingFormats = parseFormats(contest.formats);

    const { data, setData, post, processing, errors } = useForm({
        title: contest.title || "",
        description: contest.description || "",
        start_date: contest.start_date || "",
        end_date: contest.end_date || "",
        category_id: contest.category_id || "",
        payment_type: contest.payment_type || "",
        user_type: contest.user_type || "",
        amount: contest.amount || "",
        prizes: contest.prizes?.map((p) => p.id) || [],
        status: contest.status || STATUS_UPCOMING,
        is_on_hold: contest.is_on_hold || false,

        // Submission type
        type: contest.type || "",
        form_url: contest.form_url || "",
        formats: existingFormats,

        // Sponsors
        sponsor_ids:
            contest.contest_sponsor
                ?.map((s) => s.sponsor_id || s.id)
                .filter(Boolean) || [],

        sponsor_banners:
            contest.contest_sponsor?.reduce((acc, s) => {
                const id = s.sponsor_id || s.id;
                if (id && s.banner) {
                    acc[id] = {
                        file: null,
                        preview: `/storage/${s.banner}`,
                        name: "Existing banner",
                        existing: true,
                    };
                }
                return acc;
            }, {}) || {},

        _method: "PUT",

        // ✅ ADDED
        email: contest.email || "",
        phone: contest.phone || "",
        link: contest.link || "",
        admin_approval: contest.admin_approval ?? false,
    });

    const isPaidContest = data.payment_type === "paid";
    const isGoogleForm = data.type === "google_form";
    const isManual = data.type === "manual";

    // ── Status confirmation modal ─────────────────────────────────────────────
    const [statusConfirmVisible, setStatusConfirmVisible] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [selectedSponsors, setSelectedSponsors] = useState([]);

    const getSponsors = () => (Array.isArray(sponsors) ? sponsors : []);

    useEffect(() => {
        const selected = getSponsors().filter((s) =>
            data.sponsor_ids.includes(s.id),
        );
        setSelectedSponsors(selected);
    }, [data.sponsor_ids]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const updateFormData = (key, value) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const updateSponsorBanner = (sponsorId, bannerData) =>
        setData((prev) => ({
            ...prev,
            sponsor_banners: {
                ...prev.sponsor_banners,
                [sponsorId]: bannerData,
            },
        }));

    // ── Submit ────────────────────────────────────────────────────────────────
    const submit = () => {
        if (!data.title?.trim())
            return message.error("Contest title is required");
        if (!data.category_id) return message.error("Category is required");
        if (!data.start_date || !data.end_date)
            return message.error("Contest duration is required");
        if (!data.prizes?.length)
            return message.error("At least one prize is required");

        // Validate sponsor banners
        const missingBanners = data.sponsor_ids.filter((id) => {
            const b = data.sponsor_banners[id];
            return !b || (!b.file && !b.existing);
        });
        if (missingBanners.length > 0) {
            const names = missingBanners.map((id) => {
                const s = getSponsors().find((sp) => sp.id === id);
                return s?.name || `Sponsor #${id}`;
            });
            message.error(`Please upload banners for: ${names.join(", ")}`);
            return;
        }

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description || "");
        formData.append("start_date", data.start_date);
        formData.append("end_date", data.end_date);
        formData.append("category_id", data.category_id);
        formData.append("status", data.status);
        formData.append("is_on_hold", data.is_on_hold ? "1" : "0");
        formData.append("payment_type", data.payment_type || "");
        formData.append("user_type", data.user_type || "");
        formData.append("type", data.type || "");
        formData.append("form_url", data.form_url || "");
        formData.append("_method", "PUT");
        formData.append("email", data.email || "");
        formData.append("phone", data.phone || "");
        formData.append("link", data.link || "");
        formData.append("admin_approval", data.admin_approval ? "1" : "0");

        if (isPaidContest) formData.append("amount", data.amount || "");

        data.formats.forEach((f, i) => formData.append(`formats[${i}]`, f));
        data.prizes.forEach((id, i) => formData.append(`prizes[${i}]`, id));
        data.sponsor_ids.forEach((id, i) =>
            formData.append(`sponsor_ids[${i}]`, id),
        );

        Object.entries(data.sponsor_banners).forEach(([sponsorId, banner]) => {
            if (banner.file)
                formData.append(`sponsor_banners[${sponsorId}]`, banner.file);
        });

        post(route("user.contests.update", contest.id), formData, {
            forceFormData: true,
            onSuccess: () => message.success("Contest updated successfully"),
            onError: (errs) => {
                message.error(
                    errs.message ||
                        "Error updating contest. Please check all required fields.",
                );
            },
        });
    };

    // ── Sponsor handlers ──────────────────────────────────────────────────────
    const handleSponsorChange = (selectedIds) => {
        updateFormData("sponsor_ids", selectedIds || []);

        const updatedBanners = { ...data.sponsor_banners };
        selectedIds.forEach((id) => {
            if (!updatedBanners[id]) {
                updatedBanners[id] = { file: null, preview: null, name: "" };
            }
        });
        Object.keys(updatedBanners).forEach((id) => {
            if (!selectedIds.includes(parseInt(id))) {
                if (
                    updatedBanners[id]?.preview &&
                    !updatedBanners[id]?.existing
                ) {
                    URL.revokeObjectURL(updatedBanners[id].preview);
                }
                delete updatedBanners[id];
            }
        });
        updateFormData("sponsor_banners", updatedBanners);
    };

    const handleBannerUpload = (sponsorId, file) => {
        if (!file.type.startsWith("image/")) {
            message.error("Please select a valid image file");
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error("File is too large (max 5MB)");
            return false;
        }
        updateSponsorBanner(sponsorId, {
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            existing: false,
        });
        return false;
    };

    const removeBanner = (sponsorId) => {
        const b = data.sponsor_banners[sponsorId];
        if (b?.preview && !b?.existing) URL.revokeObjectURL(b.preview);
        updateSponsorBanner(sponsorId, {
            file: null,
            preview: null,
            name: "",
            existing: false,
        });
    };

    // ── Status change with confirmation ───────────────────────────────────────
    const handleStatusChange = (newStatus) => {
        setPendingStatus(newStatus);
        setStatusConfirmVisible(true);
    };
    const confirmStatusChange = () => {
        updateFormData("status", pendingStatus);
        setStatusConfirmVisible(false);
        setPendingStatus(null);
        message.success(
            `Status updated to ${statusOptions.find((s) => s.value === pendingStatus)?.label}`,
        );
    };
    const cancelStatusChange = () => {
        setStatusConfirmVisible(false);
        setPendingStatus(null);
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
        ],
    };

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(data.sponsor_banners).forEach((b) => {
                if (b?.preview && !b?.existing) URL.revokeObjectURL(b.preview);
            });
        };
    }, []);

    return (
        <Authenticated
            user={auth.user}
            header={`Edit Contest: ${contest.title}`}
        >
            <Card>
                <div className="mb-6">
                    <Link href={route("user.contests.show", contest.id)}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Contest
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined /> Edit Contest: {contest.title}
                    </Title>
                    <Text type="secondary">
                        Update your contest details and settings
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-2xl">
                    {/* Title */}
                    <Form.Item
                        label="Contest Title"
                        validateStatus={errors.title ? "error" : ""}
                        help={errors.title}
                        required
                    >
                        <Input
                            size="large"
                            placeholder="Enter Contest title"
                            value={data.title}
                            onChange={(e) =>
                                updateFormData("title", e.target.value)
                            }
                        />
                    </Form.Item>

                    {/* Category */}
                    <Form.Item
                        label="Category"
                        validateStatus={errors.category_id ? "error" : ""}
                        help={errors.category_id}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id || undefined}
                            onChange={(value) =>
                                updateFormData("category_id", value)
                            }
                        >
                            {categories.map((cat) => (
                                <Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Status */}
                    <Form.Item
                        label="Status"
                        validateStatus={errors.status ? "error" : ""}
                        help={errors.status}
                    >
                        <Select
                            size="large"
                            placeholder="Select Status"
                            value={data.status || undefined}
                            onChange={handleStatusChange}
                        >
                            {statusOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Payment Type */}
                    <Form.Item
                        label="Payment Type"
                        validateStatus={errors.payment_type ? "error" : ""}
                        help={errors.payment_type}
                    >
                        <Select
                            size="large"
                            placeholder="Select Payment Type"
                            value={data.payment_type || undefined}
                            onChange={(value) =>
                                updateFormData("payment_type", value)
                            }
                        >
                            {paymentTypeOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* User Type */}
                    <Form.Item
                        label="User Type"
                        validateStatus={errors.user_type ? "error" : ""}
                        help={errors.user_type}
                    >
                        <Select
                            size="large"
                            placeholder="Select User Type"
                            value={data.user_type || undefined}
                            onChange={(value) =>
                                updateFormData("user_type", value)
                            }
                        >
                            {userTypeOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Amount — only when paid */}
                    {isPaidContest && (
                        <Form.Item
                            label="Amount"
                            validateStatus={errors.amount ? "error" : ""}
                            help={errors.amount}
                            required
                        >
                            <Input
                                size="large"
                                placeholder="Enter Amount"
                                value={data.amount}
                                onChange={(e) =>
                                    updateFormData("amount", e.target.value)
                                }
                                type="number"
                                min="0"
                                step="0.01"
                                prefix="$"
                            />
                        </Form.Item>
                    )}

                    {/* Submission Type */}
                    <Form.Item
                        label="Submission Type"
                        validateStatus={errors.type ? "error" : ""}
                        help={errors.type}
                    >
                        <Select
                            size="large"
                            placeholder="Select Submission Type"
                            value={data.type || undefined}
                            onChange={(value) => {
                                updateFormData("type", value);
                                if (value !== "google_form")
                                    updateFormData("form_url", "");
                                if (value !== "manual")
                                    updateFormData("formats", []);
                            }}
                        >
                            {submissionTypeOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Google Form URL — only when google_form */}
                    {isGoogleForm && (
                        <Form.Item
                            label="Google Form URL"
                            validateStatus={errors.form_url ? "error" : ""}
                            help={errors.form_url}
                            required
                        >
                            <Input
                                size="large"
                                placeholder="https://docs.google.com/forms/..."
                                value={data.form_url}
                                onChange={(e) =>
                                    updateFormData("form_url", e.target.value)
                                }
                                type="url"
                            />
                        </Form.Item>
                    )}

                    {/* Formats — only when manual */}
                    {isManual && (
                        <Form.Item
                            label="Formats"
                            validateStatus={errors.formats ? "error" : ""}
                            help={errors.formats}
                            required
                        >
                            <Select
                                mode="multiple"
                                size="large"
                                placeholder="Select one or more formats"
                                value={data.formats}
                                onChange={(value) =>
                                    updateFormData("formats", value)
                                }
                                allowClear
                            >
                                {formatOptions.map((opt) => (
                                    <Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Sponsors */}
                    <Form.Item
                        label="Sponsors"
                        validateStatus={errors.sponsor_ids ? "error" : ""}
                        help={errors.sponsor_ids}
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select Sponsors"
                            value={data.sponsor_ids}
                            onChange={handleSponsorChange}
                            suffixIcon={<UserOutlined />}
                            allowClear
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                            }
                            disabled={!getSponsors().length}
                        >
                            {getSponsors().map((sponsor) => (
                                <Option key={sponsor.id} value={sponsor.id}>
                                    {sponsor.name || `Sponsor #${sponsor.id}`}
                                </Option>
                            ))}
                        </Select>
                        {!getSponsors().length && (
                            <Text type="warning" className="text-xs">
                                No sponsors available.
                            </Text>
                        )}
                    </Form.Item>

                    {/* Sponsor Banners */}
                    {selectedSponsors.length > 0 && (
                        <Form.Item label="Sponsor Banners" required>
                            <Text
                                type="secondary"
                                style={{
                                    display: "block",
                                    marginBottom: "16px",
                                }}
                            >
                                Please upload banners for each selected sponsor
                                (Max: 5MB per image)
                            </Text>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                {selectedSponsors.map((sponsor) => {
                                    const banner =
                                        data.sponsor_banners[sponsor.id];
                                    const hasBanner =
                                        banner &&
                                        (banner.file || banner.existing);

                                    return (
                                        <Card
                                            key={sponsor.id}
                                            size="small"
                                            title={
                                                <Space>
                                                    <UserOutlined />
                                                    {sponsor.name ||
                                                        `Sponsor #${sponsor.id}`}
                                                    {banner?.existing && (
                                                        <Text
                                                            type="success"
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            (Existing)
                                                        </Text>
                                                    )}
                                                </Space>
                                            }
                                            extra={
                                                hasBanner && (
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={
                                                            <DeleteOutlined />
                                                        }
                                                        onClick={() =>
                                                            removeBanner(
                                                                sponsor.id,
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                )
                                            }
                                        >
                                            <Row gutter={16} align="middle">
                                                <Col span={hasBanner ? 12 : 24}>
                                                    <Upload
                                                        name={`banner_${sponsor.id}`}
                                                        listType="picture"
                                                        showUploadList={false}
                                                        beforeUpload={(file) =>
                                                            handleBannerUpload(
                                                                sponsor.id,
                                                                file,
                                                            )
                                                        }
                                                        accept="image/*"
                                                    >
                                                        <Button
                                                            icon={
                                                                <UploadOutlined />
                                                            }
                                                        >
                                                            {hasBanner
                                                                ? "Change Banner"
                                                                : "Upload Banner"}
                                                        </Button>
                                                    </Upload>
                                                    {banner?.name && (
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                display:
                                                                    "block",
                                                                marginTop:
                                                                    "8px",
                                                            }}
                                                        >
                                                            Selected:{" "}
                                                            {banner.name}
                                                        </Text>
                                                    )}
                                                </Col>
                                                {hasBanner &&
                                                    banner.preview && (
                                                        <Col span={12}>
                                                            <div
                                                                style={{
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                <img
                                                                    src={
                                                                        banner.existing
                                                                            ? getS3PublicUrl(
                                                                                  banner.path,
                                                                              )
                                                                            : banner.preview
                                                                    }
                                                                    alt={`Banner for ${sponsor.name}`}
                                                                    style={{
                                                                        maxWidth:
                                                                            "100%",
                                                                        maxHeight:
                                                                            "120px",
                                                                        border: "1px solid #d9d9d9",
                                                                        borderRadius:
                                                                            "6px",
                                                                    }}
                                                                />
                                                                <Text
                                                                    type="secondary"
                                                                    style={{
                                                                        display:
                                                                            "block",
                                                                        marginTop:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    {banner.existing
                                                                        ? "Current Banner"
                                                                        : "Preview"}
                                                                </Text>
                                                            </div>
                                                        </Col>
                                                    )}
                                            </Row>
                                        </Card>
                                    );
                                })}
                            </div>
                        </Form.Item>
                    )}

                    {/* Prizes */}
                    <Form.Item
                        label="Prizes"
                        validateStatus={errors.prizes ? "error" : ""}
                        help={errors.prizes}
                        required
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select Prizes"
                            value={data.prizes || []}
                            onChange={(value) =>
                                updateFormData("prizes", value)
                            }
                        >
                            {prizes.map((prize) => (
                                <Option key={prize.id} value={prize.id}>
                                    {prize.position} - {prize.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Contest Duration */}
                    <Form.Item
                        label="Contest Duration"
                        validateStatus={
                            errors.start_date || errors.end_date ? "error" : ""
                        }
                        help={errors.start_date || errors.end_date}
                        required
                    >
                        <DatePicker.RangePicker
                            size="large"
                            style={{ width: "100%" }}
                            showTime={{ format: "HH:mm" }}
                            format="YYYY-MM-DD HH:mm"
                            placeholder={["Start Date", "End Date"]}
                            dropdownClassName="contest-range-popup"
                            getPopupContainer={() => document.body}
                            value={[
                                data.start_date ? dayjs(data.start_date) : null,
                                data.end_date ? dayjs(data.end_date) : null,
                            ]}
                            onChange={(dates, dateStrings) => {
                                updateFormData(
                                    "start_date",
                                    dateStrings[0] || "",
                                );
                                updateFormData(
                                    "end_date",
                                    dateStrings[1] || "",
                                );
                            }}
                        />
                    </Form.Item>

                    {/* ✅ ADDED: Email */}
                    <Form.Item
                        label="Email"
                        validateStatus={errors.email ? "error" : ""}
                        help={errors.email}
                    >
                        <Input
                            size="large"
                            prefix={<MailOutlined />}
                            placeholder="contact@example.com"
                            type="email"
                            value={data.email}
                            onChange={(e) =>
                                updateFormData("email", e.target.value)
                            }
                        />
                    </Form.Item>

                    {/* ✅ ADDED: Phone */}
                    <Form.Item
                        label="Phone Number"
                        validateStatus={errors.phone ? "error" : ""}
                        help={errors.phone}
                    >
                        <Input
                            size="large"
                            prefix={<PhoneOutlined />}
                            placeholder="+1 234 567 8900"
                            value={data.phone}
                            onChange={(e) =>
                                updateFormData("phone", e.target.value)
                            }
                        />
                    </Form.Item>

                    {/* ✅ ADDED: Link */}
                    <Form.Item
                        label="Link"
                        validateStatus={errors.link ? "error" : ""}
                        help={errors.link}
                    >
                        <Input
                            size="large"
                            prefix={<LinkOutlined />}
                            placeholder="https://example.com"
                            value={data.link}
                            onChange={(e) =>
                                updateFormData("link", e.target.value)
                            }
                        />
                    </Form.Item>

                    {/* Description */}
                    <Form.Item
                        label="Description"
                        validateStatus={errors.description ? "error" : ""}
                        help={errors.description}
                    >
                        <ReactQuill
                            theme="snow"
                            value={data.description}
                            onChange={(value) =>
                                updateFormData("description", value)
                            }
                            placeholder="Write your description..."
                            modules={quillModules}
                            style={{
                                background: "#fff",
                                borderRadius: "8px",
                                height: "200px",
                            }}
                        />
                    </Form.Item>

                    <br />
                    <br />

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Update Contest
                            </Button>
                            <Link
                                href={route("user.contests.show", contest.id)}
                            >
                                <Button type="default" size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>

                {/* Status Change Confirmation Modal */}
                <Modal
                    title="Confirm Status Change"
                    open={statusConfirmVisible}
                    onOk={confirmStatusChange}
                    onCancel={cancelStatusChange}
                    okText="Confirm Change"
                    cancelText="Cancel"
                >
                    <Text>
                        Are you sure you want to change the contest status to{" "}
                        <strong>
                            {
                                statusOptions.find(
                                    (s) => s.value === pendingStatus,
                                )?.label
                            }
                        </strong>
                        ? This may affect contest visibility and participation.
                    </Text>
                </Modal>
            </Card>
        </Authenticated>
    );
}
