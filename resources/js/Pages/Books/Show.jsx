import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Card, Typography, Space, Tag, Button, Image, Row, Col } from 'antd';
//s3
import { getS3PublicUrl } from '@/Utils/s3Helpers';
import {
    ArrowLeftOutlined,
    BookOutlined,
    FilePdfOutlined,
    EyeOutlined,
    DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Show() {
    const { book, auth } = usePage().props;

    const getPdfUrl = (path) => {
        if (!path) return null;
        return getS3PublicUrl(path);
    };

    const compressedPdfUrl = getPdfUrl(book.compressed_pdf);
    const originalPdfUrl = getPdfUrl(book.original_pdf);

    return (
        <Authenticated user={auth.user} header="Book Details">
            <Card>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2}>
                            <BookOutlined className="mr-2" />
                            {book.title}
                        </Title>
                        <Text type="secondary">Book Viewer</Text>
                    </div>
                    <Link href={route('admin.books.index')}>
                        <Button icon={<ArrowLeftOutlined />}>Back to Books</Button>
                    </Link>
                </div>

                {/* Book Info */}
                <Card title="Book Information" className="mb-6">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size="middle">
                                <div>
                                    <Text strong>Title:</Text>
                                    <br />
                                    <Text>{book.title}</Text>
                                </div>

                                <div>
                                    <Text strong>Description:</Text>
                                    <br />
                                    <Text>{book.description}</Text>
                                </div>

                                <div>
                                    <Text strong>Page Count:</Text>
                                    <br />
                                    <Tag color="blue">{book.page_count} pages</Tag>
                                </div>
                            </Space>
                        </Col>
                        <Col xs={24} md={12} className="flex justify-center">
                            {book.photo ? (
                                <div className="text-center">
                                    <Image
                                        src={getS3PublicUrl(book.photo)}
                                        alt={book.title}
                                        style={{
                                            objectFit: 'cover',
                                            borderRadius: 8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                    <Text type="secondary" className="mt-2 block">
                                        Book Cover
                                    </Text>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-40 w-32 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Text type="secondary">No Cover</Text>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card>

                {/* Embedded PDF Viewer Section */}
                {compressedPdfUrl && (
                    <Card
                        title={
                            <span className="flex items-center">
                                <BookOutlined className="mr-2" />
                                Book Viewer
                                <Tag color="blue" className="ml-2">
                                    {book.page_count} pages
                                </Tag>
                            </span>
                        }
                        className="mb-6"
                    >
                        <div className="text-center mb-4">
                            <Text type="secondary">
                                Scroll to navigate through the PDF document
                            </Text>
                        </div>
                        <iframe
                            src={compressedPdfUrl}
                            width="100%"
                            height="600"
                            style={{
                                border: '1px solid #e8e8e8',
                                borderRadius: '8px'
                            }}
                            title={`PDF Viewer - ${book.title}`}
                        />
                    </Card>
                )}

                {/* Quick Actions */}
                <Card title="Quick Actions">
                    <Space wrap>
                        <Link href={route('admin.books.edit', book.id)}>
                            <Button type="primary">Edit Book</Button>
                        </Link>
                        <Link href={route('admin.books.index')}>
                            <Button>All Books</Button>
                        </Link>
                        {compressedPdfUrl && (
                            <Button
                                href={compressedPdfUrl}
                                target="_blank"
                                icon={<FilePdfOutlined />}
                            >
                                Quick View PDF
                            </Button>
                        )}
                        {compressedPdfUrl && (
                            <Button
                                href={compressedPdfUrl}
                                download={`${book.title}.pdf`}
                                type="default"
                                icon={<DownloadOutlined />}
                            >
                                Download PDF
                            </Button>
                        )}
                    </Space>
                </Card>
            </Card>
        </Authenticated>
    );
}