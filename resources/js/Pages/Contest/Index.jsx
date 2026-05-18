import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    Button,
    Space,
    Tag,
    Input,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Row,
    Col,
    Select,
    Divider,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    EyeTwoTone,
    HourglassOutlined,
    CheckOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const statusOptions = {
    1: { label: "Upcoming", color: "blue" },
    2: { label: "Running", color: "green" },
    3: { label: "Ended", color: "red" },
    4: { label: "Archived", color: "default" },
};

export default function Index({ contests, filters, auth }) {
    const can = (permission) => {
        return auth?.user?.permissions?.includes(permission);
    };

    const handleSearch = (value) => {
        router.get(
            route("admin.contests.index"),
            {
                ...filters,
                search: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("admin.contests.index"),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleTableChange = (pagination, tableFilters, sorter) => {
        router.get(
            route("admin.contests.index"),
            {
                ...filters,
                sort_field: sorter?.field || "id",
                sort_direction:
                    sorter?.order === "ascend"
                        ? "asc"
                        : sorter?.order === "descend"
                          ? "desc"
                          : "desc",
                page: pagination.current,
                per_page: pagination.pageSize,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        router.get(route("admin.contests.index"), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        router.delete(route("admin.contests.destroy", id), {
            onSuccess: () => {
                message.success("Contest deleted successfully");
            },
            onError: () => {
                message.error("Error deleting contest");
            },
        });
    };

    const handleHold = (id) => {
        router.post(route("admin.contest.holded", id), {
            onSuccess: () => {
                message.success("Contest put on hold successfully");
            },
            onError: () => {
                message.error("Error putting contest on hold");
            },
        });
    };

    const handleActivate = (id) => {
        router.post(route("admin.contest.activated", id), {
            onSuccess: () => {
                message.success("Contest activated successfully");
            },
            onError: () => {
                message.error("Error activating contest");
            },
        });
    };

    const getContestStatusTag = (status) => {
        switch (Number(status)) {
            case 1:
                return <Tag color="blue">Upcoming</Tag>;
            case 2:
                return <Tag color="green">Running</Tag>;
            case 3:
                return <Tag color="red">Ended</Tag>;
            case 4:
                return <Tag color="default">Archived</Tag>;
            default:
                return <Tag>Unknown</Tag>;
        }
    };

    const getVotingStatusTag = (votingEnabled) => {
        return Number(votingEnabled) === 1 ? (
            <Tag color="green">Active</Tag>
        ) : (
            <Tag color="red">On Hold</Tag>
        );
    };

    const renderActionButtons = (record) => (
        <div className="flex flex-wrap gap-2">
            <Tooltip title="Edit Contest">
                <Link href={route("admin.contests.edit", record.id)}>
                    <Button type="primary" icon={<EditOutlined />} size="small" />
                </Link>
            </Tooltip>

            <Tooltip title="View Contest Details">
                <Link href={route("admin.contests.show", record.id)}>
                    <Button icon={<EyeOutlined />} size="small" />
                </Link>
            </Tooltip>

            {Number(record.voting_enabled) === 0 && (
                <Popconfirm
                    title="Activate Contest"
                    description="Are you sure to activate this contest?"
                    onConfirm={() => handleActivate(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Tooltip title="Activate Contest">
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            size="small"
                        />
                    </Tooltip>
                </Popconfirm>
            )}

            {Number(record.voting_enabled) === 1 && (
                <Popconfirm
                    title="Put On Hold"
                    description="Are you sure to put this contest on hold?"
                    onConfirm={() => handleHold(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Tooltip title="Put On Hold">
                        <Button
                            danger
                            icon={<HourglassOutlined />}
                            size="small"
                        />
                    </Tooltip>
                </Popconfirm>
            )}

            <Tooltip title="Contest Reviews">
                <Link href={route("admin.contest.reviews", record.id)}>
                    <Button
                        type="primary"
                        icon={<EyeTwoTone />}
                        size="small"
                    />
                </Link>
            </Tooltip>

            <Popconfirm
                title="Delete Contest"
                description="Are you sure to delete this contest?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
            >
                <Tooltip title="Delete Contest">
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Tooltip>
            </Popconfirm>

            <Tooltip title="View Entries">
                <Link href={route("admin.entries.contest.index", record.id)}>
                    <Button size="small">Entries</Button>
                </Link>
            </Tooltip>

            <Tooltip title="Contest Fee Clearance">
                <Link href={route("admin.contests.fee", record.id)}>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                    />
                </Link>
            </Tooltip>
        </div>
    );

    const columns = [
        {
            title: "#",
            dataIndex: "id",
            key: "serial",
            width: 70,
            render: (text, record, index) => <Text strong>{index + 1}</Text>,
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            width: 220,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
            width: 150,
            responsive: ["md"],
            render: (category) => category?.name || "N/A",
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 120,
            responsive: ["lg"],
            render: (type) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            width: 140,
            responsive: ["sm"],
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: "Contest Status",
            dataIndex: "status",
            key: "status",
            width: 140,
            render: (status) => getContestStatusTag(status),
        },
        {
            title: "Status",
            dataIndex: "admin_approval",
            key: "admin_approval",
            width: 120,
            render: (adminApproval) => {
                const isApproved = Number(adminApproval) === 1;

                return isApproved ? (
                    <Tag color="green">Actived</Tag>
                ) : (
                    <Tag color="red">Pending</Tag>
                );
            },
        },
        {
            title: "User Type",
            dataIndex: "user_type",
            key: "user_type",
            width: 120,
            responsive: ["lg"],
            render: (userType) =>
                userType === "all" ? (
                    <Tag color="default">All User</Tag>
                ) : (
                    <Tag>{userType}</Tag>
                ),
        },
        {
            title: "Fee",
            dataIndex: "amount",
            key: "amount",
            width: 120,
            responsive: ["md"],
            render: (amount) =>
                Number(amount) === 0 ? (
                    <Tag color="green">Free</Tag>
                ) : (
                    <Tag color="blue">{amount} tk</Tag>
                ),
        },
        {
            title: "Entries",
            key: "total_entries",
            width: 100,
            responsive: ["lg"],
            render: (_, record) => record.entries?.length || 0,
        },
        {
            title: "Actions",
            key: "actions",
            width: 300,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Contest">
                        <Link href={route("admin.contests.edit", record.id)}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Tooltip title="View Contest Details">
                        <Link href={route("admin.contests.show", record.id)}>
                            <Button
                                type="default"
                                icon={<EyeOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    {Number(record.admin_approval) == 0 && (
                        <Popconfirm
                            title="Activate Contest"
                            description="Are you sure to activate this Contest?"
                            onConfirm={() => handleActivate(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Activate Contest">
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    size="small"
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}

                    {Number(record.admin_approval) == 1 && (
                        <Popconfirm
                            title="Hold Contest"
                            description="Are you sure to put this Contest on hold?"
                            onConfirm={() => handleHold(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Hold Contest">
                                <Button
                                    danger
                                    icon={<HourglassOutlined />}
                                    size="small"
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}

                    <Tooltip title="Contest Reviews">
                        <Link href={route("admin.contest.reviews", record.id)}>
                            <Button
                                type="primary"
                                icon={<EyeTwoTone />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>

                    <Popconfirm
                        title="Delete Contest"
                        description="Are you sure to delete this Contest?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Contest">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>

                    <Tooltip title="View Entries">
                        <Link
                            href={route(
                                "admin.entries.contest.index",
                                record.id,
                            )}
                        >
                            <Button type="default" size="small">
                                View Entries
                            </Button>
                        </Link>
                    </Tooltip>

                    <Tooltip title="Contest Fee Clearance">
                        <Link href={route("admin.contests.fee", record.id)}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Contest Management">
            <div className="space-y-4">
                <Card className="shadow-sm rounded-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-center md:text-left">
                            <Title level={2} className="!mb-1">
                                Contest Management
                            </Title>
                            <Text type="secondary">
                                Manage, monitor and control all contests from one
                                place
                            </Text>
                        </div>

                        <Link href={route("admin.contests.create")}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                className="w-full md:w-auto"
                            >
                                Add Contest
                            </Button>
                        </Link>
                    </div>
                </Card>

                <Card className="shadow-sm rounded-xl" size="small">
                    <div className="flex items-center gap-2 mb-4">
                        <FilterOutlined />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={10}>
                            <Search
                                placeholder="Search by title, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={12} md={5}>
                            <Select
                                placeholder="Select Status"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.status || null}
                                onChange={(value) =>
                                    handleFilter("status", value)
                                }
                                optionLabelProp="label"
                            >
                                {Object.entries(statusOptions).map(
                                    ([value, { label, color }]) => (
                                        <Option
                                            key={value}
                                            value={Number(value)}
                                            label={label}
                                        >
                                            <span
                                                style={{
                                                    color,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {label}
                                            </span>
                                        </Option>
                                    ),
                                )}
                            </Select>
                        </Col>

                        <Col xs={12} md={5}>
                            <Select
                                placeholder="Hold Status"
                                allowClear
                                size="large"
                                style={{ width: "100%" }}
                                value={filters.is_on_hold || null}
                                onChange={(value) =>
                                    handleFilter("is_on_hold", value)
                                }
                            >
                                <Option value="0">Active</Option>
                                <Option value="1">On Hold</Option>
                            </Select>
                        </Col>

                        <Col xs={24} md={4}>
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
                </Card>

                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Card className="shadow-sm rounded-xl">
                        <Table
                            columns={columns}
                            dataSource={contests.data.map((contest) => ({
                                ...contest,
                                key: contest.id,
                            }))}
                            pagination={{
                                current: contests.current_page,
                                pageSize: contests.per_page,
                                total: contests.total,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} contests`,
                                pageSizeOptions: ["10", "20", "50", "100"],
                            }}
                            onChange={handleTableChange}
                            scroll={{ x: "max-content" }}
                            loading={
                                contests.data.length === 0 && !filters.search
                            }
                        />
                    </Card>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-4">
                    {contests.data.length > 0 ? (
                        contests.data.map((contest, index) => (
                            <Card
                                key={contest.id}
                                className="rounded-xl shadow-sm"
                                size="small"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <Text type="secondary">
                                            Contest #{index + 1}
                                        </Text>
                                        <div className="mt-1">
                                            <Text strong className="text-base">
                                                {contest.title}
                                            </Text>
                                        </div>
                                    </div>
                                    <div>{getContestStatusTag(contest.status)}</div>
                                </div>

                                <Divider className="my-3" />

                                <div className="space-y-2">
                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Category</Text>
                                        <Text>
                                            {contest.category?.name || "N/A"}
                                        </Text>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Type</Text>
                                        <Tag color="blue">{contest.type}</Tag>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">End Date</Text>
                                        <Text>{contest.end_date || "N/A"}</Text>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Voting</Text>
                                        {getVotingStatusTag(
                                            contest.voting_enabled,
                                        )}
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">User Type</Text>
                                        <Text>{contest.user_type || "N/A"}</Text>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Fee</Text>
                                        <Text>
                                            {Number(contest.amount) === 0
                                                ? "Free"
                                                : `${contest.amount} tk`}
                                        </Text>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Entries</Text>
                                        <Text>
                                            {contest.entries?.length || 0}
                                        </Text>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <Text type="secondary">Created By</Text>
                                        <Text className="text-right">
                                            {contest.creator
                                                ? contest.creator.name
                                                : "N/A"}
                                        </Text>
                                    </div>
                                </div>

                                <Divider className="my-3" />

                                <div className="flex flex-wrap gap-2">
                                    {renderActionButtons(contest)}
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="rounded-xl shadow-sm text-center">
                            <Text type="secondary">No contests found.</Text>
                        </Card>
                    )}

                    {contests.data.length > 0 && (
                        <Card className="rounded-xl shadow-sm">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <Text type="secondary">
                                    Page {contests.current_page} of{" "}
                                    {contests.last_page}
                                </Text>

                                <div className="flex gap-2">
                                    <Button
                                        disabled={!contests.prev_page_url}
                                        onClick={() =>
                                            router.get(
                                                route("admin.contests.index"),
                                                {
                                                    ...filters,
                                                    page:
                                                        contests.current_page - 1,
                                                },
                                                {
                                                    preserveState: true,
                                                    replace: true,
                                                },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>

                                    <Button
                                        disabled={!contests.next_page_url}
                                        onClick={() =>
                                            router.get(
                                                route("admin.contests.index"),
                                                {
                                                    ...filters,
                                                    page:
                                                        contests.current_page + 1,
                                                },
                                                {
                                                    preserveState: true,
                                                    replace: true,
                                                },
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </Authenticated>
    );
}