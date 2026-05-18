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
    List,
    Statistic,
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
    LikeOutlined,
    TrophyOutlined,
    CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Show({ entry, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = () => {
        router.delete(route("admin.entries.destroy", entry.id), {
            onSuccess: () => {
                message.success("Entry deleted successfully");
            },
            onError: () => {
                message.error("Failed to delete entry");
            },
        });
    };

    const getStatusTag = (status) => {
        if (!status) return <Tag color="default">Unknown</Tag>;

        const statusConfig = {
            approved: { color: "green", text: "Approved" },
            pending: { color: "orange", text: "Pending" },
            rejected: { color: "red", text: "Rejected" },
        };

        const config = statusConfig[status] || {
            color: "default",
            text: status,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

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

    // Safe user display functions
    const getUserDisplay = () => {
        if (!entry.user) return "N/A";

        if (typeof entry.user === "object" && entry.user !== null) {
            return entry.user.name || `User #${entry.user.id}`;
        }

        return `User #${entry.user_id}`;
    };

    // Safe contest display
    const getContestDisplay = () => {
        if (!entry.contest) return "N/A";

        if (typeof entry.contest === "object" && entry.contest !== null) {
            return `${entry.contest.title} (#${entry.contest.id})`;
        }
        return `Contest #${entry.contest_id}`;
    };

    // Votes display with statistics
    const getVotesDisplay = () => {
        if (!entry.votes) return "No Votes";

        if (Array.isArray(entry.votes) && entry.votes.length > 0) {
            return `${entry.votes.length} Vote(s)`;
        }

        return "No Votes";
    };

    // Get vote statistics
    const getVoteStatistics = () => {
        if (!entry.votes || !Array.isArray(entry.votes)) {
            return { total: 0, recent: 0 };
        }

        const totalVotes = entry.votes.length;
        const recentVotes = entry.votes.filter((vote) => {
            const voteDate = new Date(vote.created_at);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return voteDate > sevenDaysAgo;
        }).length;

        return { total: totalVotes, recent: recentVotes };
    };

    // Render media preview based on file type
    const renderMediaPreview = () => {
        if (!entry.media_path) {
            return <Text type="secondary">No media file uploaded</Text>;
        }

        const fileExtension = entry.media_path.split(".").pop()?.toLowerCase();
        const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileExtension);
        const isVideo = ["mp4", "mov", "avi"].includes(fileExtension);
        const isPDF = fileExtension === "pdf";
        const isWord = ["doc", "docx"].includes(fileExtension);

        if (isImage) {
            return (
                <Image
                    width={300}
                    src={`/storage/${entry.media_path}`}
                    alt={getSafeValue(entry.title, "Entry image")}
                    className="mt-2 rounded"
                    placeholder={<Text type="secondary">Loading image...</Text>}
                />
            );
        }

        if (isVideo) {
            return (
                <div className="mt-2">
                    <video controls width={300} className="rounded">
                        <source
                            src={`/storage/${entry.media_path}`}
                            type="video/mp4"
                        />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (isPDF || isWord) {
            return (
                <div className="mt-2">
                    <Button
                        type="link"
                        href={`/storage/${entry.media_path}`}
                        target="_blank"
                        icon={<FileTextOutlined />}
                    >
                        Download {isPDF ? "PDF" : "Word Document"}
                    </Button>
                </div>
            );
        }

        return (
            <div className="mt-2">
                <Button
                    type="link"
                    href={`/storage/${entry.media_path}`}
                    target="_blank"
                    icon={<FileTextOutlined />}
                >
                    Download File
                </Button>
            </div>
        );
    };

    const voteStats = getVoteStatistics();

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Entry Details">
            <Card>
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <TrophyOutlined className="mr-2" />
                            {getSafeValue(entry.title, "Untitled Entry")}
                        </Title>
                        <Text type="secondary">
                            Detailed information about the contest entry
                        </Text>
                    </div>

                    <Space>
                        <Link href={route("user.contests.index")}>
                            <Button icon={<BackwardFilled />} size="large">
                                Back to Contest
                            </Button>
                        </Link>
                    </Space>
                </div>

                <Divider />

                {/* Main Content Section */}
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
                                    <Text strong>Title:</Text>
                                    <br />
                                    <Text className="text-lg">
                                        {getSafeValue(entry.title)}
                                    </Text>
                                </div>

                                <div>
                                    <Text strong>Status:</Text>
                                    <br />
                                    {getStatusTag(entry.status)}
                                </div>

                                <div>
                                    <Text strong>Contest:</Text>
                                    <br />
                                    <Tag color="blue">
                                        {getContestDisplay()}
                                    </Tag>
                                </div>

                                <div>
                                    <Text strong>Submitted By:</Text>
                                    <br />
                                    <Space>
                                        <UserOutlined />
                                        <Text>{getUserDisplay()}</Text>
                                    </Space>
                                </div>
                            </Space>
                        </Card>

                        {/* Votes Statistics */}
                        <Card
                            title="Votes Statistics"
                            size="small"
                            className="mb-4"
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Total Votes"
                                        value={voteStats.total}
                                        prefix={<LikeOutlined />}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="Recent Votes (7 days)"
                                        value={voteStats.recent}
                                    />
                                </Col>
                            </Row>
                            <div className="mt-3">
                                <Text type="secondary">
                                    {getVotesDisplay()}
                                </Text>
                            </div>
                        </Card>

                        {/* Media Section */}
                        <Card title="Media File" size="small" className="mb-4">
                            <div>
                                <Text strong>Uploaded Media:</Text>
                                <br />
                                {renderMediaPreview()}
                            </div>
                        </Card>
                    </Col>

                    {/* Right Column - Content & Additional Information */}
                    <Col xs={24} lg={12}>
                        {/* Entry Content */}
                        <Card
                            title="Entry Content"
                            size="small"
                            className="mb-4"
                        >
                            <div className="prose max-w-none">
                                {entry.content ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: entry.content,
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

                        {/* Votes List */}
                        <Card
                            title="Votes Details"
                            size="small"
                            className="mb-4"
                        >
                            {entry.votes && entry.votes.length > 0 ? (
                                <List
                                    size="small"
                                    dataSource={entry.votes}
                                    renderItem={(vote) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <LikeOutlined
                                                        style={{
                                                            color: "#52c41a",
                                                        }}
                                                    />
                                                }
                                                title={
                                                    <Space>
                                                        <Text>
                                                            {vote.user
                                                                ? vote.user.name
                                                                : `User #${vote.user_id}`}
                                                        </Text>
                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            {formatDate(
                                                                vote.created_at,
                                                            )}
                                                        </Text>
                                                    </Space>
                                                }
                                                description={
                                                    vote.comment ? (
                                                        <Text
                                                            type="secondary"
                                                            italic
                                                        >
                                                            "{vote.comment}"
                                                        </Text>
                                                    ) : null
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Text type="secondary">No votes yet</Text>
                            )}
                        </Card>

                        {/* Audit Information */}
                        <Card title="Audit Information" size="small">
                            <Space
                                direction="vertical"
                                size="middle"
                                style={{ width: "100%" }}
                            >
                                <div>
                                    <Text strong>
                                        <CalendarOutlined className="mr-1" />
                                        Created At:
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                        {formatDate(entry.created_at)}
                                    </Text>
                                </div>

                                <div>
                                    <Text strong>
                                        <CalendarOutlined className="mr-1" />
                                        Updated At:
                                    </Text>
                                    <br />
                                    <Text type="secondary">
                                        {formatDate(entry.updated_at)}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Quick Actions Footer */}
                <Divider />
                <div className="flex justify-center">
                    <Space>
                        <Link
                            href={route("user.contests.show", entry.contest_id)}
                        >
                            <Button icon={<TrophyOutlined />}>
                                View Contest
                            </Button>
                        </Link>
                    </Space>
                </div>
            </Card>
        </FrontAuthenticatedLayout>
    );
}
