import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { Archive, Pin, Plus, Search, Trash2 } from "lucide-react";
import { createNote, deleteNote, listNotes, updateNote, type Note } from "../lib/notesApi";
import { errorMessage } from "../lib/errorMessage";

type FilterMode = "all" | "pinned" | "archived";

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notebook() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Editor state
  const selected = useMemo(() => notes.find(n => n.id === selectedId) || null, [notes, selectedId]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState(""); // comma typing for UX
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
    const allTags = useMemo(() => {
        const s = new Set<string>();
        notes.forEach(n => (n.tags || []).forEach(t => s.add(t)));
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

        // default: hide archived unless filter is explicitly "archived"
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

        if (rows.length && (!selectedId || !rows.some(r => r.id === selectedId))) {
        setSelectedId(rows[0].id);
        }
        if (!rows.length) setSelectedId(null);
        } catch (e: any) {
        toast.error(errorMessage(e));        }
    };
  useEffect(() => { reload(); }, [filter, tagFilter]);
  useEffect(() => {
    const t = setTimeout(() => reload(), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    // sync editor when selected changes
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
      .map(s => s.trim())
      .filter(Boolean);

  const onNew = async () => {
    try {
      const n = await createNote({ title: "  Untitled", content: "", tags: [], pinned: false, archived: false });
      toast.success("Note created");
      setNotes(prev => [n, ...prev]);
      setSelectedId(n.id);
    } catch (e: any) {
     toast.error(errorMessage(e)); 
    }
  };

  const onSave = async () => {
    if (!selected) return;
    try {
      const updated = await updateNote(selected.id, {
        title: title.trim(),
        content,
        tags: parseTags(),
        pinned,
        archived,
      });
      toast.success("Saved");
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
    } catch (e: any) {
      toast.error(errorMessage(e));
    }
  };
    

  const onDelete = async () => {
    if (!selected) return;
    if (!confirm("Delete this note? This cannot be undone.")) return;
    try {
      await deleteNote(selected.id);
      toast.success("Deleted");
      setNotes(prev => prev.filter(n => n.id !== selected.id));
      setSelectedId(null);
    } catch (e: any) {
      toast.error(errorMessage(e));
    }
  };

  return (
  <div className="flex h-full min-h-0 flex-col bg-background">
    {/* Mobile top bar */}
    <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-xl px-3"
        onClick={() => setMobileNotesOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Notes
      </Button>
          <div className="mx-2 min-w-0 flex-1 text-center">
      <div className="truncate text-sm font-semibold text-foreground">
        {selected ? "Editing note" : "Notebook"}
      </div>
      <div className="truncate text-[11px] text-muted-foreground">
        {selected ? "Tap Notes to switch" : "Your notes"}
      </div>
    </div>

      <Button onClick={onNew} size="sm" className="h-9 rounded-xl bg-blue-600 px-3 hover:bg-blue-700">
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Add</span>
    </Button>
    </div>

    <div className="flex min-h-0 flex-1">
      {/* Desktop sidebar */}
      <div className="hidden w-[340px] shrink-0 border-r bg-card/80 backdrop-blur lg:flex lg:flex-col">
        <div className="border-b p-4">
          <div className="mb-3">
            <div className="text-lg font-semibold text-foreground">My Notes</div>
            <div className="text-sm text-muted-foreground">
              {notes.length} note{notes.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-xl pl-9"
                placeholder="      Search notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button onClick={onNew} className="h-10 rounded-xl bg-blue-600 px-3 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "pinned" ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setFilter("pinned")}
            >
              Pinned
            </Button>
            <Button
              variant={filter === "archived" ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setFilter("archived")}
            >
              Archived
            </Button>
          </div>

          {allTags.length > 0 && (
            <>
              <Separator />
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={tagFilter === null ? "default" : "outline"}
                  className="cursor-pointer rounded-md px-2.5 py-1"
                  onClick={() => setTagFilter(null)}
                >
                  All
                </Badge>
                {allTags.map((t) => (
                  <Badge
                    key={t}
                    variant={tagFilter === t ? "default" : "outline"}
                    className="cursor-pointer rounded-md px-2.5 py-1"
                    onClick={() => setTagFilter(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Notes list */}
        <div className="flex-1 overflow-auto">
          {notes.length === 0 ? (
            <div className="p-6">
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No notes yet. Click <span className="font-medium text-foreground">New</span> to create one.
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {notes.map((n) => (
                <Card
                  key={n.id}
                  className={`cursor-pointer rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md ${
                    n.id === selectedId
                      ? "border-blue-500/60 bg-blue-100 dark:bg-blue-950/40 ring-1 ring-blue-400/40"
                    : "bg-background hover:bg-accent/40"
                  }`}
                  onClick={async () => {
                    if (n.id === selectedId) return;

                    if (isDirty) {
                      const ok = await onSave();
                      if (!ok) return;
                    }

                    setSelectedId(n.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {n.title || "Untitled"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-foreground/70 dark:text-foreground/60">
                        {n.content?.slice(0, 120) || "No content"}
                      </div>
                      <div className="mt-2 text-[11px] text-foreground/50">
                        Updated {timeAgo(n.updated_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {n.pinned && <Pin className="h-4 w-4 text-blue-600" />}
                      {n.archived && <Archive className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile notes sheet */}
      {mobileNotesOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNotesOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-20 flex flex-col rounded-t-3xl border bg-background shadow-2xl">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            <div className="border-b p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">My Notes</div>
                  <div className="text-sm text-muted-foreground">
                    {notes.length} note{notes.length === 1 ? "" : "s"}
                  </div>
                </div>
                <Button
                onClick={() => {
                  setMobileNotesOpen(false);
                  onNew();
                }}
                className="w-full rounded-xl bg-blue-600 px-3 hover:bg-blue-700 sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 rounded-xl pl-9"
                  placeholder="    Search notes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "pinned" ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFilter("pinned")}
                >
                  Pinned
                </Button>
                <Button
                  variant={filter === "archived" ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setFilter("archived")}
                >
                  Archived
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3">
              {notes.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No notes yet. Tap <span className="font-medium text-foreground">Add Note</span> to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <Card
                      key={n.id}
                      className={`cursor-pointer rounded-xl border p-3 shadow-sm transition-all ${
                        n.id === selectedId
                        ? "border-blue-500/60 bg-blue-100 dark:bg-blue-950/40 ring-1 ring-blue-400/40"
                        : "bg-background hover:bg-accent/40"
                      }`}
                      onClick={async () => {
                        if (n.id === selectedId) {
                          setMobileNotesOpen(false);
                          return;
                        }

                        if (isDirty) {
                          const ok = await onSave();
                          if (!ok) return;
                        }

                        setSelectedId(n.id);
                        setMobileNotesOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {n.title || "Untitled"}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-foreground/70 dark:text-foreground/60">
                            {n.content?.slice(0, 120) || "No content"}
                          </div>
                          <div className="mt-2 text-[11px] text-foreground/50">
                            Updated {timeAgo(n.updated_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {n.pinned && <Pin className="h-4 w-4 text-blue-600" />}
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

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-auto bg-muted/10 p-4 sm:p-6">
        {!selected ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-2xl border border-dashed bg-background px-8 py-10 text-center shadow-sm">
              <div className="text-base font-medium text-foreground">No note selected</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Open the notes menu or create a new note to get started.
              </div>
              <Button onClick={onNew} className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create note
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4 pb-6">
            <div className="hidden sticky top-0 z-10 flex-col gap-3 rounded-2xl border bg-background/90 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:flex">
              <div className="text-sm text-muted-foreground">
                Last updated {timeAgo(selected.updated_at)}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
                  Save
                </Button>
              </div>
            </div>
              <div className="flex flex-col gap-3 rounded-2xl border bg-background p-3 shadow-sm lg:hidden">
                <div className="text-xs text-muted-foreground">
                Updated {timeAgo(selected.updated_at)}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="h-10 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <Button
                  size="sm"
                  onClick={onSave}
                  className="h-10 bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border bg-background p-4 shadow-sm sm:p-6">
              <Input
                className="h-11 rounded-xl border-0 bg-transparent px-0 text-xl font-bold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-12 sm:text-2xl"
                placeholder="Untitled note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Pinned</span>
                  <Switch checked={pinned} onCheckedChange={setPinned} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Archived</span>
                  <Switch checked={archived} onCheckedChange={setArchived} />
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border bg-background p-4 shadow-sm">
                <div className="text-sm font-medium text-foreground">Tags</div>
                <Input
                  className="rounded-xl"
                  placeholder="school, exam, todo"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                />
              </div>

              <Textarea
                className="mt-4 min-h-[520px] rounded-2xl border bg-background p-5 text-[15px] leading-7 shadow-sm"
                placeholder="Start writing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}