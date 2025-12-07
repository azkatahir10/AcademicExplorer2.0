import { 
  askGroqQuestion, 
  summarizeWithGroq, 
  analyzeTrendsWithGroq, 
  findSimilarWithGroq 
} from './api';

// Real BM25 Implementation
export class BM25Search {
  constructor(papers) {
    this.papers = papers;
    this.k1 = 1.5;
    this.b = 0.75;
    this.buildIndex();
  }

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  buildIndex() {
    this.documents = this.papers.map(paper => ({
      id: paper.id,
      text: `${paper.title} ${paper.abstract} ${paper.authors?.join(' ')} ${paper.keywords?.join(' ') || ''}`,
      tokens: this.tokenize(`${paper.title} ${paper.abstract} ${paper.authors?.join(' ')} ${paper.keywords?.join(' ') || ''}`),
      paper: paper
    }));

    const N = this.documents.length;
    this.avgdl = this.documents.reduce((sum, doc) => sum + doc.tokens.length, 0) / N;

    // Calculate document frequency
    this.docFreq = {};
    this.wordFreq = new Array(N).fill().map(() => ({}));

    this.documents.forEach((doc, docIndex) => {
      const wordCount = {};
      doc.tokens.forEach(token => {
        wordCount[token] = (wordCount[token] || 0) + 1;
        if (!this.docFreq[token]) {
          this.docFreq[token] = new Set();
        }
        this.docFreq[token].add(docIndex);
      });
      this.wordFreq[docIndex] = wordCount;
    });

    // Calculate IDF
    this.idf = {};
    for (const [term, docSet] of Object.entries(this.docFreq)) {
      this.idf[term] = Math.log((N - docSet.size + 0.5) / (docSet.size + 0.5) + 1);
    }
  }

  search(query, filters = {}) {
    if (!query || query.trim() === '') {
      return this.applyFilters(this.papers.map(p => ({ ...p, bm25Score: 0 })), filters);
    }

    const queryTokens = this.tokenize(query);
    const scores = new Array(this.documents.length).fill(0);

    queryTokens.forEach(term => {
      if (!this.idf[term]) return;

      const idf = this.idf[term];
      
      this.documents.forEach((doc, docIndex) => {
        const tf = (this.wordFreq[docIndex][term] || 0);
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (doc.tokens.length / this.avgdl));
        const score = idf * (numerator / denominator);
        
        scores[docIndex] += score;
      });
    });

    let results = scores
      .map((score, index) => ({ 
        ...this.documents[index].paper, 
        bm25Score: score 
      }))
      .filter(result => result.bm25Score > 0)
      .sort((a, b) => b.bm25Score - a.bm25Score);

    // Apply filters
    results = this.applyFilters(results, filters);
    
    return results;
  }

  applyFilters(results, filters) {
    let filtered = results;

    if (filters.year && filters.year !== 'All') {
      filtered = filtered.filter(paper => paper.year == filters.year);
    }

    if (filters.venue && filters.venue !== 'All') {
      filtered = filtered.filter(paper =>
        paper.journal?.toLowerCase().includes(filters.venue.toLowerCase())
      );
    }

    if (filters.author && filters.author.trim() !== '') {
      filtered = filtered.filter(paper =>
        paper.authors?.some(author =>
          author.toLowerCase().includes(filters.author.toLowerCase())
        )
      );
    }

    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(paper => paper.category === filters.category);
    }

    if (filters.minCitations && filters.minCitations > 0) {
      filtered = filtered.filter(paper => paper.citations >= filters.minCitations);
    }

    return filtered;
  }
}

