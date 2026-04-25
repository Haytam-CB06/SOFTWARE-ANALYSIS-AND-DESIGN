import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Info, Link2, MessageSquare, Pencil, Pin, RefreshCw, Save, Send, Smile, Trash2, UserPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiJsonAuthed, API_BASE_URL } from '../lib/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ProfileBackgroundCanvas, profileBackgroundChoices } from './ProfileBackground';

interface PublicProfile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  profile_title?: string | null;
  background_theme?: string | null;
  completed_hours?: number;
  most_productive_week?: string | null;
  most_productive_week_hours?: number;
  most_productive_month?: string | null;
  most_productive_month_hours?: number;
  joined_at?: string | null;
  friendship_status?: 'self' | 'none' | 'friends' | 'pending_sent' | 'pending_received';
  friends_since?: string | null;
  last_seen_at?: string | null;
  is_online?: boolean;
}

interface FriendProfile extends PublicProfile {
  friendship_id: string;
  status: 'pending' | 'accepted';
  requested_at?: string | null;
  direction: 'sent' | 'received';
}

interface DirectMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at?: string | null;
  read_at?: string | null;
}

interface DirectConversation {
  friend: FriendProfile;
  last_message?: DirectMessage | null;
  unread_count?: number;
  nickname?: string | null;
  pinned?: boolean;
}

const getCurrentUser = () => ({
  id: localStorage.getItem('currentUserId') || '',
  name: localStorage.getItem('currentUserName') || 'You',
  email: localStorage.getItem('currentUserEmail') || '',
});

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

const getProfileImageUrl = (profile?: { id?: string; profile_picture_url?: string | null }) => {
  if (!profile?.id) return '';
  if (profile.profile_picture_url) return `${API_BASE_URL}${profile.profile_picture_url}`;
  return `${API_BASE_URL}/user/${profile.id}/profile-picture`;
};

