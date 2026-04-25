import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Building2, CheckCircle2, ChevronLeft, ChevronRight, User2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiJsonAuthed, ApiError } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type QuestionKey = 'fullName' | 'profileTitle' | 'role';

type Props = {
  open: boolean;
  currentUserName?: string;
  onComplete: (updatedName?: string) => void;
  onSkip: () => void;
};

const QUESTION_ORDER: QuestionKey[] = ['fullName', 'profileTitle', 'role'];

export default function PostSignupQuestionnaire({
  open,
  currentUserName,
  onComplete,
  onSkip,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [fullName, setFullName] = useState(currentUserName || '');
  const [profileTitle, setProfileTitle] = useState('');
  const [roleCategory, setRoleCategory] = useState('');
  const [otherRoleInfo, setOtherRoleInfo] = useState('');

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);

    let cancelled = false;
    const loadProfile = async () => {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) return;

      try {
        setLoading(true);
        const profile = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET');
        if (cancelled) return;
        setFullName((profile.full_name || currentUserName || '').trim());
        setProfileTitle((profile.profile_title || '').trim());
        const storedDepartment = (profile.department || '').trim();
        const normalized = storedDepartment.toLowerCase();
        if (normalized === 'student' || normalized === 'administrator' || normalized === 'teacher') {
          setRoleCategory(normalized);
          setOtherRoleInfo('');
        } else if (storedDepartment) {
          setRoleCategory('other');
          setOtherRoleInfo(storedDepartment);
        } else {
          setRoleCategory('');
          setOtherRoleInfo('');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[PostSignupQuestionnaire] Failed to load profile', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [open, currentUserName]);

  const question = QUESTION_ORDER[stepIndex];
  const totalSteps = QUESTION_ORDER.length;
  const canGoBack = stepIndex > 0;
  const isLast = stepIndex === totalSteps - 1;
  const normalizedFullName = fullName.trim();
  const previewName = normalizedFullName || currentUserName || t('postSignupQuestionnaire.preview.defaultName');
  const previewTitle = profileTitle.trim() || t('postSignupQuestionnaire.preview.defaultTitle');
  const previewRole = roleCategory === 'other'
    ? (otherRoleInfo.trim() || t('postSignupQuestionnaire.preview.defaultDepartment'))
    : (roleCategory ? t(`postSignupQuestionnaire.roleOptions.${roleCategory}`) : t('postSignupQuestionnaire.preview.defaultDepartment'));

  const questionMeta = useMemo(
    () => ({
      fullName: {
        icon: User2,
        label: t('postSignupQuestionnaire.questions.fullName.label'),
        helper: t('postSignupQuestionnaire.questions.fullName.helper'),
        placeholder: t('postSignupQuestionnaire.questions.fullName.placeholder'),
        value: fullName,
        setValue: setFullName,
        readOnly: true,
      },
      profileTitle: {
        icon: Briefcase,
        label: t('postSignupQuestionnaire.questions.profileTitle.label'),
        helper: t('postSignupQuestionnaire.questions.profileTitle.helper'),
        placeholder: t('postSignupQuestionnaire.questions.profileTitle.placeholder'),
        value: profileTitle,
        setValue: setProfileTitle,
        readOnly: false,
      },
      role: {
        icon: Building2,
        label: t('postSignupQuestionnaire.questions.role.label'),
        helper: t('postSignupQuestionnaire.questions.role.helper'),
        placeholder: '',
        value: roleCategory,
        setValue: setRoleCategory,
        readOnly: false,
      },
    }),
    [fullName, otherRoleInfo, profileTitle, roleCategory, t]
  );

  const activeQuestion = questionMeta[question];
  const ActiveIcon = activeQuestion.icon;

  const moveNext = () => {
    if (isLast) return;
    setStepIndex((current) => Math.min(totalSteps - 1, current + 1));
  };

  const moveBack = () => {
    if (!canGoBack) return;
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const skipCurrentQuestion = () => {
    if (question === 'role') {
      setRoleCategory('');
      setOtherRoleInfo('');
    } else {
      activeQuestion.setValue('');
    }
    if (isLast) {
      onSkip();
      return;
    }
    moveNext();
  };

  const handleSave = async () => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      toast.error(t('postSignupQuestionnaire.errors.notLoggedIn'));
      onSkip();
      return;
    }
    if (roleCategory === 'other' && !otherRoleInfo.trim()) {
      toast.error(t('postSignupQuestionnaire.errors.otherRoleRequired'));
      return;
    }

    try {
      setSaving(true);
      const departmentValue =
        roleCategory === 'other'
          ? otherRoleInfo.trim()
          : roleCategory;
      const updated = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'PUT', {
        profile_title: profileTitle.trim(),
        department: departmentValue,
      });

      const nextName = updated.full_name || normalizedFullName || currentUserName || '';
      if (nextName) {
        localStorage.setItem('currentUserName', nextName);
      }
      toast.success(t('postSignupQuestionnaire.success.saved'));
      onComplete(nextName);
    } catch (error) {
      console.error('[PostSignupQuestionnaire] Failed to save profile questionnaire', error);
      const message = error instanceof ApiError
        ? error.message
        : t('postSignupQuestionnaire.errors.saveFailed');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    open ? (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-3 py-5 backdrop-blur-sm">
        <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <button
            onClick={onSkip}
            className="absolute right-4 top-4 z-10 flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t('postSignupQuestionnaire.actions.skipQuestionnaire')}
          >
            <X className="h-4 w-4" />
            <span>{t('postSignupQuestionnaire.actions.skipQuestionnaire')}</span>
          </button>

          <div className="border-b border-slate-200 px-5 pb-5 pt-8 text-center dark:border-slate-800 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              {t('postSignupQuestionnaire.kicker')}
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">
              {t('postSignupQuestionnaire.title')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {t('postSignupQuestionnaire.description')}
            </p>
            <div className="mx-auto mt-5 max-w-xl">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-700 transition-all duration-300 dark:bg-blue-400"
                  style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {stepIndex + 1}/{totalSteps}
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex min-h-[460px] flex-col rounded-lg border border-blue-600 bg-blue-50 p-5 shadow-md dark:border-blue-500 dark:bg-blue-950/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white">
                  {t('postSignupQuestionnaire.questionsBadge', { current: stepIndex + 1, total: totalSteps })}
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                  {activeQuestion.label}
                </h3>
                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {activeQuestion.helper}
                </p>
              </div>

              <div className="mt-5 flex-1">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {t('postSignupQuestionnaire.inputTitle')}
                </p>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  {question === 'role' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="post-signup-role" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {activeQuestion.label}
                        </Label>
                        <Select value={roleCategory} onValueChange={setRoleCategory} disabled={loading || saving}>
                          <SelectTrigger id="post-signup-role" className="h-12 rounded-md border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
                            <SelectValue placeholder={t('postSignupQuestionnaire.questions.role.placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">{t('postSignupQuestionnaire.roleOptions.student')}</SelectItem>
                            <SelectItem value="administrator">{t('postSignupQuestionnaire.roleOptions.administrator')}</SelectItem>
                            <SelectItem value="teacher">{t('postSignupQuestionnaire.roleOptions.teacher')}</SelectItem>
                            <SelectItem value="other">{t('postSignupQuestionnaire.roleOptions.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {roleCategory === 'other' && (
                        <div className="space-y-2">
                          <Label htmlFor="post-signup-role-other" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {t('postSignupQuestionnaire.questions.otherRoleInfo.label')}
                          </Label>
                          <Input
                            id="post-signup-role-other"
                            value={otherRoleInfo}
                            disabled={loading || saving}
                            onChange={(event) => setOtherRoleInfo(event.target.value)}
                            placeholder={t('postSignupQuestionnaire.questions.otherRoleInfo.placeholder')}
                            className="h-12 rounded-md border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                          />
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {t('postSignupQuestionnaire.questions.otherRoleInfo.helper')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor={`post-signup-${question}`} className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activeQuestion.label}
                      </Label>
                      <Input
                        id={`post-signup-${question}`}
                        value={activeQuestion.value}
                        disabled={loading || saving || activeQuestion.readOnly}
                        readOnly={activeQuestion.readOnly}
                        onChange={(event) => activeQuestion.setValue(event.target.value)}
                        placeholder={activeQuestion.placeholder}
                        className={`h-12 rounded-md border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 ${activeQuestion.readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-blue-200 pt-5 dark:border-blue-900/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={moveBack}
                    disabled={!canGoBack || saving}
                    className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('common.back')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={skipCurrentQuestion}
                    disabled={saving}
                    className="rounded-md border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {t('postSignupQuestionnaire.actions.skipQuestion')}
                  </Button>
                </div>

                {isLast ? (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 rounded-md bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {saving
                      ? t('postSignupQuestionnaire.actions.saving')
                      : t('postSignupQuestionnaire.actions.saveAndContinue')}
                  </Button>
                ) : (
                  <Button
                    onClick={moveNext}
                    disabled={saving}
                    className="h-11 rounded-md bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {t('postSignupQuestionnaire.actions.nextQuestion')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex min-h-[460px] flex-col rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t('postSignupQuestionnaire.preview.kicker')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {previewName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {previewTitle}
                </p>
                <p className="mt-4 inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  {previewRole}
                </p>
              </div>

              <div className="mt-6 flex-1 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t('postSignupQuestionnaire.preview.visibilityTitle')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t('postSignupQuestionnaire.preview.visibilityBody')}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t('postSignupQuestionnaire.preview.editLaterTitle')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t('postSignupQuestionnaire.preview.editLaterBody')}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t('postSignupQuestionnaire.noteTitle')}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {t('postSignupQuestionnaire.noteBody')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );
}
