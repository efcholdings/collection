'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';

const SUGGESTIONS = [
    "Large Cuban artworks",
    "Paintings under 100 cm tall",
    "Sculptures from the 1990s",
    "Photography larger than 20 inches",
    "Abstract art created before 2000"
];

interface SuggestedSearchesProps {
    onSelectSuggestion: (query: string) => void;
}

export default function SuggestedSearches({ onSelectSuggestion }: SuggestedSearchesProps) {
    return (
        <div className="w-full mt-2 flex flex-col md:flex-row items-start md:items-center gap-2 px-2 md:px-0 opacity-80 relative z-0">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-neutral-400 font-medium shrink-0">
                <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Try asking rules:</span>
            </div>
            
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 md:pb-0 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {SUGGESTIONS.map((suggestion, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectSuggestion(suggestion)}
                        className="whitespace-nowrap rounded-full bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-600 px-3 py-1.5 text-[10px] sm:text-xs font-light transition-colors border border-transparent hover:border-neutral-300"
                    >
                        "{suggestion}"
                    </button>
                ))}
            </div>
        </div>
    );
}
