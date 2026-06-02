import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    BookFilled,
    CalendarOutlined,
    DeleteOutlined,
    EditOutlined,
    FileTextOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";


import {
    Button,
    Card,
    Col,
    Input,
    message,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import { getS3PublicUrl } from "@/Utils/s3Helpers";


const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ resources, filters, auth }) {
    const handleDelete = (id) => {
        router.delete(route("admin.islamic-zone.destroy", id), {
            onSuccess: (success) => {
                message.success(
                    success || "Islamic content deleted successfully",
                );
            },
            onError: (errors) => {
                message.error(errors.error || "Error deleting islamic content");
            },
        });
    };

    const handleSearch = (value) => {
        router.get(
            route("admin.islamic-zone.index"),
            {
                ...filters,
                search: value,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("admin.islamic-zone.index"),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        router.get(
            route("admin.islamic-zone.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "calendar":
                return <CalendarOutlined style={{ color: "#1890ff" }} />;
            case "quran":
                return <BookFilled style={{ color: "#52c41a" }} />;
            case "hadith":
                return <FileTextOutlined style={{ color: "#fa8c16" }} />;
            case "islamicContent":
                return <FileTextOutlined style={{ color: "#722ed1" }} />;
            default:
                return <FileTextOutlined />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "calendar":
                return "blue";
            case "quran":
                return "green";
            case "hadith":
                return "orange";
            case "islamicContent":
                return "purple";
            default:
                return "default";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "published":
                return "green";
            case "draft":
                return "orange";
            case "archived":
                return "red";
            default:
                return "default";
        }
    };

    const columns = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            width: 55,
            render: (text, record, index) => (
                <Text
                    style={{ color: "#8c8c8c", fontSize: 13, fontWeight: 500 }}
                >
                    {index + 1}
                </Text>
            ),
        },
        {
            title: "Content",
            key: "content",
            width: 260,
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#f5f5f5",
                            flexShrink: 0,
                            fontSize: 15,
                        }}
                    >
                        {getTypeIcon(record.type)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 6,
                                marginBottom: 2,
                            }}
                        >
                            <Text
                                strong
                                style={{
                                    fontSize: 13,
                                    lineHeight: "1.4",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                }}
                            >
                                {record.title}
                            </Text>
                            {record.is_featured && (
                                <Tag
                                    color="gold"
                                    style={{
                                        fontSize: 11,
                                        lineHeight: "18px",
                                        padding: "0 6px",
                                        margin: 0,
                                    }}
                                >
                                    Featured
                                </Tag>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            by {record.user?.name}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 140,
            render: (type) => (
                <Tag color={getTypeColor(type)}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </Tag>
            ),
        },
        {
            title: "Language",
            dataIndex: "language",
            key: "language",
            width: 110,
            render: (language) => (
                <Text style={{ fontSize: 13 }}>
                    {language ? language.name : "N/A"}
                </Text>
            ),
        },
        {
            title: "Stats",
            key: "stats",
            width: 130,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Text type="secondary" className="text-xs">
                        👁️ {record.views} views
                    </Text>
                    <Text type="secondary" className="text-xs">
                        ⬇️ {record.downloads} downloads
                    </Text>
                </Space>
            ),
        },
        {
            title: "Image",
            key: "thumbnail",
            width: 90,
            render: (_, record) =>
                record.image ? (
                    <img
                        src={getS3PublicUrl(record.image)}
                        alt={record.title}
                        style={{
                            width: 48,
                            height: 48,
                            objectFit: "contain",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: "#fafafa",
                            border: "1px dashed #d9d9d9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 10,
                                textAlign: "center",
                                lineHeight: 1.3,
                            }}
                        >
                            No{"\n"}Image
                        </Text>
                    </div>
                ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            width: 100,
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    {/* <Tooltip title="View">
                        <Link href={route('admin.islamic-zone.show', record.id)}>
                            <Button icon={<EyeOutlined />} size="small" />
                        </Link>
                    </Tooltip>
                    
                    <Tooltip title="Download">
                        <Link href={route('admin.islamic-zone.download', record.id)}>
                            <Button icon={<DownloadOutlined />} size="small" />
                        </Link>
                    </Tooltip> */}

                    <Tooltip title="Edit">
                        <Link
                            href={route("admin.islamic-zone.edit", record.id)}
                        >
                            <Button icon={<EditOutlined />} size="small" />
                        </Link>
                    </Tooltip>

                    <Popconfirm
                        title="Delete Content"
                        description="Are you sure to delete this content?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Islamic Zone Management">
            <style>{`
                .iz-table .ant-table-thead > tr > th {
                    background: #fafafa;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: #8c8c8c;
                    border-bottom: 1px solid #f0f0f0;
                    padding: 10px 14px;
                    white-space: nowrap;
                }
                .iz-table .ant-table-tbody > tr > td {
                    padding: 12px 14px;
                    border-bottom: 1px solid #f5f5f5;
                    vertical-align: middle;
                }
                .iz-table .ant-table-tbody > tr:last-child > td {
                    border-bottom: none;
                }
                .iz-table .ant-table-tbody > tr:hover > td {
                    background: #fafafa !important;
                }
                .iz-table .ant-table-cell-fix-right {
                    background: #fff;
                }
                .iz-table .ant-table-tbody > tr:hover .ant-table-cell-fix-right {
                    background: #fafafa !important;
                }
                .iz-table .ant-table {
                    border: 1px solid #f0f0f0;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .iz-table .ant-table-container {
                    border-radius: 10px;
                }
            `}</style>

            <Card bodyStyle={{ padding: 24 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 20,
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    <div>
                        <Title
                            level={3}
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                color: "#1a1a1a",
                            }}
                        >
                            Islamic Zone
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 14,
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            Manage audio, video, e-books and articles
                        </Text>
                    </div>
                    <Link href={route("admin.islamic-zone.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            style={{ fontWeight: 600 }}
                        >
                            Add Content
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div
                    style={{
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                        borderRadius: 10,
                        padding: "14px 16px",
                        marginBottom: 20,
                    }}
                >
                    <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by title, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Type"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.type || null}
                                onChange={(value) =>
                                    handleFilter("type", value)
                                }
                            >
                                <Option value="islamicContent">
                                    Islamic Content
                                </Option>
                                <Option value="calendar">Calendar</Option>
                                <Option value="hadith">Hadith</Option>
                                <Option value="quran">Quran</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Status"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.status || null}
                                onChange={(value) =>
                                    handleFilter("status", value)
                                }
                            >
                                <Option value="published">Published</Option>
                                <Option value="draft">Draft</Option>
                                <Option value="archived">Archived</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                style={{ width: "100%" }}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Table */}
                <div className="iz-table">
                    <Table
                        columns={columns}
                        dataSource={resources.data.map((item) => ({
                            ...item,
                            key: item.id,
                        }))}
                        pagination={{
                            current: resources.current_page,
                            pageSize: resources.per_page,
                            total: resources.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} items`,
                            style: { padding: "12px 0 0" },
                        }}
                        scroll={{ x: 800 }}
                        bordered={false}
                    />
                </div>
            </Card>
        </Authenticated>
    );
}
