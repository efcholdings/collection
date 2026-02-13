'use client';

import { Artwork } from '@prisma/client';
import { useState, useEffect } from 'react';
import ArtworkRow from './ArtworkRow';
import ArtworkDetailPanel from './ArtworkDetailPanel';
import Sidebar from './Sidebar';
import QuickFilters from './QuickFilters';
import SearchBar from './SearchBar';
import PaginationControls from './PaginationControls';
import ArtworkCreator from './ArtworkCreator';
import ArtworkEditor from './ArtworkEditor';
import { searchArtworks } from '@/actions/search';
import { logout } from '@/actions/auth';
import { PrinterIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/imageUtils';
import ReportBuilder from './ReportBuilder';

interface GalleryManagerProps {
    artworks: Artwork[];
    totalCount: number;
    currentPage?: number; // Optional because search mode manages its own page
    categories: string[];
    artists: string[];
    isAdmin?: boolean;
}

type ViewMode = 'grid' | 'list';

export default function GalleryManager({ artworks, totalCount, currentPage = 1, categories, artists, isAdmin = false }: GalleryManagerProps) {
    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
    const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
    const [isCreating, setIsCreating] = useState(false); // New state
    const [isReportOpen, setIsReportOpen] = useState(false); // Report Builder State
    const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list as requested

    useEffect(() => {
        console.log('GalleryManager isAdmin prop:', isAdmin);
    }, [isAdmin]);

    // Search State
    const [searchResults, setSearchResults] = useState<{ data: Artwork[], total: number, page: number } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Derived state: Show search results if they exist, otherwise show all artworks
    const displayArtworks = searchResults ? searchResults.data : artworks;
    const displayTotal = searchResults ? searchResults.total : totalCount;
    const displayPage = searchResults ? searchResults.page : currentPage;

    const handleSearch = async (query: string, page: number = 1) => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const { artworks, totalCount } = await searchArtworks(query, page);
            // Store query in state or just rely on the input (simplified: we need the query to paginate)
            // For now, let's assume the SearchBar keeps the query or we pass it.
            // Actually, we need to store the query in GalleryManager to support pagination.
            setSearchQuery(query);
            setSearchResults({ data: artworks, total: totalCount, page });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');

    const onSearchPageChange = (newPage: number) => {
        handleSearch(searchQuery, newPage);
    };

    const triggerSearch = (query: string) => handleSearch(query, 1);

    // Close panel on esc
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedArtwork(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar categories={categories} artists={artists} />

            <div className="flex-1 flex flex-col md:ml-64 h-full relative">
                <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-32">
                    {/* Utility Bar */}
                    <header className="mb-16 flex flex-col items-center gap-6 relative">

                        {/* 1. Global Search (Centered, Minimal) */}
                        <div className="w-full md:w-[75%] my-8">
                            <SearchBar onSearch={triggerSearch} isSearching={isSearching} variant="minimal" />
                        </div>

                        {/* 2. Admin & Auth Status (Absolute Positioned Top-Right) */}
                        <div className="w-full flex justify-end items-center md:absolute md:top-3 md:right-0 md:w-auto pointer-events-none gap-6">
                            {/* System Admin Indicator */}
                            {isAdmin && (
                                <div className="pointer-events-auto flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-neutral-400">System Administrator</span>
                                </div>
                            )}

                            {/* Sign Out Link */}
                            <div className="pointer-events-auto flex items-center">
                                {!isAdmin ? (
                                    <a href="/login" className="text-[9px] text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest font-medium">
                                        Admin Login
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => logout()}
                                        className="text-[9px] text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest font-medium relative group"
                                    >
                                        Sign Out
                                        <span className="absolute left-0 bottom-0 w-0 h-px bg-neutral-900 transition-all duration-300 group-hover:w-full"></span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Secondary Action Bar (Title & Tools) */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                        <div>
                            <h1 className="font-serif text-3xl text-neutral-900 mt-6">
                                Collection Management
                            </h1>
                            <p className="text-neutral-500 text-sm mt-2 font-light">
                                Showing {displayArtworks.length} of {displayTotal} Records
                                {searchResults && <span className="ml-2 text-indigo-500 cursor-pointer hover:underline" onClick={() => setSearchResults(null)}>(Clear Search)</span>}
                            </p>
                        </div>

                        {/* Utility Toolbar - Artlogic Style */}
                        <div className="flex items-center gap-6 md:gap-4 relative z-50">
                            {isAdmin && (
                                <>
                                    <HoverButton onClick={() => setIsCreating(true)}>
                                        + Add Artwork
                                    </HoverButton>
                                    <span className="text-gray-300 font-light text-[10px]">|</span>
                                </>
                            )}

                            <HoverButton onClick={() => setIsReportOpen(true)}>
                                Report
                            </HoverButton>

                            <span className="text-gray-300 font-light text-[10px]">|</span>

                            <HoverButton
                                onClick={() => setViewMode('grid')}
                                isActive={viewMode === 'grid'}
                            >
                                Grid
                            </HoverButton>

                            <span className="text-gray-300 font-light text-[10px]">|</span>

                            <HoverButton
                                onClick={() => setViewMode('list')}
                                isActive={viewMode === 'list'}
                            >
                                Table
                            </HoverButton>
                        </div>
                    </div>

                    <QuickFilters />

                    <div className="w-full transition-all duration-300">
                        {/* Content Grid/List */}
                        <div style={viewMode === 'grid' ? {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '24px',
                            width: '100%'
                        } : {
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {displayArtworks.map(art => (
                                viewMode === 'list' ? (
                                    <ArtworkRow
                                        key={art.id}
                                        artwork={art}
                                        onSelect={setSelectedArtwork}
                                        onEdit={setEditingArtwork}
                                        isAdmin={isAdmin}
                                    />
                                ) : (
                                    <div
                                        key={art.id}
                                        onClick={() => setSelectedArtwork(art)}
                                        className="group cursor-pointer flex flex-col space-y-2 relative overflow-hidden"
                                        style={{ minWidth: 0 }}
                                    >
                                        {/* Aspect Ratio Container */}
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            paddingBottom: '100%',
                                            backgroundColor: '#F9FAFB', // grey-50
                                            border: '0.5px solid #E5E7EB', // grey-200
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Absolute Positioned Image */}
                                            {getValidImageUrl(art.imagePath) ? (
                                                <img
                                                    src={getValidImageUrl(art.imagePath)!}
                                                    alt={art.title}
                                                    className="transition-transform duration-500 group-hover:scale-105"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        maxWidth: 'none'
                                                    }}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-neutral-300 bg-gray-50">
                                                    <span className="text-[9px] uppercase font-medium tracking-widest leading-none">No</span>
                                                    <span className="text-[9px] uppercase font-medium tracking-widest leading-none">Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full overflow-hidden">
                                            <h3 className="font-serif text-sm text-neutral-900 truncate block">{art.title}</h3>
                                            <p className="text-xs text-neutral-500 truncate block">{art.artist}</p>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>

                        {/* Pagination */}
                        <PaginationControls
                            currentPage={displayPage}
                            totalCount={displayTotal}
                            itemsPerPage={50}
                            onPageChange={searchResults ? onSearchPageChange : undefined}
                            isServerSide={!searchResults} // If not searching, use server-side routing
                        />
                    </div>
                </main>

                {/* Split View Panel (Persistent) */}
                {selectedArtwork && (
                    <ArtworkDetailPanel
                        artwork={selectedArtwork}
                        onClose={() => setSelectedArtwork(null)}
                        onEdit={() => {
                            setEditingArtwork(selectedArtwork);
                            setSelectedArtwork(null);
                        }}
                        isAdmin={isAdmin}
                    />
                )}

                {/* Create Modal */}
                {isCreating && (
                    <ArtworkCreator onClose={() => setIsCreating(false)} />
                )}

                {/* Edit Modal */}
                {editingArtwork && (
                    <ArtworkEditor
                        artwork={editingArtwork}
                        onClose={() => {
                            setEditingArtwork(null);
                            setSelectedArtwork(null);
                        }}
                    />
                )}

                {/* Report Builder Modal */}
                {isReportOpen && (
                    <ReportBuilder
                        artworks={displayArtworks}
                        onClose={() => setIsReportOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}

function HoverButton({ children, onClick, isActive = false }: { children: React.ReactNode, onClick: () => void, isActive?: boolean }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="text-[10px] tracking-[0.2em] font-sans uppercase px-2 py-1 rounded transition-colors duration-200 cursor-pointer"
            style={{
                backgroundColor: isActive ? 'transparent' : (isHovered ? '#E5E5E5' : 'transparent'),
                color: isActive ? 'black' : (isHovered ? 'black' : '#6B7280'), // neutral-500
                fontWeight: isActive ? 600 : 400
            }}
        >
            {children}
        </button>
    );
}
