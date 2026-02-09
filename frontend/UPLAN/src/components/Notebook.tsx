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
      const n = await createNote({ title: "Untitled", content: "", tags: [], pinned: false, archived: false });
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
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={onNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
            <Button variant={filter === "pinned" ? "default" : "outline"} size="sm" onClick={() => setFilter("pinned")}>Pinned</Button>
            <Button variant={filter === "archived" ? "default" : "outline"} size="sm" onClick={() => setFilter("archived")}>Archived</Button>
          </div>

          {allTags.length > 0 && (
            <>
              <Separator />
              <div className="text-xs text-gray-500 font-medium">Tags</div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={tagFilter === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTagFilter(null)}
                >
                  All
                </Badge>
                {allTags.map(t => (
                  <Badge
                    key={t}
                    variant={tagFilter === t ? "default" : "outline"}
                    className="cursor-pointer"
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
            <div className="p-6 text-sm text-gray-500">No notes yet. Click + to create one.</div>
          ) : (
            <div className="p-2 space-y-2">
              {notes.map(n => (
                <Card
                  key={n.id}
                  className={`p-3 cursor-pointer hover:shadow-sm transition ${
                    n.id === selectedId ? "border-blue-300 bg-blue-50" : ""
                  }`}
                  onClick={async () => {
                        if (n.id === selectedId) return;

                        if (isDirty) {
                            const ok = await onSave();
                            if (!ok) return;   // 👈 prevent switching if save failed
                        }

                        setSelectedId(n.id);
                        }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{n.title || "Untitled"}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {n.content?.slice(0, 80) || "No content"}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
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

      {/* Editor */}
      <div className="flex-1 p-6 overflow-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a note or create a new one.
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated {timeAgo(selected.updated_at)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onDelete} className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700">
                  Save
                </Button>
              </div>
            </div>

            <Input
              className="text-lg font-semibold"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex items-center justify-between rounded-lg border bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Pinned</span>
                <Switch checked={pinned} onCheckedChange={setPinned} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Archived</span>
                <Switch checked={archived} onCheckedChange={setArchived} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Tags (comma separated)</div>
              <Input
                placeholder="school, exam, todo"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />
            </div>

            <Textarea
              className="min-h-[420px]"
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
