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
import { PrinterIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getValidImageUrl } from '@/utils/imageUtils';
import ReportBuilder from './ReportBuilder';

interface GalleryManagerProps {
    artworks: Artwork[];
    totalCount: number;
    currentPage?: number; // Optional because search mode manages its own page
    categories: string[];
    artists: string[];
    userRole?: string | null;
}

type ViewMode = 'grid' | 'list';

export default function GalleryManager({ artworks, totalCount, currentPage = 1, categories, artists, userRole = null }: GalleryManagerProps) {
    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
    const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
    const [isCreating, setIsCreating] = useState(false); // New state
    const [isReportOpen, setIsReportOpen] = useState(false); // Report Builder State
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isAdmin = userRole === 'ADMIN';
    const canEdit = ['EDITOR', 'MANAGER', 'ADMIN'].includes(userRole || '');

    useEffect(() => {
        console.log('GalleryManager userRole prop:', userRole);
    }, [userRole]);

    // Sync selectedArtwork with refreshed data
    useEffect(() => {
        if (selectedArtwork) {
            const updated = artworks.find(a => a.id === selectedArtwork.id);
            if (updated && updated !== selectedArtwork) {
                setSelectedArtwork(updated);
            }
        }
    }, [artworks, selectedArtwork]);

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
        <div className="flex h-screen w-full bg-white overflow-hidden">
            <Sidebar 
                categories={categories} 
                artists={artists} 
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col md:ml-64 h-full relative min-w-0">
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 md:p-12 pb-32 w-full">
                    {/* Utility Bar */}
                    <header className="mb-16 flex flex-col items-center gap-6 relative">

                        {/* Logo Centered at Top */}
                        <div className="w-full flex justify-center mt-8 md:mt-4 mb-2">
                            <img 
                                src="/assets/efc_logo.png" 
                                alt="Ella Fontanals Cisneros Collection" 
                                className="h-12 md:h-20 w-auto object-contain select-none"
                            />
                        </div>

                        {/* 1. Global Search & Mobile Menu Toggle */}
                        <div className="w-full md:w-[75%] mb-8 flex items-center gap-4 px-4 md:px-0">
                            <button 
                                className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-900 transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Open Menu"
                            >
                                <Bars3Icon className="w-6 h-6" />
                            </button>
                            <div className="flex-1">
                                <SearchBar onSearch={triggerSearch} isSearching={isSearching} variant="minimal" />
                            </div>
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
                            <h2 className="font-serif text-xl md:text-2xl text-neutral-800 mt-2 md:mt-6">
                                Collection Archive
                            </h2>
                            <p className="text-neutral-500 text-xs md:text-sm mt-1 md:mt-2 font-light">
                                Showing {displayArtworks.length} of {displayTotal} Records
                                {searchResults && <span className="ml-2 text-indigo-500 cursor-pointer hover:underline" onClick={() => setSearchResults(null)}>(Clear Search)</span>}
                            </p>
                        </div>

                        {/* Utility Toolbar - Artlogic Style */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 relative z-50 mt-4 md:mt-0">
                            {canEdit && (
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

                    <div className="px-2 mb-6">
                        <QuickFilters />
                    </div>

                    <div className="w-full transition-all duration-300 px-2 lg:px-0">
                        {/* Content Grid/List */}
                        {viewMode === 'list' ? (
                            <div className="w-full">
                                {/* Desktop/Tablet Table Header */}
                                <div className="hidden md:flex border-b border-gray-100 flex-row">
                                    <div className="w-1/4 text-left pt-4 pb-1 px-4 text-[9px] uppercase tracking-[0.5em] text-gray-400 font-sans font-light align-bottom">Artwork</div>
                                    <div className="w-1/5 text-left pt-4 pb-1 px-4 text-[9px] uppercase tracking-[0.5em] text-gray-400 font-sans font-light align-bottom">Medium</div>
                                    <div className="w-[17%] text-left pt-4 pb-1 px-4 text-[9px] uppercase tracking-[0.5em] text-gray-400 font-sans font-light align-bottom">Dimensions</div>
                                    <div className="w-[17%] text-center pt-4 pb-1 px-4 text-[9px] uppercase tracking-[0.5em] text-gray-400 font-sans font-light align-bottom">Category</div>
                                    {isAdmin && (
                                        <div className="w-[21%] text-right pt-4 pb-1 pl-4 pr-0 text-[9px] uppercase tracking-[0.5em] text-gray-400 font-sans font-light align-bottom">Financials</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    {displayArtworks.map(art => (
                                        <ArtworkRow
                                            key={art.id}
                                            artwork={art}
                                            onSelect={setSelectedArtwork}
                                            onEdit={setEditingArtwork}
                                            userRole={userRole}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-6 w-full">
                                {displayArtworks.map(art => (
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
                                            <h3 className="font-serif text-[10px] sm:text-xs md:text-sm text-neutral-900 truncate block">{art.title}</h3>
                                            <p className="text-[9px] sm:text-[10px] md:text-xs text-neutral-500 truncate block">{art.artist}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </main>

                {/* Fixed Footer Pagination */}
                <div className="flex-shrink-0 bg-white z-10">
                    <PaginationControls
                        currentPage={displayPage}
                        totalCount={displayTotal}
                        itemsPerPage={50}
                        onPageChange={searchResults ? onSearchPageChange : undefined}
                        isServerSide={!searchResults} // If not searching, use server-side routing
                    />
                </div>

                {/* Split View Panel (Persistent) */}
                {selectedArtwork && (
                    <ArtworkDetailPanel
                        artwork={selectedArtwork}
                        onClose={() => setSelectedArtwork(null)}
                        onEdit={() => {
                            setEditingArtwork(selectedArtwork);
                            // setSelectedArtwork(null); // Keep detail view open underneath
                        }}
                        userRole={userRole}
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
                        userRole={userRole}
                        onClose={() => {
                            setEditingArtwork(null);
                            // setSelectedArtwork(null); // Return to detail view
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
            </div >
        </div >
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

