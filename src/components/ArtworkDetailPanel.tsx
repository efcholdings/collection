'use client';

import { Artwork } from '@prisma/client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getValidImageUrl } from '@/utils/imageUtils';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface ArtworkDetailPanelProps {
    artwork: Artwork | null;
    onClose: () => void;
    onEdit?: () => void;
    userRole?: string | null;
}

export default function ArtworkDetailPanel({ artwork, onClose, onEdit, userRole = null }: ArtworkDetailPanelProps) {
    const [mounted, setMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const canEdit = ['EDITOR', 'MANAGER', 'ADMIN'].includes(userRole || '');

    // Multi-image state
    const images = artwork ? [
        artwork.imagePath,
        (artwork as any).imagePath2,
        (artwork as any).imagePath3,
        (artwork as any).imagePath4,
        (artwork as any).imagePath5
    ].filter(img => img && getValidImageUrl(img)) as string[] : [];

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showNoMoreImages, setShowNoMoreImages] = useState(false);

    // Caption Auto-Hide State
    const [showCaption, setShowCaption] = useState(true);
    const mouseTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        // Prevent body scroll for Modal
        document.body.style.overflow = 'hidden';

        // Robust Media Query check
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop(); // Initial check
        window.addEventListener('resize', checkDesktop);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('resize', checkDesktop);
        };
    }, []);

    // Immersive Gestures: ESC Key Listener & Caption Logic
    useEffect(() => {
        if (!isLightboxOpen) return;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLightboxOpen(false);
            if (e.key === 'ArrowRight' && images.length > 1) {
                if (activeImageIndex === images.length - 1) {
                    setShowNoMoreImages(true);
                    setTimeout(() => setShowNoMoreImages(false), 2000);
                } else {
                    setActiveImageIndex((prev) => prev + 1);
                }
            }
            if (e.key === 'ArrowLeft' && images.length > 1) {
                if (activeImageIndex > 0) {
                    setActiveImageIndex((prev) => prev - 1);
                }
            }
        };

        const handleMouseMove = () => {
            setShowCaption(true);
            if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
            mouseTimerRef.current = setTimeout(() => setShowCaption(false), 3000);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        mouseTimerRef.current = setTimeout(() => setShowCaption(false), 3000);

        return () => {
            document.body.style.overflow = 'hidden';
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
        };
    }, [isLightboxOpen]);

    if (!artwork || !mounted) return null;

    // --- Conditional Styles ---

    const containerStyle: React.CSSProperties = isDesktop ? {
        display: 'flex',
        flexDirection: 'row',
        width: '90vw',
        maxWidth: '1280px', // Increased max-width slightly to accommodate extra spacing
        height: '85vh',
        maxHeight: 'none',
    } : {
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
    };

    const leftPanelStyle: React.CSSProperties = isDesktop ? {
        width: '55%', // Reduced slightly from 60%
        height: '100%',
        padding: 0,
    } : {
        width: '100%',
        position: 'relative',
        height: '45vh',
        flexShrink: 0,
    };

    // Right Panel with Gap Padding
    const rightPanelStyle: React.CSSProperties = isDesktop ? {
        width: '45%', // Increased slightly from 40%
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #F3F4F6',
        paddingTop: '40px',
        // Added padding left to create whitespace separation from image
        paddingLeft: '40px',
    } : {
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '20px',
        paddingBottom: '20px',
    };

    return (
        <>
            {/* MAIN MODAL PORTAL */}
            {createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center p-2 md:p-0"
                    style={{ zIndex: 9000 }}
                >
                    {/* Blurred Backdrop */}
                    <div
                        className="absolute inset-0 transition-opacity duration-300 bg-white/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div
                        className="relative bg-white shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-neutral-100"
                        style={containerStyle}
                    >

                        {/* LEFT PANEL: Visuals */}
                        <div
                            className="relative bg-neutral-50 flex flex-col items-center justify-center p-8 border-r border-neutral-100"
                            style={leftPanelStyle}
                        >
                            <div
                                className="relative w-full flex-1 flex items-center justify-center cursor-zoom-in group mb-16"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                {images.length > 0 ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={getValidImageUrl(images[activeImageIndex])!}
                                            alt={artwork.title}
                                            fill
                                            className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                                            sizes="(max-width: 768px) 95vw, 60vw"
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-neutral-400">
                                        <span className="font-serif italic text-xl">No Image Available</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-2">Upload in Edit Mode</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 md:bottom-8 left-0 w-full flex justify-center gap-3 px-8 z-10">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveImageIndex(idx);
                                            }}
                                            className={`relative w-16 h-16 shrink-0 border transition-all ${idx === activeImageIndex ? 'border-neutral-900' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <Image
                                                src={getValidImageUrl(img)!}
                                                alt={`Thumbnail ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT PANEL: Metadata */}
                        <div
                            className="bg-white overflow-hidden"
                            style={rightPanelStyle}
                        >

                            {/* Header: Close Button (Absolute) */}
                            <div
                                className="absolute top-0 right-0 p-6 md:p-8 z-10"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors group"
                                >
                                    <XMarkIcon className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div
                                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent px-6 md:px-12 pb-6 md:pb-8"
                            >

                                {/* Title Block */}
                                <div className="mb-0 mt-2 md:mt-0">
                                    <h1 className="font-serif leading-tight font-light mb-2 md:mb-3 text-3xl md:text-5xl" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        {artwork.title}
                                    </h1>
                                    <p className="font-light text-gray-500 text-xl md:text-3xl" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                                        {artwork.artist}
                                    </p>
                                </div>

                                {/* SECTIONS */}
                                <div className="flex flex-col">
                                    {/* Core Info - Strict Header Separation (mt-12 / 48px) -- INLINE STYLE FORCE */}
                                    <div className="mt-8 md:mt-12">
                                        <Section title="CORE INFORMATION" defaultExpanded={true}>
                                            <div className="pt-2">
                                                <DetailItem label="Year" value={artwork.year} />
                                                <DetailItem label="Medium" value={artwork.medium} />
                                                <DetailItem
                                                    label="Dimensions"
                                                    value={formatDimensions(artwork)}
                                                />
                                                <DetailItem label="Category" value={artwork.category} />
                                                <DetailItem label="Location" value={(artwork as any).location} />
                                            </div>
                                        </Section>
                                    </div>

                                    {/* Provenance & History */}
                                    <div className="mt-6 md:mt-10">
                                        <Section title="PROVENANCE & HISTORY" defaultExpanded={true}>
                                            <div className="pt-2">
                                                {artwork.description && (
                                                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <Label>Description</Label>
                                                        <p
                                                            className="text-black font-light leading-relaxed mb-0"
                                                            style={{ fontSize: '15px', fontWeight: 300 }}
                                                        >
                                                            {artwork.description}
                                                        </p>
                                                    </div>
                                                )}
                                                {artwork.notes ? (
                                                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <Label>Notes</Label>
                                                        <p
                                                            className="text-black font-light leading-relaxed whitespace-pre-wrap mb-0"
                                                            style={{ fontSize: '15px', fontWeight: 300 }}
                                                        >
                                                            {artwork.notes}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <p className="text-[13px] text-gray-300 italic font-sans">
                                                            No provenance notes available.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </Section>
                                    </div>

                                    {/* Financials & Valuation */}
                                    <div className="mt-6 md:mt-10">
                                        <Section title="FINANCIALS & VALUATION" defaultExpanded={false}>
                                            <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 md:p-6 rounded-sm border border-gray-100 pt-6">
                                                <div className="flex flex-col gap-1">
                                                    <SmallLabel>Appraisal Value</SmallLabel>
                                                    <div className="font-serif text-base text-neutral-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none">
                                                        {artwork.appraisalValue || '—'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <SmallLabel>Purchase Price</SmallLabel>
                                                    <div className="font-serif text-base text-neutral-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none">
                                                        {artwork.purchasePrice || '—'}
                                                    </div>
                                                </div>
                                                {(artwork as any).insuranceValue && (
                                                    <div className="col-span-2 pt-4 border-t border-gray-200/50 flex flex-col gap-1">
                                                        <SmallLabel>Insurance Value</SmallLabel>
                                                        <div className="font-serif text-base text-neutral-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none">
                                                            {(artwork as any).insuranceValue}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Section>
                                    </div>

                                </div>

                                {/* Action Bar - Centered at Bottom with Strict Spacing -- INLINE STYLE FORCE */}
                                <div className="flex justify-center items-center w-full mt-10 md:mt-16 pb-6 md:pb-10">
                                    <button
                                        onClick={onClose}
                                        className="text-[10px] tracking-[0.3em] font-sans text-gray-500 hover:text-black transition-colors uppercase"
                                    >
                                        Close View
                                    </button>

                                    {canEdit && (
                                        <>
                                            <span className="text-black opacity-20 font-light text-[10px] mx-4 md:mx-8">|</span>
                                            <button
                                                onClick={() => {
                                                    if (onEdit) onEdit();
                                                }}
                                                className="text-[10px] tracking-[0.3em] font-sans text-gray-500 hover:text-black transition-colors uppercase"
                                            >
                                                Edit Artwork
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* LIGHTBOX OVERLAY */}
            {isLightboxOpen && images.length > 0 && createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center cursor-default animate-in fade-in duration-300"
                    style={{ zIndex: 99999, backgroundColor: '#000000' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(false);
                    }}
                >
                    <button
                        className="absolute top-10 right-10 z-[100000] p-4 group flex flex-col items-center gap-2 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLightboxOpen(false);
                        }}
                    >
                        <XMarkIcon
                            className="w-8 h-8 text-white/50 group-hover:text-white transition-colors duration-300 stroke-[1.5]"
                        />
                        <span
                            className={`font-sans text-[9px] uppercase tracking-[0.4em] text-gray-400 group-hover:text-white transition-colors duration-300 ${showCaption ? 'opacity-100' : 'opacity-0'}`}
                        >
                            Close
                        </span>
                    </button>

                    {/* Nav mapping */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 z-[100000] p-4 group text-white/50 hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeImageIndex > 0) {
                                        setActiveImageIndex((prev) => prev - 1);
                                    }
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-16 md:h-16">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button
                                className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-[100000] p-4 group flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeImageIndex === images.length - 1) {
                                        setShowNoMoreImages(true);
                                        setTimeout(() => setShowNoMoreImages(false), 2000);
                                    } else {
                                        setActiveImageIndex((prev) => prev + 1);
                                    }
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-16 md:h-16">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                                <span className={`absolute top-full mt-2 font-sans text-[9px] uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap transition-opacity duration-300 ${showNoMoreImages ? 'opacity-100' : 'opacity-0'}`}>
                                    No More Images
                                </span>
                            </button>
                        </>
                    )}

                    <div
                        className="relative flex items-center justify-center pointer-events-none w-full h-full"
                        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={getValidImageUrl(images[activeImageIndex])!}
                            alt={artwork.title}
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// --- Helper Components ---

function Section({ title, children, defaultExpanded = false }: { title: string, children: React.ReactNode, defaultExpanded?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // UNIFIED STYLE with Labels (11px, 0.5em tracking)
    return (
        <div className="border-b border-gray-100 pb-2 md:pb-3 last:border-0">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center mb-4 group py-1 relative"
            >
                <h3
                    className="font-sans font-medium uppercase text-left group-hover:text-black transition-colors"
                    style={{
                        fontSize: '11px',
                        letterSpacing: '0.4em',
                        color: '#9CA3AF'
                    }}
                >
                    {title}
                </h3>
                <div className="absolute right-0 text-gray-400 group-hover:text-black transition-colors">
                    {isExpanded ? (
                        <MinusIcon className="w-3 h-3 stroke-[1.5]" />
                    ) : (
                        <PlusIcon className="w-3 h-3 stroke-[1.5]" />
                    )}
                </div>
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {children}
            </div>
        </div>
    );
}

// Strict Refactor: Wrapper for Metadata Rows with Inline Styles for gap/margin
function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Label>{label}</Label>
            <span
                className="text-black font-light leading-relaxed"
                style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.625, color: '#000000' }}
            >
                {value}
            </span>
        </div>
    );
}

// Strict Refactor: 11px Uppercase Tracking-0.5em
function Label({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="font-sans uppercase block mb-1"
            style={{
                fontSize: '11px', // Increased per request ("touch bigger")
                textTransform: 'uppercase',
                letterSpacing: '0.5em',
                color: '#9CA3AF',
                fontWeight: 500
            }}
        >
            {children}
        </span>
    );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="font-sans uppercase font-medium text-[7px] tracking-[0.1em] text-gray-400 block mb-0.5"
        >
            {children}
        </span>
    );
}

function formatDimensions(artwork: Artwork): string {
    const parts = [];
    if (artwork.height) parts.push(`H: ${artwork.height}`);
    if (artwork.width) parts.push(`W: ${artwork.width}`);
    if (artwork.depth) parts.push(`D: ${artwork.depth}`);
    return parts.length > 0 ? parts.join('  ×  ') : '—';
}
