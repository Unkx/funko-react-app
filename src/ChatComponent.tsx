import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';

interface ChatComponentProps {
  isDarkMode: boolean;
  user: {
    id: number;
    login: string;
    name: string;
  } | null;
  friend?: {
    id: number;
    login: string;
    name: string;
    conversation_id?: string;
  };
  onClose: () => void;
}

interface Conversation {
  conversation_id: string;
  friend_id: number;
  friend_login: string;
  friend_name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ isDarkMode, user, friend, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        const total = data.reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/conversation/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        await fetch(`http://localhost:5000/api/chat/conversation/${conversationId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchConversations();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/conversation/${selectedConversation.conversation_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: newMessage.trim() })
        }
      );

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const isAutoScrollNeeded = lastMsg.sender_id !== user?.id;
      if (isAutoScrollNeeded) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Own message: scroll instantly (no animation)
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [messages, user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.conversation_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

    // Replace the current friend-handling useEffect with this one:
  useEffect(() => {
    if (!friend || !user) return;

    const openFriendChat = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Ensure conversation exists (backend should return or create one)
        const convResponse = await fetch(`http://localhost:5000/api/chat/conversation/${friend.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (convResponse.ok) {
          const convData = await convResponse.json(); // { conversation_id, ... }
          const conv: Conversation = {
            conversation_id: convData.conversation_id,
            friend_id: friend.id,
            friend_login: friend.login,
            friend_name: friend.name,
            last_message: null,
            last_message_time: null,
            unread_count: 0
          };
          setSelectedConversation(conv);
        }
      } catch (err) {
        console.error('Failed to open chat with friend:', err);
      }
    };

    openFriendChat();
  }, [friend, user]); // Only depends on friend and user

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] rounded-lg shadow-2xl flex flex-col z-50 ${
      isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      <div className={`flex items-center justify-between p-4 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">
            {selectedConversation ? selectedConversation.friend_name : 'Messages'}
          </h3>
          {unreadCount > 0 && !selectedConversation && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selectedConversation && (
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col"> {/* 👈 Changed: Added 'flex flex-col' */}
        {!selectedConversation ? (
          <div className="h-full overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with your friends!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b text-left transition-colors ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{conv.friend_login}</span>
                    <span className="text-xs text-gray-500">
                      {conv.last_message_time && formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate flex-1">
                      {conv.last_message || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* 👇 Changed: Added 'flex-1' to make this div take available space */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={idx}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isOwn
                            ? isDarkMode
                              ? 'bg-yellow-600 text-white'
                              : 'bg-blue-100 text-gray-900' // 👈 Changed: Use a lighter blue for light theme
                            : isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area remains unchanged */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-2 rounded ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded ${
                    isDarkMode
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;