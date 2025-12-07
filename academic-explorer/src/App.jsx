import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PaperCard from './components/PaperCard';
import LoadingSpinner from './components/LoadingSpinner';
import SearchFilters from './components/SearchFilters';
import CitationAnalysis from './components/CitationAnalysis';
import SimilarPapers from './components/SimilarPapers';
import TrendAnalysis from './components/TrendAnalysis';
import QAInterface from './components/QAInterface';
import TopicAnalysis from './components/TopicAnalysis';
import IRDashboard from './components/IRDashboard';
import { 
  searchPapers, 
  healthCheck, 
  analyzeTopicsLDA,
  enhancedSearch,
  buildInvertedIndex,
  irSearch,
  runIREvaluation,
  getIRStats,
  compareSearchAlgorithms,
  getPrecisionRecallData,
  askGroqQuestion,
  summarizeWithGroq,
  findSimilarWithGroq,
  analyzeTrendsWithGroq
} from './services/api';
import './App.css';

// Fallback papers with structure matching backend API
const fallbackPapers = [
  {
    id: "backup-1",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones"],
    abstract: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...",
    year: 2017,
    citations: 89542,
    journal: "NeurIPS",
    venue: "NeurIPS",
    category: "AI/ML",
    pdfUrl: "#",
    source: "arXiv",
    published: "2017-06-12",
    keywords: ["Transformer", "Attention", "NLP"]
  },
  {
    id: "backup-2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
    abstract: "We introduce BERT, a new language representation model for pre-training deep bidirectional representations...",
    year: 2018,
    citations: 65432,
    journal: "NAACL",
    venue: "NAACL",
    category: "NLP",
    pdfUrl: "#",
    source: "arXiv",
    published: "2018-10-11",
    keywords: ["BERT", "Transformers", "Language Model"]
  },
  {
    id: "backup-3",
    title: "ResNet: Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    abstract: "We present a residual learning framework to ease the training of networks that are substantially deeper...",
    year: 2015,
    citations: 75421,
    journal: "CVPR",
    venue: "CVPR",
    category: "Computer Vision",
    pdfUrl: "#",
    source: "CVPR",
    published: "2015-12-10",
    keywords: ["ResNet", "Computer Vision", "Deep Learning"]
  },
  {
    id: "backup-4",
    title: "AlphaFold: Accurate Protein Structure Prediction",
    authors: ["John Jumper", "Richard Evans", "Alexander Pritzel"],
    abstract: "We present AlphaFold, an AI system that predicts a protein's 3D structure from its amino acid sequence...",
    year: 2021,
    citations: 12432,
    journal: "Nature",
    venue: "Nature",
    category: "Bioinformatics",
    pdfUrl: "#",
    source: "Nature",
    published: "2021-07-15",
    keywords: ["AlphaFold", "Protein", "Biology"]
  },
  {
    id: "backup-5",
    title: "GPT-3: Language Models are Few-Shot Learners",
    authors: ["Tom B. Brown", "Benjamin Mann", "Nick Ryder"],
    abstract: "We present GPT-3, an autoregressive language model with 175 billion parameters...",
    year: 2020,
    citations: 34567,
    journal: "arXiv",
    venue: "arXiv",
    category: "NLP",
    pdfUrl: "#",
    source: "arXiv",
    published: "2020-05-28",
    keywords: ["GPT-3", "Language Model", "LLM"]
  }
];

