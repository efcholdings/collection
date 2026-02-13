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
    isAdmin?: boolean;
}

export default function ArtworkDetailPanel({ artwork, onClose, onEdit, isAdmin = false }: ArtworkDetailPanelProps) {
    const [mounted, setMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
        width: '95vw',
        height: '85vh',
        maxHeight: '85vh',
    };

    const leftPanelStyle: React.CSSProperties = isDesktop ? {
        width: '55%', // Reduced slightly from 60%
        height: '100%',
        padding: 0,
    } : {
        width: '100%',
        position: 'relative',
        height: '40vh',
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
        paddingTop: '24px',
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
                            className="relative bg-neutral-50 flex items-center justify-center cursor-zoom-in group"
                            style={leftPanelStyle}
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            {getValidImageUrl(artwork.imagePath) ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getValidImageUrl(artwork.imagePath)!}
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
                                    <h1
                                        className="font-serif leading-tight font-light mb-2 md:mb-3"
                                        style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '36px' }} // Increased Title Size
                                    >
                                        {artwork.title}
                                    </h1>
                                    <p
                                        className="font-light text-gray-500"
                                        style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px' }} // Increased Artist Size
                                    >
                                        {artwork.artist}
                                    </p>
                                </div>

                                {/* SECTIONS */}
                                <div className="flex flex-col">
                                    {/* Core Info - Strict Header Separation (mt-12 / 48px) -- INLINE STYLE FORCE */}
                                    <div style={{ marginTop: '48px' }}>
                                        <Section title="CORE INFORMATION" defaultExpanded={true}>
                                            <div className="pt-2">
                                                <DetailItem label="Year" value={artwork.year} />
                                                <DetailItem label="Medium" value={artwork.medium} />
                                                <DetailItem
                                                    label="Dimensions"
                                                    value={formatDimensions(artwork)}
                                                />
                                                <DetailItem label="Category" value={artwork.category} />
                                                <DetailItem label="Location" value={artwork.location} />
                                            </div>
                                        </Section>
                                    </div>

                                    {/* Provenance & History */}
                                    <div style={{ marginTop: '40px' }}>
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
                                    <div style={{ marginTop: '40px' }}>
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
                                                {artwork.insuranceValue && (
                                                    <div className="col-span-2 pt-4 border-t border-gray-200/50 flex flex-col gap-1">
                                                        <SmallLabel>Insurance Value</SmallLabel>
                                                        <div className="font-serif text-base text-neutral-900 blur-[4px] hover:blur-none transition-all duration-300 cursor-help select-none">
                                                            {artwork.insuranceValue}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Section>
                                    </div>

                                </div>

                                {/* Action Bar - Centered at Bottom with Strict Spacing -- INLINE STYLE FORCE */}
                                <div
                                    className="flex justify-center items-center w-full"
                                    style={{ marginTop: '64px', paddingBottom: '40px' }}
                                >
                                    <button
                                        onClick={onClose}
                                        className="text-[10px] tracking-[0.3em] font-sans text-gray-500 hover:text-black transition-colors uppercase"
                                    >
                                        Close View
                                    </button>

                                    {isAdmin && (
                                        <>
                                            <span
                                                className="text-black opacity-20 font-light text-[10px]"
                                                style={{ margin: '0 32px' }}
                                            >|</span>
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
            {isLightboxOpen && getValidImageUrl(artwork.imagePath) && createPortal(
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
                            className="w-8 h-8 text-white group-hover:opacity-80 transition-opacity duration-300 stroke-[1.5]"
                            style={{ color: 'white' }}
                        />
                        <span
                            className="text-[9px] uppercase tracking-[0.4em] text-white group-hover:opacity-80 transition-opacity duration-300 font-medium"
                            style={{ color: 'white' }}
                        >
                            Close
                        </span>
                    </button>

                    <div
                        className="relative flex items-center justify-center pointer-events-none w-full h-full"
                        style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={getValidImageUrl(artwork.imagePath)!}
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
