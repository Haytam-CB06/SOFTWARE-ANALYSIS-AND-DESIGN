// src/lib/notesApi.ts
import { apiJsonAuthed } from "./api";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags?: string[] | string;
  pinned: boolean;
  archived: boolean;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteCreate = {
  title?: string;
  content?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  entity_type?: string | null;
  entity_id?: string | null;
};

export type NoteUpdate = Partial<NoteCreate>;

const normalizeTags = (t: any): string[] => {
  if (!t) return [];
  if (Array.isArray(t)) return t.map(String);
  if (typeof t === "string") return t.split(",").map(s => s.trim()).filter(Boolean);
  return [];
};

export async function listNotes(params?: {
  q?: string;
  pinned?: boolean;
  archived?: boolean;
  tag?: string;
  entity_type?: string;
  entity_id?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.entity_type) qs.set("entity_type", params.entity_type);
  if (params?.entity_id) qs.set("entity_id", params.entity_id);
  if (params?.pinned !== undefined) qs.set("pinned", String(params.pinned));
  if (params?.archived !== undefined) qs.set("archived", String(params.archived));

  const data = await apiJsonAuthed<any[]>(`/notes${qs.toString() ? `?${qs}` : ""}`, "GET");
  return (data || []).map((n: any) => ({ ...n, tags: normalizeTags(n.tags) })) as Note[];
}

export async function createNote(payload: NoteCreate) {
  const body = { ...payload, tags: payload.tags || [] };
  const n = await apiJsonAuthed<any>(`/notes`, "POST", body);
  return { ...n, tags: normalizeTags(n.tags) } as Note;
}

export async function updateNote(id: string, payload: NoteUpdate) {
  const body = { ...payload };
  if (payload.tags) body.tags = payload.tags;
  const n = await apiJsonAuthed<any>(`/notes/${encodeURIComponent(id)}`, "PATCH", body);
  return { ...n, tags: normalizeTags(n.tags) } as Note;
}

export async function deleteNote(id: string) {
  return apiJsonAuthed<any>(`/notes/${encodeURIComponent(id)}`, "DELETE");
}
