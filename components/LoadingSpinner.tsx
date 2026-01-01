import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