// Enhanced citation analysis function
export const getCitationStats = (papers) => {
  if (!papers || papers.length === 0) {
    return null;
  }

  // Filter papers with valid citation data
  const validPapers = papers.filter(p => typeof p.citations === 'number' && p.citations >= 0);
  
  if (validPapers.length === 0) {
    return {
      totalCitations: 0,
      averageCitations: 0,
      hIndex: 0,
      mostCitedPaper: null,
      citationTrend: 'no data',
      paperCount: 0,
      maxCitations: 0,
      minCitations: 0,
      citationDistribution: {},
      topCategories: [],
      performanceLevel: 'no data'
    };
  }

  const citations = validPapers.map(p => p.citations || 0);
  const totalCitations = citations.reduce((sum, val) => sum + val, 0);
  const averageCitations = totalCitations / validPapers.length;
  
  // Calculate h-index
  const sortedCitations = [...citations].sort((a, b) => b - a);
  let hIndex = 0;
  for (let i = 0; i < sortedCitations.length; i++) {
    if (sortedCitations[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Find most cited paper
  const mostCitedPaper = validPapers.reduce((max, paper) => 
    (paper.citations || 0) > (max.citations || 0) ? paper : max, validPapers[0]);
  
  // Calculate citation distribution
  const citationDistribution = validPapers.reduce((dist, paper) => {
    const citations = paper.citations || 0;
    let range;
    if (citations === 0) range = '0';
    else if (citations <= 10) range = '1-10';
    else if (citations <= 50) range = '11-50';
    else if (citations <= 100) range = '51-100';
    else if (citations <= 500) range = '101-500';
    else range = '500+';
    
    dist[range] = (dist[range] || 0) + 1;
    return dist;
  }, {});
  
  // Analyze categories
  const categories = {};
  validPapers.forEach(paper => {
    const cat = paper.category || 'Unknown';
    if (!categories[cat]) {
      categories[cat] = { count: 0, totalCitations: 0, papers: [] };
    }
    categories[cat].count++;
    categories[cat].totalCitations += paper.citations || 0;
    categories[cat].papers.push(paper);
  });
  
  // Convert to array and calculate averages
  const topCategories = Object.entries(categories)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgCitations: data.totalCitations / data.count,
      totalCitations: data.totalCitations,
      topPaper: data.papers.reduce((max, p) => p.citations > max.citations ? p : max, data.papers[0])
    }))
    .sort((a, b) => b.avgCitations - a.avgCitations)
    .slice(0, 5);
  
  // Determine trend
  let citationTrend = 'stable';
  let performanceLevel = 'Low';
  let trendColor = 'text-blue-500';
  
  if (averageCitations > 50) {
    citationTrend = 'growing';
    performanceLevel = 'Excellent';
    trendColor = 'text-emerald-500';
  } else if (averageCitations > 20) {
    citationTrend = 'growing';
    performanceLevel = 'Good';
    trendColor = 'text-blue-500';
  } else if (averageCitations > 5) {
    citationTrend = 'stable';
    performanceLevel = 'Average';
    trendColor = 'text-yellow-500';
  } else {
    citationTrend = 'declining';
    performanceLevel = 'Low';
    trendColor = 'text-red-500';
  }
  
  // Calculate impact score (0-100)
  const impactScore = Math.min(100, Math.round((averageCitations / 100) * 100));
  
  // Find trending papers (recent papers with high citation velocity)
  const currentYear = new Date().getFullYear();
  const trendingPapers = validPapers
    .filter(p => p.year && p.year >= currentYear - 3) // Last 3 years
    .map(p => ({
      ...p,
      citationVelocity: p.citations / (currentYear - p.year + 1)
    }))
    .sort((a, b) => b.citationVelocity - a.citationVelocity)
    .slice(0, 5);
  
  return {
    // Basic metrics
    totalCitations,
    averageCitations: parseFloat(averageCitations.toFixed(1)),
    hIndex,
    maxCitations: Math.max(...citations),
    minCitations: Math.min(...citations),
    
    // Papers
    mostCitedPaper,
    trendingPapers,
    paperCount: validPapers.length,
    
    // Analysis
    topCategories,
    citationDistribution,
    citationTrend,
    performanceLevel,
    trendColor,
    impactScore,
    
    // Derived metrics
    citationRate: averageCitations > 0 ? (totalCitations / validPapers.length).toFixed(1) : '0.0',
    citationDensity: (totalCitations / validPapers.length).toFixed(2),
    
    // Additional insights
    citationInsights: {
      hasHighlyCited: citations.some(c => c > 100),
      hasRecentImpact: trendingPapers.length > 0,
      categoryDominance: topCategories[0]?.avgCitations > (averageCitations * 2),
      citationSpread: (Math.max(...citations) - Math.min(...citations)) > 100
    }
  };
};

