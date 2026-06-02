import Authenticated from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Link, router } from "@inertiajs/react";

import {
    DeleteOutlined,
    EditOutlined,
    FilterOutlined,
    GlobalOutlined,
    PictureOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    message,
    Popconfirm,
    Row,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";

const { Title, Text } = Typography;
const { Search } = Input;

export default function Index({ sliders, filters, auth }) {
    const handleDelete = (id) => {
        router.delete(route("admin.settings.slider.destroy", id), {
            preserveScroll: true,
            onSuccess: () => message.success("Slider deleted successfully"),
            onError: () => message.error("Error deleting slider"),
        });
    };

    const handleSearch = (value) => {
        router.get(
            route("admin.settings.slider.index"),
            { ...filters, search: value, page: 1 },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const handleTableChange = (pagination, _tableFilters, sorter) => {
        router.get(
            route("admin.settings.slider.index"),
            {
                ...filters,
                sort_field: sorter?.field || "id",
                sort_direction: sorter?.order === "ascend" ? "asc" : "desc",
                page: pagination?.current || 1,
                per_page: pagination?.pageSize || sliders?.per_page || 10,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const resetFilters = () => {
        router.get(
            route("admin.settings.slider.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const data = (sliders?.data || []).map((slider) => ({
        ...slider,
        key: slider.id,
    }));

    const columns = [
        {
            title: "SL",
            key: "sl",
            width: 80,
            render: (text, record, index) => {
                const start =
                    ((sliders?.current_page || 1) - 1) *
                    (sliders?.per_page || 10);
                return start + index + 1;
            },
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            sorter: true,
            render: (text) => <Text strong>{text || "—"}</Text>,
        },
        {
            title: "Subtitle",
            dataIndex: "subtitle",
            key: "subtitle",
            sorter: true,
            render: (text) => <Text>{text || "—"}</Text>,
        },
        {
            title: "Language",
            key: "language",
            sorter: false,
            render: (_, record) => {
                const lang = record?.language;
                return lang ? (
                    <Space size={6}>
                        <GlobalOutlined />
                        <Text>
                            {lang.name}{" "}
                            <Text type="secondary">({lang.code})</Text>
                        </Text>
                    </Space>
                ) : (
                    <Text type="secondary">N/A</Text>
                );
            },
        },
        {
            title: "Image",
            dataIndex: "image_path",
            key: "image_path",
            width: 90,
            render: (_, record) =>
                record?.image_path ? (
                    <img
                        src={getS3PublicUrl(record.image_path)}
                        alt="Slider"
                        style={{
                            width: 56,
                            height: 56,
                            objectFit: "contain",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                        }}
                    />
                ) : (
                    <Space size={6}>
                        <PictureOutlined />
                        <Text type="secondary">No Image</Text>
                    </Space>
                ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Slider">
                        <Link
                            href={route(
                                "admin.settings.slider.edit",
                                record.id,
                            )}
                        >
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Popconfirm
                        title="Delete Slider"
                        description="Are you sure to delete this slider?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Slider">
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

    // ✅ Mobile friendly list/card view
    const MobileCardList = () => {
        if (!data.length) return <Empty description="No sliders found" />;

        return (
            <div className="space-y-3">
                {data.map((item) => (
                    <Card
                        key={item.id}
                        size="small"
                        className="rounded-xl"
                        bodyStyle={{ padding: 14 }}
                    >
                        <div className="flex gap-3">
                            <div className="shrink-0">
                                {item.image_path ? (
                                    <img
                                        src={getS3PublicUrl(item.image_path)}
                                        alt="Slider"
                                        style={{
                                            width: 64,
                                            height: 64,
                                            objectFit: "contain",
                                            borderRadius: 10,
                                            border: "1px solid #f0f0f0",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 10,
                                            border: "1px dashed #d9d9d9",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <PictureOutlined
                                            style={{
                                                fontSize: 20,
                                                opacity: 0.65,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Text strong className="block truncate">
                                            {item.title || "—"}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            className="block truncate"
                                        >
                                            {item.subtitle || "—"}
                                        </Text>
                                    </div>

                                    <Space size="small" className="shrink-0">
                                        <Tooltip title="Edit Slider">
                                            <Link
                                                href={route(
                                                    "admin.settings.slider.edit",
                                                    item.id,
                                                )}
                                            >
                                                <Button
                                                    type="primary"
                                                    icon={<EditOutlined />}
                                                    size="small"
                                                />
                                            </Link>
                                        </Tooltip>

                                        <Popconfirm
                                            title="Delete Slider"
                                            description="Are you sure to delete this slider?"
                                            onConfirm={() =>
                                                handleDelete(item.id)
                                            }
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Tooltip title="Delete Slider">
                                                <Button
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                />
                                            </Tooltip>
                                        </Popconfirm>
                                    </Space>
                                </div>

                                <Divider style={{ margin: "10px 0" }} />

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <Tag
                                        icon={<GlobalOutlined />}
                                        style={{ margin: 0 }}
                                    >
                                        {item?.language
                                            ? `${item.language.name} (${item.language.code})`
                                            : "N/A"}
                                    </Tag>

                                    <Text type="secondary">ID: {item.id}</Text>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <Authenticated user={auth.user} header="Sliders Management">
            <Card className="rounded-2xl">
                {/* ✅ Responsive header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                        <Title level={2} className="!mb-1">
                            Sliders
                        </Title>
                        <Text type="secondary">
                            Manage your application sliders
                        </Text>
                    </div>

                    <Link href={route("admin.settings.slider.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                            className="w-full sm:w-auto"
                        >
                            Add Slider
                        </Button>
                    </Link>
                </div>

                {/* ✅ Filters */}
                <Card size="small" className="mb-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <FilterOutlined />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[12, 12]} align="middle">
                        <Col xs={24} md={14} lg={10}>
                            <Search
                                placeholder="Search by title, subtitle..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters?.search}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={24} md={10} lg={6}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                className="w-full"
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* ✅ Mobile: Card list, Tablet/Desktop: Table */}
                <div className="block lg:hidden">
                    <MobileCardList />
                </div>

                <div className="hidden lg:block">
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        pagination={{
                            current: sliders?.current_page || 1,
                            pageSize: sliders?.per_page || 10,
                            total: sliders?.total || 0,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} sliders`,
                            pageSizeOptions: ["10", "20", "50", "100"],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 900 }}
                        loading={!!sliders?.loading}
                    />
                </div>
            </Card>
        </Authenticated>
    );
}
