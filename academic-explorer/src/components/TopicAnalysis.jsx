import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, Tag, Layers, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { analyzeTopics } from '../services/api';

function TopicAnalysis({ papers }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papersByTopic, setPapersByTopic] = useState([]);

  useEffect(() => {
    if (papers && papers.length > 5) {
      analyzePaperTopics();
    }
  }, [papers]);

  const analyzePaperTopics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeTopics(papers);
      setTopics(result.topics || []);
    } catch (err) {
      console.error('Topic analysis error:', err);
      setError('Failed to analyze topics');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    // Filter papers for this topic
    const topicPapers = papers.filter(paper => {
      // Simple keyword matching for demo
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      return topic.dominantTerms.some(term => 
        text.includes(term.term.toLowerCase())
      );
    });
    setPapersByTopic(topicPapers.slice(0, 5));
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Topic Modeling</h3>
            <p className="text-gray-600 text-sm">LDA Topic Analysis</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-gray-600 mt-2">Analyzing research topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button
            onClick={analyzePaperTopics}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Topic Modeling</h3>
            <p className="text-gray-600 text-sm">LDA Topic Analysis</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Need at least 6 papers for topic analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Topic Modeling</h3>
            <p className="text-gray-600 text-sm">LDA Analysis • {topics.length} Topics Found</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          Advanced TM
        </div>
      </div>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            onClick={() => handleTopicSelect(topic)}
            className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              selectedTopic?.id === topic.id
                ? 'bg-white border-purple-300 shadow-md'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-4 w-4 text-purple-500" />
                  <h4 className="font-semibold text-gray-900">{topic.label}</h4>
                </div>
                <p className="text-xs text-gray-600">
                  {topic.terms.slice(0, 3).map(t => t.term).join(', ')}...
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">{topic.paperCount}</div>
                <div className="text-xs text-gray-500">papers</div>
              </div>
            </div>
            
            {/* Topic Stats */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {topic.percentage}%
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {topic.avgCitations} cites/paper
                </span>
              </div>
              <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                Topic {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Topic Details */}
      {selectedTopic && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Selected Topic Analysis</h4>
              <p className="text-sm text-gray-600">{selectedTopic.label}</p>
            </div>
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          {/* Topic Terms */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Key Terms</h5>
            <div className="flex flex-wrap gap-2">
              {selectedTopic.terms.map((term, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-sm"
                >
                  {term.term}
                  <span className="text-xs text-purple-600 ml-1">
                    ({parseFloat(term.probability) * 100}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Papers */}
          {papersByTopic.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Papers</h5>
              <div className="space-y-2">
                {papersByTopic.map((paper, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{paper.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{paper.year}</span>
                      <span>•</span>
                      <span>{paper.citations?.toLocaleString()} citations</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LDA Explanation */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-gray-900">About LDA Topic Modeling</h5>
            <p className="text-xs text-gray-600 mt-1">
              Latent Dirichlet Allocation automatically discovers hidden topics in research papers 
              using statistical analysis of word distributions. Each topic is a collection of 
              related terms that frequently appear together.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {papers.length} papers analyzed
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {topics.length} latent topics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopicAnalysis;