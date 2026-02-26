'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
    currentPage: number;
    totalCount: number;
    itemsPerPage: number;
    onPageChange?: (page: number) => void; // Optional for client-side mode
    isServerSide?: boolean; // If true, uses URL router push
}

export default function PaginationControls({
    currentPage,
    totalCount,
    itemsPerPage,
    onPageChange,
    isServerSide = false
}: PaginationControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Safety check
    if (totalPages <= 1) return null;

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;

        if (isServerSide) {
            // Update URL query param 'page'
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString());
            router.push(`?${params.toString()}`);
        } else {
            // Call client-side handler
            onPageChange?.(newPage);
        }
    };

    return (
        <div className="flex items-center justify-center py-10 w-full border-t border-gray-50 bg-white gap-12">
            {/* Previous Button */}
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="group flex items-center gap-3 text-gray-400 hover:text-black disabled:opacity-20 disabled:hover:text-gray-400 disabled:cursor-default cursor-pointer transition-colors"
                aria-label="Previous Page"
            >
                <ChevronLeftIcon className="h-4 w-4 stroke-[1.5]" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-sans">Previous</span>
            </button>

            {/* Page Counter */}
            <div className="text-[10px] uppercase tracking-[0.3em] font-sans text-gray-400 select-none">
                Page {currentPage} of {totalPages}
            </div>

            {/* Next Button */}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="group flex items-center gap-3 text-gray-400 hover:text-black disabled:opacity-20 disabled:hover:text-gray-400 disabled:cursor-default cursor-pointer transition-colors"
                aria-label="Next Page"
            >
                <span className="text-[10px] uppercase tracking-[0.3em] font-sans">Next</span>
                <ChevronRightIcon className="h-4 w-4 stroke-[1.5]" strokeWidth={1.5} />
            </button>
        </div>
    );
}
