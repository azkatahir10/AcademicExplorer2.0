import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, PieChart, Activity, ChevronRight, Brain, BarChart3 } from 'lucide-react';
import { analyzeTrendsWithGroq } from '../services/api';

function TrendAnalysis({ papers = [] }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiGenerated, setAiGenerated] = useState(false);

  useEffect(() => {
    if (papers && papers.length > 5) {
      fetchTrendAnalysis();
    }
  }, [papers]);

  const fetchTrendAnalysis = async () => {
    if (papers.length < 3) {
      setError('Need at least 3 papers for trend analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the new Groq AI-powered trend analysis
      const result = await analyzeTrendsWithGroq(papers);
      setAnalysis(result);
      setAiGenerated(!result.fallback);
      
      // If AI failed, create basic analysis
      if (result.fallback) {
        createBasicAnalysis();
      }
    } catch (err) {
      console.error('Trend analysis error:', err);
      setError('Failed to analyze trends. Using basic statistics.');
      createBasicAnalysis();
    } finally {
      setLoading(false);
    }
  };

  const createBasicAnalysis = () => {
    const categories = {};
    const years = {};
    const keywords = {};
    
    papers.forEach(paper => {
      // Categories
      if (paper.category) {
        categories[paper.category] = (categories[paper.category] || 0) + 1;
      }
      
      // Years
      if (paper.year) {
        years[paper.year] = (years[paper.year] || 0) + 1;
      }
      
      // Keywords
      if (paper.keywords && Array.isArray(paper.keywords)) {
        paper.keywords.forEach(keyword => {
          keywords[keyword] = (keywords[keyword] || 0) + 1;
        });
      }
    });
    
    // Find trending categories
    const trendingCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    // Calculate year trends
    const yearTrends = Object.entries(years)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 5)
      .map(([year, count]) => ({ year, count }));
    
    // Find emerging keywords
    const emergingKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));
    
    setAnalysis({
      analysis: "Basic trend analysis based on paper statistics",
      trendingCategories,
      yearTrends,
      emergingKeywords,
      totalPapers: papers.length,
      fallback: true
    });
    setAiGenerated(false);
  };

  // Format AI analysis text
  const formatAIAnalysis = (analysisText) => {
    if (!analysisText) return [];
    
    // Split by common AI response patterns
    const sections = analysisText.split(/\n\d\.\s+|\n\*\s+|\n-\s+/).filter(s => s.trim());
    
    if (sections.length > 1) {
      return sections.map(section => section.trim());
    }
    
    // If no clear sections, split by sentences
    return analysisText.split(/\.\s+/).filter(s => s.length > 10);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
            <p className="text-gray-400 text-sm">Powered by Groq AI</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-gray-400 mt-3">Analyzing research trends with AI...</p>
          <p className="text-gray-500 text-sm mt-1">Analyzing {papers.length} papers</p>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
            <p className="text-gray-400 text-sm">Error</p>
          </div>
        </div>
        <div className="text-red-300 text-center py-4">{error}</div>
        <button
          onClick={fetchTrendAnalysis}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis || papers.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
            <p className="text-gray-400 text-sm">No data to analyze</p>
          </div>
        </div>
        <div className="text-gray-400 text-center py-4">
          <p>Search for papers to see trend analysis</p>
          <p className="text-sm mt-1">Need at least 3 papers</p>
        </div>
      </div>
    );
  }

  // Get top categories
  const trendingCategories = analysis.trendingCategories || 
    Object.entries(analysis.categories || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

  // Get year distribution
  const yearTrends = analysis.yearTrends || 
    Object.entries(analysis.years || {})
      .sort((a, b) => b[0] - a[0])
      .slice(0, 5)
      .map(([year, count]) => ({ year, count }));

  // Get emerging keywords
  const emergingKeywords = analysis.emergingKeywords || [];

  // Format AI insights
  const aiInsights = formatAIAnalysis(analysis.analysis);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            aiGenerated 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trend Analysis</h3>
            <p className="text-gray-400 text-sm">
              {aiGenerated ? 'AI-Powered Insights' : 'Statistical Analysis'}
              {analysis.model && ` • ${analysis.model}`}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          aiGenerated
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {aiGenerated ? 'Groq AI' : 'Basic'}
        </div>
      </div>

      {/* AI Insights Section */}
      {aiInsights.length > 0 && aiGenerated && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-emerald-400" />
            <h4 className="text-white font-semibold">AI Insights</h4>
          </div>
          <div className="space-y-3">
            {aiInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Categories */}
      {trendingCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-5 w-5 text-purple-400" />
            <h4 className="text-white font-semibold">Top Research Areas</h4>
          </div>
          <div className="space-y-2">
            {trendingCategories.map((category, index) => (
              <div key={category.name || index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-white truncate">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{category.count}</span>
                  <span className="text-gray-400 text-sm">papers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year Distribution */}
      {yearTrends.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-orange-400" />
            <h4 className="text-white font-semibold">Publication Trends</h4>
          </div>
          <div className="space-y-2">
            {yearTrends.map((yearData) => {
              const percentage = Math.round((yearData.count / papers.length) * 100);
              return (
                <div key={yearData.year} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white">{yearData.year}</span>
                    <span className="text-white font-medium">
                      {yearData.count} papers ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Emerging Keywords */}
      {emergingKeywords.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h4 className="text-white font-semibold">Emerging Topics</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {emergingKeywords.slice(0, 8).map((keywordData, index) => (
              <div
                key={keywordData.keyword || index}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-full border border-cyan-500/30 text-sm"
              >
                {keywordData.keyword}
                <span className="text-cyan-500/70 ml-1 text-xs">
                  ({keywordData.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Total Papers</div>
          <div className="text-2xl font-bold text-white">{papers.length}</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
          <div className="text-gray-400 text-xs mb-1">Categories</div>
          <div className="text-2xl font-bold text-white">{trendingCategories.length}</div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchTrendAnalysis}
        disabled={loading}
        className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Activity className="h-4 w-4" />
        {aiGenerated ? 'Refresh AI Analysis' : 'Try AI Analysis'}
        {aiGenerated && <span className="text-xs opacity-80">(Groq AI)</span>}
      </button>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">
          {aiGenerated 
            ? 'Analysis generated by Groq AI based on paper content and metadata.'
            : 'Basic statistical analysis. Connect Groq AI for deeper insights.'
          }
        </p>
      </div>
    </div>
  );
}

export default TrendAnalysis;