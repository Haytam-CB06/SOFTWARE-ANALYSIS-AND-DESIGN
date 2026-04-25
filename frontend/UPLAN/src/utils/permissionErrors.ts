type PermissionContext =
  | 'add-member'
  | 'remove-member'
  | 'change-role'
  | 'delete-workspace'
  | 'edit-workspace'
  | 'workspace-image'
  | 'share-link'
  | 'disable-share-link'
  | 'schedule-import'
  | 'session-status'
  | 'chat'
  | 'board'
  | 'generic';

const ACTION_MESSAGES: Record<PermissionContext, string> = {
  'add-member': 'Only workspace admins can add members to this workspace.',
  'remove-member': 'Only workspace admins can remove members from this workspace.',
  'change-role': 'Only workspace admins can change member roles.',
  'delete-workspace': 'Only workspace admins can delete this workspace.',
  'edit-workspace': 'Only workspace admins can edit workspace details.',
  'workspace-image': 'Only workspace admins can update the workspace image.',
  'share-link': 'Only workspace admins can create workspace invite links.',
  'disable-share-link': 'Only workspace admins can disable workspace invite links.',
  'schedule-import': 'Only workspace admins can import schedules into the workspace timetable.',
  'session-status': 'Only workspace admins can update workspace session status.',
  chat: 'You do not have permission to perform this chat action.',
  board: 'You do not have permission to perform this board action.',
  generic: 'You do not have permission to perform this action.',
};

export function clearPermissionError(
  statusOrMessage: number | string | undefined,
  detail?: string,
  context: PermissionContext = 'generic'
) {
  const status = typeof statusOrMessage === 'number' ? statusOrMessage : undefined;
  const raw = `${typeof statusOrMessage === 'string' ? statusOrMessage : ''} ${detail || ''}`.trim();
  const normalized = raw.toLowerCase();

  if (
    status === 403 ||
    normalized.includes('permission denied') ||
    normalized === 'forbidden' ||
    normalized.includes('admin role required') ||
    normalized.includes('only workspace admins') ||
    normalized.includes('only admins') ||
    normalized.includes('not allowed')
  ) {
    return ACTION_MESSAGES[context];
  }

  if (
    normalized.includes('not a workspace member') ||
    normalized.includes('not a member of this workspace') ||
    normalized.includes('you are not a member')
  ) {
    return 'You are not a member of this workspace. Ask an admin to invite you before trying this action.';
  }

  if (status === 401 || normalized.includes('not authenticated') || normalized.includes('unauthorized')) {
    return 'Your session is not authenticated. Sign in again, then retry this action.';
  }

  return raw || ACTION_MESSAGES[context];
}
