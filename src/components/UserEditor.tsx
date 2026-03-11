'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createUser, updateUser, deleteUser } from '@/actions/users';

type User = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
};

type Props = {
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
};

export default function UserEditor({ user, onClose, onSuccess }: Props) {
    const isEditing = !!user;
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async (formData: FormData) => {
        setIsSaving(true);
        try {
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                password: formData.get('password') || undefined,
            };

            let res;
            if (isEditing) {
                res = await updateUser(user!.id, data);
            } else {
                res = await createUser(data);
            }

            if (res.success) {
                onSuccess();
            } else {
                alert(`Error: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return;

        setIsDeleting(true);
        try {
            const res = await deleteUser(user.id);
            if (res.success) {
                onSuccess();
            } else {
                alert(`Error: ${res.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 z-[100000]">
            <div className="bg-white rounded-sm shadow-2xl flex flex-col relative overflow-hidden w-full max-w-md">
                
                <div className="absolute top-0 right-0 p-4 z-20">
                    <button
                        onClick={onClose}
                        className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
                    >
                        Close
                    </button>
                </div>

                <div className="p-8 pb-4">
                    <h2 className="font-serif text-2xl font-light text-black mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        {isEditing ? 'Edit System Access' : 'Provision User'}
                    </h2>
                </div>

                <form action={handleSave} className="px-8 pb-8 flex flex-col gap-5">
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Name</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={user?.name || ''}
                            className="w-full text-sm font-sans border-b border-neutral-200 py-2 focus:outline-none focus:border-black transition-colors"
                            placeholder="Full Name"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            required
                            defaultValue={user?.email || ''}
                            className="w-full text-sm font-sans border-b border-neutral-200 py-2 focus:outline-none focus:border-black transition-colors"
                            placeholder="name@example.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Password {isEditing ? '(Leave blank to keep current)' : '*'}</label>
                        <input
                            type="password"
                            name="password"
                            required={!isEditing}
                            className="w-full text-sm font-sans border-b border-neutral-200 py-2 focus:outline-none focus:border-black transition-colors"
                            placeholder={isEditing ? '••••••••' : 'Enter new password'}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-2">System Role *</label>
                        <select
                            name="role"
                            defaultValue={user?.role || 'VIEWER'}
                            required
                            className="w-full text-sm font-sans border-b border-neutral-200 py-2 bg-transparent focus:outline-none focus:border-black transition-colors"
                        >
                            <option value="VIEWER">VIEWER (Read Only)</option>
                            <option value="EDITOR">EDITOR (Read/Update)</option>
                            <option value="MANAGER">MANAGER (Read/Update/Delete)</option>
                            <option value="ADMIN">ADMIN (Full Access & User Mgmt)</option>
                        </select>
                    </div>

                    <div className="pt-6 flex justify-between items-center">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete User'}
                            </button>
                        ) : <div />}
                        
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-3 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}
