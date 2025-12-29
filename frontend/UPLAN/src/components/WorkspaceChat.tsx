import { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  edited?: boolean;
}

interface WorkspaceChatProps {
  workspace: {
    id: string;
    name: string;
    members: Member[];
  };
  currentUser: Member;
}

const roleColors = {

  owner: 'text-yellow-600',
  admin: 'text-purple-600',
  member: 'text-blue-600',
  viewer: 'text-gray-600'
};

const uuidLike = (v: string) => /^[0-9a-fA-F-]{8,}$/.test(v);

export default function WorkspaceChat({ workspace, currentUser }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadMessages();
  }, [workspace.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const loadMessages = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/${workspace.id}/messages?limit=200`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to load messages (${res.status})`);
      }

      const data = await res.json();
      const mapped: Message[] = (data || []).map((m: any) => ({
        id: String(m.id),
        userId: m.user_id ? String(m.user_id) : 'system',
        userName: m.username || 'Unknown',
        content: m.content,
        timestamp: m.created_at,
      }));

      // If empty, show a UI-only welcome message (not persisted)
      if (mapped.length === 0) {
        setMessages([
          {
            id: 'welcome',
            userId: 'system',
            userName: 'System',
            content: `Welcome to ${workspace.name}! Start collaborating with your team.`,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages(mapped);
    } catch (e: any) {
      console.error('[WorkspaceChat] loadMessages error:', e);
      toast.error(e.message || 'Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Local UI helper for edit/delete actions (not persisted to backend yet)
  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    // ============================================================================
    // 🔌 BACKEND INTEGRATION POINT - SEND CHAT MESSAGE
    // ============================================================================
    // This section sends a chat message to the workspace
    // 
    // API Endpoint: POST /api/workspaces/:workspaceId/messages
    // Request Body: {
    //   content: string,
    //   userId: string,
    //   userName: string,
    //   timestamp: string        // ISO format
    // }
    // Response: {
    //   success: boolean,
    //   message: {
    //     id: string,
    //     userId: string,
    //     userName: string,
    //     content: string,
    //     timestamp: string,
    //     edited: boolean
    //   }
    // }
    // 
    // Real-time Features (WebSocket/Socket.io):
    // - Broadcast new messages to all workspace members
    // - Show typing indicators
    // - Display online/offline status
    // - Deliver read receipts
    // - Send push notifications for mentions
    // 
    // Backend Implementation:
    // - Use WebSocket for real-time messaging
    // - Store messages in database with indexing
    // - Implement message pagination/infinite scroll
    // - Add file upload support
    // - Support reactions and threads
    // 
    // TODO: Replace localStorage with WebSocket + API call
    // ============================================================================

    (async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${API_BASE_URL}/chat/workspaces/${workspace.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            username: currentUser.name,
            content: newMessage.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Failed to send message (${res.status})`);
        }

        // Optimistic append
        const now = new Date().toISOString();
        const payload = await res.json().catch(() => ({}));
        const message: Message = {
          id: String(payload.id || `msg-${Date.now()}`),
          userId: currentUser.id,
          userName: currentUser.name,
          content: newMessage.trim(),
          timestamp: now,
        };
        setMessages((prev) => [...prev.filter((m) => m.id !== 'welcome'), message]);
        setNewMessage('');
      } catch (e: any) {
        console.error('[WorkspaceChat] send error:', e);
        toast.error(e.message || 'Failed to send message');
      }
    })();
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editingContent.trim() || !editingMessageId) return;

    const updatedMessages = messages.map(m =>
      m.id === editingMessageId
        ? { ...m, content: editingContent.trim(), edited: true }
        : m
    );

    saveMessages(updatedMessages);
    setEditingMessageId(null);
    setEditingContent('');
    toast.success('Message updated');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      const updatedMessages = messages.filter(m => m.id !== messageId);
      saveMessages(updatedMessages);
      toast.success('Message deleted');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 48) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const getMemberRole = (userName: string) => {
    const member = workspace.members.find(m => m.name === userName);
    return member?.role || 'member';
  };

  const isSystemMessage = (message: Message) => message.userId === 'system';
  const isOwnMessage = (message: Message) => message.userId === currentUser.id;

  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '❤️', '😂', '🎉', '🔥', '✨', '💯', '👏', '🙌', '💪', '🤔', '😅', '🎯', '📚', '✅', '⭐', '💡'];

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Create a message with file info
    const message: Message = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      content: `📎 Shared a file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, message];
    saveMessages(updatedMessages);
    toast.success('File shared in chat!');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Team Chat</h2>
            <p className="text-sm text-gray-500 mt-1">
              {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''} • Be respectful and collaborative
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSystem = isSystemMessage(message);
            const isOwn = isOwnMessage(message);
            const role = getMemberRole(message.userName);
            const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${!showAvatar ? 'ml-12' : ''}`}
              >
                {showAvatar ? (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {API_BASE_URL && message.userId !== 'system' && uuidLike(message.userId) ? (
                      <AvatarImage src={`${API_BASE_URL}/user/${message.userId}/profile-picture`} alt={message.userName} />
                    ) : null}
                    <AvatarFallback className={`${
                      isOwn 
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    } text-white`}>
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 flex-shrink-0" />
                )}

                <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col max-w-[70%]`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-sm text-gray-900">{message.userName}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${roleColors[role]} border-current`}
                      >
                        {role}
                      </Badge>
                    </div>
                  )}

                  <div className={`group relative ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {editingMessageId === message.id ? (
                      <div className="w-full bg-white border-2 border-blue-500 rounded-lg p-3">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            }
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="mb-2"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        {message.edited && (
                          <span className={`text-xs mt-1 block ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            (edited)
                          </span>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>

                      {isOwn && editingMessageId !== message.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMessage(message.id)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container mb-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Quick Emojis</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-9 gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
            
            {/* Emoji Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </Button>
            
            {/* Attachment Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </Button>
            
            {/* Send Button */}
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
