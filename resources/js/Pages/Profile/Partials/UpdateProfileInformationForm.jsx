import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { Button, Image } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            name: user?.name ?? "",
            email: user?.email ?? "",
            role: user?.role,
            photo: null,
            remove_photo: false,
            _method: "patch",
        });

    const currentPhotoUrl =
        data.photo instanceof File
            ? URL.createObjectURL(data.photo)
            : !data.remove_photo && user?.photo_url
                ? user.photo_url
                : !data.remove_photo && user?.photo
                    ? getS3PublicUrl(user.photo)
                    : null;

    const submit = (e) => {
        e.preventDefault();

        post(route("admin.profile.update"), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account&apos;s profile information and email
                    address.
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
                    <InputLabel value="Profile Photo" />

                    <div className="mt-3">
                        {currentPhotoUrl ? (
                            <Image
                                src={currentPhotoUrl}
                                alt="Profile Photo"
                                width={120}
                                height={120}
                                style={{
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    border: "1px solid #e5e7eb",
                                }}
                            />
                        ) : (
                            <div className="w-[120px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">
                                No Photo
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <input
                            id="admin-profile-photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (file) {
                                    setData("remove_photo", false);
                                    setData("photo", file);
                                }

                                e.target.value = "";
                            }}
                        />

                        <Button
                            type="button"
                            icon={<UploadOutlined />}
                            onClick={() =>
                                document
                                    .getElementById("admin-profile-photo")
                                    ?.click()
                            }
                        >
                            {currentPhotoUrl ? "Change" : "Upload"}
                        </Button>

                        {currentPhotoUrl && (
                            <Button
                                type="button"
                                danger
                                ghost
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    setData("photo", null);
                                    setData("remove_photo", true);
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </div>

                    <InputError className="mt-2" message={errors.photo} />
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