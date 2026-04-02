import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Archive, Pin, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { createNote, deleteNote, listNotes, updateNote, type Note } from "../lib/notesApi";

type FilterMode = "all" | "pinned" | "archived";

function timeAgo(iso: string, t: (key: string, options?: any) => string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notebook.time.justNow");
  if (mins < 60) return t("notebook.time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notebook.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("notebook.time.daysAgo", { count: days });
}

interface NotebookProps {
  onDirtyChange?: (dirty: boolean) => void;
  registerSaveHandler?: (handler: () => Promise<boolean>) => void;
}

export default function Notebook({
  onDirtyChange,
  registerSaveHandler,
}: NotebookProps) {
  const { t } = useTranslation();

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const confirmBeforeLeaving = (action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }

    if (autoSave) {
      onSave().then((ok) => {
        if (ok) action();
      });
      return;
    }

    setPendingAction(() => action);
    setShowUnsavedModal(true);
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => (n.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const isDirty = useMemo(() => {
    if (!selected) return false;
    return (
      title !== (selected.title || "") ||
      content !== (selected.content || "") ||
      tagsText !== ((selected.tags || []).join(", ")) ||
      pinned !== !!selected.pinned ||
      archived !== !!selected.archived
    );
  }, [selected, title, content, tagsText, pinned, archived]);

  const reload = async () => {
    try {
      const pinnedParam = filter === "pinned" ? true : undefined;
      const archivedParam = filter === "archived" ? true : false;

      const rows = await listNotes({
        q: query || undefined,
        pinned: pinnedParam,
        archived: archivedParam,
        tag: tagFilter || undefined,
      });

      rows.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      setNotes(rows);

      if (rows.length && (!selectedId || !rows.some((r) => r.id === selectedId))) {
        setSelectedId(rows[0].id);
      }
      if (!rows.length) setSelectedId(null);
    } catch {
      toast.error(t("notebook.errors.loadNotes"));
    }
  };

  useEffect(() => {
    reload();
  }, [filter, tagFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => reload(), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    return () => {
      onDirtyChange?.(false);
      registerSaveHandler?.(async () => true);
    };
  }, [onDirtyChange, registerSaveHandler]);

  useEffect(() => {
    if (!selected) {
      setTitle("");
      setContent("");
      setTagsText("");
      setPinned(false);
      setArchived(false);
      return;
    }
    setTitle(selected.title || "");
    setContent(selected.content || "");
    setTagsText((selected.tags || []).join(", "));
    setPinned(!!selected.pinned);
    setArchived(!!selected.archived);
  }, [selected]);

  const parseTags = () =>
    tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const onNew = async () => {
    try {
      const n = await createNote({
        title: t("notebook.untitled"),
        content: "",
        tags: [],
        pinned: false,
        archived: false,
      });
      toast.success(t("notebook.toasts.noteCreated"));
      setNotes((prev) => [n, ...prev]);
      setSelectedId(n.id);
    } catch {
      toast.error(t("notebook.errors.createNote"));
    }
  };

  const onSave = useCallback(async () => {
    if (!selected) return false;

    try {
      const updated = await updateNote(selected.id, {
        title: title.trim(),
        content,
        tags: parseTags(),
        pinned,
        archived,
      });

      toast.success(t("notebook.toasts.saved"));
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      return true;
    } catch {
      toast.error(t("notebook.errors.saveNote"));
      return false;
    }
  }, [selected, title, content, tagsText, pinned, archived, t]);

  useEffect(() => {
    registerSaveHandler?.(onSave);
  }, [registerSaveHandler, onSave]);

  const onDelete = async () => {
    if (!selected) return;
    if (!confirm(t("notebook.confirm.delete"))) return;

    try {
      await deleteNote(selected.id);
      toast.success(t("notebook.toasts.deleted"));
      setNotes((prev) => prev.filter((n) => n.id !== selected.id));
      setSelectedId(null);
    } catch {
      toast.error(t("notebook.errors.deleteNote"));
    }
  };

  useEffect(() => {
    if (!autoSave) return;
    if (!isDirty) return;
    if (!selected) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await onSave();
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoSave, isDirty, selected, title, content, tagsText, pinned, archived, onSave]);

  return (
    <div className="max-w-8xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3"
            onClick={() => setMobileNotesOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            {t("notebook.mobile.notes")}
          </Button>

          <div className="mx-2 min-w-0 flex-1 text-center">
            <div className="truncate text-sm font-semibold text-foreground">
              {t("notebook.mobile.title")}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {selected
                ? selected.title || t("notebook.untitled")
                : t("notebook.mobile.yourNotes")}
            </div>
          </div>

          <Button
            onClick={onNew}
            size="sm"
            className="h-9 rounded-xl bg-blue-700 px-3 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("notebook.actions.add")}</span>
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="hidden w-[340px] shrink-0 lg:flex">
            <Card className="flex w-full flex-col rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/20 p-4 rounded-t-2xl">
                <div className="mb-3">
                  <div className="text-lg font-semibold text-foreground">
                    {t("notebook.sidebar.myNotes")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("notebook.sidebar.noteCount", {
                      count: notes.length,
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-10 rounded-xl pl-9"
                      placeholder={t("notebook.placeholders.search")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={onNew} className="h-10 rounded-xl bg-blue-700 px-3 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("notebook.actions.new")}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={() => setFilter("all")}
                  >
                    {t("notebook.filters.all")}
                  </Button>
                  <Button
                    variant={filter === "pinned" ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={() => setFilter("pinned")}
                  >
                    {t("notebook.filters.pinned")}
                  </Button>
                  <Button
                    variant={filter === "archived" ? "default" : "outline"}
                    size="sm"
                    className="h-9 rounded-xl"
                    onClick={() => setFilter("archived")}
                  >
                    {t("notebook.filters.archived")}
                  </Button>
                </div>

                {allTags.length > 0 && (
                  <>
                    <Separator />
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("notebook.tags.title")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={tagFilter === null ? "default" : "outline"}
                        className="cursor-pointer rounded-lg px-2.5 py-1"
                        onClick={() => setTagFilter(null)}
                      >
                        {t("notebook.filters.all")}
                      </Badge>
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={tagFilter === tag ? "default" : "outline"}
                          className="cursor-pointer rounded-lg px-2.5 py-1"
                          onClick={() => setTagFilter(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Separator />

              <div className="flex-1 overflow-auto">
                {notes.length === 0 ? (
                  <div className="p-6">
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      {t("notebook.empty.noNotes")}{" "}
                      <span className="font-medium text-foreground">
                        {t("notebook.actions.new")}
                      </span>{" "}
                      {t("notebook.empty.createOne")}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {notes.map((n) => (
                      <Card
                        key={n.id}
                        className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                          n.id === selectedId
                            ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                            : "border-border bg-card hover:bg-muted/40"
                        }`}
                        onClick={() => {
                          if (n.id === selectedId) return;
                          confirmBeforeLeaving(() => {
                            setSelectedId(n.id);
                          });
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {n.title || t("notebook.untitled")}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs text-foreground/70 dark:text-foreground/60">
                              {n.content?.slice(0, 120) || t("notebook.empty.noContent")}
                            </div>
                            <div className="mt-2 text-[11px] text-foreground/50">
                              {t("notebook.updated")} {timeAgo(n.updated_at, t)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {n.pinned && <Pin className="h-4 w-4 text-blue-700" />}
                            {n.archived && <Archive className="h-4 w-4 text-gray-500" />}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {mobileNotesOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileNotesOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 top-20 flex flex-col rounded-t-2xl border border-border bg-card">
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

                <div className="border-b border-border p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {t("notebook.sidebar.myNotes")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("notebook.sidebar.noteCount", {
                          count: notes.length,
                        })}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setMobileNotesOpen(false);
                        onNew();
                      }}
                      className="w-full rounded-xl bg-blue-700 px-3 hover:bg-blue-700 sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("notebook.actions.addNote")}
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-10 rounded-xl pl-9"
                      placeholder={t("notebook.placeholders.search")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => setFilter("all")}
                    >
                      {t("notebook.filters.all")}
                    </Button>
                    <Button
                      variant={filter === "pinned" ? "default" : "outline"}
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => setFilter("pinned")}
                    >
                      {t("notebook.filters.pinned")}
                    </Button>
                    <Button
                      variant={filter === "archived" ? "default" : "outline"}
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => setFilter("archived")}
                    >
                      {t("notebook.filters.archived")}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3">
                  {notes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-6 text-center text-sm text-muted-foreground">
                      {t("notebook.empty.noNotes")}{" "}
                      <span className="font-medium text-foreground">
                        {t("notebook.actions.addNote")}
                      </span>{" "}
                      {t("notebook.empty.createOne")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <Card
                          key={n.id}
                          className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                            n.id === selectedId
                              ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                              : "border-border bg-card hover:bg-muted/40"
                          }`}
                          onClick={() => {
                            if (n.id === selectedId) {
                              setMobileNotesOpen(false);
                              return;
                            }

                            confirmBeforeLeaving(() => {
                              setSelectedId(n.id);
                              setMobileNotesOpen(false);
                            });
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {n.title || t("notebook.untitled")}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs text-foreground/70 dark:text-foreground/60">
                                {n.content?.slice(0, 120) || t("notebook.empty.noContent")}
                              </div>
                              <div className="mt-2 text-[11px] text-foreground/50">
                                {t("notebook.updated")} {timeAgo(n.updated_at, t)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {n.pinned && <Pin className="h-4 w-4 text-blue-700" />}
                              {n.archived && <Archive className="h-4 w-4 text-gray-500" />}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
            {!selected ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-10 text-center shadow-sm">
                  <div className="text-base font-medium text-foreground">
                    {t("notebook.empty.noNoteSelected")}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t("notebook.empty.getStarted")}
                  </div>
                  <Button
                    onClick={onNew}
                    className="mt-4 h-10 rounded-xl bg-blue-700 text-white hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("notebook.actions.createNote")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="sticky top-0 z-10 hidden flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:flex">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {t("notebook.editor.autoSave")}
                      </span>
                      <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {isAutoSaving
                        ? t("notebook.editor.saving")
                        : isDirty
                        ? t("notebook.editor.unsavedChanges")
                        : `${t("notebook.updated")} ${timeAgo(selected.updated_at, t)}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDelete}
                      className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-950/30"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("notebook.actions.delete")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={onSave}
                      className="h-10 rounded-xl bg-blue-700 text-white hover:bg-blue-700"
                    >
                      {t("notebook.actions.save")}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:hidden">
                  <div className="text-xs text-muted-foreground">
                    {t("notebook.updated")} {timeAgo(selected.updated_at, t)}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDelete}
                      className="h-10 rounded-xl border-red-900/40 text-red-400 hover:bg-red-950/30"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("notebook.actions.delete")}
                    </Button>

                    <Button
                      size="sm"
                      onClick={onSave}
                      className="h-10 rounded-xl bg-blue-700 text-white hover:bg-blue-700"
                    >
                      {t("notebook.actions.save")}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                  <Input
                    className="h-11 rounded-xl border border-border bg-background px-4 text-xl font-semibold focus-visible:ring-0 sm:h-12 sm:text-2xl"
                    placeholder={t("notebook.placeholders.untitled")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {t("notebook.editor.pinned")}
                      </span>
                      <Switch checked={pinned} onCheckedChange={setPinned} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {t("notebook.editor.archived")}
                      </span>
                      <Switch checked={archived} onCheckedChange={setArchived} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="text-sm font-medium text-foreground">
                      {t("notebook.tags.title")}
                    </div>
                    <Input
                      className="rounded-xl"
                      placeholder={t("notebook.placeholders.tags")}
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                    />
                  </div>

                  <Textarea
                    className="mt-4 min-h-[520px] rounded-xl border border-border bg-background p-5 text-[15px] leading-7"
                    placeholder={t("notebook.placeholders.startWriting")}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {showUnsavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowUnsavedModal(false)}
            />

            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <TriangleAlert className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("notebook.unsaved.title")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("notebook.unsaved.description")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowUnsavedModal(false)}
                >
                  {t("notebook.unsaved.stay")}
                </Button>

                <Button
                  className="rounded-xl bg-blue-700 text-white hover:bg-blue-700"
                  onClick={async () => {
                    const ok = await onSave();
                    if (!ok) return;
                    setShowUnsavedModal(false);
                    pendingAction?.();
                  }}
                >
                  {t("notebook.unsaved.saveAndContinue")}
                </Button>

                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => {
                    setShowUnsavedModal(false);
                    pendingAction?.();
                  }}
                >
                  {t("notebook.unsaved.leaveWithoutSaving")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}