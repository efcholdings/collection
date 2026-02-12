'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SidebarProps {
    categories: string[];
    artists: string[];
}

export default function Sidebar({ categories, artists }: SidebarProps) {
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
    };

    return (
        <aside className="w-64 flex-shrink-0 h-screen overflow-y-auto border-r border-neutral-200 p-6 hidden md:block fixed left-0 top-0 bg-white z-10">
            <h2 className="font-serif text-xl font-bold mb-8 tracking-tight">Art Collection</h2>

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
    );
}
