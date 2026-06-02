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
  InputNumber,
  DatePicker,
  ColorPicker,
  Collapse,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  DollarOutlined,
  UserOutlined,
  SettingOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

export default function Edit({ advertisement, auth }) {
  const [imagePreview, setImagePreview] = useState(
    // advertisement.image ? `/storage/${advertisement.image}` : null,
    getS3PublicUrl(advertisement.image),
  );
  const [videoPreview, setVideoPreview] = useState(
    // advertisement.video ? `/storage/${advertisement.video}` : null,
    getS3PublicUrl(advertisement.video),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data, setData, post, processing, errors, transform } = useForm({
    title: advertisement.title,
    description: advertisement.description,
    type: advertisement.type || "banner",
    position: advertisement.position || "header",
    image: null,
    video: null,
    video_url: advertisement.video_url,
    target_url: advertisement.target_url,
    button_text: advertisement.button_text || "Learn More",
    background_color: advertisement.background_color || "#ffffff",
    text_color: advertisement.text_color || "#000000",
    start_date: advertisement.start_date ? dayjs(advertisement.start_date) : null,
    end_date: advertisement.end_date ? dayjs(advertisement.end_date) : null,
    max_impressions: advertisement.max_impressions,
    max_clicks: advertisement.max_clicks,
    cost_per_impression: advertisement.cost_per_impression,
    cost_per_click: advertisement.cost_per_click,
    total_budget: advertisement.total_budget,
    advertiser_name: advertisement.advertiser_name,
    advertiser_email: advertisement.advertiser_email,
    advertiser_phone: advertisement.advertiser_phone,
    is_active: advertisement.is_active == 1,
    is_featured: advertisement.is_featured == 1,
    status: advertisement.status || "pending",
    targeting: advertisement.targeting || {},
    _method: "PUT",
  });

  const submit = () => {
    transform((data) => {
      const transformedData = {
        ...data,
        start_date: data.start_date ? data.start_date.format("YYYY-MM-DD HH:mm:ss") : null,
        end_date: data.end_date ? data.end_date.format("YYYY-MM-DD HH:mm:ss") : null,
        is_active: data.is_active ? 1 : 0,
        is_featured: data.is_featured ? 1 : 0,
        targeting: data.targeting,
      };

      // Remove null files to avoid validation errors
      if (transformedData.image === null) delete transformedData.image;
      if (transformedData.video === null) delete transformedData.video;

      return transformedData;
    });

    post(route("admin.advertisements.update", advertisement.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => message.success("Advertisement updated successfully"),
      onError: (errs) => {
        console.error("Update errors:", errs);
        message.error("Error updating advertisement. Please check all fields.");
      },
    });
  };

  const handleImageUpload = (file) => {
    setData("image", file);
    setImagePreview(URL.createObjectURL(file));
    return false;
  };

  // const handleImageRemove = () => {
  //   setData("image", null);
  //   setImagePreview(advertisement.image ? `/storage/${advertisement.image}` : null);
  // };

  const handleVideoUpload = (file) => {
    setData("video", file);
    setVideoPreview(URL.createObjectURL(file));
    return false;
  };

  // const handleVideoRemove = () => {
  //   setData("video", null);
  //   setVideoPreview(advertisement.video ? `/storage/${advertisement.video}` : null);
  // };

  const handleImageRemove = () => {
    setData("image", null);

    setImagePreview(
      advertisement.image
        ? getS3PublicUrl(advertisement.image)
        : null
    );
  };

  const handleVideoRemove = () => {
    setData("video", null);

    setVideoPreview(
      advertisement.video
        ? getS3PublicUrl(advertisement.video)
        : null
    );
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setData("start_date", dates[0]);
      setData("end_date", dates[1]);
    } else {
      setData("start_date", null);
      setData("end_date", null);
    }
  };

  const adTypes = [
    { value: "banner", label: "Banner Ad", icon: <PictureOutlined /> },
    { value: "video_ad", label: "Video Ad", icon: <VideoCameraOutlined /> },
  ];

  const calculateCTR = () => {
    if ((advertisement.impressions_count || 0) === 0) return 0;
    return (
      ((advertisement.clicks_count || 0) / (advertisement.impressions_count || 0)) *
      100
    ).toFixed(2);
  };

  return (
    <Authenticated user={auth.user} header="Edit Advertisement">
      {/* ✅ Page wrapper */}
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6">
        {/* ✅ Remove Card default 24px padding */}
        <Card className="rounded-2xl" bodyStyle={{ padding: 0 }}>
          {/* ✅ Our controlled padding */}
          <div className="p-3 sm:p-6">
            {/* Header */}
            <div className="mb-6">
              <Link href={route("admin.advertisements.index")}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  type="text"
                  className="!px-0 !text-left"
                >
                  Back to Advertisements
                </Button>
              </Link>

              <div className="mt-2">
                <Title level={3} className="!mb-1">
                  <PictureOutlined className="mr-2" />
                  Edit Advertisement
                </Title>
                <Text type="secondary">Update advertisement: {advertisement.title}</Text>
              </div>
            </div>

            {/* Performance Stats */}
            <Row gutter={[12, 12]} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card size="small" className="rounded-xl">
                  <Statistic
                    title="Impressions"
                    value={advertisement.impressions_count || 0}
                    prefix={<EyeOutlined />}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" className="rounded-xl">
                  <Statistic
                    title="Clicks"
                    value={advertisement.clicks_count || 0}
                    prefix={<EyeOutlined />}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" className="rounded-xl">
                  <Statistic title="CTR" value={calculateCTR()} suffix="%" />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card size="small" className="rounded-xl">
                  <Statistic
                    title="Spent"
                    value={advertisement.spent_amount || 0}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Form */}
            <Form layout="vertical" onFinish={submit} className="w-full">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ad Title"
                    validateStatus={errors.title ? "error" : ""}
                    help={errors.title}
                    required
                  >
                    <Input
                      size="large"
                      value={data.title}
                      onChange={(e) => setData("title", e.target.value)}
                      disabled={processing}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Ad Type"
                    validateStatus={errors.type ? "error" : ""}
                    help={errors.type}
                    required
                  >
                    <Select
                      size="large"
                      value={data.type}
                      onChange={(value) => {
                        setData("type", value);
                      }}
                      disabled={processing}
                    >
                      {adTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          <Space>
                            {type.icon}
                            {type.label}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Position"
                    validateStatus={errors.position ? "error" : ""}
                    help={errors.position}
                    required
                  >
                    <Select
                      value={data.position}
                      onChange={(value) => setData("position", value)}
                      disabled={processing}
                    >
                      <Option value="header">Header (Top of the page)</Option>
                      <Option value="in_content">
                        In-Content (Between content sections)
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Status"
                    validateStatus={errors.status ? "error" : ""}
                    help={errors.status}
                    required
                  >
                    <Select
                      value={data.status}
                      onChange={(value) => setData("status", value)}
                      disabled={processing}
                    >
                      <Option value="pending">Pending Review</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="rejected">Rejected</Option>
                      <Option value="paused">Paused</Option>
                      <Option value="completed">Completed</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Description"
                    validateStatus={errors.description ? "error" : ""}
                    help={errors.description}
                  >
                    <TextArea
                      rows={3}
                      value={data.description}
                      onChange={(e) => setData("description", e.target.value)}
                      maxLength={500}
                      disabled={processing}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Target URL"
                    validateStatus={errors.target_url ? "error" : ""}
                    help={errors.target_url}
                    required
                  >
                    <Input
                      value={data.target_url}
                      onChange={(e) => setData("target_url", e.target.value)}
                      addonBefore="https://"
                      disabled={processing}
                    />
                  </Form.Item>
                </Col>

                {data.type === "video_ad" && (
                  <Col xs={24}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Video URL (Optional if uploading file)"
                          validateStatus={errors.video_url ? "error" : ""}
                          help={errors.video_url}
                        >
                          <Input
                            value={data.video_url}
                            onChange={(e) => setData("video_url", e.target.value)}
                            disabled={processing}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Ad Video"
                          validateStatus={errors.video ? "error" : ""}
                          help={errors.video || "Upload a video file (Max 50MB)"}
                        >
                          <div className="flex flex-col gap-3">
                            <Upload
                              beforeUpload={handleVideoUpload}
                              onRemove={handleVideoRemove}
                              accept="video/*"
                              showUploadList={false}
                              maxCount={1}
                              disabled={processing}
                            >
                              <Button icon={<UploadOutlined />} disabled={processing} className="w-full">
                                {advertisement.video ? "Change Ad Video" : "Select Ad Video"}
                              </Button>
                            </Upload>

                            {videoPreview && (
                              <div className="w-full">
                                <Text strong className="block mb-2 text-xs">
                                  Video Preview:
                                </Text>
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2">
                                  <video
                                    src={videoPreview}
                                    className="h-[100px] w-full rounded-lg object-contain"
                                    controls
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                )}

                {data.type !== "video_ad" && (
                  <Col xs={24}>
                    <Form.Item
                      label="Ad Image"
                      validateStatus={errors.image ? "error" : ""}
                      help={errors.image}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <Upload
                          beforeUpload={handleImageUpload}
                          onRemove={handleImageRemove}
                          accept="image/*"
                          showUploadList={false}
                          maxCount={1}
                          disabled={processing}
                        >
                          <Button icon={<UploadOutlined />} disabled={processing}>
                            {advertisement.image ? "Change Ad Image" : "Select Ad Image"}
                          </Button>
                        </Upload>

                        {imagePreview && (
                          <div className="w-full sm:max-w-[340px]">
                            <Text strong className="block mb-2">
                              Image Preview:
                            </Text>
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2">
                              <img
                                src={imagePreview}
                                alt="Ad preview"
                                className="h-[140px] w-full rounded-lg object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Form.Item>
                  </Col>
                )}

                {/* ✅ Button Text + Colors in one responsive block */}
                <Col xs={24}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Form.Item
                        label="Button Text"
                        validateStatus={errors.button_text ? "error" : ""}
                        help={errors.button_text}
                        className="mb-0"
                      >
                        <Input
                          value={data.button_text}
                          onChange={(e) => setData("button_text", e.target.value)}
                          disabled={processing}
                        />
                      </Form.Item>

                      <Form.Item label="Background Color" className="mb-0">
                        <div className="w-full">
                          <ColorPicker
                            value={data.background_color}
                            onChange={(color) =>
                              setData("background_color", color.toHexString())
                            }
                            showText
                            disabled={processing}
                          />
                        </div>
                      </Form.Item>

                      <Form.Item label="Text Color" className="mb-0">
                        <div className="w-full">
                          <ColorPicker
                            value={data.text_color}
                            onChange={(color) =>
                              setData("text_color", color.toHexString())
                            }
                            showText
                            disabled={processing}
                          />
                        </div>
                      </Form.Item>
                    </div>
                  </div>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Campaign Period"
                    validateStatus={errors.start_date || errors.end_date ? "error" : ""}
                    help={errors.start_date || errors.end_date}
                  >
                    <RangePicker
                      style={{ width: "100%" }}
                      showTime
                      value={[data.start_date, data.end_date]}
                      onChange={handleDateRangeChange}
                      placeholder={["Start Date", "End Date"]}
                      disabled={processing}
                    />
                  </Form.Item>
                </Col>

                {/* ✅ Advertiser Information responsive block */}
                <Col xs={24}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <div className="mb-4">
                      <Title level={4} className="!mb-1">
                        <UserOutlined className="mr-2" />
                        Advertiser Information
                      </Title>
                      <p className="text-sm text-gray-500">
                        Provide contact details of the advertiser
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Form.Item
                        label="Advertiser Name"
                        validateStatus={errors.advertiser_name ? "error" : ""}
                        help={errors.advertiser_name}

                        className="mb-0"
                      >
                        <Input
                          value={data.advertiser_name}
                          onChange={(e) => setData("advertiser_name", e.target.value)}
                          disabled={processing}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Advertiser Email"
                        validateStatus={errors.advertiser_email ? "error" : ""}
                        help={errors.advertiser_email}

                        className="mb-0"
                      >
                        <Input
                          type="email"
                          value={data.advertiser_email}
                          onChange={(e) => setData("advertiser_email", e.target.value)}
                          disabled={processing}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Advertiser Phone"
                        validateStatus={errors.advertiser_phone ? "error" : ""}
                        help={errors.advertiser_phone}
                        className="mb-0"
                      >
                        <Input
                          value={data.advertiser_phone}
                          onChange={(e) => setData("advertiser_phone", e.target.value)}
                          disabled={processing}
                        />
                      </Form.Item>
                    </div>
                  </div>
                </Col>

                {/* Advanced Settings */}
                <Col xs={24}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                    <Collapse
                      ghost
                      onChange={(key) => setShowAdvanced(key.length > 0)}
                      className="!mb-0"
                    >
                      <Panel
                        header={
                          <Space>
                            <SettingOutlined />
                            <Text strong>Advanced Settings</Text>
                          </Space>
                        }
                        key="1"
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Max Impressions"
                              validateStatus={errors.max_impressions ? "error" : ""}
                              help={errors.max_impressions}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                value={data.max_impressions}
                                onChange={(value) => setData("max_impressions", value)}
                                min={1}
                                disabled={processing}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Max Clicks"
                              validateStatus={errors.max_clicks ? "error" : ""}
                              help={errors.max_clicks}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                value={data.max_clicks}
                                onChange={(value) => setData("max_clicks", value)}
                                min={1}
                                disabled={processing}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              label="Total Budget"
                              validateStatus={errors.total_budget ? "error" : ""}
                              help={errors.total_budget}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                value={data.total_budget}
                                onChange={(value) => setData("total_budget", value)}
                                min={0}
                                step={0.01}
                                formatter={(value) =>
                                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                addonBefore={<DollarOutlined />}
                                disabled={processing}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Cost Per Impression (CPI)"
                              validateStatus={errors.cost_per_impression ? "error" : ""}
                              help={errors.cost_per_impression}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                value={data.cost_per_impression}
                                onChange={(value) =>
                                  setData("cost_per_impression", value)
                                }
                                min={0}
                                step={0.0001}
                                formatter={(value) => `$ ${value}`}
                                parser={(value) => value.replace(/\$\s?/, "")}
                                addonBefore={<DollarOutlined />}
                                disabled={processing}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              label="Cost Per Click (CPC)"
                              validateStatus={errors.cost_per_click ? "error" : ""}
                              help={errors.cost_per_click}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                value={data.cost_per_click}
                                onChange={(value) => setData("cost_per_click", value)}
                                min={0}
                                step={0.0001}
                                formatter={(value) => `$ ${value}`}
                                parser={(value) => value.replace(/\$\s?/, "")}
                                addonBefore={<DollarOutlined />}
                                disabled={processing}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Panel>
                    </Collapse>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <Text>Active Status</Text>
                          <Switch
                            checked={data.is_active}
                            onChange={(checked) => setData("is_active", checked)}
                            disabled={processing}
                          />
                        </div>
                        <Text type="secondary" className="block mt-1">
                          {data.is_active ? "Active" : "Inactive"}
                        </Text>
                      </div>

                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <Text>Featured Ad</Text>
                          <Switch
                            checked={data.is_featured}
                            onChange={(checked) => setData("is_featured", checked)}
                            disabled={processing}
                          />
                        </div>
                        <Text type="secondary" className="block mt-1">
                          {data.is_featured ? "Featured" : "Regular"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* ✅ Actions responsive */}
                <Col xs={24}>
                  <Form.Item className="mt-2 !mb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={processing}
                        icon={<SaveOutlined />}
                        size="large"
                        className="w-full sm:w-auto"
                        style={{ minWidth: "160px" }}
                        disabled={processing}
                      >
                        {processing ? "Updating..." : "Update Advertisement"}
                      </Button>

                      <Link
                        href={route("admin.advertisements.index")}
                        className="w-full sm:w-auto"
                      >
                        <Button size="large" disabled={processing} className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Card>
      </div>
    </Authenticated>
  );
}