import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import {
    Form,
    Button,
    Card,
    Select,
    Typography,
    Space,
    message,
    Col,
    Alert,
} from "antd";
import {
    ArrowLeftOutlined,
    CreditCardOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ auth, plans, users }) {
    const [data, setData] = useState({
        plan_id: "",
    });

    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const selectedPlan = plans.find(
        (plan) => Number(plan.id) === Number(data.plan_id),
    );

    const submit = () => {
        if (!data.plan_id) {
            message.error("Please select a subscription plan");
            return;
        }

        setProcessing(true);
        setErrors({});

        message.loading("Redirecting to SSLCommerz payment gateway...", 1);

        axios
            .post(
                route("user.subscriptions.pay"),
                {
                    plan_id: data.plan_id,
                },
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            )
            .then((response) => {
                console.log("SSLCommerz Response:", response.data);

                if (
                    response.data?.status === true &&
                    response.data?.redirect_url
                ) {
                    window.location.href = response.data.redirect_url;
                    return;
                }

                message.error(
                    response.data?.message ||
                        "SSLCommerz redirect URL not found.",
                );

                setProcessing(false);
            })
            .catch((error) => {
                console.log("SSLCommerz Error:", error);
                console.log("SSLCommerz Error Response:", error.response?.data);

                setProcessing(false);

                if (error.response?.status === 419) {
                    message.error(
                        "Session expired. Please refresh and login again.",
                    );
                    return;
                }

                if (error.response?.status === 401) {
                    message.error("Please login first.");
                    return;
                }

                if (error.response?.status === 422) {
                    const responseErrors = error.response?.data?.errors || {};
                    setErrors(responseErrors);

                    message.error(
                        error.response?.data?.message ||
                            responseErrors?.plan_id?.[0] ||
                            "Validation failed.",
                    );
                    return;
                }

                message.error(
                    error.response?.data?.message ||
                        "Failed to start SSLCommerz payment.",
                );
            });
    };

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Add Subscription">
            <Card>
                <div className="mb-6">
                    <Link href={route("user.subscriptions.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Subscription
                        </Button>
                    </Link>

                    <Title level={3}>Create New Subscription</Title>

                    <Text type="secondary">
                        Select a plan and pay securely through SSLCommerz.
                    </Text>
                </div>

                <Alert
                    className="mb-5"
                    type="info"
                    showIcon
                    icon={<SafetyCertificateOutlined />}
                    message="Secure Online Payment"
                    description="After selecting a plan, you will be redirected to SSLCommerz. When payment is successful, your membership will be activated automatically."
                />

                <Form layout="vertical" onFinish={submit} className="max-w-2xl">
                    <Col span={24}>
                        <Form.Item
                            label="Select Plan"
                            validateStatus={errors.plan_id ? "error" : ""}
                            help={errors.plan_id?.[0] || errors.plan_id}
                            required
                        >
                            <Select
                                size="large"
                                placeholder="Select Plan"
                                value={data.plan_id || undefined}
                                onChange={(value) =>
                                    setData((prev) => ({
                                        ...prev,
                                        plan_id: value,
                                    }))
                                }
                            >
                                {plans.map((plan) => (
                                    <Option key={plan.id} value={plan.id}>
                                        <strong>{plan.name}</strong> - Tk{" "}
                                        {plan.price} - {plan.validity} days
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>

                    {selectedPlan && (
                        <Card size="small" className="mb-5 bg-gray-50">
                            <Title level={5} className="mb-2">
                                Selected Plan
                            </Title>

                            <div className="flex flex-col gap-1">
                                <Text>
                                    Plan: <strong>{selectedPlan.name}</strong>
                                </Text>

                                <Text>
                                    Price:{" "}
                                    <strong>Tk {selectedPlan.price}</strong>
                                </Text>

                                <Text>
                                    Validity:{" "}
                                    <strong>
                                        {selectedPlan.validity} days
                                    </strong>
                                </Text>
                            </div>
                        </Card>
                    )}

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<CreditCardOutlined />}
                                size="large"
                            >
                                Pay With SSLCommerz
                            </Button>

                            <Link href={route("user.subscriptions.index")}>
                                <Button size="large" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </FrontAuthenticatedLayout>
    );
}