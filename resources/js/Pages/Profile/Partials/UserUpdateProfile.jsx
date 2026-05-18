import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { Image } from "antd";
import {
    DeleteOutlined,
    EyeOutlined,
    PictureOutlined,
    UploadOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { Button, Typography } from "antd";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

const { Text } = Typography;

// ✅ Same FileUploadComponent pattern as thumbnail in Create.jsx
const FileUploadComponent = ({
    field,
    label,
    accept,
    postFile,
    required = false,
    description = "",
    previewHeight = "h-48",
    onFileChange,
    onRemove,
    value,
    error,
}) => {
    const id = `${field}-upload`;
    const hasFile = value || postFile;
    const isImage = accept.includes("image");

    const triggerFileInput = () => document.getElementById(id)?.click();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file && onFileChange) onFileChange(field, file);
        e.target.value = "";
    };

    const handleRemove = () => {
        onRemove?.(field);
    };

    const getPreviewUrl = () => {
        if (value instanceof File) return URL.createObjectURL(value);
        if (postFile)
            return typeof postFile === "string" && postFile.startsWith("http")
                ? postFile
                : getS3PublicUrl(postFile);
        return null;
    };

    const previewUrl = getPreviewUrl();

    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div
                className={`relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-lg overflow-hidden ${previewHeight} flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all`}
                onClick={triggerFileInput}
            >
                {hasFile && isImage && previewUrl ? (
                    <>
                        <div
                            className="w-full h-full absolute inset-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={previewUrl}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                                alt={label}
                                preview={{
                                    mask: (
                                        <div className="flex items-center justify-center">
                                            <EyeOutlined className="text-white text-lg" />
                                            <span className="ml-2 text-white">
                                                Preview
                                            </span>
                                        </div>
                                    ),
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <UploadOutlined className="text-white text-2xl" />
                        </div>
                    </>
                ) : hasFile ? (
                    <div className="text-center p-4">
                        <FileTextOutlined className="text-3xl text-blue-500" />
                        <p className="mt-2 text-sm font-medium">
                            {value instanceof File
                                ? value.name
                                : `Current ${label}`}
                        </p>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <PictureOutlined className="text-3xl text-gray-400" />
                        <p className="text-gray-500 mt-2">Click to upload</p>
                    </div>
                )}

                <input
                    type="file"
                    id={id}
                    hidden
                    accept={accept}
                    onChange={handleFileSelect}
                />
            </div>

            {description && (
                <p className="text-gray-500 text-xs mt-2">{description}</p>
            )}

            {error && (
                <Text type="danger" className="text-xs mt-2 block">
                    {error}
                </Text>
            )}

            <div className="mt-2 flex justify-between">
                <Button
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerFileInput();
                    }}
                    icon={<UploadOutlined />}
                >
                    {hasFile ? "Change" : "Upload"}
                </Button>

                {hasFile && (
                    <Button
                        size="small"
                        danger
                        ghost
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                    >
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    auth,
    className = "",
}) {
    const { user } = usePage().props;

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name ?? "",
            email: user.email ?? "",
            bio: user.bio ?? "",
            photo: null,
            remove_photo: false,
            role: user.role,
        });

    const submit = (e) => {
        e.preventDefault();

        post(route("user.profile.update"), {
            forceFormData: true,
            preserveScroll: true,
        });
    };
    console.log("Current user data:", data);
    console.log(usePage().props.auth.user);

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="bio" value="Bio" />

                    <textarea
                        id="bio"
                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        rows={3}
                        value={data.bio ?? ""}
                        onChange={(e) => setData("bio", e.target.value)}
                    />

                    <InputError className="mt-2" message={errors.bio} />
                </div>

                {/* ✅ Photo upload — same FileUploadComponent pattern as thumbnail */}
                <div>
                    <FileUploadComponent
                        field="photo"
                        label="Profile Photo"
                        accept="image/*"
                        postFile={data.remove_photo ? null : user?.photo}
                        description="Recommended: Square image, at least 200x200px"
                        previewHeight="h-48"
                        onFileChange={(f, file) => {
                            setData("remove_photo", false);
                            setData(f, file);
                        }}
                        onRemove={(f) => {
                            setData(f, null);
                            setData("remove_photo", true);
                        }}
                        value={data.photo}
                        error={errors.photo}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="text-sm mt-2 text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route("admin.verification.send")}
                                method="post"
                                as="button"
                                className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === "verification-link-sent" && (
                            <div className="mt-2 font-medium text-sm text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
