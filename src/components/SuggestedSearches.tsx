'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

const ALL_SUGGESTIONS = [
    "Large vibrant Cuban paintings",
    "Peaceful blue ocean scenes",
    "Dark moody photography",
    "Sculptures from the 1990s",
    "Abstract art created before 2000",
    "Small black and white pieces",
    "Minimalist works wider than 5 feet",
    "Warm, colorful mixed media",
    "Intense geometric patterns",
    "Portraits under 100 cm tall",
    "Artworks created in 2015"
];

interface SuggestedSearchesProps {
    onSelectSuggestion: (query: string) => void;
}

export default function SuggestedSearches({ onSelectSuggestion }: SuggestedSearchesProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        // Shuffle and pick 4 random suggestions on client mount to avoid NextJS hydration mismatch
        const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 4));
    }, []);

    // Prevent rendering until mounted to avoid flicker
    if (suggestions.length === 0) return (
        // Render invisible placeholder to prevent layout shift
        <div className="w-full mt-2 h-[30px]" />
    );

    return (
        <div className="w-full mt-2 flex flex-col md:flex-row items-center justify-center gap-3 px-2 md:px-0 opacity-80 relative z-0">
            <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-widest text-neutral-400 font-medium shrink-0">
                <SparklesIcon className="w-3 h-3 text-indigo-400" />
                <span>Try asking:</span>
            </div>
            
            <div className="flex flex-wrap justify-center overflow-x-auto hide-scrollbar gap-2 pb-2 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectSuggestion(suggestion)}
                        className="whitespace-nowrap rounded-full bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-600 px-3 py-1.5 text-[10px] font-light transition-all duration-300 border border-transparent hover:border-neutral-300 transform active:scale-95"
                    >
                        "{suggestion}"
                    </button>
                ))}
            </div>
        </div>
    );
}
