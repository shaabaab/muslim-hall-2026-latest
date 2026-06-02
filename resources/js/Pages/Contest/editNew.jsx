import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    UploadOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
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
    { value: STATUS_ARCHIVED, label: "Archived" },
];

const getStatusLabel = (status) => {
    switch (Number(status)) {
        case 1:
            return "Upcoming";
        case 2:
            return "Running";
        case 3:
            return "Ended";
        case 4:
            return "Archived";
        default:
            return "Unknown";
    }
};

const paymentTypeOptions = [
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
];

const userTypeOptions = [
    { value: "all", label: "All" },
    { value: "user", label: "Users" },
    { value: "member", label: "Members" },
];

export default function Edit({ auth, contest, prizes, categories, sponsors }) {
    console.log("Contest data:", contest);
    console.log("Sponsors:", contest.contest_sponsor);

    // Initialize form data with contest data for editing
    const { data, setData, post, processing, errors } = useForm({
        title: contest?.title || "",
        category_id: contest?.category_id || "",
        description: contest?.description || "",
        user_type: contest?.user_type || "",
        payment_type: contest?.payment_type || "",
        amount: contest?.amount || "",
        status: contest?.status || "",
        start_date: contest?.start_date || "",
        end_date: contest?.end_date || "",
        prizes: contest?.prizes?.map((prize) => prize.id) || [],

        // Sponsor fields
        sponsor_ids:
            contest?.contest_sponsor
                ?.map((sponsor) => sponsor.sponsor_id || sponsor.id)
                .filter((id) => id) || [],
        sponsor_banners:
            contest?.contest_sponsor?.reduce((acc, sponsor) => {
                const sponsorId = sponsor.sponsor_id || sponsor.id;
                if (sponsorId && sponsor.banner) {
                    acc[sponsorId] = {
                        file: null,
                        preview: sponsor.banner
                            ? `/storage/${sponsor.banner}`
                            : null,
                        name: "Existing banner",
                        existing: true,
                    };
                }
                return acc;
            }, {}) || {},
    });

    // State for selected sponsors and status change confirmation
    const [selectedSponsors, setSelectedSponsors] = useState([]);
    const [statusConfirmVisible, setStatusConfirmVisible] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    // Update form data when contest prop changes
    useEffect(() => {
        if (contest) {
            setData({
                title: contest.title || "",
                category_id: contest.category_id || "",
                description: contest.description || "",
                user_type: contest.user_type || "",
                payment_type: contest.payment_type || "",
                amount: contest.amount || "",
                status: contest.status || "",
                start_date: contest.start_date || "",
                end_date: contest.end_date || "",
                prizes: contest.prizes?.map((prize) => prize.id) || [],
                sponsor_ids:
                    contest.contest_sponsor
                        ?.map((sponsor) => sponsor.sponsor_id || sponsor.id)
                        .filter((id) => id) || [],
                sponsor_banners:
                    contest.contest_sponsor?.reduce((acc, sponsor) => {
                        const sponsorId = sponsor.sponsor_id || sponsor.id;
                        if (sponsorId && sponsor.banner) {
                            acc[sponsorId] = {
                                file: null,
                                preview: sponsor.banner
                                    ? `/storage/${sponsor.banner}`
                                    : null,
                                name: "Existing banner",
                                existing: true,
                            };
                        }
                        return acc;
                    }, {}) || {},
            });
        }
    }, [contest]);

    // Update selected sponsors when sponsor_ids changes
    useEffect(() => {
        const selected = getSponsors().filter((sponsor) =>
            data.sponsor_ids.includes(sponsor.id),
        );
        setSelectedSponsors(selected);
    }, [data.sponsor_ids]);

    const getSponsors = () => (Array.isArray(sponsors) ? sponsors : []);

    // Handle field changes
    const handleFieldChange = (field, value) => {
        setData(field, value);

        // Reset amount if payment type changes from Paid to Free
        if (field === "payment_type" && value === "free") {
            setData("amount", "");
        }
    };

    // Update specific field in sponsor_banners without affecting other data
    const updateSponsorBanner = (sponsorId, bannerData) => {
        setData((prevData) => ({
            ...prevData,
            sponsor_banners: {
                ...prevData.sponsor_banners,
                [sponsorId]: bannerData,
            },
        }));
    };

    const submit = () => {
        console.log("Form data:", data);

        // Validate required fields before submission
        if (!data.title || !data.title.trim()) {
            message.error("Contest title is required");
            return;
        }

        if (!data.category_id) {
            message.error("Category is required");
            return;
        }

        if (!data.start_date || !data.end_date) {
            message.error("Contest duration is required");
            return;
        }

        if (!data.prizes || data.prizes.length === 0) {
            message.error("At least one prize is required");
            return;
        }

        // Prepare form data properly
        const formData = new FormData();

        // Append basic fields
        formData.append("title", data.title);
        formData.append("description", data.description || "");
        formData.append("start_date", data.start_date);
        formData.append("end_date", data.end_date);
        formData.append("category_id", data.category_id);
        formData.append("status", data.status);
        formData.append("user_type", data.user_type);
        formData.append("payment_type", data.payment_type);
        if (data.amount) {
            formData.append("amount", data.amount);
        }
        formData.append("_method", "PUT");

        // Append prizes as array
        data.prizes.forEach((prizeId, index) => {
            formData.append(`prizes[${index}]`, prizeId);
        });

        // Append sponsor IDs as array
        data.sponsor_ids.forEach((sponsorId, index) => {
            formData.append(`sponsor_ids[${index}]`, sponsorId);
        });

        // Append sponsor banner files - only new files
        Object.entries(data.sponsor_banners).forEach(([sponsorId, banner]) => {
            if (banner && banner.file) {
                formData.append(`sponsor_banners[${sponsorId}]`, banner.file);
            }
        });

        // Log form data for debugging
        console.log(
            "Sponsor banners to upload:",
            Object.entries(data.sponsor_banners)
                .filter(([sponsorId, banner]) => banner && banner.file)
                .map(([sponsorId]) => sponsorId),
        );

        // Use post with forceFormData: true for file uploads
        post(route("admin.contests.update", contest.id), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                message.success("Contest updated successfully");
            },
            onError: (errors) => {
                message.error("Error updating contest");
                console.error("Validation errors:", errors);
            },
        });
    };

    // Handle sponsor selection change
    const handleSponsorChange = (selectedSponsorIds) => {
        handleFieldChange("sponsor_ids", selectedSponsorIds || []);

        // Initialize banner data for new sponsors
        const updatedBanners = { ...data.sponsor_banners };
        selectedSponsorIds.forEach((sponsorId) => {
            if (!updatedBanners[sponsorId]) {
                updatedBanners[sponsorId] = {
                    file: null,
                    preview: null,
                    name: "",
                };
            }
        });

        // Remove banner data for deselected sponsors
        Object.keys(updatedBanners).forEach((sponsorId) => {
            const sponsorIdNum = parseInt(sponsorId);
            if (!selectedSponsorIds.includes(sponsorIdNum)) {
                // Revoke object URL if exists (only for new uploads)
                if (
                    updatedBanners[sponsorId]?.preview &&
                    !updatedBanners[sponsorId]?.existing
                ) {
                    URL.revokeObjectURL(updatedBanners[sponsorId].preview);
                }
                delete updatedBanners[sponsorId];
            }
        });

        handleFieldChange("sponsor_banners", updatedBanners);

        // Update selected sponsors immediately
        const selected = getSponsors().filter((sponsor) =>
            selectedSponsorIds.includes(sponsor.id),
        );
        setSelectedSponsors(selected);
    };

    // Handle banner upload for a specific sponsor
    const handleBannerUpload = (sponsorId, file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
            message.error("Please select a valid image file");
            return false;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            message.error("File is too large (max 5MB)");
            return false;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);

        // Update only the specific sponsor banner
        updateSponsorBanner(sponsorId, {
            file: file,
            preview: preview,
            name: file.name,
            existing: false,
        });

        message.success(`Banner selected for upload: ${file.name}`);
        return false; // Prevent default upload behavior
    };

    // Remove banner for a specific sponsor
    const removeBanner = (sponsorId) => {
        // Revoke object URL if it's a new upload
        if (
            data.sponsor_banners[sponsorId]?.preview &&
            !data.sponsor_banners[sponsorId]?.existing
        ) {
            URL.revokeObjectURL(data.sponsor_banners[sponsorId].preview);
        }

        // Update only the specific sponsor banner
        updateSponsorBanner(sponsorId, {
            file: null,
            preview: null,
            name: "",
            existing: false,
        });

        message.info("Banner removed. Please upload a new one if required.");
    };

    // Handle status change with confirmation
    const handleStatusChange = (newStatus) => {
        setPendingStatus(newStatus);
        setStatusConfirmVisible(true);
    };

    // Confirm status change
    const confirmStatusChange = () => {
        handleFieldChange("status", pendingStatus);
        setStatusConfirmVisible(false);
        setPendingStatus(null);
        message.success(
            `Contest status updated to ${statusOptions.find((s) => s.value === pendingStatus)?.label}`,
        );
    };

    // Cancel status change
    const cancelStatusChange = () => {
        setStatusConfirmVisible(false);
        setPendingStatus(null);
    };

    // Handle date range change
    const handleDateChange = (dates, dateStrings) => {
        setData({
            ...data,
            start_date: dateStrings[0],
            end_date: dateStrings[1],
        });
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

    // Check if payment type is paid
    const isPaidContest = data.payment_type === "paid";

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(data.sponsor_banners).forEach((banner) => {
                if (banner?.preview && !banner?.existing) {
                    URL.revokeObjectURL(banner.preview);
                }
            });
        };
    }, []);

    return (
        <Authenticated
            user={auth.user}
            header={`Edit Contest: ${contest?.title}`}
        >
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.contests.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Contests
                        </Button>
                    </Link>
                    <Title level={3}>
                        <EditOutlined /> Edit Contest
                    </Title>
                    <Text type="secondary">
                        Update contest details for: {contest?.title}
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-2xl">
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
                                handleFieldChange("title", e.target.value)
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        validateStatus={errors.category_id ? "error" : ""}
                        help={errors.category_id}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id}
                            onChange={(value) =>
                                handleFieldChange("category_id", value)
                            }
                        >
                            {categories.map((category) => (
                                <Option key={category.id} value={category.id}>
                                    {category.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        validateStatus={errors.status ? "error" : ""}
                        help={errors.status}
                        required
                    >
                        <Select
                            size="large"
                            placeholder="Select Status"
                            value={Number(data.status)}
                            onChange={handleStatusChange}
                        >
                            {[1, 2, 3, 4].map((value) => (
                                <Option key={value} value={value}>
                                    {getStatusLabel(value)}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="User Type"
                        validateStatus={errors.user_type ? "error" : ""}
                        help={errors.user_type}
                    >
                        <Select
                            size="large"
                            placeholder="Select User Type"
                            value={data.user_type}
                            onChange={(value) =>
                                handleFieldChange("user_type", value)
                            }
                        >
                            {userTypeOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Payment Type"
                        validateStatus={errors.payment_type ? "error" : ""}
                        help={errors.payment_type}
                    >
                        <Select
                            size="large"
                            placeholder="Select Payment Type"
                            value={data.payment_type}
                            onChange={(value) =>
                                handleFieldChange("payment_type", value)
                            }
                        >
                            {paymentTypeOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {isPaidContest && (
                        <Form.Item
                            label="Amount"
                            validateStatus={errors.amount ? "error" : ""}
                            help={errors.amount}
                            required={isPaidContest}
                        >
                            <Input
                                size="large"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Enter Amount"
                                value={data.amount}
                                onChange={(e) =>
                                    handleFieldChange("amount", e.target.value)
                                }
                                prefix="$"
                            />
                        </Form.Item>
                    )}

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

                    {selectedSponsors.length > 0 && (
                        <Form.Item label="Sponsor Banners">
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
                                                                        banner.preview
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
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        e.target.style.display =
                                                                            "none";
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
                            value={data.prizes}
                            onChange={(value) =>
                                handleFieldChange("prizes", value)
                            }
                            maxTagCount="responsive"
                        >
                            {prizes.map((prize) => (
                                <Option key={prize.id} value={prize.id}>
                                    {prize.position} - {prize.title}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

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
                            dropdownClassName="contest-range-popup"
                            getPopupContainer={() => document.body}
                            placeholder={["Start Date", "End Date"]}
                            value={[
                                data.start_date ? dayjs(data.start_date) : null,
                                data.end_date ? dayjs(data.end_date) : null,
                            ]}
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        validateStatus={errors.description ? "error" : ""}
                        help={errors.description}
                    >
                        <div
                            style={{ background: "#fff", borderRadius: "8px" }}
                        >
                            <ReactQuill
                                theme="snow"
                                value={data.description}
                                onChange={(value) =>
                                    handleFieldChange("description", value)
                                }
                                placeholder="Write your description..."
                                modules={quillModules}
                                style={{
                                    height: "200px",
                                    marginBottom: "40px",
                                }}
                            />
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
                                disabled={processing}
                            >
                                {processing ? "Updating..." : "Update Contest"}
                            </Button>
                            <Link href={route("admin.contests.index")}>
                                <Button size="large" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>

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
