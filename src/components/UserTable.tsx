'use client';

import { useState } from 'react';
import UserEditor from './UserEditor';

type User = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
};

export default function UserTable({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsEditorOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setIsEditorOpen(true);
    };

    const handleClose = () => {
        setIsEditorOpen(false);
        setEditingUser(null);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-400">System Users</h3>
                <button
                    onClick={handleOpenCreate}
                    className="font-sans text-[10px] md:text-xs uppercase tracking-widest text-black hover:text-neutral-500 transition-colors"
                >
                    + ADD USER
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-200">
                            <th className="py-3 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-normal">Name</th>
                            <th className="py-3 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-normal">Email</th>
                            <th className="py-3 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-normal">Role</th>
                            <th className="py-3 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-normal">Joined</th>
                            <th className="py-3 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-normal text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors group">
                                <td className="py-4 font-sans text-sm text-black">{user.name || '—'}</td>
                                <td className="py-4 font-sans text-sm text-neutral-600">{user.email}</td>
                                <td className="py-4">
                                    <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 font-sans text-[10px] uppercase tracking-widest rounded-sm">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 font-sans text-xs text-neutral-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right">
                                    <button 
                                        onClick={() => handleOpenEdit(user)}
                                        className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditorOpen && (
                <UserEditor 
                    user={editingUser} 
                    onClose={handleClose} 
                    onSuccess={() => window.location.reload()} 
                />
            )}
        </div>
    );
}
