import { useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Typography,
  Space,
  message,
  Row,
  Col,
  Upload,
} from "antd";

import {
  PictureOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from "@ant-design/icons";

import { Link } from "@inertiajs/react";
import { useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

const DEFAULT_BG = "#1b7a3a";

export default function Edit({ auth, langs, slider }) {
  // ✅ Use image_url from backend (S3 friendly)
  const [previewImg, setPreviewImg] = useState(`/storage/${slider.image_path}` || null);

  const { data, setData, post, processing, errors } = useForm({
    title: slider.title || "",
    subtitle: slider.subtitle || "",
    image_path:  null, // ✅ correct key (backend expects image_path)
    background_color: slider.background_color || DEFAULT_BG, // ✅ add this
    lang_id: slider.lang_id || null,
    link: slider.link || "",
    _method: "PUT",
  });
  console.log(previewImg);
  // console.log(slider.image_path);

  const handlePhotoUpload = (file) => {
    setData("image_path", file);
    setPreviewImg( getS3PublicUrl(file));
    return false; // prevent auto upload
  };

  const handlePhotoRemove = () => {
    setData("image_path", null);
    setPreviewImg(null);
  };

  const submit = () => {
    post(route("admin.settings.slider.update", slider.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        message.success("Slider updated successfully");
      },
      onError: () => {
        message.error("Error updating slider");
      },
    });
  };

  return (
    <Authenticated user={auth.user} header="Edit Slider Section">
      <Card>
        <div className="mb-6">
          <Link href={route("admin.settings.slider.index")}>
            <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
              Back to Sliders
            </Button>
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <Title level={3}>Edit Slider: {slider.title}</Title>
              <Text type="secondary">Update slider information</Text>
            </div>
          </div>
        </div>

        <Form layout="vertical" onFinish={submit} className="max-w-4xl">
          <Row gutter={24}>
            <Col xs={24} lg={20}>
              {/* Title */}
              <Form.Item
                label="Slider Title"
                validateStatus={errors.title ? "error" : ""}
                help={errors.title}
                required
              >
                <Input
                  size="large"
                  placeholder="Enter slider title"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                />
              </Form.Item>

              {/* Subtitle */}
              <Form.Item
                label="Slider Subtitle"
                validateStatus={errors.subtitle ? "error" : ""}
                help={errors.subtitle}
              >
                <Input
                  size="large"
                  placeholder="Enter slider subtitle"
                  value={data.subtitle}
                  onChange={(e) => setData("subtitle", e.target.value)}
                />
              </Form.Item>

              {/* Background Color ✅ */}
              <Form.Item
                label="Background Color"
                validateStatus={errors.background_color ? "error" : ""}
                help={errors.background_color}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Input
                    type="color"
                    value={data.background_color || DEFAULT_BG}
                    onChange={(e) =>
                      setData("background_color", e.target.value)
                    }
                    style={{ width: 90, height: 40, padding: 2 }}
                  />
                  <Text type="secondary">
                    {data.background_color || DEFAULT_BG}
                  </Text>

                  <Button
                    type="default"
                    onClick={() => setData("background_color", DEFAULT_BG)}
                  >
                    Reset
                  </Button>
                </div>
              </Form.Item>

              {/* Link */}
              <Form.Item
                label="Slider Link (optional)"
                validateStatus={errors.link ? "error" : ""}
                help={errors.link}
              >
                <Input
                  size="large"
                  placeholder="Enter slider link (e.g., https://example.com)"
                  value={data.link}
                  onChange={(e) => setData("link", e.target.value)}
                />
              </Form.Item>

              {/* Language */}
              <Form.Item
                label="Language"
                validateStatus={errors.lang_id ? "error" : ""}
                help={errors.lang_id}
                required
              >
                <Select
                  size="large"
                  placeholder="Select Language"
                  value={data.lang_id || undefined}
                  onChange={(value) => setData("lang_id", value)}
                  suffixIcon={<TeamOutlined />}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {langs?.map((lang) => (
                    <Option key={lang.id} value={lang.id}>
                      {lang.name} ({lang.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} lg={20}>
              <Card title="Slider Image" size="default" className="mb-4">
                <Form.Item
                  validateStatus={errors.image_path ? "error" : ""}
                  help={errors.image_path}
                >
                  <Upload
                    beforeUpload={handlePhotoUpload}
                    onRemove={handlePhotoRemove}
                    accept="image/*"
                    showUploadList={false}
                    listType="picture"
                  >
                    <Button icon={<PictureOutlined />}>Select Image</Button>
                  </Upload>

                  {previewImg && (
                    <div className="mt-2">
                      <img
                        src={previewImg}
                        alt="Preview"
                        style={{
                          maxWidth: "220px",
                          maxHeight: "220px",
                          borderRadius: "8px",
                          border: "1px solid #eee",
                          marginTop: "10px",
                        }}
                      />
                    </div>
                  )}

                  {!previewImg && (
                    <Text type="secondary" className="block mt-2">
                      No image selected
                    </Text>
                  )}
                </Form.Item>
              </Card>
            </Col>
          </Row>

          {/* Buttons */}
          <Form.Item className="mt-6">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={processing}
                icon={<SaveOutlined />}
                size="large"
                disabled={!data.title}
              >
                Update Slider
              </Button>

              <Link href={route("admin.settings.slider.index")}>
                <Button size="large">Cancel</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Authenticated>
  );
}