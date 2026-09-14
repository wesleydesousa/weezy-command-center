import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { ensureUser, getAccount, getEffectiveSubscription } from "../../db/index";
import PurchaseButton from "./purchase-button";

export const dynamic = "force-dynamic";

const PLAN_LABELS = { creator: "Creator", pro: "Pro", master: "Master" };

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  await ensureUser(user);
  const account = await getAccount(user.userId);
  const subscription = await getEffectiveSubscription(user);
  const active = Boolean(subscription);
  const master = subscription?.plan === "master";
  const plan = subscription?.plan || "free";
  const planBenefits = master
    ? ["Edições ilimitadas", "Todos os recursos", "Acesso permanente"]
    : plan === "pro"
      ? ["Edições ilimitadas", "Recursos completos", "Prioridade em novidades"]
      : plan === "creator"
        ? ["Até 5 edições por dia", "Até 150 por mês", "Editor completo"]
        : ["1 vídeo por dia", "Até 2 clipes", "Recursos essenciais"];

  return <main className="account-shell">
    <header className="account-topbar">
      <a className="brand" href="/"><span className="brand-mark">W</span><span><strong>WEEZY</strong><small>COMMAND CENTER</small></span></a>
      <a className="account-link" href="/">Voltar ao painel</a>
      <a className="account-link" href={chatGPTSignOutPath("/")}>Sair</a>
    </header>

    <section className="account-hero">
      <span className="eyebrow">CONTA WEEZY</span>
      <h1>Seu espaço de criação.</h1>
      <p>{account.profile?.name || user.displayName}<br /><span>{account.profile?.email}</span></p>
    </section>

    <section className="account-grid">
      <article className={`account-card account-status current-plan-card plan-${plan}`}>
        <div className="current-plan-heading">
          <span className="account-kicker">SEU PLANO ATUAL</span>
          <span className="current-plan-badge"><i />{master ? "ACESSO TOTAL" : active ? "ATIVO" : "GRATUITO"}</span>
        </div>
        <div className="current-plan-main">
          <div>
            <small>VOCÊ ESTÁ USANDO</small>
            <strong>{active ? PLAN_LABELS[subscription.plan] || subscription.plan : "Gratuito"}</strong>
          </div>
          <div className="current-plan-benefits">
            {planBenefits.map(benefit => <span key={benefit}>✓ {benefit}</span>)}
          </div>
        </div>
        <p>{master ? "Sua conta possui acesso permanente a toda a ferramenta, sem limites diários ou mensais." : active ? `Plano liberado até ${new Intl.DateTimeFormat("pt-BR").format(new Date(subscription.expiresAt))}.` : "Você está no plano gratuito. Faça upgrade quando quiser liberar a ferramenta completa."}</p>
      </article>

      {master ? <article className="account-card featured-plan" style={{ gridColumn: "span 2" }}>
        <span className="account-kicker">USUÁRIO MASTER</span>
        <strong>Acesso total</strong>
        <ul><li>Editor completo de Shorts</li><li>Edições ilimitadas</li><li>Todos os recursos atuais e futuros</li></ul>
      </article> : <>
        <article className="account-card">
          <span className="account-kicker">CREATOR · 30 DIAS</span>
          <strong>R$ 19,90</strong>
          <ul><li>Editor completo de Shorts</li><li>Até 5 edições por dia</li><li>Até 150 edições por mês</li></ul>
          <PurchaseButton plan="creator">Comprar Creator</PurchaseButton>
        </article>

        <article className="account-card featured-plan">
          <span className="account-kicker">PRO · 30 DIAS</span>
          <strong>R$ 39,90</strong>
          <ul><li>Todos os recursos Creator</li><li>Prioridade em novos recursos</li><li>Histórico de pagamentos</li></ul>
          <PurchaseButton plan="pro">Comprar Pro</PurchaseButton>
        </article>
      </>}
    </section>

    <section className="account-card order-history">
      <div><span className="account-kicker">PAGAMENTOS</span><h2>Histórico</h2></div>
      {account.orders.length ? <div className="order-list">{account.orders.map(order => <div key={order.id}><span>{PLAN_LABELS[order.plan] || order.plan}</span><span>R$ {(order.amountCents / 100).toFixed(2).replace(".", ",")}</span><span className={`order-status ${order.status}`}>{order.status}</span></div>)}</div> : <p>Nenhum pagamento realizado ainda.</p>}
    </section>
  </main>;
}
