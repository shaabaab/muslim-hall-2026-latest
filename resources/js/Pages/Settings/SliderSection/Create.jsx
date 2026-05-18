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
} from "antd";
import {
  TeamOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";
import { useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

const DEFAULT_BG = "#1b7a3a";

export default function Create({ auth, langs }) {
  const [photoPreview, setPhotoPreview] = useState(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    title: "",
    subtitle: "",
    image_path: null,
    background_color: DEFAULT_BG,
    link: "",
    lang_id: null,
  });

  const handlePhotoUpload = (file) => {
    setData("image_path", file);
    setPhotoPreview(URL.createObjectURL(file));
    return false;
  };

  const handlePhotoRemove = () => {
    setData("image_path", null);
    setPhotoPreview(null);
  };

  const submit = () => {
    post(route("admin.settings.slider.store"), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        message.success("Slider created successfully");
        reset();
        setPhotoPreview(null);

 
        setData("background_color", DEFAULT_BG);
      },
      onError: () => {
        message.error("Error creating slider");
      },
    });
  };

  return (
    <Authenticated user={auth.user} header="Create Slider">
      <Card>
        <div className="mb-6">
          <Link href={route("admin.settings.slider.index")}>
            <Button icon={<ArrowLeftOutlined />} type="text" className="mb-4">
              Back to Sliders
            </Button>
          </Link>

          <Title level={3}>Create New Slider</Title>
          <Text type="secondary">Add a new slider to your application</Text>
        </div>

        <Form layout="vertical" onFinish={submit} className="max-w-2xl">
          {/* Title */}
          <Form.Item
            label="Slider Title"
            validateStatus={errors.title ? "error" : ""}
            help={errors.title}
            required
          >
            <Input
              size="large"
              placeholder="Enter Slider title"
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
              placeholder="Enter Slider subtitle"
              value={data.subtitle}
              onChange={(e) => setData("subtitle", e.target.value)}
            />
          </Form.Item>

          {/* Background Color */}
          <Form.Item
            label="Background Color"
            validateStatus={errors.background_color ? "error" : ""}
            help={errors.background_color}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Input
                type="color"
                value={data.background_color || DEFAULT_BG}
                onChange={(e) => setData("background_color", e.target.value)}
                style={{ width: 90, height: 40, padding: 2 }}
              />
              <Text type="secondary">{data.background_color || DEFAULT_BG}</Text>
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
              placeholder="Enter Slider link (e.g., https://example.com)"
              value={data.link}
              onChange={(e) => setData("link", e.target.value)}
            />
          </Form.Item>

          {/* Language */}
          <Form.Item
            label="Language"
            validateStatus={errors.lang_id ? "error" : ""}
            help={errors.lang_id}
          >
            <Select
              size="large"
              placeholder="Select Language"
              value={data.lang_id || undefined}
              onChange={(value) => setData("lang_id", value)}
              suffixIcon={<TeamOutlined />}
              allowClear
            >
              {langs?.map((lang) => (
                <Option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Image */}
          <Form.Item
            label="Slider Image"
            validateStatus={errors.image_path ? "error" : ""}
            help={errors.image_path}
            required
          >
            <Upload
              beforeUpload={handlePhotoUpload}
              onRemove={handlePhotoRemove}
              accept="image/*"
              showUploadList={false}
              listType="picture"
            >
              <Button icon={<PictureOutlined />}>Select Photo</Button>
            </Upload>

            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    marginTop: "8px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    padding: "4px",
                  }}
                />
              </div>
            )}

            {!data.image_path && !photoPreview && (
              <Text type="secondary" className="block mt-2">
                No photo selected
              </Text>
            )}
          </Form.Item>

          {/* Buttons */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={processing}
                icon={<SaveOutlined />}
                size="large"
              >
                Create Slider Portion
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