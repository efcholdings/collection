import { Artwork } from '@prisma/client';
import Image from 'next/image';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { getValidImageUrl } from '@/utils/imageUtils';

interface ArtworkRowProps {
    artwork: Artwork;
    onSelect: (artwork: Artwork) => void;
    onEdit?: (artwork: Artwork) => void;
    isAdmin?: boolean;
}

export default function ArtworkRow({ artwork, onSelect, onEdit, isAdmin = false }: ArtworkRowProps) {
    const validImage = getValidImageUrl(artwork.imagePath);

    return (
        <div
            className="group relative flex items-center gap-6 p-3 bg-white border border-neutral-100 rounded-lg hover:bg-[#FAFAFA] hover:border-neutral-200 transition-all shadow-sm mb-3"
        >
            {/* Thumbnail - 80px Fixed Width */}
            <div
                onClick={() => onSelect(artwork)}
                className="relative h-20 w-20 bg-neutral-100 overflow-hidden flex-shrink-0 rounded-md cursor-pointer shadow-sm group-hover:shadow-md transition-shadow"
                style={{ width: '80px', height: '80px' }}
            >
                {validImage ? (
                    <Image
                        src={validImage}
                        alt={artwork.title}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-[0.5px] border-gray-200 text-neutral-400">
                        <span className="text-[9px] uppercase font-medium tracking-widest leading-none">No</span>
                        <span className="text-[9px] uppercase font-medium tracking-widest leading-none">Image</span>
                    </div>
                )}
            </div>

            {/* ID - Sans Serif */}
            <div className="w-24 text-xs font-sans font-medium text-neutral-400 select-all flex-shrink-0">
                {artwork.originalId}
            </div>

            {/* Title - Serif */}
            <div
                onClick={() => onSelect(artwork)}
                className="flex-1 font-serif font-medium text-lg text-neutral-900 truncate pr-4 cursor-pointer hover:text-neutral-600 transition-colors"
            >
                {artwork.title}
                <div className="text-xs font-sans text-neutral-400 mt-1 md:hidden">
                    {artwork.artist}
                </div>
            </div>

            {/* Category - Sans Serif (Desktop) */}
            <div className="hidden md:block w-48 text-xs font-sans text-neutral-500 bg-neutral-50 px-2 py-1 rounded-full text-center truncate flex-shrink-0">
                {artwork.category}
            </div>

            {/* Artist - Serif (Desktop) */}
            <div className="hidden md:block w-64 text-sm font-serif text-neutral-600 truncate flex-shrink-0 text-right pr-4">
                {artwork.artist}
            </div>

            {/* Edit Hover Action */}
            {isAdmin && onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(artwork);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md text-indigo-600 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all duration-200 hover:bg-indigo-50 transform md:translate-x-2 md:group-hover:translate-x-0 z-20 border border-neutral-100"
                    title="Edit Artwork"
                >
                    <PencilSquareIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
