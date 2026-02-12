import Image from 'next/image';
import { Artwork } from '@prisma/client';
import { getValidImageUrl } from '@/utils/imageUtils';

interface ArtworkCardProps {
    artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
    const validImage = getValidImageUrl(artwork.imagePath);

    return (
        <div className="group flex flex-col space-y-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 transition-all duration-500 hover:shadow-xl">
                {validImage ? (
                    <Image
                        src={validImage}
                        alt={artwork.title}
                        fill
                        className="object-contain object-center transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-neutral-400">
                        <span className="font-serif text-sm italic tracking-widest uppercase opacity-50 mb-2">
                            No Image
                        </span>
                        <div className="h-px w-8 bg-neutral-300 my-2"></div>
                        <span className="font-serif text-xs text-neutral-500">
                            Artwork Reference
                        </span>
                    </div>
                )}
            </div>

            <div className="flex flex-col space-y-1">
                <h3 className="font-serif text-lg font-medium leading-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
                    {artwork.title}
                </h3>
                <p className="text-sm text-neutral-500 font-light tracking-wide uppercase">
                    {artwork.artist}
                </p>
                <div className="text-xs text-neutral-400 font-light flex gap-2">
                    {artwork.year && <span>{artwork.year}</span>}
                    {artwork.medium && <span className="truncate max-w-[200px]" title={artwork.medium}>{artwork.medium}</span>}
                </div>
            </div>
        </div>
    );
}