// Production-ready search system with Groq AI
export const createSearchSystem = (papers) => {
  const bm25Search = new BM25Search(papers);
  
  return {
    bm25Search,
    
    // Real search with BM25
    search: (query, filters) => bm25Search.search(query, filters),
    
    // Enhanced citation stats
    getCitationStats: (papers) => getCitationStats(papers),
    
    // Groq AI Functions
    findSimilarPapers: async (paper, allPapers) => {
      try {
        const result = await findSimilarWithGroq(paper, allPapers);
        return result;
      } catch (error) {
        console.error('Error finding similar papers:', error);
        // Fallback to basic similarity
        const similar = allPapers
          .filter(p => p.id !== paper.id)
          .slice(0, 5)
          .map(p => ({ ...p, score: 0.5 }));
        
        return {
          similarPapers: similar,
          explanation: "Similar papers based on category matching (fallback).",
          scores: similar.map(p => ({ id: p.id, score: p.score })),
          fallback: true
        };
      }
    },
    
    answerQuestion: async (question, papers) => {
      try {
        const result = await askGroqQuestion(question, papers);
        return result;
      } catch (error) {
        console.error('Error answering question:', error);
        // Fallback answer
        const fallbackAnswer = papers.length > 0 
          ? `Based on the paper "${papers[0].title}", this research addresses ${question.toLowerCase()}. The paper discusses ${papers[0].abstract.substring(0, 150)}...`
          : `I couldn't access the AI service to answer "${question}". Please check your connection.`;
        
        return {
          answer: fallbackAnswer,
          sources: papers.slice(0, 3).map(p => p.title),
          confidence: 0.5,
          fallback: true
        };
      }
    },
    
    generateSummary: async (paper, length = 'medium') => {
      try {
        return await summarizeWithGroq(paper, length);
      } catch (error) {
        console.error('Error generating summary:', error);
        // Fallback summary
        return paper.abstract.substring(0, 200) + '... [Fallback summary]';
      }
    },
    
    analyzeTrends: async (papers) => {
      try {
        const result = await analyzeTrendsWithGroq(papers);
        return result;
      } catch (error) {
        console.error('Error analyzing trends:', error);
        // Fallback trend analysis
        const categories = {};
        papers.forEach(p => {
          categories[p.category] = (categories[p.category] || 0) + 1;
        });
        
        const topCategories = Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => `${name} (${count})`)
          .join(', ');
        
        return {
          analysis: `Based on ${papers.length} papers. Top categories: ${topCategories}.`,
          fallback: true
        };
      }
    },
    
    // Enhanced collaboration network analysis
    analyzeCollaborations: (papers) => {
      const authors = new Map();
      
      papers.forEach(paper => {
        paper.authors?.forEach(author => {
          if (!authors.has(author)) {
            authors.set(author, {
              papers: 0,
              citations: 0,
              collaborators: new Set(),
              categories: new Set(),
              years: new Set(),
              papersList: []
            });
          }
          
          const authorData = authors.get(author);
          authorData.papers++;
          authorData.citations += paper.citations || 0;
          authorData.categories.add(paper.category || 'Unknown');
          if (paper.year) authorData.years.add(paper.year);
          authorData.papersList.push({
            title: paper.title,
            citations: paper.citations || 0,
            year: paper.year
          });
          
          paper.authors?.forEach(collab => {
            if (collab !== author) {
              authorData.collaborators.add(collab);
            }
          });
        });
      });
      
      return Array.from(authors.entries())
        .map(([name, data]) => ({
          name,
          papers: data.papers,
          citations: data.citations,
          avgCitations: data.citations / data.papers,
          collaborators: data.collaborators.size,
          categories: Array.from(data.categories),
          careerSpan: data.years.size > 0 
            ? Math.max(...Array.from(data.years)) - Math.min(...Array.from(data.years)) + 1
            : 0,
          topPaper: data.papersList.sort((a, b) => b.citations - a.citations)[0],
          collaborationNetwork: Array.from(data.collaborators)
        }))
        .sort((a, b) => b.citations - a.citations)
        .slice(0, 20);
    },
    
    // Additional analysis functions
    
    // Paper timeline analysis
    analyzeTimeline: (papers) => {
      const timeline = {};
      
      papers.forEach(paper => {
        const year = paper.year || 'Unknown';
        if (!timeline[year]) {
          timeline[year] = {
            count: 0,
            citations: 0,
            papers: [],
            categories: new Set()
          };
        }
        
        timeline[year].count++;
        timeline[year].citations += paper.citations || 0;
        timeline[year].papers.push(paper);
        timeline[year].categories.add(paper.category || 'Unknown');
      });
      
      // Convert to array and sort
      return Object.entries(timeline)
        .map(([year, data]) => ({
          year,
          count: data.count,
          avgCitations: data.citations / data.count,
          topPaper: data.papers.sort((a, b) => b.citations - a.citations)[0],
          categories: Array.from(data.categories)
        }))
        .sort((a, b) => b.year - a.year);
    },
    
    // Research impact by venue
    analyzeVenues: (papers) => {
      const venues = {};
      
      papers.forEach(paper => {
        const venue = paper.journal || 'Unknown';
        if (!venues[venue]) {
          venues[venue] = {
            count: 0,
            citations: 0,
            papers: [],
            categories: new Set()
          };
        }
        
        venues[venue].count++;
        venues[venue].citations += paper.citations || 0;
        venues[venue].papers.push(paper);
        venues[venue].categories.add(paper.category || 'Unknown');
      });
      
      return Object.entries(venues)
        .map(([venue, data]) => ({
          venue,
          count: data.count,
          avgCitations: data.citations / data.count,
          topPaper: data.papers.sort((a, b) => b.citations - a.citations)[0],
          categories: Array.from(data.categories)
        }))
        .sort((a, b) => b.avgCitations - a.avgCitations)
        .slice(0, 10);
    },
    
    // Keyword analysis
    analyzeKeywords: (papers) => {
      const keywords = {};
      
      papers.forEach(paper => {
        const paperKeywords = paper.keywords || [];
        paperKeywords.forEach(keyword => {
          if (!keywords[keyword]) {
            keywords[keyword] = {
              count: 0,
              citations: 0,
              papers: []
            };
          }
          
          keywords[keyword].count++;
          keywords[keyword].citations += paper.citations || 0;
          keywords[keyword].papers.push(paper);
        });
      });
      
      return Object.entries(keywords)
        .map(([keyword, data]) => ({
          keyword,
          count: data.count,
          avgCitations: data.citations / data.count,
          papers: data.papers.length
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    }
  };
};

export default createSearchSystem;