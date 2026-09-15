const FEATURES = [
  {
    number: "01",
    label: "CORTE INTELIGENTE",
    title: "Encontre os momentos que prendem atenção",
    text: "Envie o vídeo e gere sugestões de cortes a partir do ritmo, das pausas e dos picos de áudio.",
    meta: "Games · Podcasts · Vídeos longos"
  },
  {
    number: "02",
    label: "SHORTS VERTICAIS",
    title: "Transforme uma gravação em conteúdo para cada tela",
    text: "Monte em 9:16 para Shorts, Reels e TikTok ou mantenha 16:9 para YouTube.",
    meta: "Até 4 minutos por clipe"
  },
  {
    number: "03",
    label: "REENQUADRAMENTO",
    title: "Destaque gameplay, webcam ou duas pessoas",
    text: "Use layouts prontos para um recorte, game com webcam ou podcast dividido e ajuste cada enquadramento.",
    meta: "Composição visual ajustável"
  },
  {
    number: "04",
    label: "LEGENDAS AUTOMÁTICAS",
    title: "Transcreva do começo ao fim e revise tudo",
    text: "Gere legendas localmente, corrija palavras e tempos, escolha a posição e exporte também em SRT.",
    meta: "Processamento no navegador"
  },
  {
    number: "05",
    label: "PLANEJAMENTO",
    title: "Leve a ideia até a publicação",
    text: "Organize ideias, calendário editorial, checklist de produção, prioridades e progresso mensal.",
    meta: "Fluxo completo do canal"
  },
  {
    number: "06",
    label: "EXPORTAÇÃO",
    title: "Revise e baixe o resultado",
    text: "Ajuste os pontos de entrada e saída, confira a prévia e exporte o clipe final em WebM.",
    meta: "Sem enviar o vídeo para terceiros"
  }
];

const FLOW = [
  ["01", "Envie", "Escolha sua gravação de até 3 GB."],
  ["02", "Encontre", "Gere sugestões de momentos fortes."],
  ["03", "Personalize", "Ajuste formato, tela e legendas."],
  ["04", "Exporte", "Baixe o corte pronto para publicar."]
];

export const metadata = {
  title: "Conheça a ferramenta | Weezy Command Center",
  description: "Descubra como o Weezy Command Center transforma vídeos longos em cortes, Shorts e um fluxo de produção organizado."
};

export default function PresentationPage() {
  return (
    <main className="presentation-page">
      <header className="presentation-nav">
        <a className="brand" href="/" aria-label="Weezy Command Center">
          <span className="brand-mark">W</span>
          <span><strong>WEEZY</strong><small>COMMAND CENTER</small></span>
        </a>
        <nav aria-label="Navegação da apresentação">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#plano">Plano</a>
        </nav>
        <a className="presentation-login" href="/account">Entrar</a>
      </header>

      <section className="presentation-hero">
        <div className="presentation-hero-copy">
          <span className="presentation-eyebrow"><i /> CENTRAL DE CRIAÇÃO PARA VÍDEOS</span>
          <h1>Do vídeo bruto ao <em>Short pronto.</em></h1>
          <p>Encontre cortes, crie legendas e organize todo o fluxo do canal em uma única ferramenta feita para games, podcasts e criadores.</p>
          <div className="presentation-actions">
            <a className="primary" href="/#clipforge">Experimentar agora <span aria-hidden="true">→</span></a>
            <a className="presentation-secondary" href="#recursos">Ver tudo que ela faz</a>
          </div>
          <div className="presentation-trust">
            <span>✓ Processamento local</span>
            <span>✓ Teste gratuito</span>
            <span>✓ Conta protegida</span>
          </div>
        </div>

        <div className="presentation-stage" aria-label="Prévia visual do editor Weezy">
          <div className="stage-top"><span><i /> WEEZY CLIPFORGE</span><small>VÍDEO CARREGADO</small></div>
          <div className="stage-workspace">
            <div className="stage-video">
              <div className="stage-frame"><span>GAMEPLAY</span><strong>CLUTCH<br />INESPERADO</strong><b>00:42</b></div>
              <div className="stage-caption">EU NÃO ACREDITO QUE ISSO FUNCIONOU</div>
            </div>
            <div className="stage-controls">
              <span>FORMATO</span><strong>9:16 · SHORTS</strong>
              <span>LAYOUT</span><strong>GAME + WEBCAM</strong>
              <span>LEGENDAS</span><strong className="stage-on">ATIVADAS</strong>
              <button type="button">EXPORTAR CLIPE</button>
            </div>
          </div>
          <div className="stage-timeline"><span /><span /><span className="active" /><span /><span /></div>
          <div className="stage-score"><strong>94%</strong><span>POTENCIAL DO CORTE</span></div>
        </div>
      </section>

      <section className="presentation-proof" aria-label="Principais capacidades">
        <article><strong>3 GB</strong><span>por arquivo de entrada</span></article>
        <article><strong>4 min</strong><span>por clipe no plano pago</span></article>
        <article><strong>3 layouts</strong><span>game, podcast e recorte único</span></article>
        <article><strong>1 painel</strong><span>da ideia até a publicação</span></article>
      </section>

      <section className="presentation-section" id="recursos">
        <div className="presentation-heading">
          <span>RECURSOS</span>
          <h2>Tudo que seu conteúdo precisa para avançar.</h2>
          <p>Uma jornada direta, com menos ferramentas abertas e mais tempo para criar.</p>
        </div>
        <div className="presentation-feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.number}>
              <div><span>{feature.number}</span><small>{feature.label}</small></div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <strong>{feature.meta}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="presentation-section presentation-flow" id="como-funciona">
        <div className="presentation-heading">
          <span>COMO FUNCIONA</span>
          <h2>Quatro passos. Um vídeo pronto.</h2>
        </div>
        <div className="presentation-flow-grid">
          {FLOW.map(([number, title, text]) => (
            <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section className="presentation-plan" id="plano">
        <div>
          <span className="presentation-eyebrow"><i /> PLANO CREATOR</span>
          <h2>Crie mais por <em>R$ 19,90</em></h2>
          <p>Acesso à ferramenta completa por 30 dias, com limite equilibrado para manter seu canal em movimento.</p>
          <ul>
            <li><span>✓</span> Até 5 edições por dia</li>
            <li><span>✓</span> Até 150 edições por mês</li>
            <li><span>✓</span> Reenquadramento e legendas automáticas</li>
            <li><span>✓</span> Clipes de até 4 minutos</li>
          </ul>
        </div>
        <div className="presentation-plan-action">
          <small>CREATOR · 30 DIAS</small>
          <strong><sup>R$</sup> 19,90</strong>
          <span>Pagamento via Mercado Pago</span>
          <a className="primary" href="/account">Escolher Creator <span aria-hidden="true">→</span></a>
          <a href="/#clipforge">Testar grátis primeiro</a>
        </div>
      </section>

      <section className="presentation-final">
        <span>WEEZY COMMAND CENTER</span>
        <h2>Seu próximo corte pode começar agora.</h2>
        <p>Use o teste gratuito ou entre na sua conta para liberar a experiência completa.</p>
        <a className="primary" href="/#clipforge">Abrir a ferramenta <span aria-hidden="true">→</span></a>
      </section>

      <footer className="presentation-footer">
        <span>WEEZY COMMAND CENTER</span>
        <small>Criação, edição e planejamento em um só lugar.</small>
      </footer>
    </main>
  );
}
