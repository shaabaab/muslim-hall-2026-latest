import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { Typography } from "antd";

const { Title, Text } = Typography;

export default function Dashboard({ auth, stats }) {
    return (
        <Authenticated user={auth.user} header="Dashboard">
            <div>User Dashboard</div>
        </Authenticated>
    );
}
