import React from 'react';
import { Calendar, Users, FileText, TrendingUp, ExternalLink } from 'lucide-react';

function PaperCard({ paper }) {
  // Safe defaults
  const paperData = {
    title: paper.title || 'Untitled',
    authors: paper.authors || ['Unknown'],
    abstract: paper.abstract || 'No abstract available',
    year: paper.year || 'N/A',
    journal: paper.journal || 'Unknown',
    citations: paper.citations || 0,
    category: paper.category || 'General',
    keywords: paper.keywords || [],
    source: paper.source || 'Unknown',
    pdfUrl: paper.pdfUrl || '#',
    color: paper.color || 'bg-gradient-to-r from-blue-100 to-blue-200'
  };

  // Format citation number
  const formatCitations = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`${paperData.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200`}>
      {/* Header with title and year */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-gray-900 text-xl font-bold mb-2 line-clamp-2">
            {paperData.title}
          </h3>
          <div className="flex items-center gap-3 text-gray-600 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{paperData.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{paperData.journal}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{formatCitations(paperData.citations)} citations</span>
            </div>
          </div>
        </div>
        
        {/* Category badge */}
        <div className="px-3 py-1 bg-white/80 backdrop-blur-sm text-gray-800 text-sm font-medium rounded-full border border-white/50">
          {paperData.category}
        </div>
      </div>

      {/* Authors */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700 text-sm font-medium">Authors</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">
          {paperData.authors.join(', ')}
        </p>
      </div>

      {/* Abstract */}
      <div className="mb-4">
        <div className="text-gray-700 text-sm line-clamp-4">
          {paperData.abstract}
        </div>
      </div>

      {/* Keywords */}
      {paperData.keywords && paperData.keywords.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {paperData.keywords.slice(0, 4).map((keyword, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-white/80 text-gray-700 text-xs rounded-full border border-gray-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer with source and actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/50">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            paperData.source === 'arXiv' 
              ? 'bg-orange-100 text-orange-800' 
              : paperData.source === 'Semantic Scholar'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {paperData.source}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(paperData.pdfUrl, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaperCard;