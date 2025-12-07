import React, { useState, useEffect } from 'react';
import { Link, Sparkles, BookOpen, TrendingUp, Users } from 'lucide-react';

function SimilarPapers({ paper, findSimilarPapers, allPapers }) {
  const [similarPapers, setSimilarPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (paper && findSimilarPapers && allPapers?.length > 0) {
      fetchSimilarPapers();
    }
  }, [paper, findSimilarPapers, allPapers]);

  const fetchSimilarPapers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to use AI-powered similarity if available
      if (typeof findSimilarPapers === 'function') {
        const result = await findSimilarPapers(paper, allPapers);
        
        if (result.error) {
          // Fallback to basic similarity
          findBasicSimilarPapers();
        } else {
          setSimilarPapers(result.similarPapers || []);
          setExplanation(result.explanation || '');
        }
      } else {
        // Use basic similarity
        findBasicSimilarPapers();
      }
    } catch (err) {
      console.error('Error finding similar papers:', err);
      findBasicSimilarPapers();
    } finally {
      setLoading(false);
    }
  };

  const findBasicSimilarPapers = () => {
    if (!paper || !allPapers) return;
    
    const basicSimilar = allPapers
      .filter(p => p.id !== paper.id)
      .slice(0, 5);
    
    setSimilarPapers(basicSimilar);
    setExplanation('Similar papers based on category and keywords.');
  };

  if (!paper) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <Link className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Similar Papers</h3>
        </div>
        <p className="text-white/70">Select a paper to find similar research.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
          <Link className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Related Research</h3>
          <p className="text-gray-600 text-sm">Papers similar to your selection</p>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-purple-100">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
            <p className="text-gray-700 text-sm">{explanation}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-600 mt-2">Finding similar papers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchSimilarPapers}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Similar Papers List */}
      {!loading && !error && similarPapers.length > 0 && (
        <div className="space-y-4">
          {similarPapers.map((similar, index) => (
            <div
              key={similar.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {similar.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {similar.authors?.slice(0, 2).join(', ')}
                      {similar.authors?.length > 2 && ' et al.'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {similar.year || 'Unknown'}
                    </span>
                    {similar.citations > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {similar.citations.toLocaleString()} citations
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {similar.abstract?.substring(0, 120)}...
                  </p>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    similar.category === paper.category 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {similar.category || 'General'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && similarPapers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No similar papers found.</p>
          <button
            onClick={fetchSimilarPapers}
            className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
          >
            Try basic search
          </button>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Found {similarPapers.length} similar papers
          </span>
          <span className="text-purple-600 font-medium">
            {explanation.includes('AI') ? 'AI-Powered' : 'Basic Search'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SimilarPapers;