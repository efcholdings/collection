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
        <div className="flex items-center justify-center mt-12 mb-8 w-full">
            <nav className="isolate flex flex-nowrap items-center space-x-4 p-2 bg-white rounded-full shadow-sm border border-neutral-100 whitespace-nowrap" aria-label="Pagination">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="text-sm font-sans font-medium text-neutral-600 px-4 select-none">
                    <span className="text-neutral-400">Page</span> {currentPage} <span className="text-neutral-300">/</span> {totalPages}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            </nav>
        </div>
    );
}
