import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner@2.0.3";

type AdminUser = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  last_login?: string | null;
  // Backwards/alternate field names (defensive)
  last_sign_in?: string | null;
  lastSignIn?: string | null;
  is_banned: boolean;
};

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return dt;
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

export default function GlobalAdminDashboard() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const currentUserId = localStorage.getItem("currentUserId") || "";

  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [activeDays, setActiveDays] = useState(7);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (currentUserId) h["X-User-Id"] = currentUserId;
    return h;
  }, [currentUserId]);

  const load = async () => {
    if (!API_BASE_URL || !currentUserId) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotAuthorized(false);

      const [usersRes, activeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users?limit=200&offset=0`, { headers }),
        fetch(`${API_BASE_URL}/admin/active-count?days=${activeDays}`, { headers }),
      ]);

      if (usersRes.status === 403 || activeRes.status === 403) {
        setNotAuthorized(true);
        setUsers([]);
        setActiveCount(null);
        return;
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data?.users) ? data.users : []);
      } else {
        toast.error("Failed to load users");
      }

      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveCount(typeof data?.active_users === "number" ? data.active_users : null);
      }
    } catch (e) {
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, currentUserId, activeDays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.email || ""} ${u.full_name || ""} ${u.username || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const setBan = async (userId: string, shouldBan: boolean) => {
    if (!API_BASE_URL || !currentUserId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/users/${encodeURIComponent(userId)}/${shouldBan ? "ban" : "unban"}`,
        { method: "POST", headers }
      );
      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || "Request failed");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: shouldBan } : u)));
      toast.success(shouldBan ? "User banned" : "User unbanned");
    } catch {
      toast.error("Request failed");
    }
  };

  if (notAuthorized) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>You are not authorized to view this page.</p>
              <p className="text-xs">
                Dev setup: add your account email to <code className="px-1 py-0.5 bg-gray-100 rounded">ADMIN_EMAILS</code> in the backend
                env (.env) and restart the backend.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Global Admin</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-64"
            />
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <div>
              Active users (last
              <Input
                type="number"
                min={1}
                max={365}
                value={activeDays}
                onChange={(e) => setActiveDays(Math.max(1, Math.min(365, Number(e.target.value || 7))))}
                className="inline-block w-20 mx-2"
              />
              days): <span className="font-semibold">{activeCount ?? "—"}</span>
            </div>
            <div className="text-xs">Total users loaded: {users.length}</div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name || u.username || u.email || u.id}</div>
                      <div className="text-xs text-gray-500">{u.email || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{fmt(u.last_login ?? u.last_sign_in ?? u.lastSignIn)}</TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Badge variant="destructive">banned</Badge>
                      ) : (
                        <Badge variant="outline">active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.is_banned ? (
                        <Button size="sm" variant="outline" onClick={() => setBan(u.id, false)}>
                          Unban
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => setBan(u.id, true)}>
                          Ban
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading...</div>}
        </CardContent>
      </Card>
    </div>
  );
}