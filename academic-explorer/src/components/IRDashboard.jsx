// src/components/IRDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer 
} from 'recharts';

const IRDashboard = () => {
    const [evaluationResults, setEvaluationResults] = useState(null);
    const [indexStats, setIndexStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState('machine learning');
    const [searchResults, setSearchResults] = useState(null);
    const [precisionRecallData, setPrecisionRecallData] = useState([]);
    const [loading, setLoading] = useState(false);

    const buildIndex = async () => {
        // This would need access to your papers data
        // You might need to pass papers from parent component
        setLoading(true);
        try {
            const response = await fetch('/api/build-index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ papers: window.papers || [] }) // Assuming papers are available globally
            });
            const data = await response.json();
            alert(`Index built: ${data.message}`);
            fetchIndexStats();
        } catch (error) {
            console.error('Error building index:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIndexStats = async () => {
        try {
            const response = await fetch('/api/index-stats');
            const data = await response.json();
            setIndexStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const runEvaluation = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ir-evaluation');
            const data = await response.json();
            setEvaluationResults(data);
            
            // Also fetch precision-recall data
            const prResponse = await fetch('/api/precision-recall-data');
            const prData = await prResponse.json();
            setPrecisionRecallData(prData);
        } catch (error) {
            console.error('Error running evaluation:', error);
        } finally {
            setLoading(false);
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/advanced-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: searchQuery,
                    operator: 'AND',
                    limit: 10,
                    useTfIdf: true
                })
            });
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndexStats();
    }, []);

    return (
        <div className="ir-dashboard p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">IR System Dashboard</h2>
            
            {/* Index Management */}
            <div className="mb-8 p-4 bg-white rounded shadow">
                <h3 className="text-lg font-semibold mb-4">Index Management</h3>
                <div className="flex gap-4 mb-4">
                    <button 
                        onClick={buildIndex}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Building...' : 'Build Inverted Index'}
                    </button>
                    <button 
                        onClick={runEvaluation}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Evaluating...' : 'Run IR Evaluation'}
                    </button>
                </div>
                
                {indexStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="stat-card p-3 bg-blue-50 rounded">
                            <div className="text-sm text-gray-600">Total Terms</div>
                            <div className="text-xl font-bold">{indexStats.totalTerms}</div>
                        </div>
                        <div className="stat-card p-3 bg-green-50 rounded">
                            <div className="text-sm text-gray-600">Documents</div>
                            <div className="text-xl font-bold">{indexStats.totalDocuments}</div>
                        </div>
                        <div className="stat-card p-3 bg-purple-50 rounded">
                            <div className="text-sm text-gray-600">Total Postings</div>
                            <div className="text-xl font-bold">{indexStats.totalPostings}</div>
                        </div>
                        <div className="stat-card p-3 bg-yellow-50 rounded">
                            <div className="text-sm text-gray-600">Avg Postings/Term</div>
                            <div className="text-xl font-bold">{indexStats.averagePostingsPerTerm}</div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Test Search */}
            <div className="mb-8 p-4 bg-white rounded shadow">
                <h3 className="text-lg font-semibold mb-4">Test IR Search</h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter search query..."
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button 
                        onClick={performSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Search with TF-IDF
                    </button>
                </div>
                
                {searchResults && (
                    <div>
                        <div className="text-sm text-gray-600 mb-2">
                            Found {searchResults.count} results for "{searchResults.query}"
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {searchResults.results.map((result, idx) => (
                                <div key={result.id} className="p-3 border rounded hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{result.title}</div>
                                            <div className="text-sm text-gray-600">
                                                Score: {result.score} | 
                                                Matched terms: {result.matchedTerms?.join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            Rank #{idx + 1}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Evaluation Results */}
            {evaluationResults && (
                <div className="space-y-8">
                    {/* Summary Metrics */}
                    <div className="p-4 bg-white rounded shadow">
                        <h3 className="text-lg font-semibold mb-4">Evaluation Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(evaluationResults.summary).map(([key, value]) => (
                                <div key={key} className="p-3 bg-gray-50 rounded text-center">
                                    <div className="text-sm text-gray-600">{key}</div>
                                    <div className="text-xl font-bold text-green-600">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Precision-Recall Chart */}
                    {precisionRecallData.length > 0 && (
                        <div className="p-4 bg-white rounded shadow">
                            <h3 className="text-lg font-semibold mb-4">Precision-Recall Curve</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={precisionRecallData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="recall" 
                                            type="number"
                                            domain={[0, 1]}
                                            label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis 
                                            domain={[0, 1]}
                                            label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="precision" 
                                            stroke="#8884d8" 
                                            activeDot={{ r: 8 }}
                                            name="Precision"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                    
                    {/* Detailed Query Results */}
                    <div className="p-4 bg-white rounded shadow">
                        <h3 className="text-lg font-semibold mb-4">Query-Level Results</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">Query</th>
                                        <th className="px-4 py-2 text-left">P@10</th>
                                        <th className="px-4 py-2 text-left">R@10</th>
                                        <th className="px-4 py-2 text-left">F1@10</th>
                                        <th className="px-4 py-2 text-left">MAP</th>
                                        <th className="px-4 py-2 text-left">NDCG@10</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evaluationResults.queries.map((queryResult, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 border-b">
                                                <div className="font-medium">{queryResult.query}</div>
                                                <div className="text-xs text-gray-500">
                                                    {queryResult.retrievedCount} retrieved, {queryResult.relevantCount} relevant
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 border-b">{queryResult.metrics['P@10']}</td>
                                            <td className="px-4 py-2 border-b">{queryResult.metrics['R@10']}</td>
                                            <td className="px-4 py-2 border-b">{queryResult.metrics['F1@10']}</td>
                                            <td className="px-4 py-2 border-b">{queryResult.metrics['MAP']}</td>
                                            <td className="px-4 py-2 border-b">{queryResult.metrics['NDCG@10']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IRDashboard;