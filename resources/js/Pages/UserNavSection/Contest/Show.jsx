import { Link, router } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";

import {
    Table,
    Button,
    Space,
    Row,
    Col,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Tag,
    Image,
    Divider,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    EyeOutlined,
    BackwardFilled,
    FileTextOutlined,
    VideoCameraOutlined,
    GlobalOutlined,
    UserOutlined,
    EyeFilled,
    TranslationOutlined,
    EyeTwoTone,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function Show({ contest, auth, isEntrySubmitted }) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getSafeValue = (value, defaultValue = "N/A") => {
        return value || defaultValue;
    };

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Contest Details">
            <Card>
                <div className="flex lg:flex-row flex-col-reverse gap-5 justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <FileTextOutlined className="mr-2" />
                            {getSafeValue(contest.title, "Untitled Contest")}
                        </Title>
                        <Text type="secondary">
                            Detailed information about the contest
                        </Text>
                    </div>

                    <Space className="flex flex-wrap gap-2">
                        <Link href={route("user.contests.participate.index")}>
                            <Button icon={<BackwardFilled />} size="large">
                                Back to Contests
                            </Button>
                        </Link>
                        <Link href={route("user.entries.create", contest.id)}>
                            <Button icon={<EditOutlined />} size="large">
                                Entry in Contest
                            </Button>
                        </Link>

                        {/* { isEntrySubmitted && ( */}
                        <Link href={route("user.entries.index", contest.id)}>
                            <Button
                                type="primary"
                                icon={<EyeFilled />}
                                size="large"
                            >
                                View Entries For Vote:{" "}
                                {contest.entries ? contest.entries.length : 0}
                            </Button>
                        </Link>
                        {/* )} */}
                    </Space>
                </div>

                <Divider />

                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title="Basic Information"
                            size="small"
                            className="mb-4"
                        >
                            <Space
                                direction="vertical"
                                size="middle"
                                style={{ width: "100%" }}
                            >
                                <div>
                                    <Text strong>Contest Title:</Text>
                                    <br />
                                    <Text className="text-lg">
                                        {getSafeValue(contest.title)}
                                    </Text>
                                </div>
                                <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3 text-sm">
                                    {/* Contest Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-700">
                                            Submission Type
                                        </span>

                                        {contest?.type === "manual" ? (
                                            <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-full">
                                                Manual Upload
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                                                Google Form
                                            </span>
                                        )}
                                    </div>

                                    {/* Submission Formats */}
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-gray-700">
                                            Submission Method
                                        </span>

                                        {contest?.type === "manual" ? (
                                            <div className="flex flex-wrap gap-2">
                                                {contest?.formats &&
                                                    JSON.parse(
                                                        contest.formats,
                                                    ).map((format, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-md capitalize"
                                                        >
                                                            {format}
                                                        </span>
                                                    ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-sm">
                                                Submit using Google Form
                                            </span>
                                        )}
                                    </div>

                                    {/* Payment */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-700">
                                            Payment
                                        </span>

                                        {contest?.payment_type === "free" ? (
                                            <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full">
                                                Free Entry
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded-full">
                                                Paid – {contest?.amount} BDT
                                            </span>
                                        )}
                                    </div>

                                    {/* User Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-700">
                                            Eligible Users
                                        </span>

                                        <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
                                            {contest?.user_type == 1
                                                ? "All Users"
                                                : contest?.user_type == 2
                                                  ? "Normal Users"
                                                  : "Members Only"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Text strong>Status:</Text>
                                    <br />
                                    {(() => {
                                        const status = Number(contest.status);

                                        switch (status) {
                                            case 1:
                                                return (
                                                    <Tag color="blue">
                                                        Upcoming
                                                    </Tag>
                                                );
                                            case 2:
                                                return (
                                                    <Tag color="green">
                                                        Running
                                                    </Tag>
                                                );
                                            case 3:
                                                return (
                                                    <Tag color="red">Ended</Tag>
                                                );
                                            case 4:
                                                return (
                                                    <Tag color="silver">
                                                        Archived
                                                    </Tag>
                                                );
                                            default:
                                                return (
                                                    <Tag color="gray">
                                                        Unknown
                                                    </Tag>
                                                );
                                        }
                                    })()}
                                </div>

                                <div>
                                    <Text strong>Start Date:</Text>
                                    <br />
                                    {formatDate(contest.start_date)}
                                </div>

                                <div>
                                    <Text strong>End Date:</Text>
                                    <br />
                                    {formatDate(contest.end_date)}
                                </div>
                            </Space>
                        </Card>

                        <Card title="Description" size="small" className="mb-4">
                            <div className="prose max-w-none">
                                {contest.description ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: contest.description,
                                        }}
                                        className="text-gray-700"
                                    />
                                ) : (
                                    <Text type="secondary">
                                        No content available
                                    </Text>
                                )}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card
                            title="Prize Information"
                            size="small"
                            className="mb-4"
                        >
                            <Space
                                direction="vertical"
                                size="middle"
                                style={{ width: "100%" }}
                            >
                                <div>
                                    <Text strong>Prize Details:</Text>
                                    <br />
                                    <Text type="secondary">
                                        NUA = Normal User Amount | PUA = Premium
                                        User Amount
                                    </Text>

                                    <div style={{ marginTop: 8 }}>
                                        {contest.prizes &&
                                        contest.prizes.length > 0 ? (
                                            <Space wrap size={[8, 8]}>
                                                {contest.prizes.map((prize) => (
                                                    <Tag
                                                        key={prize.id}
                                                        color="gold"
                                                    >
                                                        {`${prize.position} - NUA: ${prize.amount_normal_user} | PUA: ${prize.amount_premium_user}`}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        ) : (
                                            <Text type="secondary">
                                                No prizes available
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </Space>
                        </Card>

                        <Card
                            title="Your Entry Information"
                            size="small"
                            className="mb-4"
                        >
                            <Space
                                direction="vertical"
                                size="middle"
                                style={{ width: "100%" }}
                            >
                                <div>
                                    <Text strong>Your Entry Details:</Text>
                                    <br />
                                    <div style={{ marginTop: 8 }}>
                                        {Array.isArray(contest.entries) &&
                                        contest.entries.length > 0 ? (
                                            contest.entries
                                                .filter(
                                                    (entry) =>
                                                        entry.user_id ==
                                                        auth?.user?.id,
                                                )
                                                .map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            marginBottom: 20,
                                                            padding: 12,
                                                            border: "1px solid #f0f0f0",
                                                            borderRadius: 8,
                                                            backgroundColor:
                                                                "#fafafa",
                                                        }}
                                                    >
                                                        {console.log(
                                                            "Entry Content:",
                                                            entry.user_id,
                                                            auth?.user?.id,
                                                        )}

                                                        <Space
                                                            wrap
                                                            size={[8, 8]}
                                                            align="start"
                                                        >
                                                            <div
                                                                style={{
                                                                    maxWidth: 300,
                                                                }}
                                                            >
                                                                <Text type="secondary">
                                                                    <strong>
                                                                        {
                                                                            entry.title
                                                                        }
                                                                    </strong>
                                                                </Text>

                                                                <Paragraph
                                                                    ellipsis={{
                                                                        rows: 2,
                                                                        expandable: true,
                                                                        symbol: "more",
                                                                    }}
                                                                    style={{
                                                                        margin: 0,
                                                                    }}
                                                                >
                                                                    {entry.content ? (
                                                                        <div
                                                                            className="text-gray-700"
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: entry.content,
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Text type="secondary">
                                                                            No
                                                                            comments
                                                                        </Text>
                                                                    )}
                                                                </Paragraph>
                                                            </div>

                                                            <div>
                                                                <Tag color="gold">
                                                                    {
                                                                        entry.status
                                                                    }
                                                                </Tag>
                                                                <Tag color="blue">
                                                                    Votes:{" "}
                                                                    {
                                                                        entry.total_votes
                                                                    }
                                                                </Tag>
                                                                <Tag color="blue">
                                                                    Total
                                                                    Reviews:{" "}
                                                                    {entry
                                                                        .reviews
                                                                        ?.length ||
                                                                        0}
                                                                </Tag>
                                                            </div>
                                                        </Space>

                                                        <div
                                                            style={{
                                                                marginTop: 15,
                                                            }}
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "user.entries.vote-history",
                                                                    entry.id,
                                                                )}
                                                            >
                                                                <Button
                                                                    icon={
                                                                        <EyeFilled />
                                                                    }
                                                                    size="small"
                                                                    type="primary"
                                                                >
                                                                    Vote History
                                                                </Button>
                                                            </Link>
                                                            <Link
                                                                className="ml-2"
                                                                href={route(
                                                                    "user.entries.review-history",
                                                                    entry.id,
                                                                )}
                                                            >
                                                                <Button
                                                                    icon={
                                                                        <EyeFilled />
                                                                    }
                                                                    size="small"
                                                                    type="primary"
                                                                >
                                                                    Reviews
                                                                    History
                                                                </Button>
                                                            </Link>

                                                            <Link
                                                                className="ml-2"
                                                                href={route(
                                                                    "user.entries.edit",
                                                                    entry.id,
                                                                )}
                                                            >
                                                                <Button
                                                                    icon={
                                                                        <EditOutlined />
                                                                    }
                                                                    size="small"
                                                                    type="primary"
                                                                >
                                                                    Update Entry
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <Text type="secondary">
                                                Please attend to submit entries
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Divider />
                <div className="flex justify-center">
                    <Space>
                        <Link href={route("user.contests.index")}>
                            <Button icon={<BackwardFilled />}>
                                All Contests
                            </Button>
                        </Link>
                        {/* { isEntrySubmitted && ( */}
                        <Link href={route("user.entries.index", contest.id)}>
                            <Button type="primary" icon={<EyeFilled />}>
                                View Entries For Vote:{" "}
                                {contest.entries ? contest.entries.length : 0}
                            </Button>
                        </Link>
                        {/* )} */}
                    </Space>
                </div>
            </Card>
        </FrontAuthenticatedLayout>
    );
}
