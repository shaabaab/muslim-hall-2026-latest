import { useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
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
    Switch,
    Row,
    Col,
    Divider,
} from "antd";
import {
    UserOutlined,
    TeamOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    UploadOutlined,
    PauseOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

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

// Check if payment type is paid

export default function Create({ auth, prizes, sponsors, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        category_id: "",
        payment_type: "",
        user_type: "",
        status: "",
        is_on_hold: false,
        amount: "",
        prizes: [],
        sponsor_ids: [],
        sponsor_banners: {},
        type: "",
        form_url: "",
        formats: [],
    });

    const isPaidContest = data.payment_type === "paid";
    const isGoogleForm = data.type === "google_form";
    const isManual = data.type === "manual";

    // State for hold confirmation
    const [holdConfirmVisible, setHoldConfirmVisible] = useState(false);
    const [selectedSponsors, setSelectedSponsors] = useState([]);

    const getSponsors = () => (Array.isArray(sponsors) ? sponsors : []);

    // Update selected sponsors when sponsor_ids changes
    useEffect(() => {
        const selected = getSponsors().filter((sponsor) =>
            data.sponsor_ids.includes(sponsor.id),
        );
        setSelectedSponsors(selected);
    }, [data.sponsor_ids]);

    const submit = () => {
        // Validate that all selected sponsors have banners
        const missingBanners = data.sponsor_ids.filter(
            (sponsorId) =>
                !data.sponsor_banners[sponsorId] ||
                !data.sponsor_banners[sponsorId].file,
        );

        if (missingBanners.length > 0) {
            const sponsorNames = missingBanners.map((id) => {
                const sponsor = getSponsors().find((s) => s.id === id);
                return sponsor?.name || `Sponsor #${id}`;
            });
            message.error(
                `Please upload banners for: ${sponsorNames.join(", ")}`,
            );
            return;
        }

        post(route("admin.contests.store"), {
            forceFormData: true,
            onSuccess: () => {
                message.success("Contest created successfully");
            },
            onError: () => {
                message.error("Error creating contest");
            },
        });
    };

    // Handle sponsor selection change
    const handleSponsorChange = (selectedSponsorIds) => {
        setData("sponsor_ids", selectedSponsorIds);

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
            if (!selectedSponsorIds.includes(parseInt(sponsorId))) {
                // Revoke object URL if exists
                if (updatedBanners[sponsorId]?.preview) {
                    URL.revokeObjectURL(updatedBanners[sponsorId].preview);
                }
                delete updatedBanners[sponsorId];
            }
        });

        setData("sponsor_banners", updatedBanners);
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

        // Update sponsor banners data
        setData("sponsor_banners", {
            ...data.sponsor_banners,
            [sponsorId]: {
                file: file,
                preview: preview,
                name: file.name,
            },
        });

        return false; // Prevent default upload behavior
    };

    // Remove banner for a specific sponsor
    const removeBanner = (sponsorId) => {
        // Revoke object URL
        if (data.sponsor_banners[sponsorId]?.preview) {
            URL.revokeObjectURL(data.sponsor_banners[sponsorId].preview);
        }

        // Update sponsor banners data
        const updatedBanners = { ...data.sponsor_banners };
        updatedBanners[sponsorId] = {
            file: null,
            preview: null,
            name: "",
        };

        setData("sponsor_banners", updatedBanners);
    };

    // Handle hold function
    const handleHold = (holdStatus) => {
        setData("is_on_hold", holdStatus);

        if (holdStatus) {
            message.warning("Contest will be created on hold");
        } else {
            message.info("Contest will be created as active");
        }
    };

    // Handle hold with confirmation
    const handleHoldWithConfirm = (holdStatus) => {
        if (holdStatus) {
            // Show confirmation for putting on hold
            setHoldConfirmVisible(true);
        } else {
            handleHold(false);
        }
    };

    // Confirm hold action
    const confirmHold = () => {
        handleHold(true);
        setHoldConfirmVisible(false);
        message.warning(
            "Contest will be created on hold - users cannot participate",
        );
    };

    // Cancel hold action
    const cancelHold = () => {
        setHoldConfirmVisible(false);
        setData("is_on_hold", false);
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
            Object.values(data.sponsor_banners).forEach((banner) => {
                if (banner?.preview) {
                    URL.revokeObjectURL(banner.preview);
                }
            });
        };
    }, []);

    return (
        <Authenticated user={auth.user} header="Create Contest">
            <Card>
                <div className="mb-6 -m-2 md:m-0">
                    <Link href={route("admin.contests.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Contests
                        </Button>
                    </Link>
                    <Title level={3}>Create New Contest</Title>
                    <Text type="secondary">
                        Add a new contest to your application
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-2xl mb-6">
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
                            onChange={(e) => setData("title", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        validateStatus={errors.category_id ? "error" : ""}
                        help={errors.category_id}
                    >
                        <Select
                            size="large"
                            placeholder="Select Category"
                            value={data.category_id}
                            onChange={(value) => setData("category_id", value)}
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
                    >
                        <Select
                            size="large"
                            placeholder="Select Status"
                            value={data.status}
                            onChange={(value) => setData("status", value)}
                        >
                            {statusOptions.map((option) => (
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
                            onChange={(value) => setData("payment_type", value)}
                        >
                            {paymentTypeOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
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
                            onChange={(value) => setData("user_type", value)}
                        >
                            {userTypeOptions.map((option) => (
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
                                placeholder="Enter Amount"
                                value={data.amount}
                                onChange={(e) =>
                                    setData("amount", e.target.value)
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
                            value={data.type}
                            onChange={(value) => {
                                setData("type", value);
                                // Clear google_form_url if switching away from google_form
                                if (value !== "google_form") {
                                    setData("form_url", "");
                                }
                                // Clear formats if switching away from manual
                                if (value !== "manual") {
                                    setData("formats", []);
                                }
                            }}
                        >
                            {submissionTypeOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                    {option.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Google Form URL - only visible when Google Form is selected */}
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
                                    setData("form_url", e.target.value)
                                }
                                type="url"
                            />
                        </Form.Item>
                    )}

                    {/* formats - only visible when Manual is selected */}
                    {isManual && (
                        <Form.Item
                            label="formats"
                            validateStatus={errors.formats ? "error" : ""}
                            help={errors.formats}
                            required
                        >
                            <Select
                                mode="multiple"
                                size="large"
                                placeholder="Select one or more formats"
                                value={data.formats}
                                onChange={(value) => setData("formats", value)}
                                allowClear
                            >
                                {formatOptions.map((option) => (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
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

                    {/* Dynamic Banner Fields for Selected Sponsors */}
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
                                    const hasBanner = banner && banner.file;

                                    return (
                                        <Card
                                            key={sponsor.id}
                                            size="small"
                                            title={
                                                <Space>
                                                    <UserOutlined />
                                                    {sponsor.name ||
                                                        `Sponsor #${sponsor.id}`}
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
                                                                    Preview
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
                        label="Prizes Poll Add"
                        validateStatus={errors.prizes ? "error" : ""}
                        help={errors.prizes}
                        required
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Select Prizes"
                            value={data.prizes || []}
                            onChange={(value) => setData("prizes", value)}
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
    setData("start_date", dateStrings[0] || "");
    setData("end_date", dateStrings[1] || "");
  }}
/>
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        validateStatus={errors.description ? "error" : ""}
                        help={errors.description}
                    >
                        <ReactQuill
                            theme="snow"
                            value={data.description}
                            onChange={(value) => setData("description", value)}
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
                        <Space className="mt-10">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                {data.is_on_hold
                                    ? "Create Contest (On Hold)"
                                    : "Create Contest"}
                            </Button>

                            <Button
                                type="default"
                                onClick={cancelHold}
                                size="large"
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>

                {/* Hold Confirmation Modal */}
                {holdConfirmVisible && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        <Card
                            title="Confirm Hold Contest"
                            style={{ width: 400 }}
                            actions={[
                                <Button key="cancel" onClick={cancelHold}>
                                    Cancel
                                </Button>,
                                <Button
                                    key="confirm"
                                    type="primary"
                                    danger
                                    onClick={confirmHold}
                                >
                                    Confirm Hold
                                </Button>,
                            ]}
                        >
                            <Text>
                                Are you sure you want to create this contest on
                                hold? Users will not be able to participate
                                until you activate it.
                            </Text>
                        </Card>
                    </div>
                )}
            </Card>
        </Authenticated>
    );
}
