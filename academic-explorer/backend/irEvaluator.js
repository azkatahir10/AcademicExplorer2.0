// backend/irEvaluator.js
const { getInvertedIndex } = require('./invertedIndex');

class IREvaluator {
    constructor() {
        this.testQueries = this.getTestQueries();
        this.relevanceJudgments = this.getRelevanceJudgments();
    }

    // Create synthetic test data based on your papers
    getTestQueries() {
        return [
            {
                id: "q1",
                text: "machine learning deep neural networks",
                description: "General ML papers"
            },
            {
                id: "q2",
                text: "transformer attention BERT NLP",
                description: "Transformer models in NLP"
            },
            {
                id: "q3",
                text: "reinforcement learning Q-learning",
                description: "Reinforcement learning papers"
            },
            {
                id: "q4",
                text: "computer vision object detection",
                description: "CV papers"
            },
            {
                id: "q5",
                text: "graph neural networks",
                description: "GNN papers"
            }
        ];
    }

    // Simulate relevance judgments (in real scenario, you'd manually judge)
    getRelevanceJudgments() {
        // This is a simulation - in reality, you'd create this manually
        const judgments = {};
        
        // For each query, randomly assign relevance to some documents
        this.testQueries.forEach(query => {
            const index = getInvertedIndex();
            const results = index.search(query.text, { limit: 50, useTfIdf: false });
            
            // Simulate: first 3 results are highly relevant, next 3 somewhat relevant
            judgments[query.id] = {};
            results.forEach((doc, idx) => {
                if (idx < 3) {
                    judgments[query.id][doc.id] = 2; // Highly relevant
                } else if (idx < 6) {
                    judgments[query.id][doc.id] = 1; // Somewhat relevant
                } else if (idx < 10) {
                    judgments[query.id][doc.id] = 0; // Not relevant
                }
                // Beyond 10, not judged (considered not relevant)
            });
        });
        
        return judgments;
    }

    calculatePrecision(retrievedDocs, relevantDocs, k = 10) {
        const topK = retrievedDocs.slice(0, k);
        const relevantRetrieved = topK.filter(doc => 
            relevantDocs.includes(doc.id)
        ).length;
        
        return topK.length > 0 ? relevantRetrieved / topK.length : 0;
    }

    calculateRecall(retrievedDocs, relevantDocs, k = 10) {
        const topK = retrievedDocs.slice(0, k);
        const relevantRetrieved = topK.filter(doc => 
            relevantDocs.includes(doc.id)
        ).length;
        
        return relevantDocs.length > 0 ? relevantRetrieved / relevantDocs.length : 0;
    }

    calculateF1(precision, recall) {
        return precision + recall > 0 
            ? (2 * precision * recall) / (precision + recall) 
            : 0;
    }

    calculateAveragePrecision(retrievedDocs, relevantDocs) {
        let relevantCount = 0;
        let sumPrecision = 0;
        
        retrievedDocs.forEach((doc, idx) => {
            if (relevantDocs.includes(doc.id)) {
                relevantCount++;
                const precisionAtK = relevantCount / (idx + 1);
                sumPrecision += precisionAtK;
            }
        });
        
        return relevantDocs.length > 0 ? sumPrecision / relevantDocs.length : 0;
    }

    calculateNDCG(retrievedDocs, relevanceScores, k = 10) {
        // relevanceScores: map of docId -> relevance (2, 1, 0)
        let dcg = 0;
        
        // Calculate DCG@k
        retrievedDocs.slice(0, k).forEach((doc, i) => {
            const relevance = relevanceScores[doc.id] || 0;
            const rank = i + 1;
            dcg += relevance / Math.log2(rank + 1);
        });
        
        // Calculate Ideal DCG
        const idealRelevances = Object.values(relevanceScores)
            .sort((a, b) => b - a)
            .slice(0, k);
        
        let idcg = 0;
        idealRelevances.forEach((rel, i) => {
            const rank = i + 1;
            idcg += rel / Math.log2(rank + 1);
        });
        
        return idcg > 0 ? dcg / idcg : 0;
    }

