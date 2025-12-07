import lda from 'lda';
import natural from 'natural';
import sw from 'stopword';

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Preprocessing function
function preprocessText(text) {
  if (!text) return '';
  
  // Convert to lowercase
  let processed = text.toLowerCase();
  
  // Remove special characters and numbers
  processed = processed.replace(/[^\w\s]/g, ' ');
  processed = processed.replace(/\d+/g, ' ');
  
  // Tokenize
  let tokens = tokenizer.tokenize(processed);
  
  // Remove stopwords
  tokens = sw.removeStopwords(tokens);
  
  // Stemming
  tokens = tokens.map(token => stemmer.stem(token));
  
  // Filter short tokens
  tokens = tokens.filter(token => token.length > 2);
  
  return tokens.join(' ');
}

// Main LDA function
export function analyzeTopics(papers, numTopics = 5, termsPerTopic = 5) {
  if (!papers || papers.length === 0) {
    return {
      topics: [],
      paperTopics: [],
      summary: 'No papers available for topic modeling'
    };
  }

  // Prepare documents for LDA
  const documents = papers.map(paper => {
    const text = `${paper.title} ${paper.abstract} ${paper.keywords?.join(' ') || ''}`;
    return preprocessText(text);
  }).filter(doc => doc.trim().length > 0);

  if (documents.length < numTopics) {
    numTopics = Math.min(3, documents.length);
  }

  // Run LDA
  const result = lda(documents, numTopics, termsPerTopic);

  // Process topics
  const topics = result.map((topic, index) => {
    const terms = topic.map(term => ({
      term: term.term,
      probability: term.probability.toFixed(4)
    }));

    // Generate a meaningful topic label
    const topTerms = terms.slice(0, 3).map(t => t.term).join(', ');
    const label = `Topic ${index + 1}: ${topTerms}`;

    return {
      id: `topic-${index}`,
      label,
      terms,
      dominantTerms: terms.slice(0, 3),
      topicIndex: index
    };
  });

  // Assign topics to papers
  const paperTopics = papers.map((paper, paperIndex) => {
    if (paperIndex < documents.length) {
      // Calculate topic distribution for this paper
      const topicScores = new Array(numTopics).fill(0);
      const paperText = documents[paperIndex];
      const paperTokens = paperText.split(' ');
      
      result.forEach((topic, topicIndex) => {
        topic.forEach(termObj => {
          if (paperTokens.includes(termObj.term)) {
            topicScores[topicIndex] += termObj.probability;
          }
        });
      });

      // Find dominant topic
      let dominantTopicIndex = 0;
      let maxScore = 0;
      topicScores.forEach((score, idx) => {
        if (score > maxScore) {
          maxScore = score;
          dominantTopicIndex = idx;
        }
      });

      return {
        paperId: paper.id,
        paperTitle: paper.title,
        dominantTopic: topics[dominantTopicIndex],
        topicScores: topicScores.map((score, idx) => ({
          topic: topics[idx],
          score: parseFloat(score.toFixed(4))
        })),
        topicDistribution: topicScores
      };
    }
    
    return {
      paperId: paper.id,
      paperTitle: paper.title,
      dominantTopic: null,
      topicScores: [],
      topicDistribution: []
    };
  });

  // Calculate topic statistics
  const topicStats = topics.map((topic, topicIndex) => {
    const papersInTopic = paperTopics.filter(pt => 
      pt.dominantTopic?.id === topic.id
    ).length;
    
    const citationsInTopic = papers.reduce((sum, paper, idx) => {
      if (paperTopics[idx]?.dominantTopic?.id === topic.id) {
        return sum + (paper.citations || 0);
      }
      return sum;
    }, 0);

    return {
      ...topic,
      paperCount: papersInTopic,
      avgCitations: papersInTopic > 0 ? (citationsInTopic / papersInTopic).toFixed(1) : 0,
      percentage: ((papersInTopic / papers.length) * 100).toFixed(1)
    };
  });

  return {
    topics: topicStats,
    paperTopics,
    totalPapers: papers.length,
    summary: `Identified ${numTopics} topics across ${papers.length} papers`
  };
}

// Function to get papers by topic
export function getPapersByTopic(papers, topicAnalysis, topicId) {
  const paperTopics = topicAnalysis.paperTopics || [];
  const relevantPapers = paperTopics
    .filter(pt => pt.dominantTopic?.id === topicId)
    .map(pt => papers.find(p => p.id === pt.paperId))
    .filter(Boolean);

  return relevantPapers;
}

// Function to find similar papers using topic modeling
export function findSimilarByTopic(paper, papers, topicAnalysis) {
  const paperTopics = topicAnalysis.paperTopics || [];
  const currentPaper = paperTopics.find(pt => pt.paperId === paper.id);
  
  if (!currentPaper || !currentPaper.topicDistribution) {
    return [];
  }

  // Calculate similarity based on topic distribution
  const similarities = paperTopics
    .filter(pt => pt.paperId !== paper.id)
    .map(pt => {
      const similarity = cosineSimilarity(
        currentPaper.topicDistribution,
        pt.topicDistribution
      );
      return {
        paper: papers.find(p => p.id === pt.paperId),
        similarity,
        sharedTopics: getSharedTopics(currentPaper, pt)
      };
    })
    .filter(item => item.paper && item.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  return similarities;
}

// Helper: Cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Get shared topics
function getSharedTopics(paperA, paperB) {
  if (!paperA.topicScores || !paperB.topicScores) return [];
  
  const shared = [];
  for (let i = 0; i < Math.min(paperA.topicScores.length, paperB.topicScores.length); i++) {
    if (paperA.topicScores[i].score > 0.1 && paperB.topicScores[i].score > 0.1) {
      shared.push({
        topic: paperA.topicScores[i].topic,
        scoreA: paperA.topicScores[i].score,
        scoreB: paperB.topicScores[i].score
      });
    }
  }
  return shared;
}