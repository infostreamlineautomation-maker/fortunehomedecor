"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { PageHeader, Panel } from "@/components/ui/Layout";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/hooks";

export default function ProfilePage() {
  const { admin, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(admin?.full_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveName() {
    setSavingName(true);
    try {
      await adminFetch("/auth/me", { method: "PATCH", body: JSON.stringify({ full_name: name }) });
      await refresh();
      toast.success("Name saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (next.length < 8) return toast.error("New password must be at least 8 characters");
    if (next !== repeat) return toast.error("New passwords don't match");
    setSavingPassword(true);
    try {
      await adminFetch("/auth/password", { method: "POST", body: JSON.stringify({ current_password: current, new_password: next }) });
      setCurrent("");
      setNext("");
      setRepeat("");
      toast.success("Password changed");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <PageHeader title="Your profile" description={admin?.email} />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Panel title="Name">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveName();
            }}
          >
            <Field label="Full name">
              <Input value={name} maxLength={150} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Button type="submit" loading={savingName} disabled={name === (admin?.full_name ?? "")}>
              Save name
            </Button>
          </form>
        </Panel>
        <Panel title="Change password">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void changePassword();
            }}
          >
            <Field label="Current password">
              <Input type="password" value={current} required onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <Input type="password" value={next} required minLength={8} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Repeat new password">
              <Input type="password" value={repeat} required onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={savingPassword}>
              Change password
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
