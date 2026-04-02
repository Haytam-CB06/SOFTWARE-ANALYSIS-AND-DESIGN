import { User, Bell, Moon, Sun, Save, Lock, CheckCircle2, XCircle, Palette, Info, Camera, Upload, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
      setIsProfileEditing(false);
    }
  }, [tourActive, currentStep?.selector]);

  const [notifications, setNotifications] = useState(true);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);
  const [emailReminderMinutesBefore, setEmailReminderMinutesBefore] = useState<number>(10);
  const [emailDeadlineAlertsEnabled, setEmailDeadlineAlertsEnabled] = useState(true);
  const [emailAchievementAlertsEnabled, setEmailAchievementAlertsEnabled] = useState(true);
  const [emailWeeklySummaryEnabled, setEmailWeeklySummaryEnabled] = useState(true);
  const [savingReminderPrefs, setSavingReminderPrefs] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    if (!tourActive) return;
    if (currentStep?.page !== 'settings') return;
    setIsProfileEditing(false);
    setActiveSection('profile');
  }, [tourActive, currentStep?.page]);
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

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

        if (!loadedName || !loadedDepartment) {
          setIsProfileEditing(true);
        }

        if (data.profile_picture_url) {
          setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
        } else {
          setProfilePicture('');
        }

        try {
          const prefs = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}/notification-settings`, 'GET');
          setEmailRemindersEnabled(prefs?.email_reminders_enabled !== false);
          setEmailReminderMinutesBefore(Number(prefs?.email_reminder_minutes_before ?? 10));
          setEmailDeadlineAlertsEnabled(prefs?.email_deadline_alerts_enabled !== false);
          setEmailAchievementAlertsEnabled(prefs?.email_achievement_alerts_enabled !== false);
          setEmailWeeklySummaryEnabled(prefs?.email_weekly_summary_enabled !== false);
        } catch (e) {}
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [userName]);

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('settings.errors.uploadImageOnly'));
        return;
      }

      (async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          const userId = localStorage.getItem('currentUserId');
          if (!API_BASE_URL || !userId) {
            toast.error(t('settings.errors.notLoggedIn'));
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
            toast.error(t('settings.errors.uploadImageFailedWithReason', { reason: msg }));
            return;
          }

          const data = await res.json();
          const url = data.profile_picture_url ? `${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}` : '';
          setProfilePicture(url);

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
          toast.success(t('settings.success.profilePictureUpdated'));
        } catch (err) {
          console.error(err);
          toast.error(t('settings.errors.profilePictureUploadFailed'));
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
        toast.success(t('settings.success.profilePictureRemoved'));
      }
    })();
  };

  const handleSaveProfile = async () => {
    try {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        toast.error(t('settings.errors.notLoggedIn'));
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

      onUpdateName(data.full_name || name);
      localStorage.setItem('currentUserName', data.full_name || name);

      toast.success(t('settings.success.profileUpdated'));
      setIsProfileEditing(false);
    } catch (error) {
      console.error(error);
      const msg = error instanceof ApiError ? error.message : t('settings.errors.updateProfileFailed');
      toast.error(msg);
    }
  };

  const saveReminderPreferences = async (updates: { email_reminders_enabled?: boolean; email_reminder_minutes_before?: number }) => {
    try {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        toast.error(t('settings.errors.notLoggedIn'));
        return;
      }
      setSavingReminderPrefs(true);
      const res = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}/notification-settings`, 'PUT', updates);
      setEmailRemindersEnabled(res?.email_reminders_enabled !== false);
      setEmailReminderMinutesBefore(Number(res?.email_reminder_minutes_before ?? 10));
      setEmailDeadlineAlertsEnabled(res?.email_deadline_alerts_enabled !== false);
      setEmailAchievementAlertsEnabled(res?.email_achievement_alerts_enabled !== false);
      setEmailWeeklySummaryEnabled(res?.email_weekly_summary_enabled !== false);
      toast.success(t('settings.success.reminderSettingsUpdated'));
    } catch (error) {
      console.error(error);
      const msg = error instanceof ApiError ? error.message : t('settings.errors.updateReminderSettingsFailed');
      toast.error(msg);
    } finally {
      setSavingReminderPrefs(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.password.errors.fillAllFields'));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t('settings.password.errors.sameAsCurrent'));
      return;
    }

    if (
      !passwordRequirements.minLength ||
      !passwordRequirements.hasUpperCase ||
      !passwordRequirements.hasLowerCase ||
      !passwordRequirements.hasNumber ||
      !passwordRequirements.hasSpecialChar
    ) {
      toast.error(t('settings.password.errors.requirements'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.password.errors.noMatch'));
      return;
    }

    const email = localStorage.getItem('currentUserEmail');
    if (!email) {
      toast.error(t('settings.password.errors.userNotLoggedIn'));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
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
        toast.error(data.detail || t('settings.password.errors.changeFailed'));
        return;
      }

      toast.success(t('settings.password.success.changed'), {
        description: t('settings.password.success.changedDescription'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(t('settings.password.errors.server'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative group shrink-0">
            <input
              type="file"
              id="profile-picture-upload-header"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
            <label htmlFor="profile-picture-upload-header" className="cursor-pointer block">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 transition-all group-hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:border-neutral-700">
                {profilePicture ? (
                  <img src={profilePicture} alt={t('settings.profile.pictureAlt')} className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </label>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
              {t('settings.title')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:flex-row">
        <Button
          onClick={() => setActiveSection('profile')}
          variant="ghost"
          className={`h-10 flex-1 rounded-lg justify-start sm:justify-center border transition-colors ${
            activeSection === 'profile'
              ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-900 dark:border-neutral-100 dark:bg-white dark:text-black dark:hover:bg-neutral-100'
              : 'border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-black'
          }`}
        >
          <User className="mr-2 h-4 w-4" />
          {t('settings.tabs.profile')}
        </Button>

        <Button
          onClick={() => setActiveSection('webapp')}
          variant="ghost"
          className={`h-10 flex-1 rounded-lg justify-start sm:justify-center border transition-colors ${
            activeSection === 'webapp'
              ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-900 dark:border-neutral-100 dark:bg-white dark:text-black dark:hover:bg-neutral-100'
              : 'border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-black'
          }`}
        >
          <SettingsIcon className="mr-2 h-4 w-4" />
          {t('settings.tabs.workspace')}
        </Button>
      </div>

      {activeSection === 'profile' && (
        <Card className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <User className="h-5 w-5 text-blue-700" />
              {t('settings.profile.title')}
            </CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">
              {t('settings.profile.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.profile.picture')}</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                    {profilePicture ? (
                      <img src={profilePicture} alt={t('settings.profile.pictureAlt')} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                      onClick={() => document.getElementById('profile-picture-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('settings.profile.uploadPicture')}
                    </Button>

                    {profilePicture && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-neutral-950 dark:text-red-300 dark:hover:bg-red-950/30"
                        onClick={handleRemoveProfilePicture}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {t('settings.profile.pictureHint')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.labels.fullName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.profile.placeholders.fullName')}
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isProfileEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.labels.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                placeholder={t('settings.profile.placeholders.email')}
                className="bg-input-background opacity-60 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{t('settings.profile.fields.department')}</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t('settings.profile.placeholders.department')}
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isProfileEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t('auth.labels.dateOfBirth')}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder={t('settings.profile.placeholders.dateOfBirth')}
                className={`bg-input-background ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={!isProfileEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t('auth.labels.gender')}</Label>
              <Select
                id="gender"
                value={gender}
                onValueChange={(value) => setGender(value)}
                className="bg-input-background"
                disabled={!isProfileEditing}
              >
                <SelectTrigger className={`"border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 ${!isProfileEditing ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={!isProfileEditing}>
                  <SelectValue placeholder={t('auth.placeholders.selectGender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('auth.genderOptions.male')}</SelectItem>
                  <SelectItem value="female">{t('auth.genderOptions.female')}</SelectItem>
                  <SelectItem value="other">{t('auth.genderOptions.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 flex-wrap">
              {!isProfileEditing ? (
                <Button
                  variant="outline"
                  data-tour="settings-edit-profile"
                  className="rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  onClick={() => setIsProfileEditing(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {t('settings.profile.actions.edit')}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    data-tour="settings-save-profile"
                    className="rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t('settings.profile.actions.save')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsProfileEditing(false)}
                    className="border-gray-300"
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              )}
              
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {t('settings.password.title')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-700" />
                      {t('settings.password.title')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('settings.password.description')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{t('settings.password.fields.current')}</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('settings.password.placeholders.current')}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('settings.password.fields.new')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('settings.password.placeholders.new')}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                      {newPassword && (
                        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2 dark:border-neutral-800 dark:bg-neutral-900">
                          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                            {t('auth.helper.passwordMustContain')}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.minLength ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {t('auth.requirements.password.minLength')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasUpperCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {t('auth.requirements.password.upper')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasLowerCase ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {t('auth.requirements.password.lower')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasNumber ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {t('auth.requirements.password.number')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {passwordRequirements.hasSpecialChar ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`text-sm ${passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {t('auth.requirements.password.special')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('settings.password.fields.confirm')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('settings.password.placeholders.confirm')}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {t('auth.errors.passwordMismatch')}
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('auth.success.passwordsMatch')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                      <Button
                        onClick={handleChangePassword}
                        className="flex-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                      >
                        {t('settings.password.actions.update')}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'webapp' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Bell className="h-5 w-5 text-blue-700" />
                {t('settings.notifications.title')}
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400">
                {t('settings.notifications.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.notifications.push.title')}</Label>
                  <p className="text-sm text-gray-500">
                    {t('settings.notifications.push.description')}
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.notifications.emailStudyReminders.title')}</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t('settings.notifications.emailStudyReminders.description')}
                    </p>
                  </div>
                  <div className="self-start sm:self-auto">
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
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.notifications.minutesBefore.title')}</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {t('settings.notifications.minutesBefore.description')}
                    </p>
                  </div>
                  <div className="w-full sm:w-[200px]">
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
                      <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500">
                        <SelectValue placeholder={t('settings.notifications.minutesBefore.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('settings.notifications.minutesBefore.options.atStart')}</SelectItem>
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
                    <Label>{t('settings.notifications.deadlineAlerts.title')}</Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.notifications.deadlineAlerts.description')}
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
                    <Label>{t('settings.notifications.achievementAlerts.title')}</Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.notifications.achievementAlerts.description')}
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
                    <Label>{t('settings.notifications.weeklySummary.title')}</Label>
                    <p className="text-sm text-gray-500">
                      {t('settings.notifications.weeklySummary.description')}
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

          <GoogleCalendarIntegration />

          <Card className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Moon className="h-5 w-5 text-blue-700" />
                {t('settings.appearance.title')}
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400">
                {t('settings.appearance.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                  {darkMode ? (
                    <Moon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                  ) : (
                    <Sun className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                  )}
                </div>
                <div>
                  <Label>{t('settings.appearance.darkMode.title')}</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('settings.appearance.darkMode.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Info className="h-5 w-5 text-blue-700" />
                {t('settings.about.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('settings.about.version')}</span>
                  <span>{t('settings.about.versionValue')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('settings.about.lastUpdated')}</span>
                  <span>{t('settings.about.lastUpdatedValue')}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {t('settings.about.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}