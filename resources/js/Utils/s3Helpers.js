// import { usePage } from "@inertiajs/react";

// export function getS3PublicUrl(path) {
//     if (!path) {
//         return "/assets/images/placeholder.png";
//     }

//     // If it's already a full URL, return it
//     if (path.startsWith("http")) {
//         return path;
//     }

//     const { storage_disk } = usePage().props;

//     // If we're using S3, use the S3 URL
//     if (storage_disk === "s3") {
//         const cleanPath = path.replace(/^\//, "");
//         return `https://muslimhall.s3.ap-south-1.amazonaws.com/${cleanPath}`;
//     }

//     // Default to local storage logic
//     const cleanLocalPath = path.replace(/^\/?uploads\//, "").replace(/^\//, "");
//     return `/uploads/${cleanLocalPath}`;
// }

// export function getS3PublicUrl(path) {
//     if (!path) {
//         return "/assets/images/placeholder.png";
//     }

//     // If already full URL (S3 or external)
//     if (path.startsWith("http")) {
//         return path;
//     }

//     const { storage_disk } = "local";

//     const cleanPath = path.replace(/^\//, "");

//     // S3
//     if (storage_disk === "s3") {
//         return `https://muslimhall.s3.ap-south-1.amazonaws.com/${cleanPath}`;
//     }

//     // Local (storage:link)
//     return `/storage/${cleanPath}`;
// }
export function getS3PublicUrl(path) {
    if (!path) {
        return "/assets/images/logo3.png";
    }

    if (path.startsWith("http")) {
        return path;
    }

    // Check if running locally
    if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
    ) {
        const cleanPath = path.replace(/^\//, "");
        return `/local-s3-proxy/${cleanPath}`;
    }

    return `https://muslimhall.s3.ap-south-1.amazonaws.com/${path}`;
}

export const extractS3KeyFromPossibleStorageUrl = (raw) => {
    if (!raw) return null;
    const str = String(raw);

    const idxFull = str.indexOf("/storage/");
    if (idxFull !== -1) {
        return str.substring(idxFull + "/storage/".length).replace(/^\/+/, "");
    }

    if (str.startsWith("/storage/")) return str.replace(/^\/storage\//, "");
    if (str.startsWith("storage/")) return str.replace(/^storage\//, "");
    if (str.startsWith("public/")) return str.replace(/^public\//, "");

    return str.replace(/^\/+/, "");
};

export const buildS3UrlAlways = (input) => {
    if (!input) return null;

    const raw =
        typeof input === "object"
            ? input.url || input.image || input.path || input.key || input.src
            : input;

    if (!raw) return null;

    const str = String(raw);
    const isHttp = str.startsWith("http");
    const isLocalStorageHttp = isHttp && str.includes("/storage/");

    if (
        isLocalStorageHttp ||
        str.startsWith("/storage/") ||
        str.startsWith("storage/")
    ) {
        const key = extractS3KeyFromPossibleStorageUrl(str);
        return getS3PublicUrl(key);
    }

    if (isHttp) return str;

    return getS3PublicUrl(str);
};
