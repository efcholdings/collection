'use client';

import { Artwork } from '@prisma/client';
import { XMarkIcon } from '@heroicons/react/24/outline'; // Need to install heroicons or use text
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { getValidImageUrl } from '@/utils/imageUtils';

interface ArtworkDetailPanelProps {
    artwork: Artwork | null;
    onClose: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
}

// removed updateArtwork import
import { deleteArtwork } from '@/actions/admin';

export default function ArtworkDetailPanel({ artwork, onClose, onEdit, isAdmin = false }: ArtworkDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'artist' | 'financials'>('general');
    const [isDeleting, setIsDeleting] = useState(false);
    // Removed isEditing state
    const [previewImage, setPreviewImage] = useState(artwork?.imagePath); // State for live preview
    const router = useRouter();

    useEffect(() => {
        setPreviewImage(artwork?.imagePath);
    }, [artwork]);

    if (!artwork) return null;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this artwork? This cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await deleteArtwork(artwork.id);
            onClose();
            router.refresh();
        } catch (e) {
            console.error(e);
            alert('Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    // Removed handleSave and isEditing block


    if (typeof window === 'undefined') return null;

    return createPortal(
        <>
            {/* Mobile Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[499] md:hidden backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out border-l border-neutral-100 flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-neutral-100 flex justify-between items-start">
                    <div className="flex-1 pr-4">
                        <h2 className="font-serif text-3xl text-neutral-900 leading-tight">
                            {artwork.title}
                        </h2>
                        {isAdmin && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEdit) onEdit();
                                }}
                                className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-3 hover:underline block"
                            >
                                Edit Record
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Image Banner */}
                <div className="relative w-full h-64 bg-neutral-100 flex-shrink-0">
                    {getValidImageUrl(artwork.imagePath) ? (
                        <Image
                            src={getValidImageUrl(artwork.imagePath)!}
                            alt={artwork.title}
                            fill
                            className="object-contain p-4"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-neutral-400 font-serif italic">
                            No Preview Available
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-100">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'general' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('artist')}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'artist' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Artist
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'financials' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Financials
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <DetailRow label="Date" value={artwork.year} />
                            <DetailRow label="Medium" value={artwork.medium} />
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">Dimensions</label>
                                <p className="text-neutral-800 font-light">
                                    {artwork.height && `H: ${artwork.height}`}
                                    {artwork.width && ` W: ${artwork.width}`}
                                    {artwork.depth && ` D: ${artwork.depth}`}
                                    {!artwork.height && !artwork.width && !artwork.depth && '—'}
                                </p>
                            </div>
                            <DetailRow label="Category" value={artwork.category} />
                            {artwork.notes && (
                                <div className="pt-4 border-t border-neutral-50">
                                    <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Notes</label>
                                    <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{artwork.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'artist' && (
                        <div className="space-y-6">
                            <div className="bg-neutral-50 p-6 rounded-sm">
                                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-2">Full Name</label>
                                <p className="text-xl font-serif text-neutral-900">{artwork.artist}</p>
                            </div>
                            {/* Placeholder for bio or additional artist stats if we had them */}
                            <p className="text-sm text-neutral-500 italic">
                                All works by {artwork.artist} are indexed under this profile.
                            </p>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded flex flex-col items-center justify-center text-center space-y-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Appraisal Value</span>
                                <span className="text-2xl font-serif text-neutral-900 blur-sm hover:blur-none transition-all cursor-help" title="Click to reveal">
                                    {artwork.appraisalValue || "$ —"}
                                </span>
                            </div>

                            <div className="p-4 bg-gray-50 border border-gray-100 rounded flex flex-col items-center justify-center text-center space-y-2">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Purchase Price</span>
                                <span className="text-xl font-mono text-neutral-600 blur-sm hover:blur-none transition-all cursor-help">
                                    {artwork.purchasePrice || "$ —"}
                                </span>
                            </div>

                            <p className="text-[10px] text-neutral-400 text-center mt-8">
                                Confidential • Internal Use Only
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>,
        document.body
    );
}

function DetailRow({ label, value }: { label: string, value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">{label}</label>
            <p className="text-neutral-900 font-light">{value}</p>
        </div>
    );
}
