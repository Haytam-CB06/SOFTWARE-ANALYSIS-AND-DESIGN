import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type ReactNode } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Edit2, Check, X, ArrowDown, Eye, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from "react-i18next";
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
  lastSeen?: string;
  isOnline?: boolean;
}

interface MessageReadStatus {
  userId: string;
  userName: string;
  readAt: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  readBy?: MessageReadStatus[];
}

interface WorkspaceChatProps {
  workspace: {
    id: string;
    name: string;
    members: Member[];
  };
  currentUser: Member;
  onUnreadCountChange?: (count: number) => void;
}

const roleColors = {
  owner: 'text-neutral-800 dark:text-neutral-100',
  admin: 'text-neutral-700 dark:text-neutral-200',
  member: 'text-neutral-600 dark:text-neutral-300',
  viewer: 'text-neutral-500 dark:text-neutral-400',
};

const uuidLike = (v: string) => /^[0-9a-fA-F-]{8,}$/.test(v);

export default function WorkspaceChat({ workspace, currentUser,onUnreadCountChange }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasUnseenMessages, setHasUnseenMessages] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const { t } = useTranslation();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);


  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  const normalizeUrl = (url: string) => {
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const getDomainLabel = (url: string) => {
    try {
      const parsed = new URL(normalizeUrl(url));
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return t("workspace.chat.link");
    }
  };

  const renderMessageContent = (content: string, isOwn: boolean) => {
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      if (/^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(part)) {
        const href = normalizeUrl(part);
        const label = getDomainLabel(part);

        return (
          <a
            key={`${part}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 my-1 text-sm font-medium underline-offset-2 transition hover:underline ${
              isOwn
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/15 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                : 'border-neutral-200 bg-neutral-50 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <Paperclip className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </a>
        );
      }

      return (
        <span key={`${index}-${part}`} className="whitespace-pre-wrap break-words">
          {part}
        </span>
      );
    });
  };
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
  const markMessagesAsRead = async (messageIds: string[]) => {
  if (messageIds.length === 0) return;

  try {
    const res = await fetch(`${API_BASE_URL}/chat/workspaces/messages/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id,
      },
      body: JSON.stringify({
        message_ids: messageIds.map(Number),
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log('mark-read response:', data);

    if (!res.ok) {
      throw new Error(data.detail || `Failed to mark read (${res.status})`);
    }

    // update only the READER's local copy
    setMessages((prev) =>
      prev.map((m) => {
        if (!messageIds.includes(m.id)) return m;
        if (m.userId === currentUser.id) return m;

        const alreadyRead = (m.readBy || []).some(
          (r) => r.userId === currentUser.id
        );
        if (alreadyRead) return m;

        return {
          ...m,
          readBy: [
            ...(m.readBy || []),
            {
              userId: currentUser.id,
              userName: currentUser.name,
              readAt: new Date().toISOString(),
            },
          ],
        };
      })
    );

    // force fresh reload so sender can later see ✓✓
    setTimeout(() => {
      loadMessages();
    }, 150);
  } catch (e: any) {
    console.error('[WorkspaceChat] mark as read error:', e);
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    setShowScrollButton(false);
    setNewMessagesCount(0);
    setHasUnseenMessages(false);
    setUnseenCount(0);
    onUnreadCountChange?.(0);

    const unreadIds = messages
      .filter(
        (m) =>
          m.userId !== currentUser.id &&
          !m.readBy?.some((r) => r.userId === currentUser.id)
      )
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      markMessagesAsRead(unreadIds);
    }
  };

  const isUserAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 20;
  };

  const handleMessagesScroll = () => {
  if (isUserAtBottom()) {
    setShowScrollButton(false);
    setNewMessagesCount(0);
    setHasUnseenMessages(false);
    setUnseenCount(0);
    onUnreadCountChange?.(0);
    const unreadIds = messages
      .filter(
        (m) =>
          m.userId !== currentUser.id &&
          !m.readBy?.some((r) => r.userId === currentUser.id)
      )
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      markMessagesAsRead(unreadIds);
    }
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
        `${API_BASE_URL}/chat/workspaces/${workspace.id}/messages?limit=200&_t=${Date.now()}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(currentUser?.id && uuidLike(String(currentUser.id))
              ? { "X-User-Id": String(currentUser.id) }
              : {}),
          },
          signal: controller.signal,
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to load messages (${res.status})`);
      }

      const data = await res.json();
      console.log('RAW /messages data:', JSON.stringify(data, null, 2));
      const mapped: Message[] = (data || []).map((m: any) => ({
        id: String(m.id),
        userId: m.user_id ? String(m.user_id) : 'system',
        userName: m.username || 'Unknown',
        content: m.content,
        timestamp: m.created_at,
        edited: Boolean(m.edited),
        readBy: Array.isArray(m.read_by)
          ? m.read_by.map((r: any) => ({
              userId: String(r.user_id),
              userName: r.username,
              readAt: r.read_at,
            }))
          : [],
      }));

      console.log('MAPPED own messages:', mapped.filter(m => m.userId === currentUser.id));

      if (mapped.length === 0) {
        setMessages([
          {
            id: 'welcome',
            userId: 'system',
            userName: 'System',
            content: t("workspace.chat.welcome", { name: workspace.name }),
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      setMessages((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
        return mapped;
      });
      console.log('SETTING messages:', mapped);

      const unseenMessages = mapped.filter(
        (m) =>
          m.userId !== currentUser.id &&
          !m.readBy?.some((r) => r.userId === currentUser.id)
      );
      if (unseenMessages.length > 0) {
        if (!isUserAtBottom()) {
          setHasUnseenMessages(true);
          setUnseenCount(unseenMessages.length);
          onUnreadCountChange?.(unseenMessages.length);
        } else {
          markMessagesAsRead(unseenMessages.map((m) => m.id));
          setHasUnseenMessages(false);
          setUnseenCount(0);
          onUnreadCountChange?.(0);
        }
      } else {
        setHasUnseenMessages(false);
        setUnseenCount(0);
        onUnreadCountChange?.(0);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('[WorkspaceChat] loadMessages error:', e);
      toast.error(e.message || t("workspace.chat.errors.loadMessages"));
    } finally {
      isFetchingRef.current = false;
    }
  };

  

  // Local UI helper for edit/delete actions (not persisted to backend yet)
  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
  };

  const handleSendMessage = (e: FormEvent) => {
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
        toast.error(e.message || t("workspace.chat.errors.sendMessage"));
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
      toast.success(t("workspace.chat.success.messageUpdated"));
    } catch (e: any) {
      console.error('[WorkspaceChat] edit error:', e);
      toast.error(e.message || t("workspace.chat.errors.updateMessage"));
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t("workspace.chat.confirmDeleteMessage"))) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": currentUser.id,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || t("workspace.chat.errors.deleteMessage"));
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success(t("workspace.chat.success.messageDeleted"));
    } catch (e: any) {
      console.error("[WorkspaceChat] delete error:", e);
      toast.error(e.message || t("workspace.chat.errors.deleteMessage"));
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
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return t("workspace.chat.yesterdayAt", {
        time: date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      });
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("workspace.chat.errors.fileTooLarge"));
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
    toast.success(t("workspace.chat.success.fileShared"));
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
   <div className="relative flex h-full min-h-0 flex-col">
      {/* Members Last Seen Section */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-4 dark:border-neutral-800 dark:bg-neutral-900 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t("workspace.chat.teamActivity")}</span>
            </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("workspace.chat.onlineCount", { count: workspace.members.filter(m => m.isOnline).length })}
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Online Members */}
          {workspace.members.filter(m => m.isOnline).length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t("workspace.chat.online")}</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {workspace.members.filter(m => m.isOnline).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        {API_BASE_URL && uuidLike(member.id) ? (
                          <AvatarImage src={`${API_BASE_URL}/user/${member.id}/profile-picture`} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="bg-gray-400 text-white text-xs font-bold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">{member.name}</span>
                      <span className="text-xs text-green-600 font-medium">{t("workspace.chat.activeNow")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Offline Members */}
          {workspace.members.filter(m => !m.isOnline).length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {workspace.members.filter(m => !m.isOnline).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        {API_BASE_URL && uuidLike(member.id) ? (
                          <AvatarImage src={`${API_BASE_URL}/user/${member.id}/profile-picture`} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="bg-gray-400 text-white text-xs font-bold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-gray-400 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">{member.name}</span>
                      <span className="text-xs text-gray-500">
                        {member.lastSeen
                          ? t("workspace.chat.lastSeen", { time: formatTime(member.lastSeen) })
                          : t("workspace.chat.justNow")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 pb-28 sm:px-4 lg:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <Send className="mx-auto mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm font-medium">{t("workspace.chat.emptyTitle")}</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t("workspace.chat.emptySubtitle")}
                </p>
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
                  <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`mb-4 flex w-full gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
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
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{isOwn ? t("workspace.chat.me") : message.userName}</span>
                        <Badge
                        variant="outline"
                        className="border-neutral-200 bg-white text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                      >
                        {role}
                      </Badge>
                      </div>
                    )}

                  <div className={`group relative ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {editingMessageId === message.id ? (
                      <div className="w-full rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
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
                          className="mb-2 h-10 rounded-lg border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-300 focus-visible:ring-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Check className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200" />
                            {t("workspace.chat.actions.save")}

                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"/>
                            {t("workspace.chat.actions.cancel")}

                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                          className={`min-w-0 max-w-full rounded-2xl px-4 py-3 shadow-sm ${
                          isOwn
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                        }`}
                        >
                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6">
                       {renderMessageContent(message.content, isOwn)}
                      </p>
                        {message.edited && (
                          <span className={`text-xs mt-1 block ${isOwn ? 'text-white/70 dark:text-neutral-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            ({t("workspace.chat.edited")})
                          </span>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatTime(message.timestamp)}
                      </span>

                      {isOwn && (
                        <div className="flex items-center gap-1">
                          {(() => {
                            const readers = (message.readBy || []).filter(
                              (r) => r.userId !== currentUser.id
                            );

                            return readers.length > 0 ? (
                              <div className="group relative cursor-help">
                                <span className="text-base leading-none text-neutral-700 dark:text-neutral-200 font-bold">✓✓</span>
                                
                              </div>
                            ) : (
                              <span className="text-base leading-none text-neutral-400 dark:text-neutral-500 font-bold">✓</span>
                            );
                          })()}
                        </div>
                      )}

                      {isOwn && editingMessageId !== message.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 rounded-md p-0 text-neutral-500 opacity-70 transition hover:bg-neutral-100 hover:opacity-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMessage(message.id)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              {t("workspace.chat.actions.edit")}
                            </DropdownMenuItem>   
                            <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                              <X className="h-4 w-4 mr-2" />
                              {t("workspace.chat.actions.delete")}
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
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-neutral-900 shadow-lg transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"          >
            <ArrowDown className="h-4 w-4" />
            {hasUnseenMessages ? (
              <div className="flex items-center gap-2">
                <span>{t("workspace.chat.newMessagesCount", { count: unseenCount })}</span>
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-bold">
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              </div>
            ) : (
              t("workspace.chat.newMessages")
            )}
          </button>
        </div>
      )}
      {/* Message Input */}
      <div className="sticky bottom-0 z-20 shrink-0 border-t border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900 sm:px-4 lg:px-6">        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker-container absolute bottom-full left-3 right-3 mb-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:left-4 sm:right-4 sm:p-4 lg:left-6 lg:right-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t("workspace.chat.quickEmojis")}</h4>
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
          <div className="flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("workspace.chat.placeholder")}
              className="h-11 border-0 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-neutral-100 dark:placeholder:text-neutral-500"
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
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            
            {/* Emoji Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title={t("workspace.chat.actions.addEmoji")}
            >
              <Smile className="h-5 w-5 " />
            </Button>
            
            
            {/* Send Button */}
            <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-10 shrink-0 rounded-lg bg-neutral-900 px-4 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
          >
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("workspace.chat.actions.send")}</span>
          </Button>
          </div>
        </form>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {t("workspace.chat.hint")}
        </p>
      </div>
    </div>
  );
}
