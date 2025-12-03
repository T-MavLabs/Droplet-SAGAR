import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { GoogleGenerativeAI } from '@google/generative-ai';
import VirtualKeyboard from './VirtualKeyboard';
import './DropletDesk.css';

const DropletDesk = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const inputRef = useRef(null);
  const responseEndRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Scroll to bottom when new response arrives
  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, conversationHistory]);

  // Handle keyboard input
  const handleKeyboardInput = (char) => {
    if (char === 'backspace') {
      setInputText(prev => prev.slice(0, -1));
    } else if (char === 'enter') {
      handleSubmit({ preventDefault: () => {} });
    } else {
      setInputText(prev => prev + char);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      handleQuery(inputText.trim());
      setInputText('');
    }
  };

  const handleQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setResponse('');

    try {
      // Call Gemini AI API
      const geminiResponse = await callGeminiAPI(queryText);
      
      // Add to conversation history (this will display the message)
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', text: queryText },
        { type: 'assistant', text: geminiResponse }
      ]);
      
      // Clear response state since it's now in conversationHistory
      setResponse('');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = 'Sorry, I encountered an error processing your query. Please try again.';
      // Show error in conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', text: queryText },
        { type: 'assistant', text: errorMessage }
      ]);
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiAPI = async (query) => {
    // Get API key from environment variable or config
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
    
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please set REACT_APP_GEMINI_API_KEY in your .env file.');
    }

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      // Use gemini-2.5-flash model as specified
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build conversation context
      const conversationContext = conversationHistory
        .slice(-6) // Last 3 exchanges (6 messages)
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');

      const prompt = `You are a marine biology taxonomy assistant named DropletDesk. A scientist is asking you about marine species, taxonomy, classification, or related questions. Provide accurate, scientific, and helpful responses. Keep responses concise but informative (2-4 sentences when possible).

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}User query: ${query}

Response:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text() || 'No response generated.';
      
      return responseText;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(error.message || 'Failed to get response from Gemini');
    }
  };


  return (
    <div className={`dropletdesk-container ${showKeyboard ? 'keyboard-open' : ''}`}>
      {/* Header */}
      <div className="dropletdesk-header">
        {onBack && (
          <button 
            className="dropletdesk-back-btn" 
            onClick={onBack}
            title="Back to Welcome"
          >
            <FiArrowLeft className="icon" />
          </button>
        )}
        <h1 className="dropletdesk-title">DropletDesk</h1>
      </div>

      {/* Conversation History */}
      <div className="dropletdesk-conversation">
        <AnimatePresence>
          {conversationHistory.map((message, index) => (
            <motion.div
              key={index}
              className={`dropletdesk-message ${message.type}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-content">{message.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>


        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            className="dropletdesk-message assistant loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="message-content">
              <span className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </div>
          </motion.div>
        )}

        <div ref={responseEndRef} />
      </div>

      {/* Text Input Controls */}
      <div className="dropletdesk-controls">
        <form onSubmit={handleSubmit} className="dropletdesk-input-form">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setShowKeyboard(true)}
            onBlur={() => {
              // Don't close keyboard on blur for touch devices
            }}
            placeholder="Type your query about marine taxonomy..."
            className="dropletdesk-text-input"
            disabled={isLoading}
            readOnly
          />
          <button
            type="submit"
            className="dropletdesk-send-btn"
            disabled={isLoading || !inputText.trim()}
            title="Send query"
          >
            <FiSend className="icon" />
          </button>
        </form>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        visible={showKeyboard}
        onInput={handleKeyboardInput}
        onClose={() => setShowKeyboard(false)}
      />
    </div>
  );
};

export default DropletDesk;

