import { chatGPTSignInPath } from "../chatgpt-auth";
import AuthPanel from "./auth-panel";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <main className="auth-shell">
    <header className="auth-topbar">
      <a className="brand" href="/"><span className="brand-mark">W</span><span><strong>WEEZY</strong><small>COMMAND CENTER</small></span></a>
      <a className="account-link" href="/">Voltar ao painel</a>
    </header>
    <AuthPanel signInUrl={chatGPTSignInPath("/account")} />
  </main>;
}
