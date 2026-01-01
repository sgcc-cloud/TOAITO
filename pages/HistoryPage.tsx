import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchHistoricalResults } from '../services/apiService';
import { HistoricalResult } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatPrizeAmount } from '../utils/helpers';
import { HISTORY_PAGE_LIMIT } from '../constants';
import { motion } from 'framer-motion';

const HistoryPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: paginatedResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['historicalResults', currentPage],
    queryFn: () => fetchHistoricalResults(currentPage, HISTORY_PAGE_LIMIT),
    staleTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep old data while fetching new page
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = paginatedResults ? Math.ceil(paginatedResults.total / HISTORY_PAGE_LIMIT) : 0;

  if (isLoading) {
    return <LoadingSpinner message="Fetching historical draws..." className="mt-20" />;
  }

  if (error) {
    return (
      <div className="text-red-400 text-center mt-20 p-4 bg-red-900/30 rounded-lg">
        Error loading historical draws: {error.message}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-extrabold text-center text-indigo-300 drop-shadow-lg mb-8">
        TOTO Draw History
      </h1>

      <div className="bg-gray-800/70 rounded-3xl shadow-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedResults?.data.map((draw) => (
            <div
              key={draw.draw_no}
              className="bg-gray-700/50 p-5 rounded-3xl shadow-md hover:shadow-xl transition-shadow duration-200 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="text-xl font-semibold text-white">Draw No. {draw.draw_no}</p>
                <p className="text-sm text-gray-300">{format(new Date(draw.date), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {draw.winning_numbers.map((num) => (
                  <span
                    key={`${draw.draw_no}-w-${num}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white text-base font-medium"
                  >
                    {num}
                  </span>
                ))}
                <span
                  key={`${draw.draw_no}-a-${draw.additional_number}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-600 text-white text-base font-medium"
                >
                  {draw.additional_number}
                </span>
              </div>
              <div className="mt-auto pt-3 border-t border-gray-600/50">
                <p className="text-lg font-bold text-yellow-200">
                  Prize: {formatPrizeAmount(draw.prize_amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </motion.div>
  );
};

export default HistoryPage;