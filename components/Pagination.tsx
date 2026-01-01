import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers: (number | '...')[] = [];
    const maxPageButtons = 5; // Number of page buttons to show

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > 2) {
        pageNumbers.push('...');
      }
      if (currentPage > 1 && currentPage < totalPages) {
        pageNumbers.push(currentPage);
      }
      if (currentPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    // Filter duplicates and sort for pages like [1, 2, ..., 5] -> [1, 2, 5] if totalPages=5
    return Array.from(new Set(pageNumbers)).sort((a, b) => {
        if (a === '...') return 1;
        if (b === '...') return -1;
        return (a as number) - (b as number);
    });
  };

  return (
    <nav className="flex items-center justify-center px-4 py-3 sm:px-6">
      <div className="flex flex-1 items-center justify-between sm:justify-center">
        <div>
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={`relative inline-flex items-center rounded-lg px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 mr-3
              ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div>
          <div className="hidden sm:flex space-x-1">
            {renderPageNumbers().map((pageNumber, index) => (
              pageNumber === '...' ? (
                <span key={index} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-300 ring-1 ring-inset ring-gray-600 focus:outline-offset-0 rounded-lg">
                  ...
                </span>
              ) : (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber as number)}
                  aria-current={currentPage === pageNumber ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 rounded-lg
                    ${currentPage === pageNumber
                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-700'
                    }`}
                >
                  {pageNumber}
                </button>
              )
            ))}
          </div>
        </div>
        <div>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={`relative inline-flex items-center rounded-lg px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 ml-3
              ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <span className="sr-only">Next</span>
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;