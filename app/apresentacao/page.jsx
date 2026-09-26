import ScrollReveal from "./scroll-reveal";

const FEATURES = [
  { icon: "✦", label: "CORTE INTELIGENTE", title: "Encontre os momentos que prendem atenção", text: "Analise ritmo, pausas e picos de áudio para transformar vídeos longos em cortes com potencial.", meta: "Games · Podcasts · Vídeos longos" },
  { icon: "CC", label: "LEGENDAS PROFISSIONAIS", title: "Transcreva, revise e estilize cada palavra", text: "Gere legendas do começo ao fim, corrija a timeline e exporte também em SRT.", meta: "Até 3 GB · Processamento no navegador" },
  { icon: "⌗", label: "REENQUADRAMENTO", title: "Destaque gameplay, webcam ou duas pessoas", text: "Use layouts para 9:16, 16:9 e 1:1 com controle de enquadramento e composição.", meta: "Shorts · Reels · TikTok · YouTube" },
  { icon: "↓", label: "EXPORTAÇÃO", title: "Revise e baixe o corte pronto", text: "Ajuste entrada e saída, confira a prévia e exporte sem enviar o vídeo bruto a terceiros.", meta: "Fluxo local e privado" },
];

const FLOW = [
  ["ENVIE", "Escolha sua gravação de até 3 GB."],
  ["ANALISE", "Deixe a ferramenta encontrar os melhores momentos."],
  ["PERSONALIZE", "Ajuste formato, enquadramento e legendas."],
  ["PUBLIQUE", "Baixe o corte pronto para o seu canal."],
];

const DURATIONS = [
  { days: 30, creator: "R$ 19,90", pro: "R$ 39,90" },
  { days: 90, creator: "R$ 59,70", pro: "R$ 119,70" },
  { days: 180, creator: "R$ 119,40", pro: "R$ 239,40" },
  { days: 365, creator: "R$ 238,80", pro: "R$ 478,80" },
];

export const metadata = {
  title: "Editor de Shorts e Legendas | Weezy ClipForge",
  description: "Transforme vídeos em Shorts, Reels e TikToks com cortes inteligentes, reenquadramento e legendas automáticas.",
};

function Brand() {
  return <a className="brand" href="/" aria-label="Weezy ClipForge"><span className="brand-mark" /><span><strong>WEEZY</strong><small>CLIPFORGE</small></span></a>;
}

function PriceCard({ plan, subtitle, featured = false, children }) {
  const key = plan.toLowerCase();
  return <article className={`presentation-price-card ${featured ? "featured" : ""}`}>
    {featured && <span className="popular-pill">MAIS ESCOLHIDO</span>}
    <div className="plan-title"><span>{plan}</span><small>{subtitle}</small></div>
    <strong>{key === "creator" ? "R$ 19,90" : "R$ 39,90"}<small> / 30 dias</small></strong>
    <ul>{children}</ul>
    <div className="duration-table" aria-label={`Valores do plano ${plan}`}>
      {DURATIONS.map((item) => <div key={item.days}><span>{item.days} dias</span><b>{item[key]}</b></div>)}
    </div>
    <a className="primary" href="/account">Escolher {plan} <span aria-hidden="true">→</span></a>
  </article>;
}

