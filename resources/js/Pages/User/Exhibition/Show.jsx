import { Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import {
    Button,
    Card,
    Descriptions,
    Divider,
    Empty,
    Image,
    Space,
    Tag,
    Typography,
} from "antd";
import {
    ArrowLeftOutlined,
    EditOutlined,
    EyeOutlined,
    FileTextOutlined,
    PictureOutlined,
} from "@ant-design/icons";
import { buildS3UrlAlways } from "@/Utils/s3Helpers";

const { Title, Text } = Typography;

const statusColor = (status) =>
    ({
        published: "green",
        draft: "orange",
        sold: "red",
        archived: "gray",
    })[status] || "default";

const approvalColor = (status) =>
    ({
        approved: "green",
        pending: "orange",
        rejected: "red",
    })[status] || "default";

export default function Show({ auth, exhibition }) {
    const fileUrl = (url, path) => url || (path ? buildS3UrlAlways(path) : null);

    const mainImage = fileUrl(exhibition?.image_url, exhibition?.image);
    const sponsorImage = fileUrl(
        exhibition?.sponsor_image_url,
        exhibition?.sponsor_image,
    );
    const documentUrl = fileUrl(
        exhibition?.document_file_url || exhibition?.document_url,
        exhibition?.document_file,
    );
    const gallery = Array.isArray(exhibition?.gallery_urls)
        ? exhibition.gallery_urls
              .map((item) => item?.url || item?.path || item)
              .filter(Boolean)
        : [];

    // The controller appends `url` to each of these relations.
    const mediaSections = [
        { key: "videos", label: "Videos", items: exhibition?.videos || [] },
        { key: "audios", label: "Audios", items: exhibition?.audios || [] },
        { key: "pdfs", label: "PDFs", items: exhibition?.pdfs || [] },
    ].filter((section) => section.items.length > 0);

    return (
        <Authenticated user={auth.user} header="Exhibition Item">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.exhibitions.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Exhibitions
                        </Button>
                    </Link>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <Title level={3} className="!mb-1">
                                <EyeOutlined className="mr-2" />
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            exhibition?.title || "Untitled item",
                                    }}
                                />
                            </Title>
                            <Space size={[8, 8]} wrap>
                                <Tag color={statusColor(exhibition?.status)}>
                                    {exhibition?.status}
                                </Tag>
                                <Tag
                                    color={approvalColor(
                                        exhibition?.approval_status,
                                    )}
                                >
                                    {exhibition?.approval_status}
                                </Tag>
                                <Tag>{exhibition?.type}</Tag>
                            </Space>
                        </div>

                        <Link href={route("user.exhibitions.edit", exhibition.id)}>
                            <Button icon={<EditOutlined />} type="primary">
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {exhibition?.admin_note ? (
                    <Card size="small" className="mb-6">
                        <Text strong>Admin note: </Text>
                        <Text>{exhibition.admin_note}</Text>
                    </Card>
                ) : null}

                <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
                    <Descriptions.Item label="Board">
                        {exhibition?.board?.title || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Price">
                        {exhibition?.price
                            ? `${exhibition.price} ${exhibition.currency || ""}`.trim()
                            : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Available">
                        {exhibition?.is_available ? "Yes" : "No"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Featured">
                        {exhibition?.is_featured ? "Yes" : "No"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Dimensions">
                        {exhibition?.dimensions || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Material">
                        {exhibition?.material || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="External link">
                        {exhibition?.link ? (
                            <a
                                href={exhibition.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {exhibition.link}
                            </a>
                        ) : (
                            "—"
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Views">
                        {exhibition?.views ?? 0}
                    </Descriptions.Item>
                </Descriptions>

                {exhibition?.description ? (
                    <>
                        <Divider orientation="left">Description</Divider>
                        <div
                            className="prose max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: exhibition.description,
                            }}
                        />
                    </>
                ) : null}

                <Divider orientation="left">
                    <Space>
                        <PictureOutlined /> Images
                    </Space>
                </Divider>

                {mainImage || sponsorImage || gallery.length > 0 ? (
                    <Image.PreviewGroup>
                        <Space size={[12, 12]} wrap>
                            {mainImage ? (
                                <Image
                                    src={mainImage}
                                    alt="Main image"
                                    width={180}
                                />
                            ) : null}
                            {sponsorImage ? (
                                <Image
                                    src={sponsorImage}
                                    alt="Sponsor image"
                                    width={180}
                                />
                            ) : null}
                            {gallery.map((src) => (
                                <Image
                                    key={src}
                                    src={src}
                                    alt="Gallery image"
                                    width={180}
                                />
                            ))}
                        </Space>
                    </Image.PreviewGroup>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No images"
                    />
                )}

                {documentUrl ? (
                    <>
                        <Divider orientation="left">
                            <Space>
                                <FileTextOutlined /> Document
                            </Space>
                        </Divider>
                        <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {exhibition.document_file?.split("/").pop() ||
                                "Open document"}
                        </a>
                    </>
                ) : null}

                {mediaSections.map((section) => (
                    <div key={section.key}>
                        <Divider orientation="left">{section.label}</Divider>
                        <Space direction="vertical">
                            {section.items.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {(item.url || "").split("/").pop() ||
                                        `${section.label} file`}
                                </a>
                            ))}
                        </Space>
                    </div>
                ))}
            </Card>
        </Authenticated>
    );
}
