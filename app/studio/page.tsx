import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import StudioDashboard from "./StudioDashboard";

export const dynamic = "force-dynamic";

const ALLOWED_EMAILS = new Set([
  "mihiranagamm@gmail.com",
  "bradlindemann1@gmail.com",
]);

export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");
  const email = user.email.trim().toLowerCase();

  if (!ALLOWED_EMAILS.has(email)) {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-labelledby="studio-access-title">
          <div className="auth-brand">
            <span className="brand-mark"><i /><i /><i /></span>
            <span><b>Gateway Growth</b><small>Window market intelligence</small></span>
          </div>
          <p className="auth-eyebrow">PRIVATE MARKET DASHBOARD</p>
          <h1 id="studio-access-title">This account isn&apos;t on the access list.</h1>
          <p>You signed in as <strong>{user.email}</strong>. Ask the dashboard owner to authorize that exact email address.</p>
          <a className="auth-button auth-button-secondary" href={chatGPTSignOutPath("/studio")}>Sign in with a different account</a>
          <small>Access decisions are checked securely on the server.</small>
        </section>
      </main>
    );
  }

  return <StudioDashboard viewerEmail={email} />;
}
