import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: 'You', text: input }]);

    try {
      const response = await axios.post('https://diasync-ez2f.onrender.com/api/chatbot', {
        message: input,
      });

      setMessages(prev => [
        ...prev,
        { sender: 'Bot', text: response.data.reply || 'No response from Gemini' },
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'Bot', text: 'Server error.' }]);
    }

    setInput('');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="border p-4 h-96 overflow-y-auto bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`${msg.sender === 'You' ? 'text-right' : 'text-left'} mb-2`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex mt-4">
        <input
          className="flex-grow p-2 border rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 rounded-r">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
