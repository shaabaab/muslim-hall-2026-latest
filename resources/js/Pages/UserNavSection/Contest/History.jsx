import { Link, router } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';

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
    Modal,
    Image,
    QRCode
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    TrophyOutlined,
    DownloadOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const STATUS_UPCOMING = 1;
const STATUS_RUNNING = 2;
const STATUS_ENDED = 3;
const STATUS_ARCHIVED = 4;

const statusOptions = [
    { value: STATUS_UPCOMING, label: 'Upcoming', color: 'blue' },
    { value: STATUS_RUNNING, label: 'Running', color: 'green' },
    { value: STATUS_ENDED, label: 'Ended', color: 'red' },
    { value: STATUS_ARCHIVED, label: 'Archived', color: 'gray' },
];

export default function Index({ entryHistory, filters, auth }) {
    const [isCertificateModalVisible, setIsCertificateModalVisible] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    const isSubscribed = auth.user.subscriptions.some(sub => sub.plan && sub.plan.plan_type == 2);

    console.log('Entry History:', auth.user.subscriptions);

    const muslimHallWebsite = 'https://muslimhall.com/';

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleSearch = (value) => {
        router.get(route('user.history.index'), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTableChange = (pagination, filters) => {
        router.get(route('user.history.index'), {
            ...filters,
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Reset all filters
    const resetFilters = () => {
        router.get(route('user.history.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Show certificate in modal
    const showCertificate = (record) => {
        // Check if user is a winner and has a position
        const isWinner = record.winner && record.winner.position;
        const positionText = isWinner ?
            `${getPositionText(record.winner.position)} Position` :
            'as a Valued Participant';

        setSelectedCertificate({
            contestTitle: record.contest?.title || 'N/A',
            userName: auth.user.name,
            position: positionText,
            isWinner: isWinner,
            winnerPosition: isWinner ? record.winner.position : null,
            votes: record.total_votes || 0,
            startDate: record.contest?.start_date || 'N/A',
            endDate: record.contest?.end_date || 'N/A',
            contestId: record.contest?.id,
            entryId: record.id,
            userId: auth.user.id
        });
        setIsCertificateModalVisible(true);
    };

    // Generate QR Code data with verification info
    const generateQRCodeData = () => {
        if (!selectedCertificate) return muslimHallWebsite;

        return JSON.stringify({
            website: muslimHallWebsite,
            certificateId: selectedCertificate.entryId,
            userId: selectedCertificate.userId,
            contestId: selectedCertificate.contestId,
            type: selectedCertificate.isWinner ? 'winner_certificate' : 'participation_certificate',
            position: selectedCertificate.winnerPosition,
            timestamp: new Date().toISOString()
        });
    };

    // Download certificate with QR Code
    const downloadCertificate = () => {
        if (!selectedCertificate) return;

        // Create a canvas element to generate certificate
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = 900; // Increased height for QR code

        // Certificate background with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0f8ff');
        gradient.addColorStop(1, '#e6f3ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#121314ff';
        ctx.lineWidth = 15;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

        // Decorative corners
        ctx.strokeStyle = '#202325ff';
        ctx.lineWidth = 3;
        const cornerSize = 30;

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(50, 50 + cornerSize);
        ctx.lineTo(50, 50);
        ctx.lineTo(50 + cornerSize, 50);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(canvas.width - 50 - cornerSize, 50);
        ctx.lineTo(canvas.width - 50, 50);
        ctx.lineTo(canvas.width - 50, 50 + cornerSize);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 50 - cornerSize);
        ctx.lineTo(50, canvas.height - 50);
        ctx.lineTo(50 + cornerSize, canvas.height - 50);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(canvas.width - 50, canvas.height - 50 - cornerSize);
        ctx.lineTo(canvas.width - 50, canvas.height - 50);
        ctx.lineTo(canvas.width - 50 - cornerSize, canvas.height - 50);
        ctx.stroke();

        // Title - Different title for winners vs participants
        ctx.fillStyle = '#272f36ff';
        ctx.font = 'bold 52px "Arial", sans-serif';
        ctx.textAlign = 'center';

        if (selectedCertificate.isWinner) {
            ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 150);
        } else {
            ctx.fillText('CERTIFICATE OF PARTICIPATION', canvas.width / 2, 150);
        }

        // Subtitle
        ctx.fillStyle = '#666';
        ctx.font = '26px "Arial", sans-serif';
        ctx.fillText('This is to certify that', canvas.width / 2, 220);

        // User Name
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 42px "Arial", sans-serif';
        ctx.fillText(selectedCertificate.userName, canvas.width / 2, 300);

        // Achievement text
        ctx.fillStyle = '#666';
        ctx.font = '22px "Arial", sans-serif';
        ctx.fillText('has successfully participated in', canvas.width / 2, 360);

        // Contest Title
        ctx.fillStyle = '#25313bff';
        ctx.font = 'bold 32px "Arial", sans-serif';
        ctx.fillText(`"${selectedCertificate.contestTitle}"`, canvas.width / 2, 420);

        // Position and Votes
        ctx.fillStyle = '#2c3e50';
        ctx.font = '24px "Arial", sans-serif';

        if (selectedCertificate.isWinner) {
            ctx.fillText(`Achieved ${getPositionText(selectedCertificate.winnerPosition)} Position`, canvas.width / 2, 500);
            ctx.fillText(`with ${selectedCertificate.votes} votes`, canvas.width / 2, 540);
        } else {
            ctx.fillText('as a Valued Participant', canvas.width / 2, 500);
            ctx.fillText(`with ${selectedCertificate.votes} votes`, canvas.width / 2, 540);
        }

        // Generate QR Code on canvas
        generateQRCodeOnCanvas(ctx, canvas.width - 200, canvas.height - 200, 120);

        // Verification text
        ctx.fillStyle = '#666';
        ctx.font = '16px "Arial", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Scan QR code to verify:', 80, canvas.height - 240);
        ctx.fillText(`Website: ${muslimHallWebsite}`, 80, canvas.height - 220);

        // Dates
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = '18px "Arial", sans-serif';
        ctx.fillText(`Contest Period: ${selectedCertificate.startDate} to ${selectedCertificate.endDate}`, canvas.width / 2, 620);

        // Footer
        ctx.fillStyle = '#999';
        ctx.font = '14px "Arial", sans-serif';
        ctx.fillText(`Certificate ID: ${selectedCertificate.entryId}`, canvas.width / 2, 680);
        ctx.fillText('Generated on: ' + new Date().toLocaleDateString(), canvas.width / 2, 710);

        // Convert to image and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `certificate-${selectedCertificate.contestTitle.replace(/\s+/g, '-').toLowerCase()}-${selectedCertificate.entryId}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            message.success('Certificate downloaded successfully!');
        });
    };

    // Generate QR Code on canvas
    const generateQRCodeOnCanvas = (ctx, x, y, size) => {
        // Create temporary canvas for QR code
        const qrCanvas = document.createElement('canvas');
        const qrCtx = qrCanvas.getContext('2d');
        qrCanvas.width = size;
        qrCanvas.height = size;

        // Generate QR code pattern (simplified version)
        const qrData = generateQRCodeData();
        drawQRPattern(qrCtx, qrData, size);

        // Draw QR code onto main canvas
        ctx.drawImage(qrCanvas, x, y, size, size);

        // Add QR code border
        ctx.strokeStyle = '#161b1fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 5, y - 5, size + 10, size + 10);
    };

    // Simple QR code pattern generation
    const drawQRPattern = (ctx, data, size) => {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Simple pattern based on data hash
        ctx.fillStyle = '#000000';

        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = data.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // force 32-bit integer
        }

        const cellSize = size / 10;

        // Draw pattern
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if ((hash + row * 10 + col) % 3 === 0) {
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
        }

        // Position markers (simplified)
        ctx.fillRect(0, 0, 3 * cellSize, 3 * cellSize);
        ctx.fillRect(size - 3 * cellSize, 0, 3 * cellSize, 3 * cellSize);
        ctx.fillRect(0, size - 3 * cellSize, 3 * cellSize, 3 * cellSize);
    };


    // Helper function to get position text
    const getPositionText = (position) => {
        const positionMap = {
            1: '1st',
            2: '2nd',
            3: '3rd'
        };
        return positionMap[position] || `${position}th`;
    };

    // Check if certificate is available (user is winner or participant in ended contest)
    const isCertificateAvailable = (record) => {
        return record.winner || (record.contest && record.contest.status === STATUS_ENDED);
    };

    const columns = [
        {
            title: 'Si No',
            dataIndex: 'id',
            key: 'id',
            render: (text, record, index) => <Text>{index + 1}</Text>,
        },
        {
            title: 'Title',
            key: 'title',
            render: (_, record) => (
                <Text>{record.contest ? record.contest.title : 'N/A'}</Text>
            ),
        },
        {
            title: 'Start Date',
            key: 'start_date',
            render: (_, record) => (
                <Text>{record.contest ? record.contest.start_date : 'N/A'}</Text>
            ),
        },
        {
            title: 'Your Get Votes',
            key: 'total_votes',
            render: (_, record) => (
                <Text>{record.total_votes ? record.total_votes : 0}</Text>
            ),
        },
        {
            title: 'End Date',
            key: 'end_date',
            render: (_, record) => (
                <Text>{record.contest ? record.contest.end_date : 'N/A'}</Text>
            ),
        },
        {
            title: 'Your Winning Position',
            key: 'winning_position',
            render: (_, record) => (
                <Text>
                    {record.winner && record.winner.position ?
                        `${getPositionText(record.winner.position)} Position` :
                        'Participated'
                    }
                </Text>
            ),
        },
        {
            title: 'Total Prize Positions',
            key: 'prize_positions',
            render: (_, record) => (
                <Text>{record.contest ? record.contest.prizes.length + " Positions" : 'N/A'}</Text>
            ),
        },
        {
            title: 'Certificate',
            key: 'certificate',
            render: (_, record) => (
                <Tooltip
                    title={
                        isCertificateAvailable(record)
                            ? "View and Download Certificate"
                            : "Certificate not available yet"
                    }
                >
                    {isSubscribed ? (
                        <Button
                            type="primary"
                            icon={<TrophyOutlined />}
                            onClick={() => showCertificate(record)}
                            disabled={!isCertificateAvailable(record)}
                            size="small"
                        >
                            Certificate
                        </Button>
                    ) : (
                        <Text type="secondary">Subscribe to view certificate</Text>
                    )}
                </Tooltip>
            ),
        },
    ];

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Contest History"
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Contests Participated History
                        </Title>
                        <Text type="secondary">
                            Your participated contests histories
                        </Text>
                    </div>
                </div>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>

                    <Row gutter={[16, 16]} align="middle">
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

                        <Col xs={24} sm={12} md={4}>
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={resetFilters}
                                style={{ width: '100%' }}
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Table
                    columns={columns}
                    dataSource={entryHistory.data.map(history => ({ ...history, key: history.id }))}
                    pagination={{
                        current: entryHistory.current_page,
                        pageSize: entryHistory.per_page,
                        total: entryHistory.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} entry histories`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                    loading={entryHistory.data.length === 0 && !filters.search}
                />

                {/* Certificate Modal */}
                <Modal
                    title="Contest Certificate"
                    open={isCertificateModalVisible}
                    onCancel={() => setIsCertificateModalVisible(false)}
                    footer={[
                        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={downloadCertificate}>
                            Download Certificate
                        </Button>,
                        <Button key="close" onClick={() => setIsCertificateModalVisible(false)}>
                            Close
                        </Button>
                    ]}
                    width={900}
                >
                    {selectedCertificate && (
                        <div className="certificate-preview p-6 text-center border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white">
                            <div className="border-4 border-blue-300 p-8 bg-white relative">
                                {/* QR Code Section */}
                                <div className="absolute top-4 right-4 text-center">
                                    <QRCode
                                        value={generateQRCodeData()}
                                        size={100}
                                        iconSize={40}
                                        color='#1890ff'
                                        style={{
                                            border: '2px solid #1890ff',
                                            padding: '4px',
                                            backgroundColor: 'white'
                                        }}
                                    />
                                    <div className="mt-2 text-xs text-gray-500">
                                        <GlobalOutlined className="mr-1" />
                                        Scan to verify
                                    </div>
                                </div>

                                <h1 className="text-3xl font-bold text-blue-600 mb-4">
                                    {selectedCertificate.isWinner ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION'}
                                </h1>
                                <p className="text-gray-600 mb-2">This is to certify that</p>
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedCertificate.userName}</h2>
                                <p className="text-gray-600 mb-2">has successfully participated in</p>
                                <h3 className="text-xl font-bold text-blue-500 mb-6">"{selectedCertificate.contestTitle}"</h3>

                                {selectedCertificate.isWinner ? (
                                    <>
                                        <p className="text-lg font-semibold text-gray-700 mb-2">
                                            Achieved {getPositionText(selectedCertificate.winnerPosition)} Position
                                        </p>
                                        <p className="text-gray-600 mb-6">with {selectedCertificate.votes} votes</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg font-semibold text-gray-700 mb-2">Achieved as a Valued Participant</p>
                                        {/* <p className="text-gray-600 mb-6">with {selectedCertificate.votes} votes</p> */}
                                    </>
                                )}

                                <div className="mt-8 pt-4 border-t border-gray-300">
                                    <p className="text-sm text-gray-500">
                                        Contest Period: {selectedCertificate.startDate} to {selectedCertificate.endDate}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Certificate ID: {selectedCertificate.entryId} | Generated on: {new Date().toLocaleDateString()}
                                    </p>
                                    <div className="mt-3 p-2 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-500">
                                            <GlobalOutlined className="mr-1" />
                                            Verify at: {muslimHallWebsite}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </Card>
        </FrontAuthenticatedLayout>
    );
}