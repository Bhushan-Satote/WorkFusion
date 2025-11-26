import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { FaPaperPlane, FaSpinner, FaRobot, FaExclamationCircle, FaSearch, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChatComponent = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([
    'Find active users who know React',
    'Show me high priority projects',
    'List tasks due this week',
    'Find clients from New York',
    'Help me with WorkFusion'
  ]);
  
  const chatEndRef = useRef(null);
  
  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Add user message immediately for better UX
    const userMessage = message;
    setChatHistory(prev => [...prev, {
      query: userMessage,
      isLoading: true,
      timestamp: new Date()
    }]);
    setMessage('');

    try {
      const result = await axiosInstance.post('/chatbot', {
        message: userMessage
      });
      
      // Update the last message with the response
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          query: userMessage,
          data: result.data.results || [],
          message: result.data.message,
          timestamp: new Date(),
          isLoading: false,
          mongoQuery: result.data.mongoQuery // Store the query for debugging
        };
        return updated;
      });
    } catch (err) {
      console.error('Chat error:', err);
      
      // Update the last message with the error
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          query: userMessage,
          error: err.response?.data?.message || err.response?.data?.error || 'Failed to get response',
          timestamp: new Date(),
          isLoading: false
        };
        return updated;
      });
      
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };

  // Render table based on data type
  const renderDataTable = (data) => {
    if (!data || data.length === 0) return null;
    
    // Get all unique keys from the data, handling nested objects
    const allKeys = new Set();
    data.forEach(item => {
      const getKeys = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            getKeys(value, `${prefix}${key}.`);
          } else {
            allKeys.add(`${prefix}${key}`);
          }
        });
      };
      getKeys(item);
    });
    
    // Filter out some keys we don't want to display
    const keysToExclude = ['_id', '__v', 'password'];
    const keys = Array.from(allKeys).filter(key => !keysToExclude.includes(key));
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#418EFD]/10">
            <tr>
              {keys.map(key => (
                <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-[#2A2A34] tracking-wider border-b">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#418EFD]/5 transition-colors">
                {keys.map(key => (
                  <td key={`${idx}-${key}`} className="px-4 py-2 text-xs text-[#4A4A57] whitespace-normal break-words">
                    {renderCellValue(item[key], key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render cell value based on type
  const renderCellValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    if (key === 'status') {
      return (
        <span className={`px-2 py-1 rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    }
    
    if (key.includes('date') && !isNaN(new Date(value))) {
      return new Date(value).toLocaleDateString();
    }
    
    return value.toString();
  };
  
  // Get status color based on value
  const getStatusColor = (status) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'planning': 'bg-purple-100 text-purple-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'todo': 'bg-gray-100 text-gray-800',
      'done': 'bg-green-100 text-green-800',
      'review': 'bg-orange-100 text-orange-800',
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-blue-100 text-blue-800'
    };
    
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message if no chat history */}
        {chatHistory.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#418EFD]/5 rounded-lg p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#418EFD]/20 rounded-full flex items-center justify-center">
                <FaRobot className="text-[#418EFD] text-2xl" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[#2A2A34] mb-2">WorkFusion Assistant</h3>
            <p className="text-[#4A4A57] mb-6">Ask me anything about users, projects, tasks, or clients!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-3 bg-white border border-[#8BBAFC]/30 rounded-lg text-sm text-[#2A2A34] hover:bg-[#418EFD]/5 transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Chat messages */}
        {chatHistory.map((chat, index) => (
          <motion.div 
            key={index} 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* User message */}
            <div className="flex items-start space-x-2 justify-end">
              <div className="bg-[#418EFD] rounded-lg py-3 px-4 max-w-[90%]">
                <p className="text-white text-sm">{chat.query}</p>
              </div>
              <div className="w-8 h-8 bg-[#418EFD]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="text-[#418EFD] text-sm" />
              </div>
            </div>
            
            {/* Bot response */}
            {chat.isLoading ? (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-[#418EFD]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-[#418EFD] text-sm" />
                </div>
                <div className="bg-gray-50 rounded-lg border border-[#8BBAFC]/30 p-4 max-w-[90%]">
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="animate-spin text-[#418EFD]" />
                    <p className="text-[#4A4A57] text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            ) : chat.error ? (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaExclamationCircle className="text-red-500 text-sm" />
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4 max-w-[90%]">
                  <p className="text-red-700 text-sm">{chat.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-[#418EFD]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-[#418EFD] text-sm" />
                </div>
                <div className="bg-gray-50 rounded-lg border border-[#8BBAFC]/30 p-4 max-w-[90%] w-full">
                  <p className="text-[#2A2A34] mb-4 font-medium text-sm">{chat.message}</p>
                  {chat.data && chat.data.length > 0 && renderDataTable(chat.data)}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        
        {/* Auto-scroll reference */}
        <div ref={chatEndRef} />

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-200">
            <FaExclamationCircle className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Chat Input Form */}
      <div className="p-4 border-t border-[#8BBAFC]/30">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <FaRobot className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8BBAFC]" />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
              placeholder="Ask me anything about users, projects, tasks, or clients..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-[#8BBAFC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#418EFD]/50 bg-white hover:bg-gray-50/80 transition-colors"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-3 bg-[#418EFD] text-white rounded-lg hover:bg-[#307ae3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span className="text-sm">Processing...</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="text-sm" />
                <span className="text-sm">Send</span>
              </>
            )}
          </motion.button>
        </form>
        
        {/* Suggestions */}
        {!isLoading && chatHistory.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[#4A4A57] mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs p-2 bg-white border border-[#8BBAFC]/30 rounded-lg text-[#2A2A34] hover:bg-[#418EFD]/5 transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;