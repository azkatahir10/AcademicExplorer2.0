// backend/invertedIndex.js
const natural = require('natural');
const stopwords = require('natural/lib/natural/util/stopwords').words;

class InvertedIndex {
    constructor() {
        this.index = new Map(); // term -> {docId: {tf: number, positions: []}}
        this.documents = new Map(); // docId -> {title, abstract, metadata}
        this.docLengths = new Map(); // docId -> token count
        this.totalDocs = 0;
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
    }

    preprocess(text) {
        if (!text) return [];
        
        // Tokenize
        let tokens = this.tokenizer.tokenize(text.toLowerCase());
        
        // Remove stopwords and short tokens
        tokens = tokens.filter(token => 
            token.length > 2 && 
            !stopwords.includes(token) &&
            !/\d+/.test(token) // Remove pure numbers
        );
        
        // Stem tokens
        tokens = tokens.map(token => this.stemmer.stem(token));
        
        return tokens;
    }

    addDocument(docId, title, abstract, metadata = {}) {
        const fullText = `${title} ${abstract}`.toLowerCase();
        const tokens = this.preprocess(fullText);
        
        // Store document metadata
        this.documents.set(docId, {
            title,
            abstract,
            ...metadata,
            tokenCount: tokens.length
        });
        
        this.docLengths.set(docId, tokens.length);
        
        // Build inverted index
        tokens.forEach((token, position) => {
            if (!this.index.has(token)) {
                this.index.set(token, new Map());
            }
            
            const postings = this.index.get(token);
            if (!postings.has(docId)) {
                postings.set(docId, {
                    termFrequency: 0,
                    positions: []
                });
            }
            
            const posting = postings.get(docId);
            posting.termFrequency++;
            posting.positions.push(position);
        });
        
        this.totalDocs++;
        console.log(`Indexed document ${docId} with ${tokens.length} tokens`);
    }

    buildIndexFromPapers(papers) {
        console.log(`Building index from ${papers.length} papers...`);
        papers.forEach(paper => {
            this.addDocument(
                paper.id || paper.paperId,
                paper.title || '',
                paper.abstract || '',
                {
                    authors: paper.authors,
                    year: paper.year,
                    citations: paper.citationCount || paper.citations,
                    venue: paper.venue
                }
            );
        });
        console.log(`Index built. Total terms: ${this.index.size}`);
    }

    getDocumentFrequency(term) {
        const postings = this.index.get(term);
        return postings ? postings.size : 0;
    }

    search(query, options = {}) {
        const { operator = 'AND', limit = 20, useTfIdf = true } = options;
        const queryTokens = this.preprocess(query);
        
        if (queryTokens.length === 0) {
            return [];
        }

        // Get posting lists for each query term
        const postingLists = [];
        queryTokens.forEach(term => {
            if (this.index.has(term)) {
                postingLists.push(this.index.get(term));
            }
        });

        if (postingLists.length === 0) {
            return [];
        }

        // Get candidate documents based on operator
        let candidateDocs = new Set();
        
        if (operator === 'AND') {
            // Start with first term's documents
            const firstPostings = postingLists[0];
            candidateDocs = new Set(firstPostings.keys());
            
            // Intersect with other terms
            for (let i = 1; i < postingLists.length; i++) {
                const currentDocs = new Set(postingLists[i].keys());
                candidateDocs = new Set([...candidateDocs].filter(doc => currentDocs.has(doc)));
            }
        } else { // OR operator
            postingLists.forEach(postings => {
                postings.forEach((value, docId) => {
                    candidateDocs.add(docId);
                });
            });
        }

        // Score and rank documents
        const scoredDocs = [];
        candidateDocs.forEach(docId => {
            let score = 0;
            
            if (useTfIdf) {
                // Calculate TF-IDF score
                queryTokens.forEach(term => {
                    if (this.index.has(term)) {
                        const postings = this.index.get(term);
                        if (postings.has(docId)) {
                            const tf = postings.get(docId).termFrequency;
                            const docLength = this.docLengths.get(docId) || 1;
                            const normalizedTf = tf / docLength;
                            
                            const df = postings.size;
                            const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
                            
                            score += normalizedTf * idf;
                        }
                    }
                });
            } else {
                // Simple term frequency scoring
                queryTokens.forEach(term => {
                    if (this.index.has(term) && this.index.get(term).has(docId)) {
                        score += this.index.get(term).get(docId).termFrequency;
                    }
                });
            }
            
            if (score > 0) {
                const metadata = this.documents.get(docId);
                scoredDocs.push({
                    id: docId,
                    score: parseFloat(score.toFixed(4)),
                    title: metadata?.title,
                    abstract: metadata?.abstract,
                    authors: metadata?.authors,
                    year: metadata?.year,
                    citations: metadata?.citations,
                    venue: metadata?.venue,
                    matchedTerms: this.getMatchedTerms(docId, queryTokens)
                });
            }
        });

        // Sort by score and apply limit
        return scoredDocs.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    getMatchedTerms(docId, queryTokens) {
        return queryTokens.filter(term => 
            this.index.has(term) && this.index.get(term).has(docId)
        );
    }

    // For debugging
    getIndexStats() {
        const totalPostings = Array.from(this.index.values())
            .reduce((sum, postings) => sum + postings.size, 0);
        
        return {
            totalTerms: this.index.size,
            totalDocuments: this.totalDocs,
            totalPostings,
            averagePostingsPerTerm: (totalPostings / this.index.size).toFixed(2)
        };
    }

    // Save/load index for persistence
    saveToFile() {
        const indexData = {
            index: Array.from(this.index.entries()).map(([term, postings]) => [
                term,
                Array.from(postings.entries())
            ]),
            documents: Array.from(this.documents.entries()),
            docLengths: Array.from(this.docLengths.entries()),
            totalDocs: this.totalDocs
        };
        
        require('fs').writeFileSync(
            'inverted-index.json',
            JSON.stringify(indexData, null, 2)
        );
        console.log('Index saved to inverted-index.json');
    }

    loadFromFile() {
        try {
            const data = JSON.parse(
                require('fs').readFileSync('inverted-index.json', 'utf8')
            );
            
            this.index = new Map(data.index.map(([term, postings]) => [
                term,
                new Map(postings)
            ]));
            this.documents = new Map(data.documents);
            this.docLengths = new Map(data.docLengths);
            this.totalDocs = data.totalDocs;
            
            console.log(`Loaded index with ${this.totalDocs} documents`);
        } catch (error) {
            console.log('No saved index found, starting fresh');
        }
    }
}

// Singleton instance
let globalIndex = null;

function getInvertedIndex() {
    if (!globalIndex) {
        globalIndex = new InvertedIndex();
        globalIndex.loadFromFile(); // Try to load existing index
    }
    return globalIndex;
}

module.exports = { InvertedIndex, getInvertedIndex };