import { Filter, Calendar, Users, Book, TrendingUp, X, Search, Database, Cpu, BarChart, GitCompare, Layers } from 'lucide-react';
import { useState } from 'react';

const SearchFilters = ({ 
  filters, 
  setFilters, 
  venues, 
  categories,
  years,
  onClear
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showIRSettings, setShowIRSettings] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      {/* Fixed Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-white flex-shrink-0" />
          <h2 className="text-xl font-semibold text-white whitespace-nowrap">Search Filters</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowIRSettings(!showIRSettings)}
            className="px-3 py-1.5 text-sm bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap min-w-[100px] justify-center"
          >
            <Cpu className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {showIRSettings ? 'Hide IR' : 'IR Settings'}
            </span>
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1.5 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors whitespace-nowrap min-w-[80px] text-center"
          >
            {showAdvanced ? 'Basic' : 'Advanced'}
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap min-w-[80px] justify-center"
          >
            <X className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Clear</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search Mode & Algorithm */}
        <div>
          <label className="flex items-center gap-2 text-gray-300 mb-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Search Mode</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'hybrid', label: 'Hybrid', desc: 'API + AI' },
              { id: 'tfidf', label: 'TF-IDF', desc: 'IR Engine' },
              { id: 'bm25', label: 'BM25', desc: 'IR Engine' },
              { id: 'tf', label: 'TF Only', desc: 'IR Engine' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => handleFilterChange('searchAlgorithm', mode.id)}
                className={`px-3 py-2 rounded-lg transition-all text-sm flex flex-col items-center ${filters.searchAlgorithm === mode.id 
                  ? mode.id === 'hybrid'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-lg'
                    : mode.id === 'tfidf'
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-lg'
                    : mode.id === 'bm25'
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-lg'
                    : 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-lg'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                }`}
                title={mode.desc}
              >
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs opacity-70">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* IR Settings Panel */}
        {showIRSettings && (
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-300" />
                IR Engine Settings
              </h3>
              <span className="text-xs text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded">
                {filters.searchAlgorithm !== 'hybrid' ? 'Active' : 'Not Active'}
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Query Operator */}
              <div>
                <label className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                  <GitCompare className="h-3 w-3" />
                  Query Operator
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['AND', 'OR'].map(op => (
                    <button
                      key={op}
                      onClick={() => handleFilterChange('queryOperator', op)}
                      className={`px-3 py-2 rounded-lg transition-all text-sm ${filters.queryOperator === op 
                        ? op === 'AND'
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                          : 'bg-green-500/20 border border-green-500/30 text-green-300'
                        : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      {op} Operator
                      <span className="block text-xs opacity-70 mt-1">
                        {op === 'AND' ? 'Precise match' : 'Broad match'}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {filters.queryOperator === 'AND' 
                    ? 'All search terms must appear (more precise)' 
                    : 'Any search term can appear (more results)'}
                </div>
              </div>

              {/* Algorithm Info */}
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="text-xs text-gray-300">
                  <div className="font-medium mb-1">Current Algorithm:</div>
                  {filters.searchAlgorithm === 'tfidf' && (
                    <div>
                      <span className="text-indigo-300">TF-IDF</span> - Term Frequency-Inverse Document Frequency
                      <div className="text-gray-400 mt-1">
                        Weighs terms by frequency and rarity across documents
                      </div>
                    </div>
                  )}
                  {filters.searchAlgorithm === 'bm25' && (
                    <div>
                      <span className="text-purple-300">BM25</span> - Best Matching 25
                      <div className="text-gray-400 mt-1">
                        Advanced probabilistic ranking with document length normalization
                      </div>
                    </div>
                  )}
                  {filters.searchAlgorithm === 'tf' && (
                    <div>
                      <span className="text-blue-300">Term Frequency</span>
                      <div className="text-gray-400 mt-1">
                        Simple count of term occurrences in documents
                      </div>
                    </div>
                  )}
                  {filters.searchAlgorithm === 'hybrid' && (
                    <div>
                      <span className="text-emerald-300">Hybrid Search</span>
                      <div className="text-gray-400 mt-1">
                        Combines API results with relevance scoring
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Year</span>
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm transition-all hover:bg-gray-700"
            >
              <option value="All">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <Book className="h-4 w-4" />
              <span className="text-sm font-medium">Category</span>
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm transition-all hover:bg-gray-700"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-300 mb-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Author</span>
          </label>
          <input
            type="text"
            placeholder="Search by author name..."
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder-gray-500 text-sm transition-all hover:bg-gray-700"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-gray-300 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Venue/Journal</span>
          </label>
          <select
            value={filters.venue}
            onChange={(e) => handleFilterChange('venue', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm transition-all hover:bg-gray-700"
          >
            <option value="All">All Venues</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-700 space-y-4">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Advanced Options
            </h3>
            
            {/* Min Citations Slider */}
            <div>
              <label className="flex items-center justify-between text-gray-300 text-sm mb-2">
                <span>Minimum Citations</span>
                <span className="text-emerald-300 font-medium">
                  {filters.minCitations?.toLocaleString() || '0'}+
                </span>
              </label>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-xs">0</span>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={filters.minCitations || 0}
                  onChange={(e) => handleFilterChange('minCitations', parseInt(e.target.value))}
                  className="flex-1 accent-emerald-500 hover:accent-emerald-400"
                />
                <span className="text-gray-500 text-xs">50k</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Filter papers by citation count
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="flex items-center justify-between text-gray-300 text-sm mb-2">
                <span>Sort By</span>
                <span className="text-blue-300 text-xs">
                  {filters.sortBy === 'score' && 'Relevance Score'}
                  {filters.sortBy === 'citations' && 'Citations'}
                  {filters.sortBy === 'year' && 'Year'}
                  {filters.sortBy === 'title' && 'Title'}
                </span>
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all hover:bg-gray-700"
              >
                <option value="relevance">Relevance</option>
                <option value="citations">Citations (High to Low)</option>
                <option value="year">Year (Newest First)</option>
                <option value="title">Title (A-Z)</option>
                <option value="score">Relevance Score</option>
              </select>
              <div className="text-xs text-gray-500 mt-2">
                {filters.sortBy === 'score' && 'Sort by IR relevance score (TF-IDF/BM25)'}
                {filters.sortBy === 'citations' && 'Sort by citation count'}
                {filters.sortBy === 'year' && 'Sort by publication year'}
                {filters.sortBy === 'title' && 'Sort alphabetically by title'}
                {filters.sortBy === 'relevance' && 'Default relevance ranking'}
              </div>
            </div>

            {/* Max Results */}
            <div>
              <label className="flex items-center justify-between text-gray-300 text-sm mb-2">
                <span>Results Per Page</span>
                <span className="text-purple-300">{filters.limit || 20}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map(num => (
                  <button
                    key={num}
                    onClick={() => handleFilterChange('limit', num)}
                    className={`px-3 py-2 rounded-lg transition-all text-sm ${(filters.limit || 20) === num
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                      : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.year !== 'All' || filters.venue !== 'All' || filters.author || filters.category !== 'All' || filters.minCitations > 0 || filters.searchAlgorithm !== 'hybrid') && (
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-300 text-sm font-medium">Active Filters</h4>
              <span className="text-xs text-gray-500">
                {[
                  filters.year !== 'All',
                  filters.venue !== 'All',
                  filters.author,
                  filters.category !== 'All',
                  filters.minCitations > 0,
                  filters.searchAlgorithm !== 'hybrid',
                  filters.queryOperator !== 'OR'
                ].filter(Boolean).length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Algorithm Filter */}
              {filters.searchAlgorithm !== 'hybrid' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-200 rounded-full text-xs border border-indigo-500/30">
                  <Cpu className="h-3 w-3" />
                  {filters.searchAlgorithm.toUpperCase()}
                  <button 
                    onClick={() => handleFilterChange('searchAlgorithm', 'hybrid')}
                    className="hover:text-indigo-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Operator Filter */}
              {filters.queryOperator !== 'OR' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-500/30">
                  <GitCompare className="h-3 w-3" />
                  {filters.queryOperator}
                  <button 
                    onClick={() => handleFilterChange('queryOperator', 'OR')}
                    className="hover:text-blue-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Year Filter */}
              {filters.year !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-200 rounded-full text-xs border border-emerald-500/30">
                  <Calendar className="h-3 w-3" />
                  Year: {filters.year}
                  <button 
                    onClick={() => handleFilterChange('year', 'All')}
                    className="hover:text-emerald-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Venue Filter */}
              {filters.venue !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-200 rounded-full text-xs border border-green-500/30">
                  <Database className="h-3 w-3" />
                  {filters.venue.length > 15 ? filters.venue.substring(0, 15) + '...' : filters.venue}
                  <button 
                    onClick={() => handleFilterChange('venue', 'All')}
                    className="hover:text-green-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Author Filter */}
              {filters.author && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-200 rounded-full text-xs border border-purple-500/30">
                  <Users className="h-3 w-3" />
                  Author: {filters.author.length > 10 ? filters.author.substring(0, 10) + '...' : filters.author}
                  <button 
                    onClick={() => handleFilterChange('author', '')}
                    className="hover:text-purple-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Category Filter */}
              {filters.category !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-200 rounded-full text-xs border border-orange-500/30">
                  <Book className="h-3 w-3" />
                  {filters.category}
                  <button 
                    onClick={() => handleFilterChange('category', 'All')}
                    className="hover:text-orange-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Citations Filter */}
              {filters.minCitations > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-200 rounded-full text-xs border border-red-500/30">
                  <BarChart className="h-3 w-3" />
                  {filters.minCitations.toLocaleString()}+ citations
                  <button 
                    onClick={() => handleFilterChange('minCitations', 0)}
                    className="hover:text-red-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {/* Sort Filter */}
              {filters.sortBy !== 'relevance' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-200 rounded-full text-xs border border-cyan-500/30">
                  <TrendingUp className="h-3 w-3" />
                  Sort: {filters.sortBy}
                  <button 
                    onClick={() => handleFilterChange('sortBy', 'relevance')}
                    className="hover:text-cyan-300 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="font-medium text-gray-300 mb-1">Current Configuration:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Search Algorithm:</span>
                <span className={`font-medium ${filters.searchAlgorithm === 'hybrid' ? 'text-emerald-300' :
                  filters.searchAlgorithm === 'tfidf' ? 'text-indigo-300' :
                  filters.searchAlgorithm === 'bm25' ? 'text-purple-300' :
                  'text-blue-300'
                }`}>
                  {filters.searchAlgorithm.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Query Operator:</span>
                <span className={`font-medium ${filters.queryOperator === 'AND' ? 'text-blue-300' : 'text-green-300'
                }`}>
                  {filters.queryOperator}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sorting:</span>
                <span className="text-cyan-300 font-medium">
                  {filters.sortBy.charAt(0).toUpperCase() + filters.sortBy.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;