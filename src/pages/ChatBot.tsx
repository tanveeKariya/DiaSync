// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get auth token and current user object from AuthContext
  const { token, user: currentUser } = useAuth();

  // Effect to scroll to the latest message whenever the 'messages' state changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage) {
      return;
    }

    // Include the user's name if available, otherwise default to 'valued user'
    const userName = currentUser?.name || 'valued user'; // Assuming currentUser has a 'name' field

    setMessages((prevMessages) => [...prevMessages, { from: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        'https://diasync-ez2f.onrender.com/api/chatbot',
        { message: userMessage, userName: userName }, // Pass userName to the backend
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prevMessages) => [...prevMessages, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error('Error calling chatbot API:', err);
      let errorMessage = 'Oops! Something went wrong. Please try again.';
      if (axios.isAxiosError(err) && err.response && err.response.status === 401) {
        errorMessage = 'Authentication required. Please log in to use the chatbot.';
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'bot', text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  const handleSendClick = () => {
    if (!loading) {
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>🤖 DiaSync Chatbot</h2>

      <div
        style={{
          border: '1px solid #ddd',
          padding: '1rem',
          borderRadius: '10px',
          minHeight: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          marginBottom: '1rem',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            Hello {currentUser?.name || 'there'}! I'm DiaSync Chatbot. I'm here to provide general information and support on your diabetes journey. How can I help you today?
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '20px',
                backgroundColor: msg.from === 'user' ? '#007bff' : '#e2e2e2',
                color: msg.from === 'user' ? '#fff' : '#333',
                maxWidth: '75%',
                wordWrap: 'break-word',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '0.5rem' }}>
            Typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={loading ? "Waiting for response..." : "Type your message..."}
          disabled={loading || !token}
          style={{
            flexGrow: 1,
            padding: '0.75rem',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            backgroundColor: loading || !token ? '#f0f0f0' : '#fff',
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={loading || input.trim() === '' || !token}
          style={{
            padding: '0.75rem 1.2rem',
            backgroundColor: loading || input.trim() === '' || !token ? '#a0c7ff' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || input.trim() === '' || !token ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            transition: 'background-color 0.2s',
          }}
        >
          Send
        </button>
      </div>
      {!token && (
        <p style={{ textAlign: 'center', color: '#dc3545', marginTop: '0.5rem' }}>
          Please log in to use the personalized chatbot features.
        </p>
      )}
    </div>
  );
};

export default ChatBot;