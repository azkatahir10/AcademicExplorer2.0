import React, { useMemo } from 'react';
import { TrendingUp, BarChart3, Target, Award, Zap, Star, Users, Globe } from 'lucide-react';

function CitationAnalysis({ stats, papers }) {
  // Calculate stats from papers if stats not provided
  const analysisStats = useMemo(() => {
    // Use provided stats if available
    if (stats) return stats;
    
    // Calculate stats from papers if available
    if (papers && papers.length > 0) {
      const validPapers = papers.filter(p => p && (p.citations !== undefined));
      
      if (validPapers.length === 0) {
        return {
          totalCitations: 0,
          averageCitations: 0,
          hIndex: 0,
          mostCitedPaper: null,
          citationDistribution: {},
          topCategories: [],
          citationTrend: 'stable',
          paperCount: 0
        };
      }

      // Calculate total citations
      const totalCitations = validPapers.reduce((sum, paper) => sum + (paper.citations || 0), 0);
      const averageCitations = totalCitations / validPapers.length;
      
      // Calculate h-index (simplified)
      const sortedCitations = [...validPapers]
        .map(p => p.citations || 0)
        .sort((a, b) => b - a);
      
      let hIndex = 0;
      for (let i = 0; i < sortedCitations.length; i++) {
        if (sortedCitations[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      // Find most cited paper
      const mostCitedPaper = [...validPapers]
        .sort((a, b) => (b.citations || 0) - (a.citations || 0))[0];

      // Category distribution
      const categoryCounts = {};
      validPapers.forEach(paper => {
        const category = paper.category || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ 
          name, 
          count,
          avgCitations: validPapers
            .filter(p => (p.category || 'Uncategorized') === name)
            .reduce((sum, p) => sum + (p.citations || 0), 0) / count
        }));

      // Citation trend analysis
      const recentPapers = validPapers.filter(p => p.year && p.year >= 2020);
      const olderPapers = validPapers.filter(p => p.year && p.year < 2020);
      
      const recentAvg = recentPapers.length > 0 ? 
        recentPapers.reduce((sum, p) => sum + (p.citations || 0), 0) / recentPapers.length : 0;
      const olderAvg = olderPapers.length > 0 ? 
        olderPapers.reduce((sum, p) => sum + (p.citations || 0), 0) / olderPapers.length : 0;
      
      let citationTrend = 'stable';
      if (recentPapers.length > 0 && olderPapers.length > 0) {
        if (recentAvg > olderAvg * 1.5) citationTrend = 'growing';
        else if (recentAvg < olderAvg * 0.5) citationTrend = 'declining';
      }

      return {
        totalCitations,
        averageCitations: Math.round(averageCitations * 10) / 10,
        hIndex,
        mostCitedPaper,
        citationDistribution: categoryCounts,
        topCategories,
        citationTrend,
        paperCount: validPapers.length
      };
    }
    
    // Return default/placeholder stats
    return {
      totalCitations: 0,
      averageCitations: 0,
      hIndex: 0,
      mostCitedPaper: null,
      citationDistribution: {},
      topCategories: [],
      citationTrend: 'stable',
      paperCount: 0
    };
  }, [stats, papers]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!analysisStats) return {};
    
    const {
      totalCitations = 0,
      averageCitations = 0,
      hIndex = 0,
      mostCitedPaper = null
    } = analysisStats;

    // Citation impact score (0-100)
    const impactScore = Math.min(100, Math.round((totalCitations / 1000) * 100));
    
    // Citation rate (per paper)
    const citationRate = averageCitations > 0 ? averageCitations.toFixed(1) : '0.0';
    
    // Performance level
    let performanceLevel = 'Low';
    let performanceColor = 'text-red-500';
    
    if (averageCitations > 50) {
      performanceLevel = 'Excellent';
      performanceColor = 'text-emerald-500';
    } else if (averageCitations > 20) {
      performanceLevel = 'Good';
      performanceColor = 'text-blue-500';
    } else if (averageCitations > 5) {
      performanceLevel = 'Average';
      performanceColor = 'text-yellow-500';
    }

    return {
      impactScore,
      citationRate,
      performanceLevel,
      performanceColor
    };
  }, [analysisStats]);

  // If no papers or stats available
  if ((!papers || papers.length === 0) && !stats) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Citation Analysis</h3>
            <p className="text-gray-600 text-sm">Citation metrics and impact analysis</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Citation Data Available</h4>
          <p className="text-gray-600 mb-4">
            Citation analysis requires paper data with citation counts.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Search for papers using the search bar</p>
            <p>• Make sure papers have citation data</p>
            <p>• Try searching for specific research topics</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalCitations = 0,
    averageCitations = 0,
    hIndex = 0,
    mostCitedPaper = null,
    citationDistribution = {},
    topCategories = [],
    citationTrend = 'stable'
  } = analysisStats;

  const {
    impactScore,
    citationRate,
    performanceLevel,
    performanceColor
  } = derivedMetrics;

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get trend icon and color
  const getTrendInfo = (trend) => {
    switch (trend.toLowerCase()) {
      case 'growing':
        return { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Growing' };
      case 'declining':
        return { icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-100', label: 'Declining', rotate: 'transform rotate-180' };
      case 'stable':
      default:
        return { icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Stable' };
    }
  };

  const trendInfo = getTrendInfo(citationTrend);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Citation Analysis</h3>
            <p className="text-gray-600 text-sm">
              Based on {analysisStats.paperCount || papers?.length || 0} papers
              {papers && stats && ' • Pre-calculated stats'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${trendInfo.bg} ${trendInfo.color}`}>
          <div className="flex items-center gap-1">
            <trendInfo.icon className={`h-4 w-4 ${trendInfo.rotate || ''}`} />
            <span>{trendInfo.label} Impact</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Citations */}
        <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Citations</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(totalCitations)}</div>
          <div className="text-xs text-gray-500 mt-1">Across all papers</div>
        </div>

        {/* Average Citations */}
        <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Avg per Paper</span>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{averageCitations.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Citation rate</div>
        </div>

        {/* h-Index */}
        <div className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">h-Index</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{hIndex}</div>
          <div className="text-xs text-gray-500 mt-1">Productivity & impact</div>
        </div>

        {/* Impact Score */}
        <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Impact Score</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{impactScore}</div>
          <div className="text-xs text-gray-500 mt-1">Out of 100</div>
        </div>
      </div>

      {/* Most Cited Paper */}
      {mostCitedPaper && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-500" />
            <h4 className="text-gray-700 font-medium">Most Influential Paper</h4>
          </div>
          <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">{mostCitedPaper.title}</h5>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                  <span>{mostCitedPaper.authors?.[0] || 'Unknown'}</span>
                  <span>•</span>
                  <span>{mostCitedPaper.year || 'Unknown'}</span>
                  <span>•</span>
                  <span>{mostCitedPaper.category || 'General'}</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2">
                  {mostCitedPaper.abstract?.substring(0, 120) || 'No abstract available'}...
                </p>
              </div>
              <div className="ml-4">
                <div className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-center">
                  <div className="text-lg font-bold">{formatNumber(mostCitedPaper.citations || 0)}</div>
                  <div className="text-xs">citations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Assessment */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          <h4 className="text-gray-700 font-medium">Performance Assessment</h4>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-600">Current Level</div>
              <div className={`text-lg font-bold ${performanceColor}`}>{performanceLevel}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Citation Rate</div>
              <div className="text-lg font-bold text-gray-900">{citationRate} cites/paper</div>
            </div>
          </div>
          
          {/* Performance Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Low Impact</span>
              <span>High Impact</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${impactScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
          
          {/* Performance Indicators */}
          <div className="grid grid-cols-3 gap-2 text-center mt-4">
            <div className={`p-2 rounded ${averageCitations > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="text-xs font-medium">Academic</div>
              <div className="text-sm">≥ 5 cites</div>
            </div>
            <div className={`p-2 rounded ${averageCitations > 20 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="text-xs font-medium">Influential</div>
              <div className="text-sm">≥ 20 cites</div>
            </div>
            <div className={`p-2 rounded ${averageCitations > 50 ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              <div className="text-xs font-medium">Seminal</div>
              <div className="text-sm">≥ 50 cites</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-blue-500" />
            <h4 className="text-gray-700 font-medium">Top Research Areas</h4>
          </div>
          <div className="space-y-2">
            {topCategories.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{category.name || category}</div>
                    {category.count && (
                      <div className="text-xs text-gray-500">{category.count} papers</div>
                    )}
                  </div>
                </div>
                {category.avgCitations && (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {category.avgCitations.toFixed(1)} cites
                    </div>
                    <div className="text-xs text-gray-500">average</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Based on {analysisStats.paperCount || 'multiple'} papers</span>
            </div>
          </div>
          <div className="text-purple-600 font-medium">
            {performanceLevel} Impact Level
          </div>
        </div>
        
        {/* Analysis Summary */}
        <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="text-xs text-gray-700">
            <span className="font-medium">Analysis Summary:</span> {
              averageCitations > 20 
                ? 'High-impact research with strong academic influence.'
                : averageCitations > 5
                ? 'Solid academic contribution with growing influence.'
                : 'Emerging research area with developing impact.'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitationAnalysis;