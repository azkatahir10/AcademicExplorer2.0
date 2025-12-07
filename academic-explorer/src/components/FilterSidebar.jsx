import { Filter, Calendar, Tag, TrendingUp, Database, Globe } from 'lucide-react';

const FilterSidebar = ({ 
  selectedCategory, 
  setSelectedCategory, 
  selectedYear, 
  setSelectedYear,
  selectedSource,
  setSelectedSource,
  categories,
  years,
  onRefresh
}) => {
  
  const sources = [
    { id: 'all', name: 'All Sources', icon: Globe },
    { id: 'arxiv', name: 'arXiv', icon: Database },
    { id: 'semantic', name: 'Semantic Scholar', icon: Database }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-white" />
          <h2 className="text-xl font-semibold text-white">Filters</h2>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-8">
        {/* Data Source */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-white/80" />
            <h3 className="font-medium text-white">Data Source</h3>
          </div>
          <div className="space-y-2">
            {sources.map(source => {
              const Icon = source.icon;
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedSource === source.id 
                      ? 'bg-white text-purple-600 font-medium shadow-lg' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {source.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-4 w-4 text-white/80" />
            <h3 className="font-medium text-white">Category</h3>
          </div>
          <div className="space-y-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCategory === category 
                    ? 'bg-white text-purple-600 font-medium shadow-lg' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Year Filter */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-white/80" />
            <h3 className="font-medium text-white">Publication Year</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  selectedYear === year 
                    ? 'bg-white text-purple-600 font-medium shadow-lg' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stats */}
        <div className="pt-6 border-t border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-white/80" />
            <h3 className="font-medium text-white">API Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-white/80">
              <span>arXiv API</span>
              <span className="font-medium text-green-400">Live</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Semantic Scholar</span>
              <span className="font-medium text-green-400">Live</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>Rate Limit</span>
              <span className="font-medium text-yellow-400">100/hr</span>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          setSelectedCategory('All');
          setSelectedYear('All');
          setSelectedSource('all');
        }}
        className="w-full mt-8 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;