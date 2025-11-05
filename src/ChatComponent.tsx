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
    nationality?: string;
  };
  onClose: () => void;
}

interface Conversation {
  conversation_id: string;
  friend_id: number;
  friend_login: string;
  friend_name: string;
  friend_nationality?: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_active?: boolean;
}

interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface UserProfile {
  id: number;
  login: string;
  name: string;
  nationality?: string;
  is_active?: boolean;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ isDarkMode, user, friend, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<Set<number>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(new Map()); // 👈 Przechowuje profile użytkowników
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 👇 Funkcja do pobierania profilu użytkownika
  const fetchUserProfile = async (userId: number): Promise<UserProfile | null> => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return null;
  };

  // 👇 Funkcja do pobierania profilów dla wszystkich konwersacji
  const fetchUserProfilesForConversations = async (convs: Conversation[]) => {
    const profiles = new Map<number, UserProfile>();
    
    // Pobierz profile dla każdego unikalnego użytkownika w konwersacjach
    const uniqueUserIds = [...new Set(convs.map(conv => conv.friend_id))];
    
    for (const userId of uniqueUserIds) {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        profiles.set(userId, profile);
      }
    }
    
    setUserProfiles(profiles);
  };

  const fetchConversations = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // 👇 Pobierz profile użytkowników dla konwersacji
        await fetchUserProfilesForConversations(data);
        
        const total = data.reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

    // Loyalty Dashboard state
    const [showLoyaltyDashboard, setShowLoyaltyDashboard] = useState(false);
  
    // Funkcja do automatycznego przyznawania punktów
    const awardPoints = async (actionType: string, details?: string) => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        await fetch("http://localhost:5000/api/loyalty/award-points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ actionType, details })
        });
      } catch (err) {
        console.error("Failed to award points:", err);
      }
    };
  
    
  const fetchActiveUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/chat/active-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(new Set(data.active_users || []));
      }
    } catch (err) {
      console.error('Error fetching active users:', err);
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
        const sortedMessages = data.sort((a: Message, b: Message) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
        
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

  // 👇 Poprawiona funkcja przełączania konwersacji z pobieraniem profilu
  const handleSelectConversation = async (conversation: Conversation) => {
    setMessages([]);
    setLoading(true);
    
    // 👇 Upewnij się, że mamy aktualny profil użytkownika
    if (!userProfiles.has(conversation.friend_id)) {
      const profile = await fetchUserProfile(conversation.friend_id);
      if (profile) {
        setUserProfiles(prev => new Map(prev).set(conversation.friend_id, profile));
      }
    }
    
    setSelectedConversation(conversation);
    await fetchMessages(conversation.conversation_id);
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
    await awardPoints("chat_message", "Sent message");
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

  // 👇 Pobierz narodowość z profilu użytkownika
  const getFriendNationality = (friendId: number): string | undefined => {
    const profile = userProfiles.get(friendId);
    return profile?.nationality;
  };

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const scrollToBottom = () => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      };
      
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id === user?.id) {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'auto'
        });
      }
    }
  }, [messages, user?.id]);

  useEffect(() => {
    fetchConversations();
    fetchActiveUsers();
    
    const conversationsInterval = setInterval(fetchConversations, 10000);
    const activeUsersInterval = setInterval(fetchActiveUsers, 15000);
    
    return () => {
      clearInterval(conversationsInterval);
      clearInterval(activeUsersInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation && !friend) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.conversation_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation, friend]);

  useEffect(() => {
    if (!friend || !user) return;

    const openFriendChat = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // 👇 Najpierw pobierz profil użytkownika aby mieć narodowość
        const profile = await fetchUserProfile(friend.id);
        
        const convResponse = await fetch(`http://localhost:5000/api/chat/conversation/${friend.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (convResponse.ok) {
          const convData = await convResponse.json();
          const conv: Conversation = {
            conversation_id: convData.conversation_id,
            friend_id: friend.id,
            friend_login: friend.login,
            friend_name: friend.name,
            friend_nationality: profile?.nationality || friend.nationality, // 👈 Użyj narodowości z profilu
            last_message: null,
            last_message_time: null,
            unread_count: 0,
            is_active: activeUsers.has(friend.id)
          };
          
          // 👇 Zapisz profil w stanie
          if (profile) {
            setUserProfiles(prev => new Map(prev).set(friend.id, profile));
          }
          
          setSelectedConversation(conv);
          await fetchMessages(convData.conversation_id);
        }
      } catch (err) {
        console.error('Failed to open chat with friend:', err);
      }
    };

    openFriendChat();
  }, [friend, user, activeUsers]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const renderNationalityFlag = (nationality: string | undefined) => {
    if (!nationality) return null;

    const flagEmojis: { [key: string]: string } = {
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'PL': '🇵🇱',
      'RU': '🇷🇺',
      'FR': '🇫🇷',
      'DE': '🇩🇪',
      'ES': '🇪🇸',
      'CA': '🇨🇦',
    };

    return flagEmojis[nationality] || '🏳️';
  };

  const isUserActive = (userId: number): boolean => {
    return activeUsers.has(userId);
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
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedConversation ? selectedConversation.friend_name : 'Messages'}
            </h3>
            {selectedConversation && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isUserActive(selectedConversation.friend_id) 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-gray-400'
                    }`}
                    title={isUserActive(selectedConversation.friend_id) ? "Online" : "Offline"}
                  />
                  <span className="text-gray-500">
                    {isUserActive(selectedConversation.friend_id) ? "Online" : "Offline"}
                  </span>
                </div>
                {/* 👇 Użyj narodowości z profilu użytkownika */}
                {getFriendNationality(selectedConversation.friend_id) && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <span>•</span>
                    <span>{renderNationalityFlag(getFriendNationality(selectedConversation.friend_id))}</span>
                    <span>{getFriendNationality(selectedConversation.friend_id)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {unreadCount > 0 && !selectedConversation && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {selectedConversation && (
            <button
              onClick={() => {
                setSelectedConversation(null);
                setMessages([]);
              }}
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

      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedConversation ? (
          <div className="h-full overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with your friends!</p>
              </div>
            ) : (
              conversations.map(conv => {
                const friendNationality = getFriendNationality(conv.friend_id);
                
                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 border-b text-left transition-colors ${
                      isDarkMode
                        ? 'border-gray-700 hover:bg-gray-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{conv.friend_login}</span>
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            isUserActive(conv.friend_id) 
                              ? 'bg-green-500 animate-pulse' 
                              : 'bg-gray-400'
                          }`}
                          title={isUserActive(conv.friend_id) ? "Online" : "Offline"}
                        />
                        {friendNationality && (
                          <span className="text-sm" title={friendNationality}>
                            {renderNationalityFlag(friendNationality)}
                          </span>
                        )}
                      </div>
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
                );
              })
            )}
          </div>
        ) : (
          <>
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  const isSenderActive = isUserActive(msg.sender_id);
                  
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 relative ${
                          isOwn
                            ? isDarkMode
                              ? 'bg-yellow-600 text-white'
                              : 'bg-blue-100 text-gray-900'
                            : isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                        } ${
                          !isOwn && isSenderActive 
                            ? 'ring-2 ring-green-400 ring-opacity-50' 
                            : ''
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(msg.created_at)}
                        </p>
                        {!isOwn && isSenderActive && (
                          <div 
                            className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                            title="User is online"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

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