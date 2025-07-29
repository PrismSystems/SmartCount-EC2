import React, { useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    is_admin: boolean;
    is_approved: boolean;
    is_suspended: boolean;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
    user_email: string;
    is_archived: boolean;
    pdf_count: number;
    created_at: string;
}

export const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'projects'>('pending');
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        try {
            if (activeTab === 'pending') {
                const response = await fetch('/api/admin/pending-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setPendingUsers(data);
            } else if (activeTab === 'users') {
                const response = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setAllUsers(data);
            } else if (activeTab === 'projects') {
                const response = await fetch('/api/admin/projects', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const approveUser = async (userId: string) => {
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`/api/admin/approve-user/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Approve error:', error);
        }
    };

    const toggleUserSuspension = async (userId: string, suspend: boolean) => {
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`/api/admin/suspend-user/${userId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ suspend })
            });
            fetchData();
        } catch (error) {
            console.error('Suspend error:', error);
        }
    };

    const toggleProjectArchive = async (projectId: string, archive: boolean) => {
        const token = localStorage.getItem('authToken');
        try {
            await fetch(`/api/admin/archive-project/${projectId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ archive })
            });
            fetchData();
        } catch (error) {
            console.error('Archive error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Back to App
                    </button>
                </div>

                <div className="flex space-x-1 mb-6">
                    {[
                        { key: 'pending', label: 'Pending Users' },
                        { key: 'users', label: 'All Users' },
                        { key: 'projects', label: 'Projects' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 rounded-t ${
                                activeTab === tab.key
                                    ? 'bg-white border-t border-l border-r border-gray-300'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <>
                            {activeTab === 'pending' && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">Pending User Approvals</h2>
                                    {pendingUsers.length === 0 ? (
                                        <p className="text-gray-500">No pending users</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center p-3 border rounded">
                                                    <div>
                                                        <span className="font-medium">{user.email}</span>
                                                        <span className="text-gray-500 ml-2">
                                                            Registered: {new Date(user.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => approveUser(user.id)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">All Users</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Registered</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allUsers.map(user => (
                                                    <tr key={user.id}>
                                                        <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                user.is_admin ? 'bg-purple-100 text-purple-800' :
                                                                user.is_suspended ? 'bg-red-100 text-red-800' :
                                                                user.is_approved ? 'bg-green-100 text-green-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {user.is_admin ? 'Admin' :
                                                                 user.is_suspended ? 'Suspended' :
                                                                 user.is_approved ? 'Active' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {new Date(user.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {!user.is_admin && (
                                                                <button
                                                                    onClick={() => toggleUserSuspension(user.id, !user.is_suspended)}
                                                                    className={`px-3 py-1 rounded text-sm ${
                                                                        user.is_suspended
                                                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                                                            : 'bg-red-600 text-white hover:bg-red-700'
                                                                    }`}
                                                                >
                                                                    {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'projects' && (
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">All Projects</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Project Name</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">User</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">PDFs</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map(project => (
                                                    <tr key={project.id}>
                                                        <td className="border border-gray-300 px-4 py-2">{project.name}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{project.user_email}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{project.pdf_count}</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className={`px-2 py-1 rounded text-xs ${
                                                                project.is_archived ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {project.is_archived ? 'Archived' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            {new Date(project.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <button
                                                                onClick={() => toggleProjectArchive(project.id, !project.is_archived)}
                                                                className={`px-3 py-1 rounded text-sm ${
                                                                    project.is_archived
                                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                                        : 'bg-orange-600 text-white hover:bg-orange-700'
                                                                }`}
                                                            >
                                                                {project.is_archived ? 'Unarchive' : 'Archive'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};