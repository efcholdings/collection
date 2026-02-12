'use client';

import { useState, useTransition } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    variant?: 'default' | 'minimal';
}

export default function SearchBar({ onSearch, isSearching, variant = 'default' }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    const clear = () => {
        setQuery('');
        onSearch(''); // clear results
    };

    const baseStyles = "relative flex items-center w-full transition-all duration-300 rounded-full";
    const defaultStyles = "bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-transparent";
    // Gallery/Minimal style updates - Added light border and width constraints
    const minimalStyles = "bg-white/80 border border-neutral-200 focus-within:border-neutral-800 focus-within:shadow-[0_0_20px_rgba(0,0,0,0.03)]";

    return (
        <form onSubmit={handleSubmit} className={`relative w-full max-w-4xl group ${variant === 'minimal' ? 'mx-auto' : ''}`}>
            <div className={`${baseStyles} ${variant === 'minimal' ? minimalStyles : defaultStyles} ${!isSearching && variant === 'minimal' ? 'hover:border-neutral-200' : ''}`}>

                {/* Icon */}
                <div className="pl-0 md:pl-2 text-neutral-800">
                    {isSearching ? (
                        <div className="w-4 h-4 rounded-full bg-neutral-400 animate-pulse" />
                    ) : (
                        <MagnifyingGlassIcon className={`w-5 h-5 text-neutral-600 ${variant === 'minimal' ? 'opacity-70' : ''}`} />
                    )}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={variant === 'minimal' ? "Search by theme, artist, or origin..." : "Ask nicely..."}
                    className={`w-full py-4 px-4 bg-transparent border-none focus:ring-0 text-lg md:text-xl placeholder:text-neutral-300 font-light ${variant === 'minimal' ? 'font-serif italic placeholder:italic' : ''}`}
                    disabled={isSearching}
                />

                {/* Action Buttons */}
                <div className="pr-2 flex items-center gap-1">
                    {query && (
                        <button
                            type="button"
                            onClick={clear}
                            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Suggested Query Text - Fades out on type */}
            {variant === 'minimal' && (
                <div className={`mt-3 text-center transition-opacity duration-500 ${query ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                        Suggested: <span className="text-neutral-500">Cuban abstraction before 2010</span> or <span className="text-neutral-500">Political themes</span>
                    </p>
                </div>
            )}
        </form>
    );
}