const getLastSeenText = (
  lastActive: string | null | undefined,
  isOnline: boolean | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (isOnline) return t('directMessages.presence.online');
  if (!lastActive) return t('directMessages.presence.offline');
  const diffMs = Date.now() - new Date(lastActive).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return t('directMessages.presence.justNow');
  if (diffMins < 60) return t('directMessages.presence.minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('directMessages.presence.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('directMessages.presence.daysAgo', { count: diffDays });
  return new Date(lastActive).toLocaleDateString();
};

const extractFirstUrl = (content: string) => content.match(/https?:\/\/[^\s<>"']+/i)?.[0] || null;

const normalizeBackgroundTheme = (theme?: string | null) =>
  profileBackgroundChoices.some((choice) => choice.id === theme) ? String(theme) : profileBackgroundChoices[0].id;

export default function DirectMessages() {
  const { t } = useTranslation();
  const currentUser = useMemo(getCurrentUser, []);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [conversationTarget, setConversationTarget] = useState<PublicProfile | FriendProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileUsernameDraft, setProfileUsernameDraft] = useState('');
  const [profileTitleDraft, setProfileTitleDraft] = useState('');
  const [profileBackgroundDraft, setProfileBackgroundDraft] = useState(profileBackgroundChoices[0].id);
  const [friendLink, setFriendLink] = useState('');
  const [hiddenConversationIds, setHiddenConversationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('uplan_hidden_direct_conversations') || '[]');
    } catch {
      return [];
    }
  });
  const quickReactions = [
    t('directMessages.quickReplies.ok'),
    t('directMessages.quickReplies.nice'),
    t('directMessages.quickReplies.done'),
    t('directMessages.quickReplies.thanks'),
    '+1',
  ];
  const messageTemplates = [
    t('directMessages.templates.studyCheckIn', 'Can we review the plan for this week?'),
    t('directMessages.templates.meetup', 'Are you free to study together later today?'),
    t('directMessages.templates.followUp', 'Quick follow-up on the last message.'),
  ];

  const profileTitleFallback = t('directMessages.defaults.profileTitle');
  const usernameFallback = t('directMessages.defaults.username');
  const noSessionsLabel = t('directMessages.defaults.noSessions');
  const recentlyLabel = t('directMessages.defaults.recently');

  const getErrorMessage = (error: any, fallbackKey: string) => {
    if (error?.status === 401) return t('directMessages.errors.loginRequired');
    if (error?.status === 403) return t('directMessages.errors.friendsOnly');
    return t(fallbackKey);
  };

  const getFriendshipStatusLabel = (status?: PublicProfile['friendship_status']) => {
    switch (status) {
      case 'self':
        return t('directMessages.status.self');
      case 'friends':
        return t('directMessages.status.friends');
      case 'pending_sent':
        return t('directMessages.status.pendingSent');
      case 'pending_received':
        return t('directMessages.status.pendingReceived');
      default:
        return t('directMessages.status.none');
    }
  };

  const getBackgroundLabel = (choiceId: string) => t(`directMessages.backgrounds.${choiceId}`);

  const getBaseFriendName = (friend?: PublicProfile | FriendProfile | null) =>
    friend?.full_name || friend?.username || friend?.email || t('directMessages.defaults.friend');

  const getConversationFor = (friendId?: string | null) =>
    friendId ? conversations.find((conversation) => conversation.friend.id === friendId) : undefined;

  const getConversationDisplayName = (friend?: PublicProfile | FriendProfile | null) =>
    getConversationFor(friend?.id)?.nickname || getBaseFriendName(friend);

  const visibleConversations = useMemo(
    () => conversations.filter((conversation) => !hiddenConversationIds.includes(conversation.friend.id)),
    [conversations, hiddenConversationIds]
  );

  const loadFriends = async () => {
    if (!currentUser.id) return;
    try {
      const data = await apiJsonAuthed<FriendProfile[]>(`/user/${encodeURIComponent(currentUser.id)}/friends`, 'GET');
      setFriends(Array.isArray(data) ? data : []);
    } catch {
      setFriends([]);
    }
  };

  const loadConversations = async () => {
    if (!currentUser.id) return;
    setLoadingConversations(true);
    try {
      const data = await apiJsonAuthed<DirectConversation[]>(`/user/${encodeURIComponent(currentUser.id)}/conversations`, 'GET');
      setConversations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.loadMessages'));
    } finally {
      setLoadingConversations(false);
    }
  };

  const openProfile = async (userId: string) => {
    if (!userId) return;
    setProfileOpen(true);
    setProfileLoading(true);
    setSelectedProfile(null);
    setProfileEditMode(false);
    try {
      const profile = await apiJsonAuthed<PublicProfile>(`/user/${encodeURIComponent(userId)}/public-profile`, 'GET');
      setSelectedProfile(profile);
      setProfileNameDraft(profile.full_name || '');
      setProfileUsernameDraft(profile.username || '');
      setProfileTitleDraft(profile.profile_title || profileTitleFallback);
      setProfileBackgroundDraft(normalizeBackgroundTheme(profile.background_theme));
      await loadFriends();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.loadProfile'));
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const createFriendLink = async () => {
    try {
      const data = await apiJsonAuthed<{ token: string }>(`/user/${encodeURIComponent(currentUser.id)}/friend-link`, 'POST');
      const url = `${window.location.origin}${window.location.pathname}?page=messages&friend_token=${encodeURIComponent(data.token)}`;
      setFriendLink(url);
      await navigator.clipboard.writeText(url);
      toast.success(t('directMessages.success.profileLinkCopied'));
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.createProfileLink'));
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      await apiJsonAuthed(`/user/${encodeURIComponent(currentUser.id)}/friends/${encodeURIComponent(targetUserId)}`, 'POST');
      await openProfile(targetUserId);
      toast.success(t('directMessages.success.friendRequestSent'));
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.sendFriendRequest'));
    }
  };

  const acceptFriendRequest = async (targetUserId: string) => {
    try {
      await apiJsonAuthed(`/user/${encodeURIComponent(currentUser.id)}/friends/${encodeURIComponent(targetUserId)}/accept`, 'POST');
      await openProfile(targetUserId);
      await loadConversations();
      toast.success(t('directMessages.success.friendRequestAccepted'));
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.acceptFriendRequest'));
    }
  };

  const cancelProfileEdit = () => {
    if (!selectedProfile) return;
    setProfileNameDraft(selectedProfile.full_name || '');
    setProfileUsernameDraft(selectedProfile.username || '');
    setProfileTitleDraft(selectedProfile.profile_title || profileTitleFallback);
    setProfileBackgroundDraft(normalizeBackgroundTheme(selectedProfile.background_theme));
    setProfileEditMode(false);
  };

  const saveSharedProfile = async () => {
    if (!selectedProfile || selectedProfile.id !== currentUser.id) return;
    setProfileSaving(true);
    try {
      const updated = await apiJsonAuthed<PublicProfile>(`/user/${encodeURIComponent(currentUser.id)}`, 'PUT', {
        username: profileUsernameDraft.trim(),
        profile_title: profileTitleDraft.trim(),
        background_theme: profileBackgroundDraft,
      });
      setSelectedProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: updated.full_name ?? profileNameDraft.trim(),
              username: updated.username ?? profileUsernameDraft.trim(),
              email: updated.email ?? prev.email,
              profile_title: updated.profile_title ?? profileTitleDraft.trim(),
              background_theme: updated.background_theme ?? profileBackgroundDraft,
            }
          : prev
      );
      localStorage.setItem('currentUserName', updated.full_name || profileNameDraft.trim());
      setProfileEditMode(false);
      toast.success(t('directMessages.success.profileUpdated'));
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.updateProfile'));
    } finally {
      setProfileSaving(false);
    }
  };

  const loadMessages = async (targetUserId: string) => {
    setLoadingMessages(true);
    try {
      const data = await apiJsonAuthed<DirectMessage[]>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(targetUserId)}/messages`,
        'GET'
      );
      setMessages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.loadConversation'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const openConversation = async (target: PublicProfile | FriendProfile) => {
    if (!target?.id || target.id === currentUser.id) return;
    setConversationTarget(target);
    setNicknameDraft(getConversationFor(target.id)?.nickname || '');
    setMessageText('');
    await loadMessages(target.id);
    setConversations((prev) =>
      prev.map((conversation) => (conversation.friend.id === target.id ? { ...conversation, unread_count: 0 } : conversation))
    );
  };

  const sendMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const content = messageText.trim();
    if (!content || !conversationTarget) return;
    try {
      const message = await apiJsonAuthed<DirectMessage>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(conversationTarget.id)}/messages`,
        'POST',
        { content }
      );
      setMessages((prev) => [...prev, message]);
      setMessageText('');
      await loadConversations();
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.sendMessage'));
    }
  };

  const updateConversationPreference = async (targetId: string, updates: { nickname?: string | null; pinned?: boolean }) => {
    try {
      const updated = await apiJsonAuthed<DirectConversation>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(targetId)}/preferences`,
        'PATCH',
        updates
      );
      setConversations((prev) =>
        prev
          .map((conversation) => (conversation.friend.id === targetId ? { ...conversation, ...updated } : conversation))
          .sort((a, b) => {
            if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
            const aTime = a.last_message?.created_at || a.friend.friends_since || a.friend.requested_at || '';
            const bTime = b.last_message?.created_at || b.friend.friends_since || b.friend.requested_at || '';
            return bTime.localeCompare(aTime);
          })
      );
      if (updates.nickname !== undefined) setNicknameDraft(updated.nickname || '');
      if (conversationTarget?.id === targetId) {
        setConversationTarget((prev) =>
          prev
            ? {
                ...prev,
                ...(updated.friend || {}),
              }
            : prev
        );
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'directMessages.errors.updateConversation'));
    }
  };

  const hideConversation = (targetId: string) => {
    setHiddenConversationIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    if (conversationTarget?.id === targetId) {
      setConversationTarget(null);
      setMessages([]);
      setMessageText('');
    }
    toast.success(t('directMessages.success.chatHidden', 'Chat hidden from your list.'));
  };

  const renderMessageContent = (content: string, isOwn: boolean) => {
    const url = extractFirstUrl(content);
    if (!url) return <p className="whitespace-pre-wrap break-words">{content}</p>;
    const parts = content.split(url);
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap break-words">
          {parts[0]}
          <a href={url} target="_blank" rel="noreferrer" className={isOwn ? 'break-all underline' : 'break-all text-blue-700 underline dark:text-blue-300'}>
            {url}
          </a>
          {parts.slice(1).join(url)}
        </p>
        <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl border border-current/20 p-3 text-sm">
          {url.replace(/^https?:\/\//, '')}
        </a>
      </div>
    );
  };

  useEffect(() => {
    loadConversations();
    loadFriends();
    const id = window.setInterval(loadConversations, 15000);
    window.addEventListener('focus', loadConversations);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', loadConversations);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('uplan_hidden_direct_conversations', JSON.stringify(hiddenConversationIds));
  }, [hiddenConversationIds]);

  useEffect(() => {
    if (!conversationTarget?.id) return;

    const refreshOpenConversation = async () => {
      await Promise.all([loadConversations(), loadMessages(conversationTarget.id)]);
    };

    const id = window.setInterval(() => {
      void refreshOpenConversation();
    }, 15000);
    window.addEventListener('focus', refreshOpenConversation);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', refreshOpenConversation);
    };
  }, [conversationTarget?.id]);

  useEffect(() => {
    if (!conversationTarget?.id) return;
    const nickname = getConversationFor(conversationTarget.id)?.nickname || '';
    setNicknameDraft(nickname);
  }, [conversationTarget?.id, conversations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('friend_token');
    if (!token || !currentUser.id) return;

    (async () => {
      try {
        await apiJsonAuthed(`/user/${encodeURIComponent(currentUser.id)}/friend-link/${encodeURIComponent(token)}`, 'POST');
        toast.success(t('directMessages.success.friendAdded'));
        params.delete('friend_token');
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, document.title, next.endsWith('?') ? window.location.pathname : next);
        await loadFriends();
        await loadConversations();
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'directMessages.errors.acceptProfileLink'));
      }
    })();
  }, [currentUser.id]);

  return (
    <section className="min-h-[calc(100vh-7rem)] rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid min-h-[calc(100vh-7rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950 lg:border-b-0 lg:border-r">
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">{t('directMessages.title')}</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('directMessages.subtitle')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={loadConversations} className="rounded-xl">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => openProfile(currentUser.id)} className="mt-3 w-full rounded-xl bg-blue-700 text-white hover:bg-blue-800">
              <Link2 className="mr-2 h-4 w-4" />
              {t('directMessages.actions.profile')}
            </Button>
          </div>

          <div className="max-h-[360px] space-y-1 overflow-y-auto p-2 lg:h-[calc(100vh-13rem)] lg:max-h-none">
            {loadingConversations && conversations.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">{t('directMessages.loading.conversations')}</div>
            ) : conversations.length === 0 ? (
              <div className="m-2 rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                {t('directMessages.empty.noConversations')}
              </div>
            ) : (
              visibleConversations.map((conversation) => {
                const friend = conversation.friend;
                const selected = conversationTarget?.id === friend.id;
                const displayName = conversation.nickname || getBaseFriendName(friend);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => openConversation(friend)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                      selected
                        ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                        : 'text-neutral-900 hover:bg-white dark:text-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={getProfileImageUrl(friend)} alt={displayName} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          {conversation.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                          <span className="truncate text-sm font-semibold">{displayName}</span>
                        </span>
                        {!!conversation.unread_count && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </span>
                        )}
                      </span>
                      <span className={`mt-0.5 block truncate text-xs ${selected ? 'text-white/70 dark:text-neutral-700' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {conversation.last_message?.content || getLastSeenText(friend.last_seen_at, friend.is_online, t)}
                      </span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${friend.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[560px] min-w-0 flex-col bg-white dark:bg-neutral-950">
          {conversationTarget ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <button type="button" onClick={() => openProfile(conversationTarget.id)} className="flex min-w-0 items-center gap-3 text-left">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={getProfileImageUrl(conversationTarget)} alt={getBaseFriendName(conversationTarget)} />
                    <AvatarFallback>{getInitials(getBaseFriendName(conversationTarget))}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                      {getConversationDisplayName(conversationTarget)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className={`h-2 w-2 rounded-full ${conversationTarget.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                      {getLastSeenText(conversationTarget.last_seen_at, conversationTarget.is_online, t)}
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openProfile(conversationTarget.id)}
                    className="rounded-xl"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.info')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateConversationPreference(conversationTarget.id, { pinned: !getConversationFor(conversationTarget.id)?.pinned })}
                    className="rounded-xl"
                  >
                    <Pin className="mr-2 h-4 w-4" />
                    {getConversationFor(conversationTarget.id)?.pinned ? t('directMessages.actions.pinned') : t('directMessages.actions.pin')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => hideConversation(conversationTarget.id)}
                    className="rounded-xl text-red-600 dark:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.deleteChat', 'Delete chat')}
                  </Button>
                </div>
              </div>

              <div className="border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={nicknameDraft}
                    onChange={(event) => setNicknameDraft(event.target.value)}
                    placeholder={t('directMessages.placeholders.nickname')}
                    className="h-9 rounded-xl"
                  />
                  <Button size="sm" onClick={() => updateConversationPreference(conversationTarget.id, { nickname: nicknameDraft })} className="h-9 rounded-xl">
                    {t('directMessages.actions.saveNickname')}
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-[#070707]">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">{t('directMessages.loading.conversation')}</div>
                ) : messages.length === 0 ? (
                  <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {t('directMessages.empty.noMessages')}
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = String(message.sender_id) === String(currentUser.id);
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isOwn
                              ? 'bg-blue-700 text-white'
                              : 'border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {renderMessageContent(message.content, isOwn)}
                          <p className={`mt-1 text-[11px] ${isOwn ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('directMessages.states.sending')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    <Smile className="h-3.5 w-3.5" />
                    {t('directMessages.quickReplies.label')}
                  </span>
                  {quickReactions.map((reaction) => (
                    <button
                      key={reaction}
                      type="button"
                      onClick={() => setMessageText((prev) => `${prev}${prev ? ' ' : ''}${reaction}`)}
                      className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                      {reaction}
                    </button>
                  ))}
                  {messageTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setMessageText(template)}
                      className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                  <Textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder={t('directMessages.placeholders.message')}
                    className="min-h-[44px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button type="submit" disabled={!messageText.trim()} className="h-10 rounded-xl bg-blue-700 px-3 text-white hover:bg-blue-800">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full min-h-[560px] items-center justify-center p-6">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                  <MessageSquare className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">{t('directMessages.empty.chooseConversation')}</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t('directMessages.empty.chooseConversationDescription')}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('directMessages.profile.title')}</DialogTitle>
            <DialogDescription>{t('directMessages.profile.description')}</DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              {t('directMessages.loading.profile')}
            </div>
          ) : selectedProfile ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <ProfileBackgroundCanvas themeId={selectedProfile.background_theme} className="px-5 py-7 text-white">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="h-24 w-24 border-2 border-white/50 shadow-lg">
                        <AvatarImage src={getProfileImageUrl(selectedProfile)} alt={getBaseFriendName(selectedProfile)} />
                        <AvatarFallback className="bg-white/15 text-xl font-semibold text-white">
                          {getInitials(getBaseFriendName(selectedProfile))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-semibold">{getBaseFriendName(selectedProfile)}</p>
                        <p className="mt-1 truncate text-sm font-medium text-white/85">
                          {selectedProfile.profile_title || profileTitleFallback}
                        </p>
                        <p className="mt-1 truncate text-sm text-white/75">@{selectedProfile.username || String(selectedProfile.email || '').split('@')[0] || usernameFallback}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{t('directMessages.profile.joined')}</p>
                      <p className="mt-1 text-sm font-semibold">
                        {selectedProfile.joined_at ? new Date(selectedProfile.joined_at).toLocaleDateString() : recentlyLabel}
                      </p>
                    </div>
                  </div>
                </ProfileBackgroundCanvas>

                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('directMessages.profile.hoursCompleted')}</p>
                    <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{Number(selectedProfile.completed_hours || 0).toFixed(1)}h</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('directMessages.profile.mostProductiveWeek')}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedProfile.most_productive_week || noSessionsLabel}
                    </p>
                    <p className="text-xs text-neutral-500">{Number(selectedProfile.most_productive_week_hours || 0).toFixed(1)}h</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('directMessages.profile.mostProductiveMonth')}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedProfile.most_productive_month || noSessionsLabel}
                    </p>
                    <p className="text-xs text-neutral-500">{Number(selectedProfile.most_productive_month_hours || 0).toFixed(1)}h</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('directMessages.profile.connection')}</p>
                    <p className="mt-1 text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
                      {getFriendshipStatusLabel(selectedProfile.friendship_status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'none' && (
                  <Button onClick={() => sendFriendRequest(selectedProfile.id)} className="rounded-xl bg-blue-700 hover:bg-blue-800">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.addFriend')}
                  </Button>
                )}
                {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'pending_received' && (
                  <Button onClick={() => acceptFriendRequest(selectedProfile.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    <Check className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.acceptRequest')}
                  </Button>
                )}
                {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'friends' && (
                  <Button
                    onClick={() => openConversation(selectedProfile)}
                    className="rounded-xl border border-neutral-950 bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.message')}
                  </Button>
                )}
                {selectedProfile.id === currentUser.id && (
                  <Button onClick={createFriendLink} className="rounded-xl bg-blue-700 hover:bg-blue-800">
                    <Link2 className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.copyProfileLink')}
                  </Button>
                )}
                {selectedProfile.id === currentUser.id && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (profileEditMode) {
                        cancelProfileEdit();
                      } else {
                        setProfileEditMode(true);
                      }
                    }}
                    className="rounded-xl border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900"
                  >
                    {profileEditMode ? <X className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    {profileEditMode ? t('common.cancel') : t('directMessages.actions.editSharedProfile')}
                  </Button>
                )}
                {friendLink && selectedProfile.id === currentUser.id && (
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(friendLink)} className="rounded-xl">
                    <Copy className="mr-2 h-4 w-4" />
                    {t('directMessages.actions.copyAgain')}
                  </Button>
                )}
              </div>

              {selectedProfile.id === currentUser.id && profileEditMode && (
                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle>{t('directMessages.edit.title')}</CardTitle>
                    <CardDescription>{t('directMessages.edit.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="messages-profile-name" className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t('auth.labels.fullName')}
              </label>
              <Input
                id="messages-profile-name"
                value={profileNameDraft}
                placeholder={t('directMessages.placeholders.fullName')}
                className="cursor-not-allowed rounded-xl opacity-60"
                disabled
                readOnly
              />
            </div>
                      <div className="space-y-2">
                        <label htmlFor="messages-profile-username" className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {t('auth.labels.username')}
                        </label>
                        <Input
                          id="messages-profile-username"
                          value={profileUsernameDraft}
                          onChange={(event) => setProfileUsernameDraft(event.target.value)}
                          placeholder={t('directMessages.placeholders.username')}
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="messages-profile-title" className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {t('directMessages.edit.profileTitle')}
                      </label>
                      <Input
                        id="messages-profile-title"
                        value={profileTitleDraft}
                        onChange={(event) => setProfileTitleDraft(event.target.value)}
                        placeholder={profileTitleFallback}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t('directMessages.edit.backgroundTitle')}</p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {t('directMessages.edit.backgroundDescription')}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {profileBackgroundChoices.map((choice) => {
                          const selected = profileBackgroundDraft === choice.id;
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              onClick={() => setProfileBackgroundDraft(choice.id)}
                              className={`overflow-hidden rounded-xl border text-left transition ${
                                selected
                                  ? 'border-blue-600 ring-2 ring-blue-600/20'
                                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700'
                              }`}
                            >
                              <ProfileBackgroundCanvas themeId={choice.id} className="h-16" />
                              <span className="flex items-center justify-between px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                {getBackgroundLabel(choice.id)}
                                {selected && <Check className="h-4 w-4 text-blue-700 dark:text-blue-300" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={saveSharedProfile}
                      disabled={profileSaving}
                      className="rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {profileSaving ? t('directMessages.states.saving') : t('directMessages.actions.saveSharedProfile')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedProfile.id === currentUser.id && (
                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle>{t('directMessages.friends.title')}</CardTitle>
                    <CardDescription>{t('directMessages.friends.description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {friends.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        {t('directMessages.friends.empty')}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div key={friend.friendship_id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                            <button type="button" onClick={() => openProfile(friend.id)} className="flex min-w-0 items-center gap-3 text-left">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getProfileImageUrl(friend)} alt={getBaseFriendName(friend)} />
                                <AvatarFallback>{getInitials(getBaseFriendName(friend))}</AvatarFallback>
                              </Avatar>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{getBaseFriendName(friend)}</span>
                                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {friend.status === 'accepted'
                                    ? t('directMessages.friends.since', { date: friend.friends_since ? new Date(friend.friends_since).toLocaleDateString() : recentlyLabel })
                                    : friend.direction === 'sent'
                                      ? t('directMessages.friends.requestSent')
                                      : t('directMessages.friends.requestReceived')}
                                </span>
                              </span>
                            </button>
                            {friend.status === 'pending' && friend.direction === 'received' ? (
                              <Button size="sm" onClick={() => acceptFriendRequest(friend.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                {t('directMessages.actions.accept')}
                              </Button>
                            ) : friend.status === 'accepted' ? (
                              <Button
                                size="sm"
                                onClick={() => openConversation(friend)}
                                className="rounded-xl border border-neutral-950 bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                              >
                                {t('directMessages.actions.message')}
                              </Button>
                            ) : (
                              <Badge variant="outline" className="capitalize">{friend.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
