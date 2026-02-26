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
        <tr
            className="group border-b border-gray-50 hover:bg-neutral-50 transition-colors"
        >
            {/* Column 1: Artwork (Thumb + Title + Artist) - 25% */}
            <td className="p-4 py-12 align-middle" style={{ width: '25%', overflow: 'hidden' }}>
                <div className="flex items-center gap-8 overflow-hidden h-full">
                    {/* Thumbnail - 80px Fixed Width */}
                    <div
                        onClick={() => onSelect(artwork)}
                        className="relative h-20 w-20 bg-neutral-100 overflow-hidden flex-shrink-0 cursor-pointer"
                        style={{ width: '80px', height: '80px', minWidth: '80px' }}
                    >
                        {validImage ? (
                            <Image
                                src={validImage}
                                alt={artwork.title || 'Artwork'}
                                width={80}
                                height={80}
                                className="object-contain w-full h-full"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-neutral-300">
                                <span className="text-[9px] uppercase tracking-wider">No Img</span>
                            </div>
                        )}
                    </div>

                    {/* Text Data - Relaxed Leading */}
                    <div className="flex flex-col justify-center overflow-hidden gap-4 flex-1 h-full min-w-0">
                        <span
                            onClick={() => onSelect(artwork)}
                            className="font-serif text-[15px] text-black truncate cursor-pointer hover:text-neutral-500 transition-colors leading-loose block"
                            title={artwork.title}
                        >
                            {artwork.title}
                        </span>
                        <span className="font-serif text-[13px] text-neutral-500 italic truncate leading-loose block">
                            {artwork.artist}
                        </span>
                        {/* ID */}
                        <span className="text-[10px] font-sans text-neutral-300 select-all tracking-wide truncate block mt-0.5 leading-relaxed">
                            {artwork.originalId}
                        </span>
                    </div>
                </div>
            </td>

            {/* Column 2: Medium - 20% */}
            <td className="p-4 py-12 align-middle" style={{ width: '20%', maxWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <span className="text-[13px] font-sans font-light text-neutral-800 leading-loose block truncate" title={artwork.medium || ''}>
                    {artwork.medium || <span className="text-neutral-300">—</span>}
                </span>
            </td>

            {/* Column 3: Dimensions - 17% */}
            <td className="p-4 py-12 align-middle" style={{ width: '17%', maxWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <span className="text-[13px] font-sans font-light text-neutral-800 leading-loose block truncate" title={formatDimensions(artwork)}>
                    {formatDimensions(artwork) || <span className="text-neutral-300">—</span>}
                </span>
            </td>

            {/* Column 4: Category - 17% */}
            <td className="p-4 py-12 align-middle text-center" style={{ width: '17%', maxWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <div className="inline-block max-w-full truncate">
                    <span className="text-[10px] font-sans text-neutral-500 uppercase tracking-[0.1em] bg-neutral-50 px-3 py-1.5 rounded-sm mx-auto tracking-wide block truncate border border-neutral-100">
                        {artwork.category || <span className="text-neutral-300">–</span>}
                    </span>
                </div>
            </td>

            {/* Column 5: Financials (Admin) - 21% */}
            {isAdmin ? (
                <td className="pl-4 pr-0 py-12 align-middle text-right" style={{ width: '21%', maxWidth: 0, overflow: 'hidden' }}>
                    <div className="flex flex-col items-end justify-center gap-2 w-full">
                        {/* Appraisal */}
                        <div className="flex items-center gap-4 w-full justify-end">
                            <span className="text-[9px] text-neutral-300 uppercase tracking-[0.2em] flex-shrink-0">Est</span>
                            <span className="text-[13px] font-sans font-light text-black min-w-[70px] text-right truncate tabular-nums">
                                {artwork.appraisalValue || <span className="text-neutral-300">–</span>}
                            </span>
                        </div>
                        {/* Purchase */}
                        <div className="flex items-center gap-4 w-full justify-end">
                            <span className="text-[9px] text-neutral-300 uppercase tracking-[0.2em] flex-shrink-0">Paid</span>
                            <span className="text-[13px] font-sans font-light text-black min-w-[70px] text-right truncate tabular-nums">
                                {artwork.purchasePrice || <span className="text-neutral-300">–</span>}
                            </span>
                        </div>
                    </div>
                </td>
            ) : <td style={{ width: '21%' }} />}
        </tr>
    );
}

function formatDimensions(artwork: Artwork): string {
    const parts = [];
    if (artwork.height) parts.push(`H: ${artwork.height}`);
    if (artwork.width) parts.push(`W: ${artwork.width}`);
    if (artwork.depth) parts.push(`D: ${artwork.depth}`);
    return parts.length > 0 ? parts.join(' × ') : '—';
}
