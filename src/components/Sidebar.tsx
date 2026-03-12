'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
    categories: string[];
    artists: string[];
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ categories, artists, isOpen = false, onClose }: SidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get('category');
    const currentArtist = searchParams.get('artist');

    const handleFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        // Reset to page 1 whenever filter changes
        params.delete('page');

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/?${params.toString()}`);
        if (onClose) onClose(); // Auto-close menu on mobile after selection
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`w-64 flex-shrink-0 h-screen overflow-y-auto border-r border-neutral-200 p-6 fixed left-0 top-0 bg-white z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                
                {/* Mobile Close Button */}
                <button 
                    className="md:hidden absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                    onClick={onClose}
                    aria-label="Close Menu"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <h2 className="font-serif text-xl font-bold mb-8 tracking-tight pr-6">Art Collection</h2>

            <div className="space-y-8">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 opacity-60">Category</h3>
                    <ul className="space-y-2 leading-loose">
                        <li>
                            <button
                                onClick={() => handleFilter('category', null)}
                                className={`text-sm hover:text-neutral-900 transition-colors ${!currentCategory ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
                            >
                                All Categories
                            </button>
                        </li>
                        {categories.map((cat) => (
                            <li key={cat}>
                                <button
                                    onClick={() => handleFilter('category', cat)}
                                    className={`text-sm text-left w-full hover:text-neutral-900 transition-colors ${currentCategory === cat ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
                                >
                                    {cat}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 opacity-60">Artist</h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin leading-loose">
                        <li>
                            <button
                                onClick={() => handleFilter('artist', null)}
                                className={`text-sm hover:text-neutral-900 transition-colors ${!currentArtist ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
                            >
                                All Artists
                            </button>
                        </li>
                        {artists.map((artist) => (
                            <li key={artist}>
                                <button
                                    onClick={() => handleFilter('artist', artist)}
                                    className={`text-sm text-left w-full hover:text-neutral-900 transition-colors ${currentArtist === artist ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}
                                >
                                    {artist}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </aside>
        </>
    );
}
