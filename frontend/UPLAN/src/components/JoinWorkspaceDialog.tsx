import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from './ui/sonner';
import { Users, Send, X } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  pendingRequests?: PendingRequest[];
  sharing?: {
    linkId: string;
    enabled: boolean;
    accessType: 'request' | 'auto';
    expiresAt?: string;
  };
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isOnline?: boolean;
  lastActive?: string;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  message?: string;
}

interface JoinWorkspaceDialogProps {
  linkId: string | null;
  onClose: () => void;
  onJoinSuccess?: () => void;
}

export default function JoinWorkspaceDialog({ linkId, onClose, onJoinSuccess }: JoinWorkspaceDialogProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (linkId) {
      findWorkspaceByLink(linkId);
    } else {
      setLoading(false);
    }
  }, [linkId]);

  const findWorkspaceByLink = (id: string) => {
    try {
      const savedWorkspaces = localStorage.getItem('workspaces');
      if (savedWorkspaces) {
        const workspaces: Workspace[] = JSON.parse(savedWorkspaces);
        const foundWorkspace = workspaces.find(
          w => w.sharing?.linkId === id && w.sharing?.enabled
        );
        
        if (foundWorkspace) {
          // Check if link is expired
          if (foundWorkspace.sharing?.expiresAt) {
            const expiryDate = new Date(foundWorkspace.sharing.expiresAt);
            if (expiryDate < new Date()) {
              toast.error('This invite link has expired');
              setLoading(false);
              return;
            }
          }
          setWorkspace(foundWorkspace);
        } else {
          toast.error('Invalid or disabled invite link');
        }
      }
    } catch (error) {
      console.error('Error finding workspace:', error);
      toast.error('Failed to find workspace');
    }
    setLoading(false);
  };

  const handleSubmitRequest = () => {
    if (!workspace) return;

    // Validation
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const savedWorkspaces = localStorage.getItem('workspaces');
      if (savedWorkspaces) {
        const workspaces: Workspace[] = JSON.parse(savedWorkspaces);
        const workspaceIndex = workspaces.findIndex(w => w.id === workspace.id);
        
        if (workspaceIndex === -1) {
          toast.error('Workspace not found');
          setSubmitting(false);
          return;
        }

        // Check if email already exists in members
        if (workspaces[workspaceIndex].members.some(m => m.email === email)) {
          toast.error('You are already a member of this workspace');
          setSubmitting(false);
          return;
        }

        // Check if email already has a pending request
        if (workspaces[workspaceIndex].pendingRequests?.some(r => r.email === email)) {
          toast.error('You already have a pending request for this workspace');
          setSubmitting(false);
          return;
        }

        // Create pending request
        const newRequest: PendingRequest = {
          id: `request-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          requestedAt: new Date().toISOString(),
          message: message.trim() || undefined
        };

        // Add request to workspace
        if (!workspaces[workspaceIndex].pendingRequests) {
          workspaces[workspaceIndex].pendingRequests = [];
        }
        workspaces[workspaceIndex].pendingRequests!.push(newRequest);

        // Save to localStorage
        localStorage.setItem('workspaces', JSON.stringify(workspaces));

        toast.success('Request sent successfully! The workspace admin will review your request.');
        
        // Reset form
        setName('');
        setEmail('');
        setMessage('');
        
        // Close dialog after short delay
        setTimeout(() => {
          onClose();
          onJoinSuccess?.();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!linkId) {
    return null;
  }

  return (
    <Dialog open={!!linkId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-blue-500" />
            Join Workspace
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {loading 
              ? 'Loading workspace details...' 
              : workspace 
                ? 'Request to join this workspace'
                : 'Invalid or expired invite link'
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        ) : workspace ? (
          <div className="space-y-4">
            {/* Workspace Info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="font-medium text-white mb-1">{workspace.name}</h3>
              {workspace.description && (
                <p className="text-sm text-gray-400">{workspace.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Request Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="join-name" className="text-gray-300">Your Name *</Label>
                <Input
                  id="join-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 mt-1"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="join-email" className="text-gray-300">Your Email *</Label>
                <Input
                  id="join-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 mt-1"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="join-message" className="text-gray-300">Message (Optional)</Label>
                <Textarea
                  id="join-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the admin why you'd like to join..."
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 mt-1 min-h-[80px] resize-none"
                  disabled={submitting}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRequest}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <X className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <p className="text-gray-400 mb-4">This invite link is invalid or has been disabled</p>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