export default function PresentationPage() {
  return <main className="presentation-page">
    <ScrollReveal />
    <header className="presentation-nav"><Brand /><nav aria-label="Navegação"><a href="#demonstracao">Demonstração</a><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#planos">Planos</a></nav><a className="presentation-login" href="/account">Entrar</a></header>

    <section className="presentation-hero">
      <div className="presentation-hero-copy">
        <span className="presentation-eyebrow"><i /> IA PARA CRIADORES</span>
        <h1>Seu vídeo longo vira <em>conteúdo que prende.</em></h1>
        <p>Cortes inteligentes, legendas profissionais e reenquadramento para transformar gameplay, podcast e live em Shorts prontos para publicar.</p>
        <div className="presentation-actions"><a className="primary" href="/#clipforge">Criar meu primeiro corte <span>→</span></a><a className="presentation-secondary" href="#planos">Conhecer os planos</a></div>
        <div className="presentation-trust"><span>✓ 2 vídeos grátis sem login</span><span>✓ Arquivos de até 3 GB</span><span>✓ Vídeo processado no navegador</span></div>
      </div>

      <div className="presentation-stage" aria-label="Prévia do editor Weezy ClipForge">
        <div className="stage-top"><span><i /> WEEZY CLIPFORGE</span><small>PROJETO EM ANÁLISE</small></div>
        <div className="stage-workspace"><div className="stage-video"><div className="stage-frame"><span>GAMEPLAY</span><strong>CLUTCH<br />INESPERADO</strong><b>00:42</b></div><div className="stage-caption">EU NÃO ACREDITO QUE ISSO FUNCIONOU</div></div><div className="stage-controls"><span>FORMATO</span><strong>9:16 · SHORTS</strong><span>LAYOUT</span><strong>GAME + WEBCAM</strong><span>LEGENDAS</span><strong className="stage-on">ATIVADAS</strong><button type="button">EXPORTAR CLIPE</button></div></div>
        <div className="stage-timeline"><span /><span /><span className="active" /><span /><span /></div><div className="stage-score"><strong>94%</strong><span>POTENCIAL DO CORTE</span></div>
      </div>
    </section>

    <section className="presentation-proof" aria-label="Principais capacidades"><article><strong>3 GB</strong><span>por vídeo enviado</span></article><article><strong>10 clipes</strong><span>no plano Pro</span></article><article><strong>8 min</strong><span>por clipe no Pro</span></article><article><strong>100% local</strong><span>mais privacidade</span></article></section>

    <section className="presentation-demo" id="demonstracao">
      <div className="presentation-demo-copy">
        <span className="presentation-eyebrow"><i /> VEJA EM AÇÃO</span>
        <h2>Do vídeo bruto ao corte pronto.</h2>
        <p>Assista a uma demonstração real da ferramenta: envio do vídeo, identificação dos melhores momentos, reenquadramento, legendas e preparação do conteúdo final.</p>
        <div className="demo-points"><span>✓ Fluxo completo</span><span>✓ Interface real</span><span>✓ Resultado pronto para publicar</span></div>
      </div>
      <div className="presentation-demo-player">
        <div className="demo-player-bar"><span><i /> DEMONSTRAÇÃO WEEZY</span><small>APERTE O PLAY</small></div>
        <video controls playsInline preload="metadata" poster="https://weezy.x-emulator.online/weezy-demo-poster.jpg">
          <source src="https://weezy.x-emulator.online/weezy-clipforge-demo.mp4" type="video/mp4" />
          Seu navegador não conseguiu reproduzir o vídeo de demonstração.
        </video>
      </div>
    </section>

    <section className="presentation-section" id="recursos"><div className="presentation-heading"><span>RECURSOS</span><h2>Do vídeo bruto ao corte profissional.</h2><p>Uma área de criação completa, rápida e desenhada para o fluxo de quem publica toda semana.</p></div><div className="presentation-feature-grid">{FEATURES.map((feature) => <article key={feature.label}><div><span className="feature-icon">{feature.icon}</span><small>{feature.label}</small></div><h3>{feature.title}</h3><p>{feature.text}</p><strong>{feature.meta}</strong></article>)}</div></section>

    <section className="presentation-section presentation-flow" id="como-funciona"><div className="presentation-heading"><span>COMO FUNCIONA</span><h2>Da gravação à publicação.</h2></div><div className="presentation-flow-grid">{FLOW.map(([title, text]) => <article key={title}><span>{title}</span><h3>{title === "ENVIE" ? "Escolha o vídeo" : title === "ANALISE" ? "Encontre os destaques" : title === "PERSONALIZE" ? "Dê sua identidade" : "Exporte o resultado"}</h3><p>{text}</p></article>)}</div></section>

    <section className="presentation-pricing" id="planos"><div className="presentation-heading"><span>PLANOS FLEXÍVEIS</span><h2>Escolha seu ritmo de criação.</h2><p>Licenças de 30, 90, 180 ou 365 dias. Quanto maior o período, mais tempo você cria sem interrupções.</p></div><div className="presentation-pricing-grid"><article className="presentation-price-card free"><div className="plan-title"><span>GRATUITO</span><small>Para conhecer</small></div><strong>R$ 0</strong><ul><li>2 vídeos por dia após o login</li><li>Até 3 cortes de demonstração</li><li>Clipes de até 1 minuto</li><li>2 vídeos sem login sem consumir limite</li></ul><a className="presentation-secondary" href="/#clipforge">Testar gratuitamente</a></article><PriceCard plan="Creator" subtitle="Para publicar com frequência" featured><li>Até 5 edições por dia</li><li>Até 150 edições por mês</li><li>Editor e legendas completos</li><li>Clipes de até 4 minutos</li></PriceCard><PriceCard plan="Pro" subtitle="Máxima liberdade"><li>Todos os recursos Creator</li><li>Edições sem limite</li><li>Até 10 clipes por projeto</li><li>Clipes de até 8 minutos</li></PriceCard></div></section>

    <section className="presentation-final"><span>WEEZY CLIPFORGE</span><h2>Seu próximo corte começa aqui.</h2><p>Teste grátis agora ou entre na sua conta para liberar o plano ideal.</p><a className="primary" href="/#clipforge">Abrir a ferramenta <span>→</span></a></section>
    <footer className="presentation-footer"><span>WEEZY CLIPFORGE</span><small>Cortes, legendas e criação em um só lugar.</small></footer>
  </main>;
}
