import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default LoadingSpinner; 