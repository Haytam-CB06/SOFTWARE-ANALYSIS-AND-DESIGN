import { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Edit2, Check, X, ArrowDown } from 'lucide-react';
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
  admin: 'text-blue-600',
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevMessagesLengthRef = useRef(0);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);


  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

useEffect(() => {
  const prevLength = prevMessagesLengthRef.current;

  if (prevLength === 0) {
    prevMessagesLengthRef.current = messages.length;
    setTimeout(() => scrollToBottom(), 50);
    return;
  }

  if (messages.length > prevLength) {
    const addedCount = messages.length - prevLength;

    if (isUserAtBottom()) {
      setTimeout(() => scrollToBottom(), 50);
    } else {
      setShowScrollButton(true);
      setNewMessagesCount((count) => count + addedCount);
    }
  }

  prevMessagesLengthRef.current = messages.length;
}, [messages]);
  useEffect(() => {
    // Poll every 2 seconds, but only while this component is mounted (i.e., on the Chat tab/route)
    loadMessages();
    const id = window.setInterval(() => {
      loadMessages();
    }, 2000);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, [workspace.id]);

  

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

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });

  setShowScrollButton(false);
  setNewMessagesCount(0);
};

  const isUserAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleMessagesScroll = () => {
    if (isUserAtBottom()) {
      setShowScrollButton(false);
      setNewMessagesCount(0);
    }
  };
  
  const loadMessages = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/${workspace.id}/messages?limit=200`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(currentUser?.id && uuidLike(String(currentUser.id)) ? { "X-User-Id": String(currentUser.id) } : {}),
          },
          signal: controller.signal,
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
        edited: Boolean(m.edited),
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
      if (e?.name === 'AbortError') return;
      console.error('[WorkspaceChat] loadMessages error:', e);
      toast.error(e.message || 'Failed to load messages');
    } finally {
      isFetchingRef.current = false;
    }
  };

  

  // Local UI helper for edit/delete actions (not persisted to backend yet)
  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

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
        setTimeout(() => scrollToBottom(), 50);
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
  const handleSaveEdit = async () => {
    if (!editingContent.trim() || !editingMessageId) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/messages/${editingMessageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
          },
          body: JSON.stringify({
            content: editingContent.trim(),
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || `Failed to update message (${res.status})`);
      }

      const updatedMessages = messages.map((m) =>
        m.id === editingMessageId
          ? {
              ...m,
              content: data.content,
              edited: Boolean(data.edited),
            }
          : m
      );

      saveMessages(updatedMessages);
      setEditingMessageId(null);
      setEditingContent('');
      toast.success('Message updated');
    } catch (e: any) {
      console.error('[WorkspaceChat] edit error:', e);
      toast.error(e.message || 'Failed to update message');
    }
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
   <div className="relative flex h-full min-h-0 flex-col">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-0 sm:px-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-gray-500">
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
                className={`flex w-full gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {isOwn ? (
                  <div className="h-10 w-10 flex-shrink-0" />
                ) : showAvatar ? (
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {API_BASE_URL && message.userId !== 'system' && uuidLike(message.userId) ? (
                      <AvatarImage src={`${API_BASE_URL}/user/${message.userId}/profile-picture`} alt={message.userName} />
                    ) : null}
                    <AvatarFallback className="bg-gray-500 text-white">
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 flex-shrink-0" />
                )}

                <div className={`flex min-w-0 flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] lg:max-w-[68%]`}>
                  {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-sm text-gray-900">{isOwn ? 'Me' : message.userName}</span>
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
                          className={`min-w-0 max-w-full rounded-2xl px-4 py-2.5 shadow-sm ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-200 bg-gray-50 text-gray-900'
                          }`}
                        >
                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6">
                        {message.content}
                      </p>
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
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMessage(message.id)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
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
      {showScrollButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition"
          >
            <ArrowDown className="h-4 w-4" />
            {newMessagesCount > 0 ? `${newMessagesCount} new messages` : 'New messages'}
          </button>
        </div>
      )}
      {/* Message Input */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 sm:px-4 lg:px-6">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-lg sm:p-4">
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
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-9">
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
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
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
            className="shrink-0"
          >
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Send</span>
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
