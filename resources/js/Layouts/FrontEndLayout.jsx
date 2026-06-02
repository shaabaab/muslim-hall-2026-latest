// import { useState } from "react";
// export default function FrontAuthenticatedLayout({ children }) {
//     return (
//         <>
//             {children}
//         </>
//     );
// }
import { useState, useEffect } from "react";
export default function FrontAuthenticatedLayout({ children }) {
    useEffect(() => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }, []);
    return <div style={{ minHeight: "100vh" }}>{children}</div>;
}