'use client';

import { createArtwork } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Artwork } from '@prisma/client';
import { createPortal } from 'react-dom';
import { getValidImageUrl } from '@/utils/imageUtils';

export default function ArtworkCreator({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState<string[]>(['', '', '', '', '']);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const updateImage = (index: number, url: string) => {
        const newImages = [...images];
        newImages[index] = url;
        setImages(newImages);
    };

    const hasInvalidImage = images.some(img => img && !getValidImageUrl(img));

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (images[activeImageIndex] && getValidImageUrl(images[activeImageIndex])) {
            const confirmOverwrite = window.confirm("This will delete the existing image. Would you like to continue?");
            if (!confirmOverwrite) {
                if (e.target) e.target.value = ''; // Reset input
                return;
            }
        }

        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || 'Upload failed');
            }
            
            const blob = await response.json();
            updateImage(activeImageIndex, blob.url);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(`Failed to upload image. ${error.message}`);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };

    const handleSave = async (formData: FormData) => {
        setIsSaving(true);
        try {
            await createArtwork(formData);
            router.refresh(); // Refresh list to show new item
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to create artwork');
        } finally {
            setIsSaving(false);
        }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" style={{ zIndex: 100000 }}>
            {/* Modal Container */}
            <div
                className="bg-white rounded-sm shadow-2xl flex flex-col relative h-[85vh] overflow-hidden"
                style={{ width: '1200px', maxWidth: '95vw' }}
            >
                {/* Header Actions (Top Corners) */}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
                    <div /> {/* Spacer for Left Side */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <form action={handleSave} className="grid grid-cols-1 md:grid-cols-5 flex-1 h-full overflow-hidden relative">

                    {/* LEFT COLUMN: Data Form (60%) -> 3 cols */}
                    <div className="md:col-span-3 flex flex-col h-full border-b md:border-b-0 md:border-r border-neutral-100 bg-white relative z-10 min-w-0">
                        <div className="flex-1 overflow-y-auto px-10 py-16 md:px-16 custom-scrollbar">

                            {/* Header Title inside Form */}
                            <h2 className="font-serif text-3xl text-neutral-900 mb-12 text-center">Add Archive Record</h2>

                            <div className="space-y-12">

                                {/* Section 1: Provenance */}
                                <section>
                                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-6 border-b border-neutral-100 pb-2">Provenance</h3>
                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Title of Work <span className="text-red-500">*</span></label>
                                            <AutoResizeTextarea
                                                name="title"
                                                className="w-full font-serif text-xl py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent placeholder-neutral-300 resize-none overflow-hidden"
                                                placeholder="Untitled"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Artist Name <span className="text-red-500">*</span></label>
                                                <AutoResizeTextarea
                                                    name="artist"
                                                    className="w-full font-serif text-lg py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden"
                                                    placeholder="Artist Name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Creation Year</label>
                                                <AutoResizeTextarea
                                                    name="year"
                                                    className="w-full font-serif text-lg py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden"
                                                    placeholder="YYYY"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Attributes */}
                                <section>
                                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-6 border-b border-neutral-100 pb-2">Attributes</h3>
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Category</label>
                                                <AutoResizeTextarea
                                                    name="category"
                                                    className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden"
                                                    placeholder="Painting..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Medium</label>
                                                <AutoResizeTextarea
                                                    name="medium"
                                                    className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden"
                                                    placeholder="Oil on canvas..."
                                                />
                                            </div>
                                        </div>

                                        {/* Dimensions */}
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Height (in)</label>
                                                <AutoResizeTextarea name="height" className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Width (in)</label>
                                                <AutoResizeTextarea name="width" className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Depth (in)</label>
                                                <AutoResizeTextarea name="depth" className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent resize-none overflow-hidden" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Curatorial Notes</label>
                                            <AutoResizeTextarea
                                                name="notes"
                                                className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent min-h-[80px] resize-none overflow-hidden"
                                                placeholder="Provenance, description..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 3: Private Data */}
                                <section>
                                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-6 border-b border-neutral-100 pb-2">Private Data (Financials)</h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Appraisal Value</label>
                                            <input
                                                name="appraisalValue"
                                                className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent text-emerald-700"
                                                placeholder="$0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-sans text-neutral-500 mb-1 tracking-wider">Purchase Price</label>
                                            <input
                                                name="purchasePrice"
                                                className="w-full font-serif text-base py-2 border-b border-neutral-200 focus:border-neutral-900 outline-none transition-colors bg-transparent text-neutral-600"
                                                placeholder="$0.00"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Action Bar (Sticky Bottom) */}
                        <div className="p-6 border-t border-neutral-100 flex justify-center bg-white z-10 shrink-0">
                            <button
                                disabled={isSaving || isUploading || hasInvalidImage}
                                type="submit"
                                className="bg-neutral-900 text-white px-12 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Creating...' : isUploading ? 'Uploading Image...' : 'Create Record'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Image Visual (40%) -> 2 cols */}
                    <div className="md:col-span-2 bg-neutral-50 flex flex-col items-center justify-center p-8 border-l border-neutral-100 relative shrink-0 h-[300px] md:h-auto">
                        <input type="hidden" name="imagePath" value={images[0]} />
                        <input type="hidden" name="imagePath2" value={images[1]} />
                        <input type="hidden" name="imagePath3" value={images[2]} />
                        <input type="hidden" name="imagePath4" value={images[3]} />
                        <input type="hidden" name="imagePath5" value={images[4]} />

                        <div className="relative w-full h-full max-h-[60vh] shadow-xl bg-white p-4 flex items-center justify-center">
                            {images[activeImageIndex] && getValidImageUrl(images[activeImageIndex]) ? (
                                <Image
                                    src={getValidImageUrl(images[activeImageIndex])!}
                                    alt="Preview"
                                    fill
                                    className="object-contain p-2"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-neutral-300 font-serif italic text-lg text-center font-sans uppercase tracking-widest text-[9px] text-gray-400">No Visual</span>
                            )}
                        </div>

                        {/* Thumbnails row */}
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full justify-center">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-16 h-16 shrink-0 border transition-colors ${idx === activeImageIndex ? 'border-neutral-900 border' : 'border-transparent hover:border-neutral-300'}`}
                                >
                                    {img && getValidImageUrl(img) ? (
                                        <Image src={getValidImageUrl(img)!} alt={`Thumb ${idx + 1}`} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* URL Input below image */}
                        <div className="mt-4 w-full max-w-sm hidden md:block">
                            <AutoResizeTextarea
                                name={`imagePath_display_${activeImageIndex}`}
                                value={images[activeImageIndex]}
                                onChange={(e: any) => updateImage(activeImageIndex, e.target.value)}
                                className={`w-full text-center font-sans text-[9px] uppercase tracking-[0.4em] text-gray-400 py-2 border-b outline-none bg-transparent resize-none overflow-hidden ${images[activeImageIndex] && !getValidImageUrl(images[activeImageIndex])
                                    ? 'border-red-300 text-red-500 focus:border-red-500'
                                    : 'border-neutral-200 focus:border-neutral-900'
                                    }`}
                                placeholder={`SOURCE IMAGE URL`}
                            />
                            {images[activeImageIndex] && !getValidImageUrl(images[activeImageIndex]) && (
                                <p className="text-[10px] text-red-500 mt-2 text-center font-bold uppercase tracking-widest">
                                    Unsupported File Format (.jpg, .png only)
                                </p>
                            )}

                            <div className="mt-3 flex justify-center w-full">
                                <label className={`cursor-pointer border border-neutral-200 px-4 py-1 flex items-center justify-center transition-colors hover:border-black hover:text-black font-sans text-[9px] uppercase tracking-[0.4em] ${isUploading ? 'opacity-50 text-gray-400' : 'text-gray-500'}`}>
                                    {isUploading ? 'UPLOADING...' : 'UPLOAD FILE'}
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/webp" 
                                        className="hidden" 
                                        onChange={handleUpload}
                                        disabled={isUploading}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Mobile Only URL Input */}
                        <div className="md:hidden w-full mt-4">
                            <input
                                name={`imagePath_mobile_${activeImageIndex}`}
                                value={images[activeImageIndex]}
                                onChange={(e) => updateImage(activeImageIndex, e.target.value)}
                                className={`w-full text-center font-sans text-[10px] py-1 border-b outline-none bg-transparent ${images[activeImageIndex] && !getValidImageUrl(images[activeImageIndex])
                                    ? 'border-red-300 text-red-500'
                                    : 'border-neutral-200 text-neutral-500'
                                    }`}
                                placeholder={`Edit Image URL (${activeImageIndex + 1}/5)...`}
                            />
                            {images[activeImageIndex] && !getValidImageUrl(images[activeImageIndex]) && (
                                <p className="text-[10px] text-red-500 mt-1 text-center font-bold uppercase tracking-widest">
                                    Unsupported File Format
                                </p>
                            )}
                        </div>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
}

function AutoResizeTextarea({ className, ...props }: any) {
    const adjustHeight = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto'; // Reset to recalculate
        el.style.height = el.scrollHeight + 'px';
    };

    return (
        <textarea
            {...props}
            className={className}
            rows={1}
            onInput={(e) => adjustHeight(e.currentTarget)}
        // No ref needed for creation mostly as empty, but good practice
        />
    );
}
