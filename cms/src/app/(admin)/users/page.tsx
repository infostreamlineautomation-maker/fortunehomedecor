"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Toggle } from "@/components/ui/Form";
import { Badge, ErrorBox, Loading, PageHeader } from "@/components/ui/Layout";
import { Modal, useConfirm } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errorMessage, formatDate, useResource } from "@/lib/hooks";
import type { User } from "@/lib/types";

const ROLE_LABELS = { superadmin: "Admin", editor: "Editor" } as const;

/** Readable random password for new accounts; shown once so the admin can share it. */
function suggestPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function UsersPage() {
  const { admin } = useAuth();
  const { data, setData, error, loading, reload } = useResource<User[]>(admin?.role === "superadmin" ? "/users" : null);
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  if (admin?.role !== "superadmin") return <ErrorBox message="Only admins can manage users." />;

  async function remove(user: User) {
    const ok = await confirm({ title: "Delete user?", message: `${user.email} will no longer be able to sign in.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await adminFetch(`/users/${user.id}`, { method: "DELETE" });
      setData((list) => list?.filter((u) => u.id !== user.id) ?? null);
      toast.success("User deleted");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Admins can manage users and see the audit log. Editors can edit all website content."
        actions={<Button onClick={() => setEditing("new")}>Add user</Button>}
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-cream text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.full_name || u.email}</span>
                    {u.id === admin.id && <span className="ml-2 text-xs text-muted">(you)</span>}
                    <span className="block text-xs text-muted">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex gap-2">
                      <Badge tone={u.role === "superadmin" ? "blue" : "grey"}>{ROLE_LABELS[u.role]}</Badge>
                      {!u.is_active && <Badge tone="red">Disabled</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.last_login_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>
                      Edit
                    </Button>
                    {u.id !== admin.id && (
                      <Button size="sm" variant="ghost" onClick={() => remove(u)} className="ml-2">
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UserForm
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(u, created) => {
            setData((list) => (created ? [...(list ?? []), u] : (list?.map((x) => (x.id === u.id ? u : x)) ?? null)));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function UserForm({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: (u: User, created: boolean) => void }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.full_name ?? "");
  const [role, setRole] = useState<User["role"]>(user?.role ?? "editor");
  const [active, setActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState(user ? "" : suggestPassword());
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (password && password.length < 8) return toast.error("Password must be at least 8 characters");
    setSaving(true);
    try {
      const saved = user
        ? await adminFetch<User>(`/users/${user.id}`, {
            method: "PATCH",
            body: JSON.stringify({ full_name: name, role, is_active: active, ...(password ? { password } : {}) }),
          })
        : await adminFetch<User>("/users", { method: "POST", body: JSON.stringify({ email, full_name: name, role, password }) });
      toast.success(user ? "User updated" : "User created — share the password with them securely");
      onSaved(saved, !user);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={user ? `Edit ${user.email}` : "Add user"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {!user && (
          <Field label="Email *">
            <Input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          </Field>
        )}
        <Field label="Full name">
          <Input value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as User["role"])}>
            <option value="editor">Editor — edits website content</option>
            <option value="superadmin">Admin — also manages users and sees the audit log</option>
          </Select>
        </Field>
        <Field label={user ? "New password" : "Password *"} hint={user ? "Leave empty to keep the current password." : "Generated for you — copy it before saving."}>
          <div className="flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} minLength={user ? undefined : 8} required={!user} autoComplete="new-password" />
            <Button variant="secondary" onClick={() => setPassword(suggestPassword())}>
              Generate
            </Button>
          </div>
        </Field>
        {user && <Toggle checked={active} onChange={setActive} label={active ? "Can sign in" : "Disabled"} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {user ? "Save" : "Create user"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
