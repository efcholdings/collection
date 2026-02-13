'use client';

import { updateArtwork, deleteArtwork } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Artwork } from '@prisma/client';
import { createPortal } from 'react-dom';
import { getValidImageUrl } from '@/utils/imageUtils';

interface ArtworkEditorProps {
    artwork: Artwork;
    onClose: () => void;
}

export default function ArtworkEditor({ artwork, onClose }: ArtworkEditorProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewImage, setPreviewImage] = useState(getValidImageUrl(artwork.imagePath) || '');
    const [mounted, setMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Kill Modal Scroll: Prevent body scroll
        document.body.style.overflow = 'hidden';

        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('resize', checkDesktop);
        };
    }, []);

    // Reset state when artwork changes
    useEffect(() => {
        setPreviewImage(getValidImageUrl(artwork.imagePath) || '');
    }, [artwork]);

    const handleSave = async (formData: FormData) => {
        setIsSaving(true);
        try {
            await updateArtwork(artwork.id, formData);
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to update artwork');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        // Dangerous Action Styling: Confirmation required
        if (!confirm('DANGER: You are about to permanently delete this artwork record.\n\nThis action cannot be undone.\n\nAre you sure you want to proceed?')) return;

        setIsDeleting(true);
        try {
            await deleteArtwork(artwork.id);
            router.refresh();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!mounted) return null;

    // --- Conditional Styles (Matching Detail Panel REFACTORED) ---

    const containerStyle: React.CSSProperties = isDesktop ? {
        display: 'flex',
        flexDirection: 'row',
        width: '90vw',
        maxWidth: '1280px', // MATCHED DETAIL PANEL
        height: '85vh',
        // Kill Modal Scroll: overflow hidden on container
        overflow: 'hidden',
        maxHeight: 'none',
    } : {
        display: 'flex',
        flexDirection: 'column',
        width: '95vw',
        height: '85vh',
        maxHeight: '85vh',
        overflow: 'hidden',
    };

    // Swapped: Image is LEFT (55%)
    const leftPanelStyle: React.CSSProperties = isDesktop ? {
        width: '55%', // MATCHED DETAIL PANEL
        height: '100%',
        padding: 0,
        backgroundColor: '#fafafa'
    } : {
        width: '100%',
        position: 'relative',
        height: '40vh',
        flexShrink: 0,
        backgroundColor: '#fafafa'
    };

    // Form is RIGHT (45%) with PADDING
    const rightPanelStyle: React.CSSProperties = isDesktop ? {
        width: '45%', // MATCHED DETAIL PANEL
        height: '100%',
        borderLeft: '1px solid #F5F5F5',
        paddingTop: '40px',
        paddingLeft: '40px', // MATCHED DETAIL PANEL SPACING
    } : {
        width: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '24px',
    };

    // Refined Input Padding: pb-2
    // Input Styling (The Archival Look - 15px Light)
    const inputBaseClass = "w-full font-sans text-[15px] font-light py-1 pb-2 border-b border-neutral-200 outline-none bg-transparent overflow-hidden transition-colors focus:border-black placeholder-neutral-300 text-black";

    return createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center p-2 md:p-0"
            style={{ zIndex: 2147483647 }}
        >
            {/* Blurred Backdrop */}
            <div
                className="absolute inset-0 transition-opacity duration-300 bg-white/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative bg-white shadow-2xl rounded-sm animate-in fade-in zoom-in-95 duration-300 border border-neutral-100"
                style={containerStyle}
            >

                {/* LEFT PANEL: Visuals & Image Input */}
                <div
                    className="relative flex flex-col items-center justify-center"
                    style={leftPanelStyle}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-8 pb-20">
                        {previewImage ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={previewImage}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <span className="text-neutral-300 font-serif italic text-lg">No Visual Reference</span>
                        )}
                    </div>

                    {/* Image URL Input - Bottom Overlay (Source Image URL) */}
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-neutral-50/90 border-t border-neutral-100 backdrop-blur-sm">
                        <label className="block text-[9px] uppercase font-sans text-gray-300 mb-2 text-left tracking-[0.4em]">Source Image URL</label>
                        <AutoResizeTextarea
                            name="imagePath"
                            defaultValue={artwork.imagePath || ''}
                            onChange={(e: any) => setPreviewImage(e.target.value)}
                            className={`w-full text-left font-sans text-[11px] py-1 pb-2 border-b outline-none bg-transparent overflow-hidden ${previewImage && !getValidImageUrl(previewImage)
                                ? 'border-red-300 text-red-500'
                                : 'border-neutral-200 text-gray-400 focus:border-black'
                                }`}
                            placeholder="https://..."
                            minRows={1}
                        />
                    </div>
                </div>

                {/* RIGHT PANEL: Edit Form */}
                <form
                    action={handleSave}
                    className="bg-white flex flex-col h-full"
                    style={rightPanelStyle}
                >
                    {/* Hidden Input to capture Image URL from Left Panel */}
                    <input type="hidden" name="imagePath" value={previewImage} />


                    {/* Header: Title */}
                    <div className="px-6 md:px-0 mb-0 mt-2 md:mt-0 shrink-0">
                        {/* Axis Check: Strict Left Alignment */}
                        {/* Title Input matching 36px Playfair */}
                        <AutoResizeTextarea
                            name="title"
                            defaultValue={artwork.title}
                            className="w-full font-serif leading-tight text-neutral-900 bg-transparent border-b border-transparent focus:border-neutral-200 outline-none overflow-hidden placeholder-gray-300 text-left mb-2 md:mb-3"
                            style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '36px' }}
                            placeholder="Artwork Title"
                            required
                            minRows={1}
                        />

                        {/* Artist Name Input matching 24px Playfair Gray-500 */}
                        <AutoResizeTextarea
                            name="artist"
                            defaultValue={artwork.artist}
                            className="w-full font-serif font-light text-gray-500 bg-transparent border-b border-transparent focus:border-neutral-200 outline-none overflow-hidden placeholder-gray-300 text-left"
                            style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px' }}
                            placeholder="Artist Name"
                            required
                            minRows={1}
                        />
                    </div>

                    {/* Scrollable Form Content */}
                    <div
                        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent px-6 md:px-0 pb-6 md:pb-8"
                        style={{ overflowY: 'auto', paddingRight: '48px' }} // Standard padding right for scrollbar
                    >
                        {/* Core Info - Vertical Rhythm: +48px space (MATCHED DETAIL PANEL) */}
                        <div style={{ marginTop: '48px' }}>
                            <SectionHeader title="CORE INFORMATION" />
                            {/* Flex Stack - Gap 24px (MATCHED DETAIL PANEL ROW SPACING) */}
                            <div className="flex flex-col gap-6 pt-2">
                                {/* Title is now in header area, removing duplication if previously there */}

                                <div className="grid grid-cols-2 gap-6">
                                    <InputGroup label="Year">
                                        <AutoResizeTextarea name="year" defaultValue={artwork.year || ''} className={inputBaseClass} minRows={1} />
                                    </InputGroup>
                                    <InputGroup label="Medium">
                                        {/* Dynamic Textarea Expansion: Medium usually needs more space */}
                                        <AutoResizeTextarea name="medium" defaultValue={artwork.medium || ''} className={inputBaseClass} minRows={2} />
                                    </InputGroup>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <InputGroup label="Height">
                                        <AutoResizeTextarea name="height" defaultValue={artwork.height || ''} className={inputBaseClass} minRows={1} />
                                    </InputGroup>
                                    <InputGroup label="Width">
                                        <AutoResizeTextarea name="width" defaultValue={artwork.width || ''} className={inputBaseClass} minRows={1} />
                                    </InputGroup>
                                    <InputGroup label="Depth">
                                        <AutoResizeTextarea name="depth" defaultValue={artwork.depth || ''} className={inputBaseClass} minRows={1} />
                                    </InputGroup>
                                </div>
                                <InputGroup label="Category">
                                    <AutoResizeTextarea name="category" defaultValue={artwork.category || ''} className={inputBaseClass} minRows={1} />
                                </InputGroup>
                                <InputGroup label="Location">
                                    <AutoResizeTextarea name="location" defaultValue={artwork.location || ''} className={inputBaseClass} minRows={1} />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Provenance */}
                        <div style={{ marginTop: '40px' }}>
                            <SectionHeader title="PROVENANCE & HISTORY" />
                            <div className="flex flex-col gap-6 pt-2">
                                <InputGroup label="Description">
                                    {/* Dynamic Textarea Expansion: min 4 rows */}
                                    <AutoResizeTextarea
                                        name="description"
                                        defaultValue={artwork.description || ''}
                                        className={inputBaseClass}
                                        minRows={4}
                                    />
                                </InputGroup>
                                <InputGroup label="Notes">
                                    {/* Dynamic Textarea Expansion: min 4 rows */}
                                    <AutoResizeTextarea
                                        name="notes"
                                        defaultValue={artwork.notes || ''}
                                        className={inputBaseClass}
                                        minRows={4}
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Financials */}
                        <div style={{ marginTop: '40px' }}>
                            <SectionHeader title="FINANCIALS & VALUATION" />
                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <InputGroup label="Appraisal Value">
                                    <input name="appraisalValue" defaultValue={artwork.appraisalValue || ''} className={inputBaseClass} />
                                </InputGroup>
                                <InputGroup label="Purchase Price">
                                    <input name="purchasePrice" defaultValue={artwork.purchasePrice || ''} className={inputBaseClass} />
                                </InputGroup>
                            </div>
                            <div className="pt-6">
                                <InputGroup label="Insurance Value">
                                    <input name="insuranceValue" defaultValue={artwork.insuranceValue || ''} className={inputBaseClass} />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Spacer for Action Bar Padding */}
                        <div className="h-24 md:h-32" />
                    </div>

                    {/* Footer Actions - BALANCED LAYOUT (Left, Center, Spacer) */}
                    <div
                        className="bg-white flex justify-between items-center shrink-0 border-t border-transparent p-6 md:p-8 md:px-0 relative"
                        style={{ marginTop: 'auto', paddingBottom: '40px' }}
                    >
                        {/* LEFT: Dangerous Action Styling */}
                        <div className="flex-1 flex justify-start">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-[9px] uppercase tracking-[0.2em] text-red-500 hover:text-red-700 transition-colors font-medium border-b border-transparent hover:border-red-700 pb-0.5 whitespace-nowrap"
                                style={{ color: '#ef4444' }} // Soft red
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>

                        {/* CENTER: Action Bar */}
                        <div className="flex-0 flex items-center justify-center whitespace-nowrap mx-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-[10px] tracking-[0.3em] font-sans text-gray-500 hover:text-black transition-colors uppercase"
                            >
                                Cancel
                            </button>

                            <span
                                className="text-black opacity-20 font-light text-[10px]"
                                style={{ margin: '0 32px' }}
                            >|</span>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="text-[10px] tracking-[0.3em] font-sans text-gray-500 hover:text-black transition-colors uppercase disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {/* RIGHT: Spacer to ensure balance */}
                        <div className="flex-1"></div>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}

