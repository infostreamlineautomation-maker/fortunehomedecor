import { AuthGate } from "@/components/AuthGate";

// CMS pages wait for the browser-side session check, so navigations here can't be instant.
export const instant = false;

/** Every CMS page except /login lives in this group and requires a session. */
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <AuthGate>{children}</AuthGate>;
}
