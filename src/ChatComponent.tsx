import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';
import { translations } from './Translations/TranslationsChatComponent';

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
  const [userProfiles, setUserProfiles] = useState<Map<number, UserProfile>>(new Map());
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'EN';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const t = translations[language] || translations['EN'];

  // Get language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'EN';
    setLanguage(savedLanguage);

    // Listen for storage events (changes in other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'preferredLanguage' && e.newValue) {
        setLanguage(e.newValue);
      }
    };

    // Also listen for custom event (for same-page updates)
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.language) {
        setLanguage(customEvent.detail.language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

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

  const fetchUserProfilesForConversations = async (convs: Conversation[]) => {
    const profiles = new Map<number, UserProfile>();
    
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
        
        await fetchUserProfilesForConversations(data);
        
        const total = data.reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const awardPoints = async (actionType: string, details?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch('http://localhost:5000/api/loyalty/award-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ actionType, details })
      });
    } catch (err) {
      console.error('Failed to award points:', err);
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

  const handleSelectConversation = async (conversation: Conversation) => {
    setMessages([]);
    setLoading(true);
    
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
        await awardPoints('chat_message', 'Sent message');
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

  const getFriendNationality = (friendId: number): string | undefined => {
    const profile = userProfiles.get(friendId);
    return profile?.nationality;
  };

  // Enhanced time formatting with translations
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      if (diff < 60000) return t.justNow;
      if (diff < 3600000) return `${Math.floor(diff / 60000)}${t.minutesAgo}`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return t.yesterday;
    }
    
    // This week
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return date.toLocaleDateString();
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
            friend_nationality: profile?.nationality || friend.nationality,
            last_message: null,
            last_message_time: null,
            unread_count: 0,
            is_active: activeUsers.has(friend.id)
          };
          
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

  // Define static Tailwind class names for each theme
  const themeClasses = {
    dark: {
      bg: 'bg-slate-900', // Dark blue background
      text: 'text-white',
      border: 'border-slate-700',
      headerBg: 'bg-slate-900',
      headerBorder: 'border-slate-700',
      conversationBg: 'bg-slate-800',
      conversationHover: 'hover:bg-slate-700',
      messageOwnBg: 'bg-green-500',
      messageOwnText: 'text-white',
      messageOtherBg: 'bg-slate-800',
      messageOtherText: 'text-white',
      messageOtherBorder: 'border-slate-700',
      inputBg: 'bg-slate-800',
      inputBorder: 'border-slate-700',
      inputFocusRing: 'focus:ring-green-500',
      buttonBg: 'bg-green-500',
      buttonHover: 'hover:bg-green-600',
      buttonDisabled: 'disabled:bg-slate-800',
      unreadBadgeBg: 'bg-red-500',
      unreadBadgeText: 'text-white',
      onlineIndicator: 'bg-green-500',
      offlineIndicator: 'bg-gray-400',
      loadingText: 'text-gray-400',
      noMessagesText: 'text-gray-400',
      placeholder: 'placeholder-gray-400',
    },
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
      headerBg: 'bg-white',
      headerBorder: 'border-gray-200',
      conversationBg: 'bg-gray-50',
      conversationHover: 'hover:bg-white',
      messageOwnBg: 'bg-blue-500',
      messageOwnText: 'text-white',
      messageOtherBg: 'bg-white',
      messageOtherText: 'text-gray-900',
      messageOtherBorder: 'border-gray-200',
      inputBg: 'bg-white',
      inputBorder: 'border-gray-300',
      inputFocusRing: 'focus:ring-blue-500',
      buttonBg: 'bg-blue-500',
      buttonHover: 'hover:bg-blue-600',
      buttonDisabled: 'disabled:bg-gray-200',
      unreadBadgeBg: 'bg-red-500',
      unreadBadgeText: 'text-white',
      onlineIndicator: 'bg-green-500',
      offlineIndicator: 'bg-gray-400',
      loadingText: 'text-gray-500',
      noMessagesText: 'text-gray-500',
      placeholder: 'placeholder-gray-500',
    }
  };

  const classes = isDarkMode ? themeClasses.dark : themeClasses.light;

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[600px] rounded-lg shadow-2xl flex flex-col z-50 ${classes.bg} ${classes.text} ${classes.border}`}>
      <div className={`flex items-center justify-between p-4 border-b ${classes.headerBorder} ${classes.headerBg}`}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-400" />
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedConversation ? selectedConversation.friend_name : t.messages}
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
                    title={isUserActive(selectedConversation.friend_id) ? t.online : t.offline}
                  />
                  <span className={`text-${classes.placeholder}`}>
                    {isUserActive(selectedConversation.friend_id) ? t.online : t.offline}
                  </span>
                </div>
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
            <span className={`bg-red-500 text-white text-xs px-2 py-1 rounded-full`}>
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
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Users className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedConversation ? (
          <div className={`h-full overflow-y-auto ${classes.conversationBg}`}>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MessageCircle className="w-12 h-12 mb-2 text-gray-400" />
                <p className="text-center mb-1">{t.noConversations}</p>
                <p className="text-sm text-center">{t.startChatting}</p>
              </div>
            ) : (
              conversations.map(conv => {
                const friendNationality = getFriendNationality(conv.friend_id);
                
                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 border-b ${classes.border} text-left transition-colors ${classes.conversationHover} ${classes.conversationBg}`}
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
                          title={isUserActive(conv.friend_id) ? t.online : t.offline}
                        />
                        {friendNationality && (
                          <span className="text-sm" title={friendNationality}>
                            {renderNationalityFlag(friendNationality)}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${classes.placeholder}`}>
                        {conv.last_message_time && formatTime(conv.last_message_time)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate flex-1 ${classes.placeholder}`}>
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
              className={`flex-1 overflow-y-auto p-4 space-y-3 ${classes.bg}`}
            >
              {loading ? (
                <div className={`text-center ${classes.loadingText}`}>{t.loadingMessages}</div>
              ) : messages.length === 0 ? (
                <div className={`text-center ${classes.noMessagesText}`}>
                  {t.noMessages}. {t.startConversation}
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
                            ? `${classes.messageOwnBg} ${classes.messageOwnText} shadow-sm`
                            : `${classes.messageOtherBg} ${classes.messageOtherText} border ${classes.messageOtherBorder}`
                        } ${
                          !isOwn && isSenderActive 
                            ? 'ring-2 ring-green-400 ring-opacity-50' 
                            : ''
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : classes.placeholder}`}>
                          {formatTime(msg.created_at)}
                        </p>
                        {!isOwn && isSenderActive && (
                          <div 
                            className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"
                            title={t.userOnline}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`p-4 border-t ${classes.border} ${classes.bg}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.typeMessage}
                  className={`flex-1 px-3 py-2 rounded border ${classes.inputBorder} ${classes.inputBg} ${classes.text} ${classes.placeholder} focus:outline-none focus:ring-2 ${classes.inputFocusRing} focus:border-transparent`}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded ${classes.buttonBg} ${classes.buttonHover} text-white ${classes.buttonDisabled} transition-colors flex items-center justify-center`}
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