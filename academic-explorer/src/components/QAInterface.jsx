import React, { useState, useEffect } from 'react';
import { Send, Brain, BookOpen, Sparkles, Loader2, Cpu, AlertCircle, Zap, Target } from 'lucide-react';
import { askGroqQuestion, testGroqConnection } from '../services/api';

function QAInterface({ selectedPaper, papers }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState('');
  const [groqStatus, setGroqStatus] = useState({ connected: false, message: 'Checking...' });

  // Check Groq connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await testGroqConnection();
        setGroqStatus(status);
        if (status.model) {
          setModelInfo(`Using ${status.model}`);
        }
      } catch (err) {
        setGroqStatus({ connected: false, message: 'Connection check failed' });
      }
    };
    
    checkConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedPaper) return;

    setLoading(true);
    setError(null);
    setAnswer('');
    
    try {
      console.log(`Asking question: "${question}" about paper: "${selectedPaper.title}"`);
      
      // Use Groq API through backend
      const result = await askGroqQuestion(question, [selectedPaper, ...papers.slice(0, 4)]);
      
      console.log('QA Result:', result); // Debug log
      
      if (result.error || result.fallback) {
        // If there's an error or fallback mode
        if (result.error) {
          setError(result.answer || 'Failed to get answer from AI service.');
        } else if (result.fallback) {
          // Use enhanced fallback answer
          setAnswer(getEnhancedFallbackAnswer(question, selectedPaper, result.note));
        }
      } else {
        // Success - display the answer
        setAnswer(result.answer);
        if (result.model) {
          setModelInfo(`Powered by ${result.model}`);
        }
      }
    } catch (err) {
      console.error('QA error:', err);
      setError('Failed to connect to AI service. Check if backend is running on localhost:5000');
      // Enhanced fallback answer
      setAnswer(getEnhancedFallbackAnswer(question, selectedPaper, 'Connection error'));
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fallback answer generator
  const getEnhancedFallbackAnswer = (question, paper, note = '') => {
    if (!paper) return "Please select a paper first.";
    
    const questionLower = question.toLowerCase();
    const paperTitle = paper.title;
    const authors = paper.authors?.join(', ') || 'the authors';
    const year = paper.year || '';
    const abstract = paper.abstract || '';
    
    // Extract keywords from question
    const questionKeywords = questionLower.split(' ').filter(word => 
      word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'who', 'which', 'this', 'that', 'these', 'those', 'about'].includes(word)
    );
    
    // Try to find relevant parts of abstract
    let relevantExcerpt = abstract.substring(0, 200);
    if (questionKeywords.length > 0) {
      for (const keyword of questionKeywords) {
        const keywordIndex = abstract.toLowerCase().indexOf(keyword);
        if (keywordIndex > -1) {
          relevantExcerpt = abstract.substring(
            Math.max(0, keywordIndex - 50),
            Math.min(abstract.length, keywordIndex + 150)
          ) + '...';
          break;
        }
      }
    }
    
    // Generate context-aware response
    let response = '';
    
    if (questionLower.includes('method') || questionLower.includes('approach') || questionLower.includes('technique')) {
      response = `Regarding the methodology in "${paperTitle}", the paper employs ${relevantExcerpt}... The approach focuses on ${abstract.substring(0, 120)}...`;
    } else if (questionLower.includes('result') || questionLower.includes('finding') || questionLower.includes('outcome')) {
      response = `The key findings in "${paperTitle}" include ${relevantExcerpt}... This research demonstrates ${abstract.substring(100, 250)}...`;
    } else if (questionLower.includes('contribut') || questionLower.includes('novel') || questionLower.includes('innovation')) {
      response = `The main contribution of "${paperTitle}" is ${relevantExcerpt}... This work advances the field by ${abstract.substring(50, 200)}...`;
    } else if (questionLower.includes('compare') || questionLower.includes('different') || questionLower.includes('versus')) {
      response = `Compared to previous work, "${paperTitle}" differs in ${relevantExcerpt}... The authors build upon existing research by ${abstract.substring(80, 220)}...`;
    } else if (questionLower.includes('limit') || questionLower.includes('challenge') || questionLower.includes('future')) {
      response = `The limitations and future work discussed in "${paperTitle}" involve ${relevantExcerpt}... The paper suggests ${abstract.substring(150, 300)}...`;
    } else if (questionLower.includes('dataset') || questionLower.includes('data') || questionLower.includes('experiment')) {
      response = `The experimental setup in "${paperTitle}" uses ${relevantExcerpt}... Data and methods include ${abstract.substring(60, 180)}...`;
    } else {
      // General response
      response = `Based on "${paperTitle}" by ${authors} (${year}), this research addresses ${question}. The paper discusses ${relevantExcerpt}...`;
    }
    
    // Add AI service note if available
    if (note) {
      response += `\n\n[Note: ${note}]`;
    }
    
    return response;
  };

  const suggestedQuestions = [
    "What is the main contribution of this paper?",
    "Explain the methodology used in simple terms.",
    "What are the key findings or results?",
    "How does this compare to previous work?",
    "What are the limitations of this research?",
    "What datasets were used in this study?",
    "What future work is suggested by the authors?",
    "What problem does this research solve?",
    "Explain the technical approach in detail.",
    "What evaluation metrics were used?"
  ];

  const handleQuickQuestion = async (quickQuestion) => {
    setQuestion(quickQuestion);
    // Wait a moment for state to update, then submit
    setTimeout(() => {
      const submitEvent = new Event('submit', { cancelable: true });
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(submitEvent);
      }
    }, 50);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 shadow-lg border border-emerald-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Research Assistant</h3>
            <p className="text-gray-600 text-sm">Powered by Groq AI • Ultra-Fast Inference</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          groqStatus.connected 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          {groqStatus.connected ? 'AI Connected' : 'AI Offline'}
        </div>
      </div>

      {/* Selected Paper Info */}
      {selectedPaper && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-emerald-100 shadow-sm">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Analyzing Paper</h4>
                  <p className="text-gray-700 text-sm line-clamp-2">{selectedPaper.title}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                  {selectedPaper.citations?.toLocaleString() || '0'} cites
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                  {selectedPaper.year || 'Unknown Year'}
                </span>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {selectedPaper.category || 'General'}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  {selectedPaper.authors?.[0] || 'Unknown'}
                  {selectedPaper.authors?.length > 1 ? ' et al.' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">Ask anything about this paper:</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., 'Explain the methodology in simple terms' or 'What datasets were used?'"
              className="w-full px-4 py-3 pr-12 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder-gray-500 shadow-sm"
              disabled={!selectedPaper || loading}
            />
            <button
              type="submit"
              disabled={!selectedPaper || !question.trim() || loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Ask question"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {!selectedPaper && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Select a paper first to ask questions about it
            </p>
          </div>
        )}
        
        {selectedPaper && !groqStatus.connected && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm">
              <span className="font-medium">Note:</span> AI service is offline. Showing enhanced fallback responses.
            </p>
          </div>
        )}
      </form>

      {/* Suggested Questions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h4 className="text-gray-700 font-medium">Quick Questions</h4>
          <span className="text-xs text-gray-500 ml-auto">Click to ask</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(q)}
              disabled={!selectedPaper || loading}
              className="p-3 bg-white text-left text-gray-700 text-sm rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">
                  <Brain className="h-3 w-3 text-emerald-500" />
                </div>
                <span>{q}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Answer Display */}
      {(answer || error || loading) && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
              ) : error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Brain className="h-5 w-5 text-emerald-500" />
              )}
              <h4 className="font-semibold text-gray-800">
                {loading ? 'Analyzing...' : error ? 'Error' : 'Answer'}
              </h4>
            </div>
            {modelInfo && !loading && (
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                {modelInfo}
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-gray-500">Processing query...</span>
              </div>
              <div className="text-center text-gray-500 text-sm">
                <Zap className="h-4 w-4 inline-block mr-2 animate-pulse" />
                Groq AI is generating your answer
              </div>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                <div className="font-medium mb-2">{error}</div>
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Make sure backend is running: <code className="bg-gray-100 px-2 py-1 rounded">node server.js</code> in backend folder
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Verify Groq API key in <code className="bg-gray-100 px-2 py-1 rounded">backend/.env</code>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Get a free API key from: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.groq.com/keys</a>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Dismiss error
              </button>
            </div>
          ) : answer ? (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {answer}
                </div>
              </div>
              
              {/* Source attribution */}
              {selectedPaper && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Answer based on:</p>
                      <p className="text-sm font-medium text-emerald-700">{selectedPaper.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{selectedPaper.authors?.slice(0, 2).join(', ')}</span>
                        <span>•</span>
                        <span>{selectedPaper.year}</span>
                        <span>•</span>
                        <span>{selectedPaper.category || 'Research'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Feedback/actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => setAnswer('')}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear answer
                </button>
                <div className="text-xs text-gray-500">
                  {groqStatus.connected ? 'AI-powered response' : 'Enhanced fallback response'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* System Status & Tips */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${selectedPaper ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium text-gray-700">
                {selectedPaper ? 'Paper Selected' : 'No Paper'}
              </span>
            </div>
            {selectedPaper && (
              <p className="text-xs text-gray-500 truncate" title={selectedPaper.title}>
                {selectedPaper.title.substring(0, 40)}...
              </p>
            )}
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${groqStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-gray-700">
                {groqStatus.connected ? 'Groq AI Ready' : 'AI Offline'}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {groqStatus.connected ? 'Ultra-fast responses' : 'Using fallback mode'}
            </p>
          </div>
        </div>
        
        {/* Quick Tips */}
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h5 className="text-sm font-medium text-emerald-800">Tips for better answers:</h5>
          </div>
          <ul className="text-xs text-emerald-700 space-y-1">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Ask specific questions about methods, results, or contributions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Reference specific sections or aspects of the paper</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Compare with other papers or ask about limitations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Enable Groq AI for detailed, context-aware responses</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default QAInterface;