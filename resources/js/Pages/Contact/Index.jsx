// resources/js/Pages/Contact/Admin/Index.jsx
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

export default function AdminContactIndex({ contacts, filters, stats }) {
    const { auth } = usePage().props;
    const [deletingId, setDeletingId] = useState(null);

    const getStatusBadge = (status) => {
        const statusConfig = {
            unread: { bg: 'bg-red-100 text-red-800', icon: 'fa-envelope' },
            read: { bg: 'bg-blue-100 text-blue-800', icon: 'fa-envelope-open' },
            replied: { bg: 'bg-green-100 text-green-800', icon: 'fa-reply' },
            archived: { bg: 'bg-gray-100 text-gray-800', icon: 'fa-archive' },
        };

        const config = statusConfig[status] || statusConfig.unread;

        return (
            <span className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${config.bg}`}>
                <i className={`fas ${config.icon}`}></i>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleDelete = (contactId, contactName) => {
        if (confirm(`Are you sure you want to delete the message from "${contactName}"?`)) {
            setDeletingId(contactId);
            
            router.delete(route('admin.contacts.destroy', contactId), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingId(null);
                },
                onError: (error) => {
                    setDeletingId(null);
                    alert('Failed to delete message. Please try again.');
                    console.error('Delete error:', error);
                },
                onFinish: () => {
                    setDeletingId(null);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={'Contact Messages'}
        >
            <Head title="Contact Management" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">



                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {/* Filters and Search */}
                            <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => router.get(route('admin.contacts.index'), { status: 'unread' })}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${filters.status === 'unread' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Unread ({stats.unread})
                                    </button>
                                    <button
                                        onClick={() => router.get(route('admin.contacts.index'), { status: 'read' })}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${filters.status === 'read' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Read ({stats.read})
                                    </button>
                                    <button
                                        onClick={() => router.get(route('admin.contacts.index'), { status: 'replied' })}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${filters.status === 'replied' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Replied ({stats.replied})
                                    </button>
                                    <button
                                        onClick={() => router.get(route('admin.contacts.index'), { status: 'archived' })}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg ${filters.status === 'archived' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Archived ({stats.archived})
                                    </button>
                                    <button
                                        onClick={() => router.get(route('admin.contacts.index'))}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        All Messages
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            defaultValue={filters.search || ''}
                                            onChange={(e) => {
                                                router.get(route('admin.contacts.index'), {
                                                    search: e.target.value,
                                                    status: filters.status
                                                }, {
                                                    preserveState: true,
                                                    replace: true,
                                                    debounce: 300
                                                });
                                            }}
                                            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <i className="absolute left-3 top-2.5 fas fa-search text-gray-400"></i>
                                    </div>
                                </div>
                            </div>


                            {/* Messages Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                From
                                            </th>
                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Subject
                                            </th>
                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {contacts.data.map((contact) => (
                                            <tr
                                                key={contact.id}
                                                className={`hover:bg-gray-50 ${contact.status === 'unread' ? 'bg-blue-50' : ''}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{contact.name}</div>
                                                        <div className="text-sm text-gray-500">{contact.email}</div>
                                                        {contact.phone && (
                                                            <div className="text-sm text-gray-500">{contact.phone}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <div className="font-medium text-gray-900 truncate">{contact.subject}</div>
                                                        <div className="text-sm text-gray-500 truncate">
                                                            {contact.message.substring(0, 80)}...
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(contact.created_at)}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(contact.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(contact.status)}
                                                </td>
                                                <td className="px-2 py-4 text-sm font-medium whitespace-nowrap">
                                                    <div className="flex gap-2">

                                                        <button
                                                            onClick={() => handleDelete(contact.id, contact.name)}
                                                            disabled={deletingId === contact.id}
                                                            className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete Message"
                                                        >
                                                            {deletingId === contact.id ? (
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <i className="fas fa-trash"></i>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty State */}
                            {contacts.data.length === 0 && (
                                <div className="py-12 text-center">
                                    <i className="mb-4 text-4xl text-gray-300 fas fa-inbox"></i>
                                    <h3 className="mb-2 text-lg font-medium text-gray-900">No messages found</h3>
                                    <p className="text-gray-500">
                                        {filters.search || filters.status
                                            ? 'Try changing your filters or search terms.'
                                            : 'All contact messages will appear here.'}
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            {contacts.data.length > 0 && (
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="text-sm text-gray-700">
                                        Showing {contacts.from} to {contacts.to} of {contacts.total} messages
                                    </div>
                                    <div className="flex space-x-2">
                                        {contacts.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm rounded ${link.active
                                                        ? 'bg-blue-500 text-white'
                                                        : link.url
                                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}