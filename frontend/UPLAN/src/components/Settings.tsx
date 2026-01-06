import { User, Bell, Moon, Sun, Save, Lock, CheckCircle2, XCircle, Palette, Info, Camera, Upload, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import GoogleCalendarIntegration from './GoogleCalendarIntegration';
import { apiJsonAuthed, API_BASE_URL, ApiError } from '../lib/api';
import { useTour } from '../contexts/TourContext';

interface SettingsProps {
  userName: string;
  onUpdateName: (name: string) => void;
  darkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
  initialSection?: 'profile' | 'webapp';
}

export default function Settings({ userName, onUpdateName, darkMode, onToggleDarkMode, initialSection = 'profile' }: SettingsProps) {
  // If the onboarding tour lands here while the user previously toggled edit mode,
  // ensure "Edit Profile" is visible so the spotlight doesn't land on a missing target.
  const { active: tourActive, currentStep } = useTour();
  const [activeSection, setActiveSection] = useState<'profile' | 'webapp'>(initialSection);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState('student@example.com');
  const [department, setDepartment] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    if (!tourActive) return;
    if (currentStep?.selector === '[data-tour="settings-edit-profile"]') {
      // Force view mode so the "Edit Profile" button is present.
      setIsProfileEditing(false);
    }
  }, [tourActive, currentStep?.selector]);
  const [notifications, setNotifications] = useState(true);
  // Reminder preferences (backend-driven)
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [emailReminderMinutesBefore, setEmailReminderMinutesBefore] = useState<number>(10);
  const [emailDeadlineAlertsEnabled, setEmailDeadlineAlertsEnabled] = useState(true);
  const [emailAchievementAlertsEnabled, setEmailAchievementAlertsEnabled] = useState(true);
  const [emailWeeklySummaryEnabled, setEmailWeeklySummaryEnabled] = useState(true);
  const [savingReminderPrefs, setSavingReminderPrefs] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');

  // Tour safety: step 2 highlights "Edit Profile".
  // If the user previously toggled edit mode on, the button disappears.
  // Keep a stable, tour-friendly state while the tour is active on Settings.
  useEffect(() => {
    if (!tourActive) return;
    if (currentStep?.page !== 'settings') return;
    setIsProfileEditing(false);
    setActiveSection('profile');
  }, [tourActive, currentStep?.page]);
  
  // Change Password States
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password validation requirements
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  // Load user profile from backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const userId = localStorage.getItem('currentUserId');
        if (!userId) return;
        const data = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET');

        const loadedName = (data.full_name || userName || '').trim();
        const loadedDepartment = (data.department || '').trim();

        setName(loadedName);
        setEmail(data.email || '');
        setDepartment(loadedDepartment);
        setDateOfBirth(data.date_of_birth || '');
        setGender(data.gender || '');

        // If the backend profile is missing key fields (common for OAuth/Google signups),
        // automatically open edit mode so the user can fill them.
        if (!loadedName || !loadedDepartment) {
          setIsProfileEditing(true);
        }

        // Profile picture is stored on the backend. Cache-bust to avoid stale images.
        if (data.profile_picture_url) {
          setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
        } else {
          setProfilePicture('');
        }

        // Load notification reminder preferences
        try {
          const prefs = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}/notification-settings`, 'GET');
          setEmailRemindersEnabled(prefs?.email_reminders_enabled !== false);
          setEmailReminderMinutesBefore(Number(prefs?.email_reminder_minutes_before ?? 10));
          setEmailDeadlineAlertsEnabled(prefs?.email_deadline_alerts_enabled !== false);
          setEmailAchievementAlertsEnabled(prefs?.email_achievement_alerts_enabled !== false);
          setEmailWeeklySummaryEnabled(prefs?.email_weekly_summary_enabled !== false);
        } catch (e) {
          // Non-fatal; keep defaults
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [userName]);

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Upload to backend
      (async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          const userId = localStorage.getItem('currentUserId');
          if (!API_BASE_URL || !userId) {
            toast.error('You are not logged in');
            return;
          }

          const fd = new FormData();
          fd.append('file', file);

          const res = await fetch(`${API_BASE_URL}/user/${userId}/profile-picture`, {
            method: 'POST',
            headers: { 'X-User-Id': userId },
            body: fd,
          });

          if (!res.ok) {
            const msg = await res.text();
            toast.error(`Failed to upload image: ${msg}`);
            return;
          }

          const data = await res.json();
          const url = data.profile_picture_url ? `${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}` : '';
          setProfilePicture(url);

          // Keep a lightweight reference locally (URL), but the image itself is stored on the backend.
          try {
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const currentUserEmail = localStorage.getItem('currentUserEmail');
            const userIndex = users.findIndex((u: any) => u.email === currentUserEmail);
            if (userIndex !== -1) {
              users[userIndex] = { ...users[userIndex], profilePicture: url };
              localStorage.setItem('registeredUsers', JSON.stringify(users));
            }
          } catch {}

          window.dispatchEvent(new Event('profilePictureUpdated'));
          toast.success('Profile picture updated successfully!');
        } catch (err) {
          console.error(err);
          toast.error('Failed to upload profile picture');
        }
      })();
    }
  };

  const handleRemoveProfilePicture = () => {
    (async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('currentUserId');
        if (!API_BASE_URL || !userId) {
          setProfilePicture('');
          return;
        }

        await fetch(`${API_BASE_URL}/user/${userId}/profile-picture`, {
          method: 'DELETE',
          headers: { 'X-User-Id': userId },
        });
      } catch (e) {
        console.error(e);
      } finally {
        setProfilePicture('');

        // Clear local reference
        try {
          const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const currentUserEmail = localStorage.getItem('currentUserEmail');
          const userIndex = users.findIndex((u: any) => u.email === currentUserEmail);
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], profilePicture: '' };
            localStorage.setItem('registeredUsers', JSON.stringify(users));
          }
        } catch {}

        window.dispatchEvent(new Event('profilePictureUpdated'));
        toast.success('Profile picture removed successfully!');
      }
    })();
  };

  const handleSaveProfile = async () => {
  try {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      toast.error('You are not logged in');
      return;
    }

    const data = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'PUT', {
      full_name: (name || '').trim(),
      department: (department || '').trim(),
      date_of_birth: dateOfBirth,
      gender,
    });
    setName(data.full_name || name);
    setEmail(data.email || email);
    setDepartment(data.department || department);
    setDateOfBirth(data.date_of_birth || dateOfBirth);
    setGender(data.gender || gender);

    // Update app-wide name + localStorage
    onUpdateName(data.full_name || name);
    localStorage.setItem('currentUserName', data.full_name || name);

    toast.success('Profile updated successfully!');
    setIsProfileEditing(false);
  } catch (error) {
    console.error(error);
    const msg = error instanceof ApiError ? error.message : 'Failed to update profile';
    toast.error(msg);
  }
};


  const saveReminderPreferences = async (updates: { email_reminders_enabled?: boolean; email_reminder_minutes_before?: number }) => {
    try {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        toast.error('You are not logged in');
        return;
      }
      setSavingReminderPrefs(true);
      const res = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}/notification-settings`, 'PUT', updates);
      setEmailRemindersEnabled(res?.email_reminders_enabled !== false);
      setEmailReminderMinutesBefore(Number(res?.email_reminder_minutes_before ?? 10));
      setEmailDeadlineAlertsEnabled(res?.email_deadline_alerts_enabled !== false);
      setEmailAchievementAlertsEnabled(res?.email_achievement_alerts_enabled !== false);
      setEmailWeeklySummaryEnabled(res?.email_weekly_summary_enabled !== false);
      toast.success('Reminder settings updated');
    } catch (error) {
      console.error(error);
      const msg = error instanceof ApiError ? error.message : 'Failed to update reminder settings';
      toast.error(msg);
    } finally {
      setSavingReminderPrefs(false);
    }
  };


  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    if (!passwordRequirements.minLength ||
        !passwordRequirements.hasUpperCase ||
        !passwordRequirements.hasLowerCase ||
        !passwordRequirements.hasNumber ||
        !passwordRequirements.hasSpecialChar) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const email = localStorage.getItem('currentUserEmail');
    if (!email) {
      toast.error('User not logged in');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || 'Failed to change password');
        return;
      }

      toast.success('Password changed successfully!', {
        description: 'Your password has been updated securely.',
      });

      // Reset UI
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);

    } catch (error) {
      console.error(error);
      toast.error('Server error. Please try again later.');
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-3">
          <div className="relative group">
            <input
              type="file"
              id="profile-picture-upload-header"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
            <label
              htmlFor="profile-picture-upload-header"
              className="cursor-pointer block"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 hover:border-white/60 transition-all group-hover:scale-105">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-7 w-7 text-white/80" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </label>
          </div>
          <div>
            <h1 className="text-white">Settings</h1>
            <p className="text-blue-100 text-sm">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg">
        <Button
          onClick={() => setActiveSection('profile')}
          variant={activeSection === 'profile' ? 'default' : 'ghost'}
          className={`flex-1 ${
            activeSection === 'profile'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <User className="h-4 w-4 mr-2" />
          Profile Settings
        </Button>
        <Button
          onClick={() => setActiveSection('webapp')}
          variant={activeSection === 'webapp' ? 'default' : 'ghost'}
          className={`flex-1 ${
            activeSection === 'webapp'
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Profile Settings Section */}
      {activeSection === 'profile' && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                    <label htmlFor="profile-picture-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => document.getElementById('profile-picture-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Picture
                      </Button>
                    </label>
                    {profilePicture && (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={handleRemoveProfilePicture}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isProfileEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                placeholder="Enter your email"
                className="bg-input-background opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter your department"
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isProfileEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="Enter your date of birth"
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}` }
                disabled={!isProfileEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                value={gender}
                onValueChange={(value) => setGender(value)}
                className="bg-input-background"
                disabled={!isProfileEditing}
              >
                <SelectTrigger className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={!isProfileEditing}>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 flex-wrap">
              {!isProfileEditing ? (
                <Button
                  variant="outline"
                  data-tour="settings-edit-profile"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => setIsProfileEditing(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveProfile} data-tour="settings-save-profile" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsProfileEditing(false)}
                    className="border-gray-300"
                  >
                    Cancel
                  </Button>
                </>
              )}
              
              {/* Change Password Button with Dialog */}
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      Change Password
                    </DialogTitle>
                    <DialogDescription>
                      Create a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-input-background"
                      />
                      {newPassword && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Password must contain:</p>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.minLength ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              At least 8 characters
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasUpperCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              One uppercase letter (A-Z)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasLowerCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              One lowercase letter (a-z)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasNumber ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              One number (0-9)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasSpecialChar ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              One special character (!@#$%^&*...)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="bg-input-background"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Passwords match
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={handleChangePassword}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Update Password
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsPasswordDialogOpen(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web App Settings Section */}
      {activeSection === 'webapp' && (
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about your study schedule
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Study Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Receive an email reminder before each planned study session
                    </p>
                  </div>
                  <Switch
                    checked={emailRemindersEnabled}
                    onCheckedChange={(checked) => {
                      setEmailRemindersEnabled(checked);
                      saveReminderPreferences({
                        email_reminders_enabled: checked,
                        email_reminder_minutes_before: emailReminderMinutesBefore,
                      });
                    }}
                    disabled={savingReminderPrefs}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Minutes before</Label>
                    <p className="text-sm text-gray-500">
                      How early to send the reminder email
                    </p>
                  </div>
                  <div className="w-[200px]">
                    <Select
                      value={String(emailReminderMinutesBefore)}
                      onValueChange={(v) => {
                        const minutes = Number(v);
                        setEmailReminderMinutesBefore(minutes);
                        saveReminderPreferences({
                          email_reminder_minutes_before: minutes,
                          email_reminders_enabled: emailRemindersEnabled,
                        });
                      }}
                      disabled={!emailRemindersEnabled || savingReminderPrefs}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 (at start)</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 border-t" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Deadline Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Get an email when a deadline is approaching
                    </p>
                  </div>
                  <Switch
                    checked={emailDeadlineAlertsEnabled}
                    onCheckedChange={(checked) => {
                      setEmailDeadlineAlertsEnabled(checked);
                      saveReminderPreferences({ email_deadline_alerts_enabled: checked });
                    }}
                    disabled={savingReminderPrefs}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Achievement Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Get an email when you unlock an achievement
                    </p>
                  </div>
                  <Switch
                    checked={emailAchievementAlertsEnabled}
                    onCheckedChange={(checked) => {
                      setEmailAchievementAlertsEnabled(checked);
                      saveReminderPreferences({ email_achievement_alerts_enabled: checked });
                    }}
                    disabled={savingReminderPrefs}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Weekly Summary</Label>
                    <p className="text-sm text-gray-500">
                      Receive a weekly summary of your progress
                    </p>
                  </div>
                  <Switch
                    checked={emailWeeklySummaryEnabled}
                    onCheckedChange={(checked) => {
                      setEmailWeeklySummaryEnabled(checked);
                      saveReminderPreferences({ email_weekly_summary_enabled: checked });
                    }}
                    disabled={savingReminderPrefs}
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <GoogleCalendarIntegration />

          {/* Appearance Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-600" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  {darkMode ? <Moon className="h-5 w-5 text-gray-600" /> : <Sun className="h-5 w-5 text-yellow-600" />}
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-gray-500">
                      Switch to dark theme for better viewing at night
                    </p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={(checked) => {
                    onToggleDarkMode(checked);
                    toast.info(checked ? 'Dark mode enabled' : 'Light mode enabled');
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Application Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span>October 2025</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Smart Study Time Table Generator helps students organize their study time effectively
                  with AI-powered scheduling and personalized recommendations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}