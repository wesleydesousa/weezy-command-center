"use client";

import { useState } from "react";

const VIEWS = {
  login: {
    eyebrow: "ACESSO À CONTA",
    title: "Bem-vindo de volta.",
    text: "Entre para continuar seus projetos, acompanhar seu plano e usar todas as ferramentas liberadas.",
    action: "Entrar com ChatGPT",
    note: "A autenticação acontece em uma tela segura do ChatGPT."
  },
  signup: {
    eyebrow: "NOVO USUÁRIO",
    title: "Crie sua conta Weezy.",
    text: "Use sua conta do ChatGPT para criar seu perfil automaticamente e começar com os recursos gratuitos.",
    action: "Criar conta gratuitamente",
    note: "Seu perfil Weezy será criado após a primeira entrada."
  },
  recovery: {
    eyebrow: "RECUPERAÇÃO DE SENHA",
    title: "Recupere seu acesso.",
    text: "Sua senha é protegida pelo ChatGPT. Continue para a tela segura, informe seu e-mail e selecione “Esqueci minha senha”.",
    action: "Continuar para recuperar senha",
    note: "As instruções de redefinição serão enviadas pelo serviço de autenticação."
  }
};

function AuthIcon({ view }) {
  if (view === "recovery") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2.3 5.7L4 18v-5h5l-1.7 1.7A5 5 0 1 0 7 11"/><path d="M12 8v4l3 2"/></svg>;
  if (view === "signup") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="4"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V6a4 4 0 0 0-8 0v2"/><rect x="3" y="8" width="14" height="12" rx="2"/><path d="M10 12v4M18 12h4M20 10v4"/></svg>;
}

export default function AuthPanel({ signInUrl }) {
  const [view, setView] = useState("login");
  const content = VIEWS[view];

  return <section className="auth-layout">
    <aside className="auth-intro">
      <span className="eyebrow">CONTA WEEZY</span>
      <h1>Seu canal.<br />Seu comando.</h1>
      <p>Uma conta conecta seus projetos, seu plano e suas ferramentas de criação.</p>
      <div className="auth-benefits">
        <span><i>01</i> Projetos e legendas no navegador</span>
        <span><i>02</i> Plano e limites em um só lugar</span>
        <span><i>03</i> Login protegido pelo ChatGPT</span>
      </div>
    </aside>

    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Opções da conta">
        <button role="tab" aria-selected={view === "login"} className={view === "login" ? "active" : ""} onClick={() => setView("login")}>Entrar</button>
        <button role="tab" aria-selected={view === "signup"} className={view === "signup" ? "active" : ""} onClick={() => setView("signup")}>Criar conta</button>
        <button role="tab" aria-selected={view === "recovery"} className={view === "recovery" ? "active" : ""} onClick={() => setView("recovery")}>Recuperar senha</button>
      </div>

      <div className="auth-card-content" role="tabpanel">
        <span className="auth-icon"><AuthIcon view={view} /></span>
        <span className="account-kicker">{content.eyebrow}</span>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
        <a className="auth-primary" href={signInUrl} target="_top">{content.action}<span>→</span></a>
        <small className="auth-note"><span>✓</span>{content.note}</small>
      </div>

      <div className="auth-switch">
        {view === "login" && <><span>Ainda não tem conta?</span><button onClick={() => setView("signup")}>Criar agora</button></>}
        {view === "signup" && <><span>Já possui uma conta?</span><button onClick={() => setView("login")}>Fazer login</button></>}
        {view === "recovery" && <><span>Lembrou sua senha?</span><button onClick={() => setView("login")}>Voltar ao login</button></>}
      </div>
    </div>
  </section>;
}