function App() {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [papers, setPapers] = useState(fallbackPapers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showIRDashboard, setShowIRDashboard] = useState(false);
  
  // Backend Status
  const [backendStatus, setBackendStatus] = useState({ 
    connected: false, 
    groqReady: false,
    topicModeling: false,
    invertedIndex: false,
    irEvaluator: false
  });
  const [aiModel, setAiModel] = useState('');
  
  // Analytics State
  const [topicAnalysis, setTopicAnalysis] = useState(null);
  const [analyzingTopics, setAnalyzingTopics] = useState(false);
  const [trendAnalysisData, setTrendAnalysisData] = useState(null);
  
  // IR System State
  const [irStats, setIrStats] = useState(null);
  const [irEvaluation, setIrEvaluation] = useState(null);
  const [precisionRecallData, setPrecisionRecallData] = useState([]);
  const [searchComparison, setSearchComparison] = useState(null);
  const [irSearchResults, setIrSearchResults] = useState(null);
  const [indexBuilt, setIndexBuilt] = useState(false);
  const [buildingIndex, setBuildingIndex] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState({
    year: 'All',
    venue: 'All',
    author: '',
    category: 'All',
    minCitations: 0,
    searchAlgorithm: 'hybrid', // 'hybrid', 'tfidf', 'bm25', 'tf'
    queryOperator: 'OR', // 'OR', 'AND'
    sortBy: 'relevance',
    limit: 20
  });

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await healthCheck();
        setBackendStatus({
          connected: health.status === 'healthy',
          groqReady: health.services?.groq || false,
          topicModeling: health.services?.topic_modeling || false,
          invertedIndex: health.inverted_index?.hasIndex || false,
          irEvaluator: health.ir_evaluation === 'Ready'
        });
        if (health.model) {
          setAiModel(health.model);
        }
        
        // Get IR stats if index exists
        if (health.inverted_index?.hasIndex) {
          try {
            const stats = await getIRStats();
            setIrStats(stats);
            setIndexBuilt(stats.hasIndex);
          } catch (err) {
            console.log('IR stats not available:', err.message);
          }
        }
      } catch (err) {
        console.log('Backend check failed:', err.message);
        setBackendStatus({ 
          connected: false, 
          groqReady: false,
          topicModeling: false,
          invertedIndex: false,
          irEvaluator: false
        });
      }
    };
    
    checkBackend();
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Build inverted index when we have papers
  useEffect(() => {
    const buildIndexIfNeeded = async () => {
      if (papers.length >= 5 && !indexBuilt && backendStatus.connected && !useFallback) {
        try {
          setBuildingIndex(true);
          console.log('Building inverted index with', papers.length, 'papers');
          const result = await buildInvertedIndex(papers);
          if (result.success) {
            setIndexBuilt(true);
            setIrStats(result.stats);
            console.log('✅ Inverted index built:', result.message);
          }
        } catch (error) {
          console.error('Failed to build index:', error);
        } finally {
          setBuildingIndex(false);
        }
      }
    };

    if (!useFallback) {
      buildIndexIfNeeded();
    }
  }, [papers, indexBuilt, backendStatus.connected, useFallback]);

  // Run topic analysis when we have enough papers
  useEffect(() => {
    const analyzeTopics = async () => {
      if (papers.length >= 3 && backendStatus.connected && !useFallback) {
        setAnalyzingTopics(true);
        try {
          const result = await analyzeTopicsLDA(papers);
          setTopicAnalysis(result);
        } catch (error) {
          console.error('Topic analysis failed:', error);
        } finally {
          setAnalyzingTopics(false);
        }
      }
    };

    if (!useFallback && papers.length >= 3) {
      analyzeTopics();
    }
  }, [papers, backendStatus.connected, useFallback]);

  // Fetch real papers on search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.searchAlgorithm]);

  // Perform search with IR capabilities
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setPapers(fallbackPapers);
      setUseFallback(true);
      setTopicAnalysis(null);
      setTrendAnalysisData(null);
      setIrSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    setTopicAnalysis(null);
    setTrendAnalysisData(null);
    setIrSearchResults(null);
    
    try {
      console.log('Searching for:', searchTerm, 'with algorithm:', filters.searchAlgorithm);
      
      // Use IR search if algorithm is not hybrid and index is built
      if (filters.searchAlgorithm !== 'hybrid' && indexBuilt) {
        console.log('Using IR search algorithm:', filters.searchAlgorithm);
        
        const useTfIdf = filters.searchAlgorithm === 'tfidf';
        const operator = filters.queryOperator || 'OR';
        
        const irResult = await irSearch({
          query: searchTerm,
          operator: operator,
          limit: filters.limit || 20,
          useTfIdf: useTfIdf
        });
        
        console.log('IR search returned:', irResult.count, 'results');
        
        if (irResult.results && irResult.results.length > 0) {
          // Format results for display
          const formattedPapers = irResult.results.map((result, index) => ({
            id: result.id || `ir-${Date.now()}-${index}`,
            title: result.title || 'No Title',
            authors: result.authors || ['Unknown'],
            abstract: result.abstract || 'No abstract available',
            year: result.year || new Date().getFullYear(),
            citations: result.citations || 0,
            journal: result.venue || result.journal || 'Unknown',
            venue: result.venue || 'Unknown',
            category: result.category || 'AI/ML',
            pdfUrl: '#',
            source: result.source || 'IR Search',
            keywords: result.keywords || [],
            color: getPaperColor(index),
            score: result.score, // TF-IDF score
            matchedTerms: result.matchedTerms || [], // Terms matched
            operator: result.operator,
            queryTerms: result.queryTerms
          }));
          
          setPapers(formattedPapers);
          setUseFallback(false);
          setIrSearchResults(irResult);
          
          // Run topic analysis on results
          if (formattedPapers.length >= 3) {
            try {
              const topicResult = await analyzeTopicsLDA(formattedPapers);
              setTopicAnalysis(topicResult);
            } catch (topicError) {
              console.log('Topic analysis skipped:', topicError.message);
            }
          }
        } else {
          // Fall back to enhanced search
          await performEnhancedSearch();
        }
      } else {
        // Use enhanced search (hybrid or when no index)
        await performEnhancedSearch();
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to API. Using sample papers.');
      setPapers(fallbackPapers);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search function
  const performEnhancedSearch = async () => {
    try {
      const searchOptions = {
        useAI: backendStatus.groqReady,
        analyzeTopics: true,
        numTopics: 5,
        maxResults: filters.limit || 20
      };
      
      const searchResult = await enhancedSearch(searchTerm, 'all', searchOptions);
      console.log('Enhanced search returned:', searchResult.totalResults, 'papers');
      
      if (searchResult.papers && searchResult.papers.length > 0) {
        const coloredPapers = searchResult.papers.map((paper, index) => ({
          ...paper,
          color: getPaperColor(index),
          keywords: paper.keywords || paper.categories || [],
          venue: paper.venue || paper.journal || 'Unknown'
        }));
        
        setPapers(coloredPapers);
        setUseFallback(false);
        
        if (searchResult.topics) {
          setTopicAnalysis(searchResult.topics);
        }
      } else {
        const filteredFallback = fallbackPapers.filter(paper =>
          paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
          paper.keywords.some(kw => kw.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        setPapers(filteredFallback.length > 0 ? filteredFallback : fallbackPapers);
        setUseFallback(true);
        setError('No papers found from API. Showing sample papers.');
      }
    } catch (err) {
      throw err;
    }
  };

  // Color generator for papers
  const getPaperColor = (index) => {
    const colors = [
      "bg-gradient-to-r from-emerald-500 to-teal-400",
      "bg-gradient-to-r from-blue-500 to-cyan-400",
      "bg-gradient-to-r from-purple-500 to-pink-400",
      "bg-gradient-to-r from-orange-500 to-amber-400",
      "bg-gradient-to-r from-rose-500 to-pink-400",
      "bg-gradient-to-r from-indigo-500 to-violet-400",
      "bg-gradient-to-r from-teal-500 to-emerald-400",
      "bg-gradient-to-r from-amber-500 to-yellow-400",
      "bg-gradient-to-r from-fuchsia-500 to-pink-400",
      "bg-gradient-to-r from-sky-500 to-blue-400"
    ];
    return colors[index % colors.length];
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const clearFilters = () => {
    setFilters({
      year: 'All',
      venue: 'All',
      author: '',
      category: 'All',
      minCitations: 0,
      searchAlgorithm: 'hybrid',
      queryOperator: 'OR',
      sortBy: 'relevance',
      limit: 20
    });
    setPapers(fallbackPapers);
    setUseFallback(true);
    setTopicAnalysis(null);
    setTrendAnalysisData(null);
    setSelectedPaper(null);
    setIrSearchResults(null);
  };

  const handlePaperSelect = (paper) => {
    setSelectedPaper(paper);
  };

  // Filter papers based on current filters
  const filteredPapers = useMemo(() => {
    let filtered = [...papers];

    // Apply additional filters
    if (filters.year !== 'All') {
      filtered = filtered.filter(paper => paper.year == filters.year);
    }
    
    if (filters.venue !== 'All') {
      filtered = filtered.filter(paper => {
        const venue = paper.venue || paper.journal || '';
        return venue.toLowerCase().includes(filters.venue.toLowerCase());
      });
    }
    
    if (filters.author.trim() !== '') {
      filtered = filtered.filter(paper => 
        paper.authors?.some(author => 
          author.toLowerCase().includes(filters.author.toLowerCase())
        )
      );
    }
    
    if (filters.category !== 'All') {
      filtered = filtered.filter(paper => paper.category === filters.category);
    }
    
    if (filters.minCitations > 0) {
      filtered = filtered.filter(paper => paper.citations >= filters.minCitations);
    }

    // Apply sorting
    if (filters.sortBy === 'citations') {
      filtered.sort((a, b) => b.citations - a.citations);
    } else if (filters.sortBy === 'year') {
      filtered.sort((a, b) => b.year - a.year);
    } else if (filters.sortBy === 'title') {
      filtered.sort((a, b) => a.title?.localeCompare(b.title));
    } else if (filters.sortBy === 'score' && irSearchResults) {
      // Sort by IR score if available
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (filters.sortBy === 'relevance' && irSearchResults) {
      // Keep original IR ranking for relevance
      // No sorting needed
    }

    return filtered.slice(0, filters.limit || 20);
  }, [papers, filters, irSearchResults]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    if (papers.length === 0) {
      return { venues: [], categories: [], years: [] };
    }
    
    const allVenues = papers.map(p => p.venue || p.journal).filter(Boolean);
    const venues = [...new Set(allVenues)].sort();
    const categories = [...new Set(papers.map(p => p.category).filter(Boolean))].sort();
    const years = [...new Set(papers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
    
    return { venues, categories, years };
  }, [papers]);

  // IR Feature Functions
  const runIREvaluationFunc = async () => {
    try {
      const results = await runIREvaluation();
      setIrEvaluation(results);
      console.log('IR Evaluation results:', results.summary);
    } catch (error) {
      console.error('IR Evaluation failed:', error);
      setError('IR Evaluation failed. Build index first.');
    }
  };

  const runSearchComparison = async () => {
    if (!searchTerm.trim()) {
      setError('Enter a search query to compare algorithms');
      return;
    }
    
    try {
      const comparison = await compareSearchAlgorithms({ query: searchTerm });
      setSearchComparison(comparison);
      console.log('Search comparison:', comparison);
    } catch (error) {
      console.error('Search comparison failed:', error);
      setError('Search comparison failed.');
    }
  };

  const fetchPrecisionRecallData = async () => {
    try {
      const data = await getPrecisionRecallData();
      setPrecisionRecallData(data.data || []);
    } catch (error) {
      console.error('Precision-recall data failed:', error);
    }
  };

  const buildIndexNow = async () => {
    if (papers.length < 3) {
      setError('Need at least 3 papers to build index');
      return;
    }
    
    setBuildingIndex(true);
    try {
      const result = await buildInvertedIndex(papers);
      if (result.success) {
        setIndexBuilt(true);
        setIrStats(result.stats);
        setError(null);
      } else {
        setError('Failed to build index: ' + result.message);
      }
    } catch (error) {
      console.error('Build index failed:', error);
      setError('Build index failed: ' + error.message);
    } finally {
      setBuildingIndex(false);
    }
  };

  // Manual trigger for topic analysis
  const runTopicAnalysis = async () => {
    if (filteredPapers.length < 3) {
      setError('Need at least 3 papers for topic analysis');
      return;
    }
    
    setAnalyzingTopics(true);
    try {
      const result = await analyzeTopicsLDA(filteredPapers);
      setTopicAnalysis(result);
    } catch (error) {
      console.error('Topic analysis error:', error);
      setError('Failed to analyze topics. Please try again.');
    } finally {
      setAnalyzingTopics(false);
    }
  };

  // Handle trend analysis data update
  const handleTrendAnalysisUpdate = (trendData) => {
    setTrendAnalysisData(trendData);
  };

  // Quick search examples
  const quickSearches = [
    { label: "Machine Learning", query: "machine learning", algorithm: "tfidf" },
    { label: "Transformers", query: "transformer attention", algorithm: "bm25" },
    { label: "Computer Vision", query: "computer vision deep learning", algorithm: "tfidf" },
    { label: "NLP", query: "natural language processing", algorithm: "tf" },
    { label: "AI Ethics", query: "artificial intelligence ethics", algorithm: "hybrid" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
      <Header 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
        backendConnected={backendStatus.connected}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters & Controls */}
          <div className="lg:w-1/4 space-y-6">
            <SearchFilters
              filters={filters}
              setFilters={setFilters}
              venues={filterOptions.venues}
              categories={filterOptions.categories}
              years={filterOptions.years}
              onClear={clearFilters}
            />
            
            {/* System Status Panel */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Backend:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    backendStatus.connected 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {backendStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">AI Service:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    backendStatus.groqReady 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {backendStatus.groqReady ? `Groq Ready (${aiModel || 'llama3'})` : 'Setup Required'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">IR Index:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    indexBuilt 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {indexBuilt ? `Built (${irStats?.totalDocuments || 0} docs)` : 'Not Built'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Data Source:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    useFallback 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {useFallback ? 'Sample Data' : 'Live API'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Current Papers:</span>
                  <span className="text-white font-medium">{filteredPapers.length}</span>
                </div>
                
                {/* IR Stats if available */}
                {irStats && indexBuilt && (
                  <>
                    <div className="pt-3 border-t border-gray-700 mt-3">
                      <div className="text-gray-300 text-sm font-medium mb-2">Index Statistics:</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Terms:</span>
                          <span className="text-blue-300">{irStats.totalTerms}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Postings:</span>
                          <span className="text-purple-300">{irStats.totalPostings}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Avg Doc Length:</span>
                          <span className="text-emerald-300">{irStats.averageDocumentLength} tokens</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="space-y-2">
                  <button
                    onClick={() => searchTerm ? performSearch() : setPapers(fallbackPapers)}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : (searchTerm ? 'Search Again' : 'Reset to Default')}
                  </button>
                  
                  {!indexBuilt && filteredPapers.length >= 3 && (
                    <button
                      onClick={buildIndexNow}
                      disabled={buildingIndex}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {buildingIndex ? 'Building Index...' : '🔨 Build IR Index'}
                    </button>
                  )}
                  
                  {filteredPapers.length >= 3 && (
                    <button
                      onClick={runTopicAnalysis}
                      disabled={analyzingTopics}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      {analyzingTopics ? 'Analyzing Topics...' : '📊 Run LDA Topic Analysis'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowIRDashboard(!showIRDashboard)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    {showIRDashboard ? 'Hide IR Dashboard' : '🧠 Show IR Analytics'}
                  </button>
                  
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    {showAdvanced ? 'Hide Advanced Features' : 'Show Advanced Features'}
                  </button>
                </div>
              </div>
              
              {/* Quick Search Suggestions */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-gray-300 text-sm font-medium mb-3">Quick Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchTerm(search.query);
                        setFilters(prev => ({ ...prev, searchAlgorithm: search.algorithm }));
                        setTimeout(() => performSearch(), 100);
                      }}
                      className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all hover:border-emerald-500/50 hover:text-emerald-300"
                      title={`Uses ${search.algorithm.toUpperCase()} algorithm`}
                    >
                      {search.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Academic Explorer 2.0
                    <span className="text-emerald-300 ml-2 text-xl">• IR Engine + AI Analytics</span>
                  </h1>
                  <p className="text-gray-400 mt-2">Information Retrieval System with Inverted Index, TF-IDF, BM25 & LDA Topic Modeling</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className={`px-3 py-1.5 rounded-full border ${
                    backendStatus.connected 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    <p className="text-sm font-medium">
                      Backend: {backendStatus.connected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  
                  {backendStatus.groqReady && (
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full">
                      <p className="text-sm font-medium">
                        Groq AI: Active
                      </p>
                    </div>
                  )}
                  
                  {indexBuilt && (
                    <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full">
                      <p className="text-sm font-medium">
                        IR Index: Built
                      </p>
                    </div>
                  )}
                  
                  {useFallback && (
                    <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full">
                      <p className="text-sm font-medium">
                        Sample Data
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <p className="text-gray-300">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      {indexBuilt && filters.searchAlgorithm !== 'hybrid' ? 'Searching with IR Engine...' : 'Searching databases...'}
                    </span>
                  ) : (
                    <span>
                      Found <span className="text-white font-bold">{filteredPapers.length}</span> papers
                      {searchTerm && ` for "${searchTerm}"`}
                      {irSearchResults && (
                        <span className="text-indigo-300 ml-2">
                          • IR Score: {filteredPapers[0]?.score?.toFixed(4) || 'N/A'}
                        </span>
                      )}
                      {topicAnalysis && ` • ${topicAnalysis.topics?.length || 0} topics identified`}
                    </span>
                  )}
                </p>
                
                {filteredPapers.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Click any paper for details and AI analysis
                    </span>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    {error}
                  </p>
                </div>
              )}
            </div>
            
            {/* IR Dashboard Section */}
            {showIRDashboard && (
              <div className="mb-8">
                <IRDashboard 
                  papers={filteredPapers}
                  irStats={irStats}
                  irEvaluation={irEvaluation}
                  precisionRecallData={precisionRecallData}
                  searchComparison={searchComparison}
                  onBuildIndex={buildIndexNow}
                  onRunEvaluation={runIREvaluationFunc}
                  onRunComparison={runSearchComparison}
                  onGetPrecisionRecall={fetchPrecisionRecallData}
                  indexBuilt={indexBuilt}
                  buildingIndex={buildingIndex}
                />
              </div>
            )}
            
            {loading ? (
              <LoadingSpinner />
            ) : filteredPapers.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 text-center border border-gray-700">
                <div className="text-white text-xl mb-4">No papers found. Try a different search.</div>
                <p className="text-gray-400 mb-6">Search across arXiv and Semantic Scholar databases</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('machine learning transformer');
                      setFilters(prev => ({ ...prev, searchAlgorithm: 'tfidf' }));
                      setTimeout(() => performSearch(), 100);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Search "Machine Learning" (TF-IDF)
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('artificial intelligence neural networks');
                      setFilters(prev => ({ ...prev, searchAlgorithm: 'bm25' }));
                      setTimeout(() => performSearch(), 100);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    Search "AI Research" (BM25)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Algorithm Info */}
                {filters.searchAlgorithm !== 'hybrid' && irSearchResults && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-indigo-300">🔍</span>
                        IR Search Results
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-xs text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded">
                          {filters.searchAlgorithm.toUpperCase()}
                        </span>
                        <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                          {filters.queryOperator} Operator
                        </span>
                        <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded">
                          Score: {filteredPapers[0]?.score?.toFixed(4) || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-400">Query</div>
                        <div className="text-sm text-white truncate">{irSearchResults.query}</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-400">Algorithm</div>
                        <div className={`text-sm font-medium ${
                          filters.searchAlgorithm === 'tfidf' ? 'text-indigo-300' :
                          filters.searchAlgorithm === 'bm25' ? 'text-purple-300' :
                          'text-blue-300'
                        }`}>
                          {filters.searchAlgorithm.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-400">Documents</div>
                        <div className="text-sm text-blue-300">{irSearchResults.stats?.totalDocuments || 0}</div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-xs text-gray-400">Index Terms</div>
                        <div className="text-sm text-purple-300">{irSearchResults.stats?.totalTerms || 0}</div>
                      </div>
                    </div>
                    {filteredPapers[0]?.matchedTerms && (
                      <div className="mt-3 text-xs text-gray-400">
                        Top paper matched terms: <span className="text-emerald-300">{filteredPapers[0].matchedTerms.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Papers Grid */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2 md:mb-0">
                      Research Papers
                      <span className="text-emerald-300 ml-2">({filteredPapers.length})</span>
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <div className="text-gray-400 text-sm bg-gray-800/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        {useFallback ? '📚 Sample Papers' : '🌐 Live API Results'}
                        {filters.searchAlgorithm !== 'hybrid' && (
                          <span className={`ml-2 ${
                            filters.searchAlgorithm === 'tfidf' ? 'text-indigo-300' :
                            filters.searchAlgorithm === 'bm25' ? 'text-purple-300' :
                            'text-blue-300'
                          }`}>
                            🔍 {filters.searchAlgorithm.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {topicAnalysis && (
                        <div className="text-purple-300 text-sm bg-purple-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          📊 {topicAnalysis.topics?.length || 0} Topics
                        </div>
                      )}
                      {irSearchResults && filteredPapers[0]?.score && (
                        <div className="text-emerald-300 text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          ⭐ Top Score: {filteredPapers[0].score.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPapers.map((paper, index) => (
                      <div 
                        key={paper.id} 
                        onClick={() => handlePaperSelect(paper)}
                        className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                      >
                        <PaperCard 
                          paper={paper} 
                          index={index} 
                          showScore={filters.searchAlgorithm !== 'hybrid'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Topic Analysis Section */}
                {topicAnalysis && topicAnalysis.topics && topicAnalysis.topics.length > 0 && (
                  <div className="mb-8">
                    <TopicAnalysis papers={filteredPapers} />
                  </div>
                )}
                
                {/* Selected Paper Details */}
                {selectedPaper && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Paper Details & AI Analysis</h3>
                        <p className="text-gray-400 mt-1 line-clamp-1">{selectedPaper.title}</p>
                      </div>
                      <button
                        onClick={() => setSelectedPaper(null)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
                      >
                        Close Details
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <SimilarPapers 
                        paper={selectedPaper}
                        allPapers={filteredPapers}
                      />
                      
                      <QAInterface 
                        selectedPaper={selectedPaper}
                        papers={filteredPapers}
                      />
                    </div>
                  </div>
                )}
                
                {/* Advanced Features */}
                {showAdvanced && filteredPapers.length > 0 && (
                  <div className="space-y-8">
                    <div className="border-t border-gray-700 pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">Advanced Analytics</h3>
                        <span className="text-emerald-300 text-sm bg-emerald-500/10 px-3 py-1 rounded-lg">
                          Powered by Groq AI + LDA
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CitationAnalysis papers={filteredPapers} />
                        
                        <TrendAnalysis 
                          papers={filteredPapers}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        clearFilters();
                        setSelectedPaper(null);
                        setTopicAnalysis(null);
                        setIrSearchResults(null);
                      }}
                      className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 font-medium"
                    >
                      Reset Search & Clear Filters
                    </button>
                    
                    {filteredPapers.length >= 3 && !topicAnalysis && (
                      <button
                        onClick={runTopicAnalysis}
                        disabled={analyzingTopics}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzingTopics ? 'Analyzing...' : '📊 Discover Topics with LDA'}
                      </button>
                    )}
                    
                    {!showIRDashboard && (
                      <button
                        onClick={() => setShowIRDashboard(true)}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                      >
                        🧠 Show IR Analytics Dashboard
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                    >
                      {showAdvanced ? 'Hide Advanced Analytics' : 'Show Advanced Analytics'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-400">Groq AI Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-purple-400">LDA Topic Modeling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-indigo-400">Inverted Index + TF-IDF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-blue-400">IR Evaluation Metrics</span>
              </div>
            </div>
            
            <p className="text-gray-500 text-sm">
              Academic Explorer 2.0 • Backend: localhost:5000 • Frontend: localhost:5173 • {new Date().getFullYear()}
            </p>
            <p className="text-gray-600 text-sm">
              {backendStatus.connected ? (
                <span className="text-emerald-400">✓ Backend Connected • </span>
              ) : (
                <span className="text-red-400">✗ Backend Disconnected • </span>
              )}
              AI Status: {backendStatus.groqReady ? (
                <span className="text-emerald-400">Groq Ready ({aiModel}) • </span>
              ) : (
                <span className="text-amber-400">Add API Key • </span>
              )}
              IR Index: {indexBuilt ? (
                <span className="text-indigo-400">Built ({irStats?.totalDocuments} docs) • </span>
              ) : (
                <span className="text-blue-400">Not Built • </span>
              )}
              LDA: {backendStatus.topicModeling ? (
                <span className="text-purple-400">Active</span>
              ) : (
                <span className="text-blue-400">Available</span>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;