    evaluateQuery(query, relevanceJudgments) {
        const index = getInvertedIndex();
        const retrievedDocs = index.search(query.text, { limit: 20 });
        
        // Get relevant documents for this query
        const relevantDocs = Object.keys(relevanceJudgments[query.id] || {})
            .filter(docId => relevanceJudgments[query.id][docId] > 0);
        
        const relevanceScores = relevanceJudgments[query.id] || {};
        
        // Calculate metrics at different cutoffs
        const metrics = {};
        [5, 10, 20].forEach(k => {
            const precision = this.calculatePrecision(retrievedDocs, relevantDocs, k);
            const recall = this.calculateRecall(retrievedDocs, relevantDocs, k);
            
            metrics[`P@${k}`] = parseFloat(precision.toFixed(3));
            metrics[`R@${k}`] = parseFloat(recall.toFixed(3));
            metrics[`F1@${k}`] = parseFloat(this.calculateF1(precision, recall).toFixed(3));
        });
        
        metrics['MAP'] = parseFloat(
            this.calculateAveragePrecision(retrievedDocs, relevantDocs).toFixed(3)
        );
        metrics['NDCG@10'] = parseFloat(
            this.calculateNDCG(retrievedDocs, relevanceScores, 10).toFixed(3)
        );
        
        return {
            query: query.text,
            retrievedCount: retrievedDocs.length,
            relevantCount: relevantDocs.length,
            metrics,
            topResults: retrievedDocs.slice(0, 5).map(d => ({
                id: d.id,
                title: d.title?.substring(0, 50) + '...',
                score: d.score,
                relevance: relevanceScores[d.id] || 'Not judged'
            }))
        };
    }

    runFullEvaluation() {
        console.log('Running IR System Evaluation...');
        
        const results = {
            queries: [],
            summary: {}
        };
        
        let totalPrecision = 0;
        let totalRecall = 0;
        let totalF1 = 0;
        let totalMAP = 0;
        let totalNDCG = 0;
        
        this.testQueries.forEach(query => {
            const queryResult = this.evaluateQuery(query, this.relevanceJudgments);
            results.queries.push(queryResult);
            
            // Accumulate for averages
            totalPrecision += queryResult.metrics['P@10'];
            totalRecall += queryResult.metrics['R@10'];
            totalF1 += queryResult.metrics['F1@10'];
            totalMAP += queryResult.metrics['MAP'];
            totalNDCG += queryResult.metrics['NDCG@10'];
        });
        
        const numQueries = this.testQueries.length;
        results.summary = {
            meanPrecision: parseFloat((totalPrecision / numQueries).toFixed(3)),
            meanRecall: parseFloat((totalRecall / numQueries).toFixed(3)),
            meanF1: parseFloat((totalF1 / numQueries).toFixed(3)),
            MAP: parseFloat((totalMAP / numQueries).toFixed(3)),
            meanNDCG: parseFloat((totalNDCG / numQueries).toFixed(3)),
            evaluationDate: new Date().toISOString(),
            totalQueries: numQueries
        };
        
        // Also compare TF-IDF vs simple TF scoring
        results.comparison = this.compareScoringMethods();
        
        console.log('Evaluation complete!');
        return results;
    }

    compareScoringMethods() {
        const query = this.testQueries[0]; // Use first query for comparison
        const index = getInvertedIndex();
        
        const tfidfResults = index.search(query.text, { useTfIdf: true, limit: 10 });
        const tfResults = index.search(query.text, { useTfIdf: false, limit: 10 });
        
        return {
            query: query.text,
            tfidfTop3: tfidfResults.slice(0, 3).map(d => d.title),
            tfTop3: tfResults.slice(0, 3).map(d => d.title),
            overlap: tfidfResults.slice(0, 10).filter(tfidfDoc => 
                tfResults.slice(0, 10).some(tfDoc => tfDoc.id === tfidfDoc.id)
            ).length
        };
    }

    // Generate a simple visualization data
    getPrecisionRecallData() {
        const data = [];
        this.testQueries.forEach(query => {
            const index = getInvertedIndex();
            const retrievedDocs = index.search(query.text, { limit: 20 });
            const relevantDocs = Object.keys(this.relevanceJudgments[query.id] || {})
                .filter(docId => this.relevanceJudgments[query.id][docId] > 0);
            
            // Calculate precision at each recall level
            let relevantSoFar = 0;
            retrievedDocs.forEach((doc, idx) => {
                if (relevantDocs.includes(doc.id)) {
                    relevantSoFar++;
                    const recall = relevantSoFar / relevantDocs.length;
                    const precision = relevantSoFar / (idx + 1);
                    data.push({
                        query: query.id,
                        recall: parseFloat(recall.toFixed(2)),
                        precision: parseFloat(precision.toFixed(2)),
                        rank: idx + 1
                    });
                }
            });
        });
        
        return data;
    }
}

module.exports = IREvaluator;