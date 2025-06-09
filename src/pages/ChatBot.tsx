// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
// If you create a service, you would import it like this:
// import { chatbotApi } from '../services/api'; // Example if you use api.ts for chatbot

const ChatBot: React.FC = () => {
  // State to hold all chat messages. 'from' can be 'user' or 'bot'.
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  // State for the text currently in the input field.
  const [input, setInput] = useState('');
  // State to indicate if a response is currently being fetched from the API.
  const [loading, setLoading] = useState(false);

  // Ref to automatically scroll to the bottom of the chat when new messages arrive.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the latest message whenever the 'messages' state changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle sending a message to the backend.
  const sendMessage = async () => {
    const userMessage = input.trim(); // Get the message from input and remove leading/trailing spaces.

    // Don't send empty messages.
    if (!userMessage) {
      return;
    }

    // 1. Add the user's message to the chat immediately.
    setMessages((prevMessages) => [...prevMessages, { from: 'user', text: userMessage }]);
    setInput(''); // Clear the input field right after sending.
    setLoading(true); // Show the loading indicator.

    try {
      // 2. Make the API call to your backend.
      // The URL 'http://localhost:5000/api/chatbot' is correct for the server setup.
      const res = await axios.post('http://localhost:5000/api/chatbot', { message: userMessage });
      // If you used the `api.ts` service:
      // const res = await chatbotApi.askBot(userMessage);


      // 3. Add the bot's reply to the chat messages.
      setMessages((prevMessages) => [...prevMessages, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error('Error calling chatbot API:', err);
      // 4. Display an error message in the chat if the API call fails.
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: 'bot', text: 'Oops! Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false); // Hide the loading indicator, regardless of success or failure.
    }
  };

  // Handler for 'Enter' key press in the input field.
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only send the message if 'Enter' is pressed and not already loading a response.
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  // Handler for the 'Send' button click.
  const handleSendClick = () => {
    // Only send the message if not already loading a response.
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
          gap: '10px', // Adds space between message bubbles
        }}
      >
        {/* Display a welcome message if no messages are present */}
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>Start a conversation with the chatbot!</p>
        )}

        {/* Map and display all messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', // Align messages right for user, left for bot
            }}
          >
            <div
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: '20px',
                backgroundColor: msg.from === 'user' ? '#007bff' : '#e2e2e2', // Different colors for user/bot
                color: msg.from === 'user' ? '#fff' : '#333',
                maxWidth: '75%', // Limit message bubble width
                wordWrap: 'break-word', // Ensure long words wrap
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)', // Subtle shadow for depth
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Display typing indicator when loading */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '0.5rem' }}>
            Typing...
          </div>
        )}

        {/* This div is used for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={loading ? "Waiting for response..." : "Type your message..."} // Dynamic placeholder
          disabled={loading} // Disable input while loading
          style={{
            flexGrow: 1,
            padding: '0.75rem',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            backgroundColor: loading ? '#f0f0f0' : '#fff', // Gray out when disabled
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={loading || input.trim() === ''} // Disable if loading or input is empty
          style={{
            padding: '0.75rem 1.2rem',
            backgroundColor: loading || input.trim() === '' ? '#a0c7ff' : '#007bff', // Lighter blue when disabled
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || input.trim() === '' ? 'not-allowed' : 'pointer', // Change cursor
            fontSize: '1rem',
            transition: 'background-color 0.2s', // Smooth transition for color changes
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;