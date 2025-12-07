const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-white/20"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-white text-lg">Fetching research papers...</p>
      <p className="text-white/60 text-sm mt-2">Searching arXiv & Semantic Scholar</p>
    </div>
  );
};

export default LoadingSpinner;