// --- Helpers ---

// MATCHED DETAIL PANEL HEADER STYLE (11px, 0.4em)
function SectionHeader({ title }: { title: string }) {
    return (
        <h3
            className="font-sans font-medium uppercase text-left mb-6"
            style={{
                fontSize: '11px',
                letterSpacing: '0.4em',
                color: '#9CA3AF'
            }}
        >
            {title}
        </h3>
    );
}

// MATCHED DETAIL PANEL LABEL STYLE (11px, 0.5em)
function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 w-full text-left" style={{ marginBottom: '24px' }}>
            <span
                className="font-sans uppercase font-medium block mb-2"
                style={{
                    fontSize: '11px', // MATCHED DETAIL PANEL
                    textTransform: 'uppercase',
                    letterSpacing: '0.5em',
                    color: '#9CA3AF',
                    fontWeight: 500
                }}
            >
                {label}
            </span>
            {children}
        </div>
    );
}

// Dynamic Textarea Expansion: Force auto height, remove resize
function AutoResizeTextarea({ defaultValue, className, minRows = 1, ...props }: any) {
    const adjustHeight = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto'; // Reset to calculate scrollHeight
        el.style.height = el.scrollHeight + 'px';
    };

    return (
        <textarea
            {...props}
            defaultValue={defaultValue}
            className={`${className} resize-none`} // Remove resize handle
            rows={minRows}
            onInput={(e) => adjustHeight(e.currentTarget)}
            ref={(el) => {
                if (el) adjustHeight(el);
            }}
            style={{ minHeight: `${minRows * 1.5}em`, ...props.style }} // Ensure props.style (font size etc) overrides
        />
    );
}
