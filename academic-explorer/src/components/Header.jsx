import { Search, BookOpen, Filter, Brain } from 'lucide-react';

const Header = ({ searchTerm, setSearchTerm, onSearch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(e);
  };

  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                Academic Explorer 2.0
                <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-semibold rounded-full">
                  Advanced
                </span>
              </h1>
              <p className="text-white/80 text-sm">BM25 + Embeddings + Citation Analysis</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search papers with BM25 + semantic search..."
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <button
                type="submit"
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Brain className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        
        {/* Quick Search Suggestions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-white/60 text-sm">Advanced Search:</span>
          {['transformer attention', 'diffusion models 2023', 'computer vision survey', 'ai ethics impact'].map(term => (
            <button
              key={term}
              onClick={() => {
                setSearchTerm(term);
                setTimeout(() => onSearch({ preventDefault: () => {} }), 100);
              }}
              className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-full transition-colors border border-white/10"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;