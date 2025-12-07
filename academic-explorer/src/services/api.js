import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log(`📡 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('📡 Request Error:', error);
    return Promise.reject(error);
  }
);

// ==================== IR API FUNCTIONS ====================

export const buildInvertedIndex = async (papers) => {
  try {
    const response = await api.post('/ir/build-index', { papers });
    return response.data;
  } catch (error) {
    console.error('Build inverted index error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to build inverted index'
    };
  }
};

export const irSearch = async (params) => {
  try {
    const response = await api.post('/ir/search', params);
    return response.data;
  } catch (error) {
    console.error('IR search error:', error);
    return {
      query: params.query,
      count: 0,
      results: [],
      error: error.message,
      fallback: true,
      note: 'IR search failed. Using fallback search.'
    };
  }
};

export const runIREvaluation = async () => {
  try {
    const response = await api.get('/ir/evaluate');
    return response.data;
  } catch (error) {
    console.error('IR evaluation error:', error);
    return {
      success: false,
      error: error.message,
      queries: [],
      summary: {},
      note: 'IR evaluation failed. Build index first.'
    };
  }
};

export const getIRStats = async () => {
  try {
    const response = await api.get('/ir/stats');
    return response.data;
  } catch (error) {
    console.error('IR stats error:', error);
    return {
      hasIndex: false,
      totalDocuments: 0,
      totalTerms: 0,
      totalPostings: 0,
      error: error.message
    };
  }
};

export const compareSearchAlgorithms = async (params) => {
  try {
    const response = await api.post('/ir/compare', params);
    return response.data;
  } catch (error) {
    console.error('Search comparison error:', error);
    return {
      query: params.query,
      comparison: {},
      error: error.message
    };
  }
};

export const getPrecisionRecallData = async () => {
  try {
    const response = await api.get('/ir/precision-recall');
    return response.data;
  } catch (error) {
    console.error('Precision-recall data error:', error);
    return {
      data: [],
      queryCount: 0,
      totalPoints: 0,
      error: error.message
    };
  }
};

// ==================== SEARCH FUNCTIONS ====================

export const searchArXiv = async (query, maxResults = 20, sortBy = 'relevance') => {
  try {
    const response = await api.get('/search/arxiv', {
      params: { query, maxResults, sortBy }
    });
    return response.data;
  } catch (error) {
    console.error('arXiv API error:', error);
    throw error;
  }
};

export const searchSemanticScholar = async (query, limit = 20, fields = 'title,abstract,authors,year') => {
  try {
    const response = await api.get('/search/semantic', {
      params: { query, limit, fields }
    });
    return response.data;
  } catch (error) {
    console.error('Semantic Scholar API error:', error);
    throw error;
  }
};

// ==================== LDA TOPIC MODELING FUNCTIONS ====================

export const analyzeTopicsLDA = async (papers, numTopics = 5, termsPerTopic = 5) => {
  try {
    const response = await api.post('/ai/topics', {
      papers,
      numTopics,
      termsPerTopic
    });
    return response.data;
  } catch (error) {
    console.error('LDA topic analysis error:', error);
    return {
      topics: [],
      paperTopics: [],
      summary: 'LDA analysis requires at least 3 papers',
      totalPapers: papers.length,
      fallback: true,
      model: 'Simple LDA-like Topic Modeling'
    };
  }
};

// Alias for backward compatibility
export const analyzeTopics = async (papers, numTopics = 5) => {
  return analyzeTopicsLDA(papers, numTopics);
};

export const getPapersByTopic = async (topicId, papers) => {
  try {
    const response = await api.post(`/ai/topics/${topicId}/papers`, { papers });
    return response.data;
  } catch (error) {
    console.error('Get papers by topic error:', error);
    return {
      success: false,
      topicId,
      papers: [],
      count: 0,
      fallback: true
    };
  }
};

export const findSimilarByTopics = async (paper, papers, useLDA = true) => {
  try {
    if (useLDA) {
      const topicAnalysis = await analyzeTopicsLDA([paper, ...papers], 5);
      const paperTopic = topicAnalysis.paperTopics?.find(pt => pt.paperId === paper.id);
      
      if (paperTopic && paperTopic.topicDistribution) {
        const similarities = topicAnalysis.paperTopics
          .filter(pt => pt.paperId !== paper.id)
          .map(pt => {
            const vecA = paperTopic.topicDistribution;
            const vecB = pt.topicDistribution;
            let similarity = 0;
            
            if (vecA && vecB && vecA.length === vecB.length) {
              let dotProduct = 0;
              let normA = 0;
              let normB = 0;
              
              for (let i = 0; i < vecA.length; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
              }
              
              if (normA > 0 && normB > 0) {
                similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
              }
            }
            
            return {
              paper: papers.find(p => p.id === pt.paperId),
              similarity,
              sharedTopic: pt.dominantTopic
            };
          })
          .filter(item => item.paper && item.similarity > 0.1)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);
        
        return {
          similarPapers: similarities.map(s => s.paper),
          explanation: "Similar papers found using LDA topic modeling",
          scores: similarities.map(s => ({ id: s.paper.id, score: s.similarity })),
          method: 'LDA'
        };
      }
    }
    
    return findSimilarWithGroq(paper, papers);
  } catch (error) {
    console.error('Find similar by topics error:', error);
    return {
      similarPapers: papers.filter(p => p.id !== paper.id).slice(0, 3),
      explanation: "Similar papers based on basic topic matching.",
      scores: [],
      fallback: true
    };
  }
};

// ==================== GROQ AI FUNCTIONS ====================

export const askGroqQuestion = async (question, papers, context = '') => {
  try {
    const response = await api.post('/ai/qa', { 
      question, 
      papers,
      context
    });
    return response.data;
  } catch (error) {
    console.error('Groq QA error:', error);
    return {
      answer: "I couldn't connect to the Groq AI service. Please check if the backend server is running.",
      sources: [],
      confidence: 0,
      error: true,
      fallback: true,
      note: "Get a free Groq API key from: https://console.groq.com/keys"
    };
  }
};

export const summarizeWithGroq = async (paper, length = 'medium', includeBullets = true) => {
  try {
    const response = await api.post('/ai/summarize', { 
      paper, 
      length,
      includeBullets
    });
    return response.data;
  } catch (error) {
    console.error('Groq summarization error:', error);
    return {
      summary: paper.abstract?.substring(0, 200) + '... [Fallback summary]' || 'No summary available',
      keyPoints: [],
      length: 'short',
      fallback: true
    };
  }
};

export const analyzeTrendsWithGroq = async (papers, timeframe = 'all') => {
  try {
    const response = await api.post('/ai/trends', { 
      papers,
      timeframe 
    });
    return response.data;
  } catch (error) {
    console.error('Groq trend analysis error:', error);
    return {
      analysis: "Trend analysis unavailable. Using basic statistics.",
      fallback: true
    };
  }
};

export const findSimilarWithGroq = async (paper, papers) => {
  try {
    const response = await api.post('/ai/similar', { paper, papers });
    return response.data;
  } catch (error) {
    console.error('Groq similar papers error:', error);
    return {
      similarPapers: papers.filter(p => p.id !== paper.id).slice(0, 3),
      explanation: "Similar papers based on topic matching.",
      scores: [],
      fallback: true
    };
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString(),
      services: {
        groq: false,
        arxiv: false,
        semantic_scholar: false,
        topic_modeling: true,
        inverted_index: false,
        ir_evaluator: false
      },
      note: 'Backend server may not be running. Start with: node server.js in backend/ folder',
      troubleshooting: [
        '1. Check if backend server is running on port 5000',
        '2. Verify CORS settings in server.js',
        '3. Check network connectivity'
      ]
    };
  }
};

export const testGroqConnection = async () => {
  try {
    const response = await api.get('/health');
    if (response.data.services?.groq) {
      return {
        connected: true,
        model: response.data.model || 'llama-3.1-8b-instant',
        message: 'Groq AI is connected and ready',
        ai_status: response.data.ai_status || 'Active',
        rate_limit_note: response.data.rate_limit_note || '',
        inverted_index: response.data.inverted_index
      };
    } else {
      return {
        connected: false,
        message: 'Groq AI is not configured. Add API key to backend/.env',
        help: 'Get free key from: https://console.groq.com/keys',
        note: 'Using fallback responses for now'
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: 'Cannot connect to backend server',
      error: error.message,
      troubleshooting: [
        'Check if backend server is running: node server.js',
        'Verify server is on http://localhost:5000',
        'Check browser console for CORS errors'
      ]
    };
  }
};

export const testLDA = async () => {
  try {
    const dummyPapers = [
      {
        id: 'test-1',
        title: 'Machine Learning Approaches',
        abstract: 'This paper discusses various machine learning techniques and their applications.',
        year: 2023
      },
      {
        id: 'test-2',
        title: 'Deep Learning in Computer Vision',
        abstract: 'We explore deep learning models for image recognition and classification.',
        year: 2023
      },
      {
        id: 'test-3',
        title: 'Natural Language Processing Trends',
        abstract: 'Recent advances in NLP and transformer models are discussed.',
        year: 2023
      }
    ];
    
    const result = await analyzeTopicsLDA(dummyPapers, 2);
    
    return {
      available: true,
      message: 'LDA topic modeling is working',
      model: result.model || 'Simple LDA-like Topic Modeling',
      topicsFound: result.topics?.length || 0,
      status: 'ready'
    };
  } catch (error) {
    return {
      available: false,
      message: 'LDA topic modeling not available',
      error: error.message,
      requirements: ['Node.js backend with lda, natural, stopword packages']
    };
  }
};

// Test IR features
export const testIRFeatures = async () => {
  try {
    const health = await healthCheck();
    const irStats = await getIRStats();
    
    return {
      backend: health.status === 'healthy',
      irEnabled: health.services?.inverted_index || false,
      stats: irStats,
      endpoints: {
        buildIndex: '/api/ir/build-index',
        search: '/api/ir/search',
        evaluate: '/api/ir/evaluate',
        stats: '/api/ir/stats',
        compare: '/api/ir/compare'
      },
      requirements: 'Build index first with /api/ir/build-index'
    };
  } catch (error) {
    return {
      backend: false,
      irEnabled: false,
      error: error.message,
      note: 'IR features require backend server with inverted index implementation'
    };
  }
};

// ==================== SEARCH FUNCTIONS ====================

export const searchPapers = async (query, source = 'all', options = {}) => {
  const {
    maxResults = 20,
    yearRange = null,
    sortBy = 'relevance'
  } = options;
  
  const searchPromises = [];
  
  if (source === 'all' || source === 'arxiv') {
    searchPromises.push(searchArXiv(query, Math.floor(maxResults / 2), sortBy));
  }
  
  if (source === 'all' || source === 'semantic') {
    searchPromises.push(searchSemanticScholar(query, Math.floor(maxResults / 2)));
  }
  
  try {
    const results = await Promise.allSettled(searchPromises);
    const papers = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        papers.push(...result.value);
      }
    });
    
    // Filter by year range if specified
    let filteredPapers = papers;
    if (yearRange && yearRange.start && yearRange.end) {
      filteredPapers = papers.filter(paper => {
        const year = paper.year || new Date(paper.publishedDate)?.getFullYear() || new Date().getFullYear();
        return year >= yearRange.start && year <= yearRange.end;
      });
    }
    
    // Remove duplicates
    const uniquePapers = removeDuplicates(filteredPapers);
    
    // Sort by relevance/citations if requested
    if (sortBy === 'citations') {
      uniquePapers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    } else if (sortBy === 'date') {
      uniquePapers.sort((a, b) => {
        const dateA = new Date(b.publishedDate || b.year || 0);
        const dateB = new Date(a.publishedDate || a.year || 0);
        return dateA - dateB;
      });
    }
    
    return uniquePapers.slice(0, maxResults);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Enhanced search with LDA topic analysis
export const enhancedSearch = async (query, source = 'all', options = {}) => {
  const {
    useAI = false,
    analyzeTopics = false,
    numTopics = 5,
    maxResults = 20,
    useIR = false, // New option to use IR search
    searchAlgorithm = 'tfidf', // tfidf, tf, bm25
    operator = 'OR' // OR, AND
  } = options;
  
  try {
    let papers;
    
    // Use IR search if requested and available
    if (useIR) {
      try {
        const irResult = await irSearch({
          query,
          operator,
          limit: maxResults,
          useTfIdf: searchAlgorithm === 'tfidf'
        });
        
        if (irResult.results && irResult.results.length > 0) {
          papers = irResult.results.map(r => ({
            ...r,
            source: 'IR Search'
          }));
        } else {
          // Fallback to regular search
          papers = await searchPapers(query, source, { maxResults });
        }
      } catch (irError) {
        console.warn('IR search failed, using regular search:', irError);
        papers = await searchPapers(query, source, { maxResults });
      }
    } else {
      // Use regular search
      papers = await searchPapers(query, source, { maxResults });
    }
    
    const result = {
      papers,
      totalResults: papers.length,
      query,
      timestamp: new Date().toISOString(),
      source: useIR ? 'IR Search' : source,
      searchAlgorithm: useIR ? searchAlgorithm : 'hybrid',
      operator: useIR ? operator : 'N/A'
    };
    
    // Add AI insights if requested
    if (useAI && papers.length > 0) {
      try {
        const question = `Which of these papers are most relevant to "${query}" and why?`;
        const aiResponse = await askGroqQuestion(question, papers.slice(0, 5));
        
        result.aiInsights = aiResponse.answer;
        result.relevanceScore = aiResponse.confidence || 0.7;
        result.aiSources = aiResponse.sources || [];
        result.model = aiResponse.model;
      } catch (aiError) {
        console.warn('AI ranking failed:', aiError);
        result.aiError = aiError.message;
      }
    }
    
    // Add LDA topic analysis if requested
    if (analyzeTopics && papers.length >= 3) {
      try {
        const topics = await analyzeTopicsLDA(papers, numTopics);
        result.topics = topics;
        
        if (topics.topics && topics.topics.length > 0) {
          const topicSummary = topics.topics.map(topic => ({
            id: topic.id,
            label: topic.label,
            paperCount: topic.paperCount,
            percentage: topic.percentage,
            keyTerms: topic.dominantTerms?.map(t => t.term) || []
          }));
          
          result.topicSummary = topicSummary;
        }
      } catch (ldaError) {
        console.warn('LDA analysis failed:', ldaError);
        result.ldaError = ldaError.message;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Enhanced search error:', error);
    throw error;
  }
};

// ==================== ADVANCED FUNCTIONS ====================

export const batchSummarize = async (papers, maxPapers = 5, options = {}) => {
  const {
    includeTopics = false,
    includeSimilar = false
  } = options;
  
  if (!papers || papers.length === 0) return [];
  
  const papersToProcess = papers.slice(0, maxPapers);
  const summaries = [];
  
  for (const paper of papersToProcess) {
    try {
      const summaryData = await summarizeWithGroq(paper, 'medium', true);
      
      const summaryItem = {
        id: paper.id,
        title: paper.title,
        summary: summaryData.summary || summaryData,
        keyPoints: summaryData.keyPoints || [],
        authors: paper.authors,
        year: paper.year,
        citationCount: paper.citationCount || 0,
        source: paper.source || 'Unknown'
      };
      
      if (includeTopics && papers.length >= 3) {
        try {
          const topics = await analyzeTopicsLDA([paper], 2);
          if (topics.paperTopics && topics.paperTopics[0]) {
            summaryItem.topics = topics.paperTopics[0].topicScores || [];
            summaryItem.dominantTopic = topics.paperTopics[0].dominantTopic;
          }
        } catch (topicError) {
          console.warn(`Topic analysis failed for "${paper.title}":`, topicError);
        }
      }
      
      summaries.push(summaryItem);
    } catch (error) {
      console.error(`Failed to summarize "${paper.title}":`, error);
      summaries.push({
        id: paper.id,
        title: paper.title,
        summary: paper.abstract?.substring(0, 150) + '...' || 'No abstract available',
        keyPoints: [],
        error: true,
        errorMessage: error.message
      });
    }
  }
  
  return summaries;
};

export const comparePapers = async (papers, criteria = ['methodology', 'results', 'novelty']) => {
  if (!papers || papers.length < 2) {
    return {
      comparison: [],
      similarities: [],
      differences: [],
      note: 'Need at least 2 papers for comparison'
    };
  }
  
  try {
    const question = `Compare these ${papers.length} papers focusing on ${criteria.join(', ')}:\n\n${papers.map((p, i) => `${i+1}. ${p.title} (${p.year})`).join('\n')}`;
    
    const comparison = await askGroqQuestion(question, papers);
    
    let topicSimilarity = null;
    if (papers.length >= 3) {
      try {
        const topics = await analyzeTopicsLDA(papers, 3);
        topicSimilarity = {
          topicsFound: topics.topics?.length || 0,
          paperCount: topics.totalPapers || papers.length
        };
      } catch (ldaError) {
        // Silently fail - LDA is optional
      }
    }
    
    return {
      comparison: comparison.answer,
      sources: comparison.sources || [],
      confidence: comparison.confidence || 0.7,
      model: comparison.model,
      topicSimilarity,
      criteria,
      papers: papers.map(p => ({ id: p.id, title: p.title, year: p.year }))
    };
  } catch (error) {
    console.error('Paper comparison error:', error);
    return {
      comparison: "Comparison failed. Please try again.",
      error: true,
      fallback: true,
      note: "Make sure Groq AI is properly configured"
    };
  }
};

export const clusterPapersByTopics = async (papers, numClusters = 5) => {
  try {
    const topicAnalysis = await analyzeTopicsLDA(papers, numClusters);
    
    if (!topicAnalysis.topics || topicAnalysis.topics.length === 0) {
      return {
        clusters: [],
        summary: 'No clusters found',
        fallback: true
      };
    }
    
    const clusters = {};
    topicAnalysis.topics.forEach(topic => {
      clusters[topic.id] = {
        topic: topic.label,
        papers: [],
        keyTerms: topic.dominantTerms?.map(t => t.term) || []
      };
    });
    
    topicAnalysis.paperTopics?.forEach(pt => {
      if (pt.dominantTopic && clusters[pt.dominantTopic.id]) {
        const paper = papers.find(p => p.id === pt.paperId);
        if (paper) {
          clusters[pt.dominantTopic.id].papers.push(paper);
        }
      }
    });
    
    const nonEmptyClusters = {};
    Object.entries(clusters).forEach(([id, cluster]) => {
      if (cluster.papers.length > 0) {
        nonEmptyClusters[id] = cluster;
      }
    });
    
    return {
      clusters: nonEmptyClusters,
      totalClusters: Object.keys(nonEmptyClusters).length,
      totalPapers: papers.length,
      summary: `Found ${Object.keys(nonEmptyClusters).length} clusters among ${papers.length} papers`,
      model: topicAnalysis.model
    };
  } catch (error) {
    console.error('Paper clustering error:', error);
    return {
      clusters: {},
      summary: 'Clustering failed',
      error: true,
      fallback: true
    };
  }
};

// Quick search with LDA preview
export const quickSearchWithTopics = async (query, maxResults = 15) => {
  try {
    const papers = await searchPapers(query, 'all', { maxResults });
    
    if (papers.length >= 3) {
      try {
        const topics = await analyzeTopicsLDA(papers, 3);
        return {
          papers,
          topics: topics.topics?.slice(0, 3) || [],
          totalResults: papers.length,
          hasTopics: true
        };
      } catch (ldaError) {
        return {
          papers,
          totalResults: papers.length,
          hasTopics: false
        };
      }
    }
    
    return {
      papers,
      totalResults: papers.length,
      hasTopics: false
    };
  } catch (error) {
    console.error('Quick search error:', error);
    throw error;
  }
};

// Advanced search with IR and AI capabilities
export const advancedSearch = async (params) => {
  const {
    query,
    source = 'all',
    algorithm = 'tfidf',
    operator = 'OR',
    useAI = true,
    analyzeTopics = true,
    limit = 20
  } = params;
  
  try {
    // Try IR search first
    let searchResult;
    try {
      searchResult = await irSearch({
        query,
        operator,
        limit,
        useTfIdf: algorithm === 'tfidf'
      });
    } catch (irError) {
      console.warn('IR search failed, using regular search:', irError);
      searchResult = await enhancedSearch(query, source, { 
        maxResults: limit,
        useAI: false,
        analyzeTopics: false 
      });
    }
    
    const result = {
      query,
      algorithm,
      operator,
      totalResults: searchResult.count || searchResult.papers?.length || 0,
      papers: searchResult.results || searchResult.papers || [],
      searchDetails: searchResult.searchDetails || {},
      timestamp: new Date().toISOString()
    };
    
    // Add AI analysis if requested
    if (useAI && result.papers.length > 0) {
      try {
        const aiQuestion = `Provide a brief overview of the research area for "${query}" based on these papers.`;
        const aiResponse = await askGroqQuestion(aiQuestion, result.papers.slice(0, 5));
        
        result.aiAnalysis = aiResponse.answer;
        result.aiConfidence = aiResponse.confidence;
        result.aiModel = aiResponse.model;
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);
        result.aiError = aiError.message;
      }
    }
    
    // Add topic analysis if requested
    if (analyzeTopics && result.papers.length >= 3) {
      try {
        const topics = await analyzeTopicsLDA(result.papers, 5);
        result.topicAnalysis = topics;
      } catch (ldaError) {
        console.warn('Topic analysis failed:', ldaError);
        result.ldaError = ldaError.message;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Advanced search error:', error);
    return {
      query,
      error: error.message,
      papers: [],
      totalResults: 0,
      fallback: true
    };
  }
};

// Generate search comparison report
export const generateSearchComparisonReport = async (query) => {
  try {
    // Run different algorithms
    const algorithms = ['tfidf', 'tf', 'bm25'];
    const results = {};
    
    for (const algorithm of algorithms) {
      try {
        const searchResult = await irSearch({
          query,
          operator: 'OR',
          limit: 10,
          useTfIdf: algorithm === 'tfidf'
        });
        
        results[algorithm] = {
          count: searchResult.count || 0,
          topPapers: searchResult.results?.slice(0, 3).map(p => p.title) || [],
          averageScore: searchResult.results?.length > 0 
            ? searchResult.results.reduce((sum, r) => sum + (r.score || 0), 0) / searchResult.results.length 
            : 0
        };
      } catch (error) {
        results[algorithm] = { error: error.message };
      }
    }
    
    // Get AI comparison
    let aiComparison = null;
    try {
      const papers = results.tfidf?.topPapers?.map(title => ({ title })) || [];
      if (papers.length > 0) {
        const aiResponse = await askGroqQuestion(
          `Compare these search algorithms for query "${query}": TF-IDF, Simple TF, and BM25. Which would be most effective?`,
          []
        );
        aiComparison = aiResponse.answer;
      }
    } catch (aiError) {
      console.warn('AI comparison failed:', aiError);
    }
    
    return {
      query,
      algorithms,
      results,
      aiComparison,
      timestamp: new Date().toISOString(),
      summary: `Compared ${algorithms.length} search algorithms for "${query}"`
    };
  } catch (error) {
    console.error('Search comparison report error:', error);
    return {
      query,
      error: error.message,
      results: {},
      fallback: true
    };
  }
};

// Helper function to remove duplicates
const removeDuplicates = (papers) => {
  const seen = new Set();
  return papers.filter(paper => {
    const key = paper.id || paper.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ==================== EXPORT ALL FUNCTIONS ====================

export default {
  // IR Functions
  buildInvertedIndex,
  irSearch,
  runIREvaluation,
  getIRStats,
  compareSearchAlgorithms,
  getPrecisionRecallData,
  testIRFeatures,
  
  // Search functions
  searchArXiv,
  searchSemanticScholar,
  searchPapers,
  enhancedSearch,
  quickSearchWithTopics,
  advancedSearch,
  generateSearchComparisonReport,
  
  // LDA Topic Modeling Functions
  analyzeTopicsLDA,
  analyzeTopics, // Alias for backward compatibility
  getPapersByTopic,
  findSimilarByTopics,
  clusterPapersByTopics,
  
  // Groq AI functions
  askGroqQuestion,
  summarizeWithGroq,
  analyzeTrendsWithGroq,
  findSimilarWithGroq,
  batchSummarize,
  comparePapers,
  
  // Utility functions
  healthCheck,
  testGroqConnection,
  testLDA,
  
  // Constants
  API_BASE_URL,
  
  // Configuration
  config: {
    defaultMaxResults: 20,
    availableSources: ['arxiv', 'semantic', 'all'],
    searchAlgorithms: ['tfidf', 'tf', 'bm25', 'hybrid'],
    operators: ['AND', 'OR'],
    ldaMinPapers: 3,
    defaultTopics: 5,
    aiProvider: 'Groq',
    topicModeling: 'LDA (Latent Dirichlet Allocation)',
    irFeatures: {
      invertedIndex: 'Enabled',
      tfidfScoring: 'Enabled',
      bm25Scoring: 'Enabled',
      evaluationMetrics: 'Precision, Recall, F1, MAP, NDCG'
    }
  }
};