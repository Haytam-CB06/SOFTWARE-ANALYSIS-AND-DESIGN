import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Users, Send, X, CheckCircle2 } from 'lucide-react';

interface WorkspaceInfo {
  id: number;
  name: string;
  description?: string;
}

interface JoinWorkspaceDialogProps {
  linkId: string | null;
  onClose: () => void;
  onJoinSuccess?: () => void;
}

export default function JoinWorkspaceDialog({
  linkId,
  onClose,
  onJoinSuccess,
}: JoinWorkspaceDialogProps) {
  const { t } = useTranslation();

  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const currentUserId = localStorage.getItem('currentUserId');

  useEffect(() => {
    if (!linkId) {
      setLoading(false);
      return;
    }
    verifyToken(linkId);
  }, [linkId]);

  const verifyToken = async (token: string) => {
    setLoading(true);
    setLinkError('');

    try {
      const res = await fetch(
        `${API_BASE_URL}/workspaces/verify-invite?token=${encodeURIComponent(token)}`
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLinkError(data?.detail || t('joinWorkspace.errors.invalidLink'));
        return;
      }

      setWorkspaceInfo({
        id: data.id,
        name: data.name,
        description: data.description,
      });
    } catch (e) {
      console.error('[JoinWorkspaceDialog] verifyToken error:', e);
      setLinkError(t('joinWorkspace.errors.expiredLink'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!workspaceInfo || !linkId) return;

    if (!currentUserId) {
      toast.error(t('joinWorkspace.errors.loginRequired'));

      sessionStorage.setItem('pendingJoinToken', linkId);

      const url = new URL(window.location.href);
      url.searchParams.set('join_token', linkId);
      url.searchParams.set('page', 'auth');

      window.location.replace(url.toString());
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceInfo.id}/join-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUserId,
          },
          body: JSON.stringify({ message: message.trim() || null }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 400 &&
          (data.detail || '').toLowerCase().includes('already a member')
        ) {
          toast.success(t('joinWorkspace.success.alreadyMember'));
          onJoinSuccess?.();
          onClose();
          return;
        }
        throw new Error(data.detail || t('joinWorkspace.errors.requestFailed'));
      }

      setSubmitted(true);
      toast.success(t('joinWorkspace.success.requestSent'));

      setTimeout(() => {
        onClose();
        onJoinSuccess?.();
      }, 2500);
    } catch (e: any) {
      console.error('[JoinWorkspaceDialog] submit error:', e);
      toast.error(e.message || t('joinWorkspace.errors.sendFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!linkId) return null;

  return (
    <Dialog open={!!linkId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-blue-500" />
            {t('joinWorkspace.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {loading
              ? t('joinWorkspace.states.verifying')
              : linkError
                ? t('joinWorkspace.states.invalid')
                : submitted
                  ? t('joinWorkspace.states.sent')
                  : t('joinWorkspace.states.requestToJoin', { name: workspaceInfo?.name })}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="mt-4 text-gray-400">{t('joinWorkspace.loading')}</p>
          </div>
        )}

        {!loading && linkError && (
          <div className="py-8 text-center">
            <X className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <p className="text-gray-400 mb-4">{linkError}</p>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {t('common.close')}
            </Button>
          </div>
        )}

        {!loading && !linkError && submitted && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-white font-medium mb-1">{t('joinWorkspace.success.title')}</p>
            <p className="text-gray-400 text-sm">
              {t('joinWorkspace.success.description')}
            </p>
          </div>
        )}

        {!loading && !linkError && !submitted && workspaceInfo && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
              <h3 className="font-medium text-white mb-1">{workspaceInfo.name}</h3>
              {workspaceInfo.description && (
                <p className="text-sm text-gray-400">{workspaceInfo.description}</p>
              )}
            </div>

            {!currentUserId && (
              <div className="rounded-2xl border border-yellow-700 bg-yellow-900/30 p-3 text-sm text-yellow-300">
                {t('joinWorkspace.loginWarning')}
              </div>
            )}

            <div>
              <label className="text-sm text-gray-300 block mb-1">
                {t('joinWorkspace.message.label')}{' '}
                <span className="text-gray-500">({t('common.optional')})</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('joinWorkspace.message.placeholder')}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 min-h-[80px] resize-none"
                disabled={submitting || !currentUserId}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSubmitRequest}
                className="flex-1 bg-blue-700 hover:bg-blue-700 text-white"
                disabled={submitting || !currentUserId}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting
                  ? t('joinWorkspace.actions.sending')
                  : t('joinWorkspace.actions.send')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
