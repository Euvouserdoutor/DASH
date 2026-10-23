import { redirect } from "next/navigation";

// Keep bookmarked /login URLs working without displaying a login screen.
export default function LoginPage() {
  redirect("/overview");
}
