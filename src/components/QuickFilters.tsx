'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TOP_CATEGORIES = [
    'Contemporary',
    'Latin American abstraction',
    'Geometric abstraction',
    'Abstraction',
    'Photography',
    'Video',
    'Sculpture',
    'Painting',
    'Installation'
];

export default function QuickFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    const handleFilter = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        // Reset to page 1
        params.delete('page');

        if (currentCategory === category) {
            params.delete('category'); // Toggle off
        } else {
            params.set('category', category);
        }

        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide mb-6 border-b border-neutral-100">
            <button
                onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('category');
                    router.push(`/?${params.toString()}`);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0 ${!currentCategory
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
            >
                All Works
            </button>

            {TOP_CATEGORIES.map((category) => (
                <button
                    key={category}
                    onClick={() => handleFilter(category)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0 ${currentCategory === category
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
}
