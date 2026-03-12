import { Artwork } from '@prisma/client';
import Image from 'next/image';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { getValidImageUrl } from '@/utils/imageUtils';

interface ArtworkRowProps {
    artwork: Artwork;
    onSelect: (artwork: Artwork) => void;
    onEdit?: (artwork: Artwork) => void;
    userRole?: string | null;
}

export default function ArtworkRow({ artwork, onSelect, onEdit, userRole = null }: ArtworkRowProps) {
    const validImage = getValidImageUrl(artwork.imagePath);
    const canViewFinancials = ['EDITOR', 'MANAGER', 'ADMIN'].includes(userRole || '');

    return (
        <div
            className="group border-b border-gray-50 bg-white hover:bg-neutral-50 transition-colors flex flex-col md:flex-row md:items-center py-6 md:py-8 px-4 md:px-0 gap-4 md:gap-0"
        >
            {/* Column 1: Artwork (Thumb + Title + Artist) */}
            <div className="w-full md:w-1/4 flex items-center gap-6 overflow-hidden md:pl-4">
                {/* Thumbnail */}
                <div
                    onClick={() => onSelect(artwork)}
                    className="relative w-16 h-16 md:w-20 md:h-20 bg-neutral-100 overflow-hidden flex-shrink-0 cursor-pointer"
                >
                    {validImage ? (
                        <Image
                            src={validImage}
                            alt={artwork.title || 'Artwork'}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-neutral-300">
                            <span className="text-[8px] md:text-[9px] uppercase tracking-wider">No Img</span>
                        </div>
                    )}
                </div>

                {/* Text Data */}
                <div className="flex flex-col justify-center overflow-hidden gap-1 md:gap-2 flex-1 min-w-0">
                    <span
                        onClick={() => onSelect(artwork)}
                        className="font-serif text-[14px] md:text-[15px] text-black truncate cursor-pointer hover:text-neutral-500 transition-colors leading-tight"
                        title={artwork.title}
                    >
                        {artwork.title}
                    </span>
                    <span className="font-serif text-[12px] md:text-[13px] text-neutral-500 italic truncate leading-tight">
                        {artwork.artist}
                    </span>
                    {/* ID */}
                    <span className="text-[10px] md:text-[10px] font-sans text-neutral-300 select-all tracking-wide truncate block">
                        {artwork.originalId}
                    </span>
                </div>
            </div>

            {/* Sub-Details Wrapper (Mobile Stack / Desktop Inline) */}
            <div className="flex flex-col md:flex-row md:flex-1 md:items-center gap-3 md:gap-0 mt-4 md:mt-0 pl-22 md:pl-0">
                {/* Column 2: Medium */}
                <div className="w-full md:w-1/5 truncate md:px-4">
                    <div className="flex md:hidden text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Medium</div>
                    <span className="text-[12px] md:text-[13px] font-sans font-light text-neutral-800 leading-tight block truncate" title={artwork.medium || ''}>
                        {artwork.medium || <span className="text-neutral-300">—</span>}
                    </span>
                </div>

                {/* Column 3: Dimensions */}
                <div className="w-full md:w-[22.5%] truncate md:px-4">
                    <div className="flex md:hidden text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Dimensions</div>
                    <span className="text-[12px] md:text-[13px] font-sans font-light text-neutral-800 leading-tight block truncate" title={formatDimensions(artwork)}>
                        {formatDimensions(artwork) || <span className="text-neutral-300">—</span>}
                    </span>
                </div>

                {/* Column 4: Category */}
                <div className="w-full md:w-[22.5%] truncate md:px-4 md:text-center">
                    <div className="flex md:hidden text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-1">Category</div>
                    <div className="inline-block max-w-full truncate">
                        <span className="text-[9px] md:text-[10px] font-sans text-neutral-500 uppercase tracking-[0.1em] bg-neutral-50 px-2 md:px-3 py-1 md:py-1.5 rounded-sm md:mx-auto tracking-wide block truncate border border-neutral-100">
                            {artwork.category || <span className="text-neutral-300">–</span>}
                        </span>
                    </div>
                </div>

                {/* Column 5: Financials */}
                {canViewFinancials && (
                    <div className="w-full md:w-[28%] md:pr-4 md:text-right mt-2 md:mt-0">
                        <div className="flex flex-col md:items-end justify-center gap-1 md:gap-2 w-full">
                            {/* Appraisal */}
                            <div className="flex items-center gap-4 md:justify-end w-full">
                                <span className="text-[9px] text-neutral-300 uppercase tracking-[0.2em] w-12 md:w-auto">Est</span>
                                <span className="text-[12px] md:text-[13px] font-sans font-light text-black truncate tabular-nums">
                                    {artwork.appraisalValue || <span className="text-neutral-300">–</span>}
                                </span>
                            </div>
                            
                            {/* Cost */}
                            <div className="flex items-center gap-4 md:justify-end w-full">
                                <span className="text-[9px] text-neutral-300 uppercase tracking-[0.2em] w-12 md:w-auto">Cost</span>
                                <span className="text-[12px] md:text-[13px] font-sans font-light text-black truncate tabular-nums">
                                    {artwork.purchasePrice || <span className="text-neutral-300">–</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Button Configuration */}
            {onEdit && ['EDITOR', 'MANAGER', 'ADMIN'].includes(userRole || '') && (
                <div className="absolute top-6 right-4 md:relative md:top-auto md:right-auto md:ml-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(artwork);
                        }}
                        className="p-2 md:p-3 bg-neutral-50 text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors rounded-sm cursor-pointer ml-auto"
                        title="Edit Artwork"
                    >
                        <PencilSquareIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function formatDimensions(artwork: Artwork): string {
    const parts = [];
    if (artwork.height) parts.push(`H: ${artwork.height}`);
    if (artwork.width) parts.push(`W: ${artwork.width}`);
    if (artwork.depth) parts.push(`D: ${artwork.depth}`);
    return parts.length > 0 ? parts.join(' × ') : '—';
}
