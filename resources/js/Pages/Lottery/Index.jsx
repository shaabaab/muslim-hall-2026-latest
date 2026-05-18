import React, { useState } from "react";
import axios from "axios";
import Authenticated from "@/Layouts/AuthenticatedLayout";

import {
    SearchOutlined,
    TrophyOutlined,
    TeamOutlined,
    SettingOutlined,
    CheckCircleFilled,
    InfoCircleOutlined,
} from "@ant-design/icons";
import {
    Table,
    Button,
    Space,
    Tag,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Input,
    Select,
    Row,
    Col,
    Image,
    Badge,
    Statistic,
} from "antd";

export default function Lottery({ contests, seos, filters, auth }) {
    const [selectedContest, setSelectedContest] = useState("");
    const [participants, setParticipants] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [winnerCount, setWinnerCount] = useState("");
    const [winners, setWinners] = useState([]);
    const [search, setSearch] = useState("");
    const [loaded, setLoaded] = useState(false);

    const handleContestChange = async (e) => {
        const contestId = e.target.value;
        setSelectedContest(contestId);
        setSelectedUsers([]);
        setWinnerCount("");
        setWinners([]);
        setSearch("");
        setLoaded(false);

        if (!contestId) {
            setParticipants([]);
            return;
        }

        try {
            const response = await axios.get("lottery/participants", {
                params: { contest_id: contestId },
            });

            if (response.data.success) {
                setParticipants(response.data.data);
            } else {
                setParticipants([]);
            }
        } catch (error) {
            console.error(error);
            setParticipants([]);
        } finally {
            setLoaded(true);
        }
    };

    const handleCheckboxChange = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const pickRandomWinners = (count) => {
        const selectedParticipants = participants.filter((p) =>
            selectedUsers.includes(p.user.id),
        );

        if (selectedParticipants.length < count) {
            alert("Selected users are less than winner count!");
            return;
        }

        const arr = [...selectedParticipants];

        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        setWinners(arr.slice(0, count));
    };

    const isDisabled =
        !selectedContest || !winnerCount || selectedUsers.length === 0;

    const filteredParticipants = participants.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.user.name?.toLowerCase().includes(q) ||
            p.user.email?.toLowerCase().includes(q) ||
            p.user.username?.toLowerCase().includes(q)
        );
    });

    return (
        <Authenticated user={auth.user} header="Lottery">
            <Card>
                <div className="main-content-wrapper md:m-0 -m-2">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                            <div className="bg-blue-100 mb-6 text-blue-600 p-3 rounded-lg shadow-sm">
                                <TrophyOutlined className="text-xl" />
                            </div>

                            <div className="flex flex-col gap-0">
                                <h1 className="text-2xl md:leading-3 font-sans font-semibold uppercase text-blue-700 ">
                                    Lottery Draw
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Select participants and draw random winners
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="box-wrapper bg-white md:border border-gray-200 rounded-xl md:shadow-sm md:p-5  mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 uppercase mb-1.5">
                                    Contest
                                </label>
                                <select
                                    value={selectedContest}
                                    onChange={handleContestChange}
                                    className="w-full border-blue-200 text-gray-600 font-medium text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                                >
                                    <option className="text-gray-500" value="">
                                        Select Contest{" "}
                                    </option>
                                    {contests.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 uppercase mb-1.5">
                                    Number of Winners
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={winnerCount}
                                    onChange={(e) =>
                                        setWinnerCount(e.target.value)
                                    }
                                    className="w-full border-blue-200 text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 mt-1"
                                    placeholder="e.g. 3"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        pickRandomWinners(parseInt(winnerCount))
                                    }
                                    disabled={isDisabled}
                                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                        isDisabled
                                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    }`}
                                >
                                    <TrophyOutlined />
                                    Pick Winners
                                </button>
                            </div>
                        </div>
                        <div className=" px-3 py-2 rounded-md bg-blue-50 backdrop-blur-md opacity-90 border border-gray-200 flex items-center gap-2 text-sm text-gray-700 font-sans shadow-lg mt-10 shadow-blue-600">
                            <InfoCircleOutlined className="text-blue-500 text-base" />

                            <span>
                                Select a contest, select participants from the
                                table, then enter the number of winners to draw.
                            </span>
                        </div>
                    </div>

                    {winners.length > 0 && (
                        <div className="mb-4 p-4 bg-white border border-blue-300 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <TrophyOutlined className="text-blue-600 text-base" />
                                <h3 className="text-sm font-semibold text-blue-700">
                                    {winners.length} Winner
                                    {winners.length > 1 ? "s" : ""} Selected
                                </h3>
                            </div>
                            <ul className="space-y-2">
                                {winners.map((w, i) => (
                                    <li
                                        key={w.id}
                                        className="flex md:flex-row flex-col  items-center gap-3 text-sm"
                                    >
                                        <span className="bg-blue-600 text-white text-xs font-bold rounded-md px-2 py-0.5">
                                            #{i + 1}
                                        </span>

                                        <span className="font-semibold text-gray-800">
                                            <CheckCircleFilled className="text-blue-500" />{" "}
                                            {w.user.name}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {w.user.email}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* participants table */}
                    {selectedContest && (
                        <div className="box-wrapper bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <TeamOutlined className="text-blue-600" />
                                    <h2 className="text-sm font-semibold text-gray-800">
                                        Participants
                                    </h2>
                                    {participants.length > 0 && (
                                        <>
                                            <div className="flex md:flex-row flex-col gap-1">
                                                <span className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {participants.length} total
                                                </span>
                                                {selectedUsers.length > 0 && (
                                                    <span className="text-xs border border-blue-300 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                                        {selectedUsers.length}
                                                        selected
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {participants.length > 0 && (
                                    <div className="relative w-full sm:w-60">
                                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Search participants..."
                                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* msg for no participates] */}
                            {loaded && participants.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <TeamOutlined className="text-4xl text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">
                                        No participants found
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        This contest has no registered
                                        participants yet.
                                    </p>
                                </div>
                            )}

                            {participants.length > 0 && (
                                <div className="table-responsive">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-12">
                                                    Select
                                                </th>

                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                                    Particupates Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                                    Email
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredParticipants.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        className="px-4 py-12 text-center"
                                                    >
                                                        <SearchOutlined className="text-2xl text-gray-300 mb-2 block" />
                                                        <p className="text-gray-500 font-medium">
                                                            No results found
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-1">
                                                            Try a different
                                                            search term.
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredParticipants.map(
                                                    (p) => (
                                                        <tr
                                                            key={p.id}
                                                            className={`transition-colors ${
                                                                selectedUsers.includes(
                                                                    p.user.id,
                                                                )
                                                                    ? "bg-blue-50"
                                                                    : "hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUsers.includes(
                                                                        p.user
                                                                            .id,
                                                                    )}
                                                                    onChange={() =>
                                                                        handleCheckboxChange(
                                                                            p
                                                                                .user
                                                                                .id,
                                                                        )
                                                                    }
                                                                    className="w-4 h-4 rounded-md accent-blue-600  cursor-pointer"
                                                                />
                                                            </td>

                                                            <td className="px-4 py-3 font-medium text-gray-700">
                                                                {p.user.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {p.user.email}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </Authenticated>
    );
}
