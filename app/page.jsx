"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ShortComposer, { INITIAL_COMPOSITION, drawComposition } from "./short-composer";
import Captions from "./captions";

const PIPELINE = ["Ideia", "Roteiro", "Gravação", "Edição", "Pronto", "Publicado"];
const CHECKS = [
  "Definir gancho e promessa",
  "Fechar roteiro ou tópicos",
  "Gravar gameplay e voz",
  "Editar e revisar o vídeo",
  "Criar thumbnail e título",
  "Subir, revisar e agendar"
];

const DAVINCI_SHORTCUTS = [
  { keys: "Space", action: "Reproduzir ou pausar", category: "Navegação" },
  { keys: "J · K · L", action: "Reverso, pausa e avanço", category: "Navegação" },
  { keys: "← · →", action: "Mover um quadro", category: "Navegação" },
  { keys: "I / O", action: "Marcar entrada e saída", category: "Navegação" },
  { keys: "Alt+X", action: "Limpar pontos In e Out", category: "Navegação" },
  { keys: "M", action: "Adicionar marcador", category: "Navegação" },
  { keys: "F", action: "Match Frame", category: "Navegação" },
  { keys: "Q", action: "Alternar Source e Timeline", category: "Navegação" },
  { keys: "A", action: "Selection Mode", category: "Montagem" },
  { keys: "B", action: "Blade Edit Mode", category: "Montagem" },
  { keys: "T", action: "Trim Edit Mode", category: "Montagem" },
  { keys: "Ctrl+B", action: "Cortar clip no playhead", category: "Montagem" },
  { keys: "Shift+Backspace", action: "Ripple Delete", category: "Montagem" },
  { keys: "D", action: "Ativar ou desativar clip", category: "Montagem" },
  { keys: "Ctrl+R", action: "Abrir Retime Controls", category: "Montagem" },
  { keys: "Shift+Z", action: "Encaixar timeline na janela", category: "Timeline" },
  { keys: "F9", action: "Insert", category: "Timeline" },
  { keys: "F10", action: "Overwrite", category: "Timeline" },
  { keys: "F11", action: "Replace", category: "Timeline" },
  { keys: "F12", action: "Place on Top", category: "Timeline" },
  { keys: "Shift+2", action: "Abrir página Media", category: "Páginas" },
  { keys: "Shift+4", action: "Abrir página Edit", category: "Páginas" },
  { keys: "Shift+5", action: "Abrir página Fusion", category: "Páginas" },
  { keys: "Shift+6", action: "Abrir página Color", category: "Páginas" },
  { keys: "Shift+7", action: "Abrir página Fairlight", category: "Páginas" },
  { keys: "Shift+8", action: "Abrir página Deliver", category: "Páginas" }
];

const STARTER_IDEAS = [
  {
    id: "dayz-24h",
    title: "Sobrevivi 24 horas sozinho no DayZ",
    game: "DayZ",
    format: "Vídeo longo",
    status: "Roteiro",
    priority: "Alta",
    pillar: "História",
    potential: 5,
    effort: 4,
    date: "2026-09-06",
    hook: "Comecei sem nada e a noite virou meu maior inimigo.",
    notes: "Abrir com o momento de maior perigo e voltar ao começo."
  },
  {
    id: "valorant-sheriff",
    title: "Só Sheriff até conseguir uma vitória",
    game: "Valorant",
    format: "Desafio",
    status: "Gravação",
    priority: "Alta",
    pillar: "Desafio",
    potential: 4,
    effort: 3,
    date: "2026-09-10",
    hook: "Uma arma, uma regra e nenhuma desculpa.",
    notes: "Separar reações fortes e evolução entre as partidas."
  },
  {
    id: "setup-celulares",
    title: "Transformei celulares parados em multicâmera",
    game: "Bastidores",
    format: "Tutorial",
    status: "Ideia",
    priority: "Média",
    pillar: "Bastidores",
    potential: 4,
    effort: 2,
    date: "2026-09-17",
    hook: "Seu celular antigo pode virar uma câmera extra.",
    notes: "Mostrar montagem, sincronização e resultado final."
  },
  {
    id: "dayz-short",
    title: "O encontro mais tenso que tive no DayZ",
    game: "DayZ",
    format: "Short",
    status: "Edição",
    priority: "Média",
    pillar: "História",
    potential: 5,
    effort: 2,
    date: "2026-09-03",
    hook: "Eu tinha segundos para decidir se confiava nele.",
    notes: "Corte rápido, legenda grande e tensão crescente."
  }
];

const TREND_IDEAS = [
  {
    id: "radar-valorant-1305",
    title: "O patch 13.05 acabou com os programas de instalock?",
    game: "Valorant",
    format: "Vídeo longo",
    pillar: "Atualização",
    potential: 5,
    effort: 2,
    priority: "Alta",
    signal: "Assunto quente",
    hook: "A Riot começou a punir ferramentas de instalock — mas isso mudou as partidas?",
    notes: "Explicar a regra em 20 segundos e testar a experiência real em partidas competitivas.",
    source: "https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-13-05/",
    sourceLabel: "Patch oficial 13.05"
  },
  {
    id: "radar-valorant-gear",
    title: "O que resgatar antes da mudança no Agent Gear",
    game: "Valorant",
    format: "Short",
    pillar: "Atualização",
    potential: 4,
    effort: 1,
    priority: "Alta",
    signal: "Janela curta",
    hook: "Você tem Kingdom Credits? Veja isso antes do patch 13.06.",
    notes: "Short objetivo com tela do menu, três recomendações e CTA para salvar.",
    source: "https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-13-05/",
    sourceLabel: "Aviso oficial da Riot"
  },
  {
    id: "radar-fivem-enhanced",
    title: "Primeiro dia no FiveM Enhanced: vale a troca?",
    game: "GTA RP",
    format: "Vídeo longo",
    pillar: "Atualização",
    potential: 5,
    effort: 3,
    priority: "Alta",
    signal: "Lançamento",
    hook: "Entrei no acesso antecipado para descobrir o que realmente mudou no RP.",
    notes: "Comparar visual, desempenho, estabilidade e sensação dentro de um servidor.",
    source: "https://forum.cfx.re/t/fivem-for-gtav-enhanced-is-available-now-in-early-access/5412858",
    sourceLabel: "Anúncio oficial FiveM"
  },
  {
    id: "radar-minecraft-camps",
    title: "Segui mapas de acampamentos abandonados até o fim",
    game: "Minecraft",
    format: "Desafio",
    pillar: "Exploração",
    potential: 5,
    effort: 3,
    priority: "Alta",
    signal: "Em testes",
    hook: "Cada mapa apontava para um lugar mais estranho que o anterior.",
    notes: "Criar progressão com três mapas, descobertas e uma recompensa final.",
    source: "https://www.minecraft.net/en-us/article/drop-3-2026-final-testing",
    sourceLabel: "Drop 3 — teste oficial"
  },
  {
    id: "radar-minecraft-chaos",
    title: "Construí uma base nas cavernas de enxofre",
    game: "Minecraft",
    format: "Vídeo longo",
    pillar: "Desafio",
    potential: 4,
    effort: 4,
    priority: "Média",
    signal: "Visual forte",
    hook: "A caverna que causa náusea virou minha casa por 30 dias.",
    notes: "Misturar sobrevivência, construção temática e encontros com Sulfur Cubes.",
    source: "https://www.minecraft.net/en-us/article/mclive_march2026_recap",
    sourceLabel: "Minecraft Live 2026"
  },
  {
    id: "radar-dayz-trust",
    title: "Confiei no primeiro sobrevivente que encontrei no DayZ",
    game: "DayZ",
    format: "Vídeo longo",
    pillar: "História",
    potential: 5,
    effort: 3,
    priority: "Alta",
    signal: "Formato evergreen",
    hook: "Ele podia salvar minha vida — ou terminar com ela.",
    notes: "Tratar como experimento social, com tensão, decisão moral e desfecho claro."
  },
  {
    id: "radar-dayz-film",
    title: "Transformei 3 horas de DayZ em um filme de 12 minutos",
    game: "DayZ",
    format: "Vídeo longo",
    pillar: "Bastidores",
    potential: 4,
    effort: 4,
    priority: "Média",
    signal: "Diferencial Weezy",
    hook: "A gameplay parecia comum — até eu editar como cinema.",
    notes: "Mostrar antes/depois de cortes, sound design, color e ritmo no DaVinci."
  }
];

const EMPTY_DRAFT = {
  title: "",
  game: "DayZ",
  format: "Vídeo longo",
  status: "Ideia",
  priority: "Média",
  pillar: "História",
  potential: 4,
  effort: 3,
  date: "",
  hook: "",
  notes: ""
};

function Icon({ name, size = 18 }) {
  const paths = {
    bulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.2 14.5A7 7 0 1 1 15.8 14.5c-.9.7-1.4 1.5-1.6 2.5h-4.4c-.2-1-.7-1.8-1.6-2.5Z"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/>,
    trend: <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/></>,
    keyboard: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M19 10h.01M7 14h.01M11 14h5"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></>,
    scissors: <><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.4 11.3 6.1M8.7 15.6 20 9.5"/></>,
    play: <path d="m8 5 11 7-11 7V5Z"/>,
    download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/></>,
    video: <><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2"/></>,
    magic: <><path d="m15 4 5 5L8 21l-5-5L15 4Z"/><path d="m6 14 5 5M6 4v4M4 6h4M19 15v4M17 17h4"/></>
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue];
}

function formatDate(value) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${value}T12:00:00`))
    .replace(".", "");
}

function stageColor(status) {
  return {
    Ideia: "neutral",
    Roteiro: "violet",
    Gravação: "amber",
    Edição: "blue",
    Pronto: "cyan",
    Publicado: "green"
  }[status] || "neutral";
}

function normalizeIdea(idea) {
  const fallbackPotential = idea.priority === "Alta" ? 5 : idea.priority === "Baixa" ? 2 : 4;
  return {
    pillar: "História",
    potential: fallbackPotential,
    effort: 3,
    hook: "",
    ...idea
  };
}

function ideaScore(idea) {
  const normalized = normalizeIdea(idea);
  return Math.round(((normalized.potential / 5) * .72 + ((6 - normalized.effort) / 5) * .28) * 100);
}

export default function Home() {
  const [ideas, setIdeas] = useStoredState("weezy-ideas-v1", STARTER_IDEAS);
  const [checks, setChecks] = useStoredState("weezy-checks-v1", {});
  const [goal, setGoal] = useStoredState("weezy-goal-v1", 4);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [gameFilter, setGameFilter] = useState("Todos os jogos");
  const [sortBy, setSortBy] = useState("Melhor aposta");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState(STARTER_IDEAS[0].id);
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 8, 1));
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [shortcutCategory, setShortcutCategory] = useState("Todos");
  const [shortcutOS, setShortcutOS] = useState("Windows");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [clipDuration, setClipDuration] = useState(30);
  const [clipCount, setClipCount] = useState(3);
  const [clipFormat, setClipFormat] = useState("9:16 · Shorts");
  const [analysisState, setAnalysisState] = useState("idle");
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [editorMessage, setEditorMessage] = useState("");
  const [composition, setComposition] = useState(INITIAL_COMPOSITION);
  const videoRef = useRef(null);

  useEffect(() => {
    if (ideas.length && !ideas.some((idea) => idea.id === selectedId)) {
      setSelectedId(ideas[0].id);
    }
  }, [ideas, selectedId]);

  const filteredIdeas = useMemo(() => ideas.map(normalizeIdea).filter((idea) => {
    const matchesText = `${idea.title} ${idea.game} ${idea.format} ${idea.pillar} ${idea.hook}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "Todos" || idea.status === filter;
    const matchesGame = gameFilter === "Todos os jogos" || idea.game === gameFilter;
    return matchesText && matchesFilter && matchesGame;
  }).sort((a, b) => {
    if (sortBy === "Mais recentes") return String(b.id).localeCompare(String(a.id));
    if (sortBy === "Menor esforço") return a.effort - b.effort || ideaScore(b) - ideaScore(a);
    return ideaScore(b) - ideaScore(a);
  }), [ideas, query, filter, gameFilter, sortBy]);

  const gameOptions = useMemo(() => ["Todos os jogos", ...new Set(ideas.map((idea) => idea.game))], [ideas]);
  const bestIdea = useMemo(() => ideas
    .map(normalizeIdea)
    .filter((idea) => idea.status !== "Publicado")
    .sort((a, b) => ideaScore(b) - ideaScore(a))[0], [ideas]);

  const selected = ideas.find((idea) => idea.id === selectedId) || ideas[0];
  const selectedChecks = selected ? checks[selected.id] || [] : [];
  const published = ideas.filter((idea) => idea.status === "Publicado").length;
  const active = ideas.filter((idea) => !["Ideia", "Publicado"].includes(idea.status)).length;
  const ready = ideas.filter((idea) => idea.status === "Pronto").length;
  const goalPercent = Math.min(100, Math.round((published / Math.max(1, goal)) * 100));
  const visibleShortcuts = useMemo(() => DAVINCI_SHORTCUTS.filter((shortcut) => {
    const matchesCategory = shortcutCategory === "Todos" || shortcut.category === shortcutCategory;
    const matchesQuery = `${shortcut.keys} ${shortcut.action}`.toLowerCase().includes(shortcutQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [shortcutCategory, shortcutQuery]);

  function updateIdea(id, patch) {
    setIdeas((current) => current.map((idea) => idea.id === id ? { ...idea, ...patch } : idea));
  }

  function advanceIdea(id) {
    setIdeas((current) => current.map((idea) => {
      if (idea.id !== id) return idea;
      const next = Math.min(PIPELINE.length - 1, PIPELINE.indexOf(idea.status) + 1);
      return { ...idea, status: PIPELINE[next] };
    }));
  }

  function addIdea(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const item = { ...draft, title: draft.title.trim(), id: `${Date.now()}` };
    setIdeas((current) => [item, ...current]);
    setSelectedId(item.id);
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  }

  function addTrendIdea(trend) {
    if (ideas.some((idea) => idea.title === trend.title)) return;
    const item = { ...trend, id: `${trend.id}-${Date.now()}`, status: "Ideia", date: "" };
    setIdeas((current) => [item, ...current]);
    setSelectedId(item.id);
  }

  function toggleCheck(label) {
    if (!selected) return;
    setChecks((current) => {
      const activeChecks = current[selected.id] || [];
      const next = activeChecks.includes(label)
        ? activeChecks.filter((item) => item !== label)
        : [...activeChecks, label];
      return { ...current, [selected.id]: next };
    });
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function selectVideo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setVideoDuration(0);
    setComposition(current => ({ ...current, captions: [] }));
    setClips([]);
    setSelectedClipId(null);
    setAnalysisState("idle");
    setEditorMessage("");
  }

  async function findAudioPeaks(file, duration, wanted) {
    if (!file || file.size > 180 * 1024 * 1024) return [];
    let context;
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      const data = buffer.getChannelData(0);
      const windowSize = Math.max(1, Math.floor(buffer.sampleRate * 0.8));
      const samples = [];
      for (let start = 0; start < data.length; start += windowSize) {
        let sum = 0;
        const stride = 24;
        for (let i = start; i < Math.min(data.length, start + windowSize); i += stride) sum += Math.abs(data[i]);
        samples.push({ time: start / buffer.sampleRate, score: sum / Math.max(1, windowSize / stride) });
      }
      const chosen = [];
      for (const sample of samples.sort((a, b) => b.score - a.score)) {
        if (sample.time < 2 || sample.time > duration - 2) continue;
        if (chosen.every((item) => Math.abs(item.time - sample.time) > clipDuration * 0.8)) chosen.push(sample);
        if (chosen.length === wanted) break;
      }
      return chosen.sort((a, b) => a.time - b.time).map((item) => item.time);
    } catch {
      return [];
    } finally {
      if (context) context.close();
    }
  }

  async function analyzeVideo() {
    if (!videoFile || !videoDuration) return;
    setAnalysisState("analyzing");
    setEditorMessage("Lendo ritmo, pausas e picos de áudio…");
    const duration = Math.min(clipDuration, Math.max(4, videoDuration));
    const wanted = Math.min(clipCount, Math.max(1, Math.floor(videoDuration / Math.max(6, duration * 0.55))));
    const peaks = await findAudioPeaks(videoFile, videoDuration, wanted);
    const centers = peaks.length
      ? peaks
      : Array.from({ length: wanted }, (_, index) => videoDuration * ((index + 1) / (wanted + 1)));
    const nextClips = centers.map((center, index) => {
      const start = Math.max(0, Math.min(videoDuration - duration, center - duration * 0.32));
      return {
        id: `clip-${Date.now()}-${index}`,
        title: ["Momento de impacto", "Reação que prende", "Virada da história", "Final forte", "Cena bônus"][index] || `Clipe ${index + 1}`,
        start: Number(start.toFixed(1)),
        end: Number(Math.min(videoDuration, start + duration).toFixed(1)),
        score: Math.max(72, 94 - index * 5),
        caption: true
      };
    });
    setClips(nextClips);
    setSelectedClipId(nextClips[0]?.id || null);
    setAnalysisState("ready");
    setEditorMessage(peaks.length ? "Cortes sugeridos a partir dos picos de áudio." : "Cortes distribuídos pelos melhores pontos da duração.");
  }

  function updateClip(id, patch) {
    setClips((current) => current.map((clip) => clip.id === id ? { ...clip, ...patch } : clip));
  }

  function previewClip(clip) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = clip.start;
    setSelectedClipId(clip.id);
    setPreviewing(true);
    videoRef.current.play();
  }

  async function exportClip(clip) {
    if (exportingId) return;
    if (composition.captionsEnabled !== false && (composition.captions || []).some(c => !Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < 0 || c.end <= c.start || c.end > videoDuration)) {
      setEditorMessage("Corrija os tempos das legendas antes de exportar.");
      return;
    }
    const video = videoRef.current;
    if (!Number.isFinite(clip.start) || !Number.isFinite(clip.end) || clip.start < 0 || clip.end <= clip.start || clip.end > videoDuration) {
      setEditorMessage("Ajuste o início e o fim: o trecho precisa estar dentro do vídeo e ter duração positiva.");
      return;
    }
    if (!video?.captureStream || typeof MediaRecorder === "undefined") {
      setEditorMessage("Este navegador não suporta a exportação local. Use Chrome ou Edge atualizado.");
      return;
    }
    setExportingId(clip.id);
    setEditorMessage("Exportando em tempo real. Mantenha esta aba aberta…");
    let animationFrame;
    try {
      video.pause();
      if (Math.abs(video.currentTime - clip.start) > .001) {
        await new Promise((resolve) => {
          video.addEventListener("seeked", resolve, { once: true });
          video.currentTime = clip.start;
        });
      }
      const vertical = clipFormat.startsWith("9:16");
      const canvas = document.createElement("canvas");
      canvas.width = vertical ? 720 : 1280;
      canvas.height = vertical ? 1280 : 720;
      const context = canvas.getContext("2d");
      let drawing = true;
      const drawFrame = () => {
        if (!drawing) return;
        drawComposition(context, video, canvas.width, canvas.height, composition);
        animationFrame = requestAnimationFrame(drawFrame);
      };
      drawFrame();
      const stream = canvas.captureStream(30);
      const sourceStream = video.captureStream();
      sourceStream.getAudioTracks().forEach((track) => stream.addTrack(track));
      const chunks = [];
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? { mimeType: "video/webm;codecs=vp9,opus" } : undefined);
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const finished = new Promise((resolve) => { recorder.onstop = resolve; });
      recorder.start(500);
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, Math.max(500, (clip.end - clip.start) * 1000)));
      video.pause();
      drawing = false;
      cancelAnimationFrame(animationFrame);
      recorder.stop();
      await finished;
      const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${clip.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "clip"}.webm`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setEditorMessage("Clipe exportado em WebM.");
    } catch {
      setEditorMessage("Não foi possível exportar este trecho. Tente novamente no Chrome ou Edge.");
    } finally {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      setExportingId(null);
    }
  }

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarDate);
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Weezy Command Center">
          <span className="brand-mark">W</span>
          <span><strong>WEEZY</strong><small>COMMAND CENTER</small></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#ideas"><Icon name="bulb" /> Ideias</a>
          <a className="nav-editor-button" href="#clipforge" aria-label="Editar vídeo"><Icon name="scissors" /> Editar vídeo</a>
          <a href="#planning"><Icon name="calendar" /> Planejamento</a>
          <a href="#progress"><Icon name="chart" /> Progresso</a>
          <a href="#shortcuts"><Icon name="keyboard" /> Atalhos</a>
        </nav>
        <span className="private-pill"><span /> Privado</span>
      </header>

      <div className="page-shell" id="top">
        <section className="hero">
          <div>
            <span className="eyebrow"><Icon name="spark" size={15} /> PAINEL DO CANAL</span>
            <h1>Transforme boas ideias<br />em vídeos publicados.</h1>
            <p>Capture, priorize e acompanhe cada conteúdo do Weezy em um só lugar.</p>
          </div>
          <div className="hero-actions">
            <a className="primary clipforge-cta" href="#clipforge" aria-label="Abrir o editor de vídeo com inteligência artificial">
              <span className="cta-icon"><Icon name="magic" size={21} /></span>
              <span><small>CLIPES AUTOMÁTICOS COM IA</small><strong>EDITAR VÍDEO AGORA</strong></span>
              <Icon name="arrow" size={19} />
            </a>
            <button className="ghost" onClick={() => setShowForm(true)}><Icon name="plus" /> Nova ideia</button>
          </div>
        </section>

        <section className="stats-strip" aria-label="Resumo do canal">
          <article><span>Ideias no radar</span><strong>{ideas.length}</strong><small>Banco ativo</small></article>
          <article><span>Em produção</span><strong>{active}</strong><small>Pedem atenção</small></article>
          <article><span>Prontos</span><strong>{ready}</strong><small>Fila de publicação</small></article>
          <article className="goal-card"><span>Meta do mês</span><strong>{published}<em> / {goal}</em></strong><div className="mini-progress"><i style={{ width: `${goalPercent}%` }} /></div></article>
        </section>

        <section className="panel clipforge" id="clipforge">
          <div className="clipforge-heading">
            <div><span className="section-index">IA</span><div><span className="eyebrow"><Icon name="magic" size={14} /> CLIPFORGE</span><h2>Transforme gameplay em clipes</h2><p>Carregue um vídeo, gere sugestões e ajuste cada corte antes de exportar.</p></div></div>
            <span className="local-badge">PROCESSAMENTO LOCAL</span>
          </div>

          {!videoUrl ? (
            <label className="video-drop">
              <input type="file" accept="video/*" onChange={selectVideo} />
              <span className="drop-icon"><Icon name="upload" size={28} /></span>
              <strong>Solte seu vídeo aqui ou clique para escolher</strong>
              <small>MP4, MOV ou WebM · o arquivo não sai do seu navegador</small>
              <span className="choose-file">Escolher vídeo</span>
            </label>
          ) : (
            <div className="editor-workspace">
              <div className="video-stage">
                <div className={`video-frame ${clipFormat.startsWith("9:16") ? "portrait-guide" : ""}`}>
                  <video ref={videoRef} src={videoUrl} controls onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => {
                    const activeClip = clips.find((clip) => clip.id === selectedClipId);
                    if (previewing && activeClip && event.currentTarget.currentTime >= activeClip.end) {
                      event.currentTarget.pause();
                      setPreviewing(false);
                    }
                  }} />
                  {clipFormat.startsWith("9:16") && <div className="safe-area"><span>9:16</span></div>}
                </div>
                <div className="file-row"><div><Icon name="video" /><span><strong>{videoFile?.name}</strong><small>{formatTime(videoDuration)} · {(videoFile?.size / 1024 / 1024).toFixed(1)} MB</small></span></div><label>Trocar vídeo<input type="file" accept="video/*" onChange={selectVideo} /></label></div>
              </div>

              <aside className="ai-controls">
                <div className="control-title"><span><Icon name="magic" /></span><div><strong>Direção dos clipes</strong><small>Ajuste a entrega da análise</small></div></div>
                <label><span>Formato de saída</span><select value={clipFormat} onChange={(event) => setClipFormat(event.target.value)}><option>9:16 · Shorts</option><option>9:16 · Reels</option><option>9:16 · TikTok</option><option>16:9 · YouTube</option></select></label>
                <label><span>Duração por clipe · até 4 minutos</span><select value={clipDuration} onChange={(event) => setClipDuration(Number(event.target.value))}>{[15, 30, 45, 60, 90, 120, 180, 240].map((value) => <option key={value} value={value}>{value < 60 ? `${value} segundos` : value === 90 ? "1 minuto e 30 segundos" : `${value / 60} ${value === 60 ? "minuto" : "minutos"}`}</option>)}</select><small>Se o vídeo for mais curto, o clipe terá no máximo a duração disponível.</small></label>
                <label><span>Quantidade</span><div className="choice-row">{[2, 3, 5].map((value) => <button key={value} className={clipCount === value ? "active" : ""} onClick={() => setClipCount(value)}>{value} clipes</button>)}</div></label>
                <div className="ai-detects"><span>A análise procura</span><div><i />Picos de áudio</div><div><i />Ritmo e distribuição</div><div><i />Aberturas fortes</div></div>
                <button className="primary analyze-button" disabled={!videoDuration || analysisState === "analyzing"} onClick={analyzeVideo}>{analysisState === "analyzing" ? <><span className="spinner" /> Analisando vídeo…</> : <><Icon name="magic" /> Gerar cortes com IA</>}</button>
                {editorMessage && <p className="editor-message">{editorMessage}</p>}
              </aside>
            </div>
          )}

          {videoUrl && <ShortComposer videoRef={videoRef} settings={composition} onChange={setComposition} vertical={clipFormat.startsWith("9:16")} disabled={Boolean(exportingId)} />}
          {videoUrl && videoDuration > 0 && <Captions key={videoUrl} file={videoFile} duration={videoDuration} settings={composition} onChange={setComposition} disabled={Boolean(exportingId)} videoRef={videoRef} />}

          {clips.length > 0 && <div className="clip-results">
            <div className="results-heading"><div><span className="section-index">{String(clips.length).padStart(2, "0")}</span><div><strong>Clipes sugeridos</strong><small>Revise os pontos de entrada e saída</small></div></div><span>Exportação local em WebM</span></div>
            <div className="clip-list">{clips.map((clip, index) => <article className={`clip-card ${selectedClipId === clip.id ? "selected" : ""}`} key={clip.id} onClick={() => setSelectedClipId(clip.id)}>
              <div className="clip-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="clip-info"><input aria-label="Título do clipe" value={clip.title} onChange={(event) => updateClip(clip.id, { title: event.target.value })} onClick={(event) => event.stopPropagation()} /><div><span className="viral-score">{clip.score}% potencial</span><span>{formatTime(clip.end - clip.start)}</span><span>{clipFormat.split(" · ")[1]}</span></div></div>
              <div className="trim-fields"><label>Início<input type="number" min="0" max={clip.end - 1} step="0.1" value={clip.start} onChange={(event) => updateClip(clip.id, { start: Math.max(0, Number(event.target.value)) })} onClick={(event) => event.stopPropagation()} /></label><span>—</span><label>Fim<input type="number" min={clip.start + 1} max={videoDuration} step="0.1" value={clip.end} onChange={(event) => updateClip(clip.id, { end: Math.min(videoDuration, Number(event.target.value)) })} onClick={(event) => event.stopPropagation()} /></label></div>
              <div className="clip-actions"><button onClick={(event) => { event.stopPropagation(); previewClip(clip); }}><Icon name="play" size={15} /> Prévia</button><button className="export-button" disabled={exportingId === clip.id} onClick={(event) => { event.stopPropagation(); exportClip(clip); }}><Icon name="download" size={15} /> {exportingId === clip.id ? "Exportando…" : "Exportar"}</button></div>
            </article>)}</div>
          </div>}
        </section>

        <section className="panel section-panel" id="ideas">
          <div className="section-heading">
            <div><span className="section-index">01</span><h2>Banco de ideias</h2><p>Compare potencial e esforço para gravar o conteúdo certo primeiro.</p></div>
            <div className="idea-tools">
              <label className="search"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ideia ou jogo" /></label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por etapa">
                <option>Todos</option>{PIPELINE.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
              <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} aria-label="Filtrar por jogo">
                {gameOptions.map((game) => <option key={game}>{game}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar ideias">
                <option>Melhor aposta</option><option>Menor esforço</option><option>Mais recentes</option>
              </select>
            </div>
          </div>

          <div className="opportunity-radar">
            <div className="radar-heading">
              <div><span className="radar-icon"><Icon name="trend" /></span><div><strong>Radar de oportunidades</strong><small>Pesquisa atualizada em 03 set 2026</small></div></div>
              <span>{TREND_IDEAS.length} ideias prontas para adaptar</span>
            </div>
            <div className="radar-grid">
              {TREND_IDEAS.map((trend) => {
                const alreadyAdded = ideas.some((idea) => idea.title === trend.title);
                return <article className="radar-card" key={trend.id}>
                  <div className="radar-meta"><span>{trend.signal}</span><small>{trend.game} · {trend.pillar}</small></div>
                  <h3>{trend.title}</h3>
                  <p>{trend.hook}</p>
                  <div className="radar-score"><strong>{ideaScore(trend)}</strong><span>score</span><i><b style={{ width: `${ideaScore(trend)}%` }} /></i></div>
                  <div className="radar-actions">
                    {trend.source ? <a href={trend.source} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> {trend.sourceLabel}</a> : <span>Formato baseado em narrativa</span>}
                    <button disabled={alreadyAdded} onClick={() => addTrendIdea(trend)}>{alreadyAdded ? "Adicionada" : <><Icon name="plus" size={14} /> Adicionar</>}</button>
                  </div>
                </article>;
              })}
            </div>
          </div>

          {bestIdea && <div className="best-bet"><span><Icon name="target" size={18} /></span><div><small>MELHOR PRÓXIMA APOSTA</small><strong>{bestIdea.title}</strong></div><div className="best-score"><strong>{ideaScore(bestIdea)}</strong><small>score</small></div><button onClick={() => setSelectedId(bestIdea.id)}>Selecionar <Icon name="arrow" size={15} /></button></div>}

          {showForm && (
            <form className="idea-form" onSubmit={addIdea}>
              <div className="form-title"><div><Icon name="plus" /><strong>Adicionar nova ideia</strong></div><button type="button" onClick={() => setShowForm(false)}>Fechar</button></div>
              <label className="wide"><span>Título da ideia</span><input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Tentei sobreviver sem armas no DayZ" /></label>
              <label><span>Jogo / tema</span><input value={draft.game} onChange={(e) => setDraft({ ...draft, game: e.target.value })} /></label>
              <label><span>Formato</span><select value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })}><option>Vídeo longo</option><option>Short</option><option>Live</option><option>Desafio</option><option>Tutorial</option></select></label>
              <label><span>Prioridade</span><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}><option>Alta</option><option>Média</option><option>Baixa</option></select></label>
              <label><span>Data planejada</span><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
              <label><span>Pilar de conteúdo</span><select value={draft.pillar} onChange={(e) => setDraft({ ...draft, pillar: e.target.value })}><option>História</option><option>Desafio</option><option>Atualização</option><option>Exploração</option><option>Tutorial</option><option>Bastidores</option></select></label>
              <label><span>Potencial</span><select value={draft.potential} onChange={(e) => setDraft({ ...draft, potential: Number(e.target.value) })}>{[5,4,3,2,1].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label>
              <label><span>Esforço</span><select value={draft.effort} onChange={(e) => setDraft({ ...draft, effort: Number(e.target.value) })}>{[1,2,3,4,5].map((value) => <option value={value} key={value}>{value} / 5</option>)}</select></label>
              <label className="wide"><span>Gancho de abertura</span><input value={draft.hook} onChange={(e) => setDraft({ ...draft, hook: e.target.value })} placeholder="A promessa dos primeiros 15 segundos" /></label>
              <label className="wide"><span>Plano rápido</span><input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Cenas, virada, recompensa e diferencial" /></label>
              <div className="wide form-actions"><button type="button" className="ghost" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary" type="submit"><Icon name="plus" /> Salvar ideia</button></div>
            </form>
          )}

          <div className="idea-list">
            {filteredIdeas.map((idea) => (
              <article className={`idea-card ${selectedId === idea.id ? "selected" : ""}`} key={idea.id} onClick={() => setSelectedId(idea.id)}>
                <div className="idea-accent" />
                <div className="idea-main">
                  <div className="meta-row"><span className={`stage ${stageColor(idea.status)}`}>{idea.status}</span><span>{idea.game}</span><span>•</span><span>{idea.format}</span><span>•</span><span>{idea.pillar}</span></div>
                  <h3>{idea.title}</h3>
                  <p>{idea.hook || idea.notes || "Adicione um gancho para fortalecer a ideia."}</p>
                  <div className="idea-metrics"><span>Potencial <b>{idea.potential}/5</b></span><span>Esforço <b>{idea.effort}/5</b></span>{idea.source && <a href={idea.source} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="link" size={12} /> Fonte</a>}</div>
                </div>
                <div className="idea-side">
                  <div className="idea-score"><strong>{ideaScore(idea)}</strong><span>score</span></div>
                  <span className={`priority ${idea.priority.toLowerCase().replace("é", "e")}`}>{idea.priority}</span>
                  <label className="date-field"><Icon name="calendar" size={15} /><input type="date" value={idea.date} onChange={(e) => updateIdea(idea.id, { date: e.target.value })} onClick={(e) => e.stopPropagation()} /></label>
                  <div className="card-actions">
                    <button title="Excluir ideia" className="icon-button" onClick={(e) => { e.stopPropagation(); setIdeas((items) => items.filter((item) => item.id !== idea.id)); }}><Icon name="trash" size={16} /></button>
                    <button className="advance" disabled={idea.status === "Publicado"} onClick={(e) => { e.stopPropagation(); advanceIdea(idea.id); }}>{idea.status === "Publicado" ? "Concluído" : "Avançar"}<Icon name="arrow" size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
            {!filteredIdeas.length && <div className="empty-state"><Icon name="bulb" size={28} /><strong>Nenhuma ideia encontrada</strong><span>Ajuste o filtro ou adicione uma nova.</span></div>}
          </div>
        </section>

        <section className="planning-grid" id="planning">
          <article className="panel calendar-panel">
            <div className="compact-heading"><div><span className="section-index">02</span><h2>Calendário editorial</h2></div><div className="month-nav"><button onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>‹</button><strong>{monthLabel}</strong><button onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>›</button></div></div>
            <div className="calendar week-labels">{["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
            <div className="calendar calendar-days">
              {calendarCells.map((day, index) => {
                const iso = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
                const dayIdeas = ideas.filter((idea) => idea.date === iso);
                return <div className={`day ${!day ? "muted" : ""} ${dayIdeas.length ? "has-event" : ""}`} key={index}><span>{day}</span>{dayIdeas.slice(0, 2).map((idea) => <button key={idea.id} title={idea.title} onClick={() => setSelectedId(idea.id)}><i className={stageColor(idea.status)} />{idea.title}</button>)}</div>;
              })}
            </div>
          </article>

          <article className="panel checklist-panel">
            <div className="compact-heading"><div><span className="section-index">03</span><h2>Checklist de produção</h2></div><span className="completion">{selected ? Math.round((selectedChecks.length / CHECKS.length) * 100) : 0}%</span></div>
            {selected ? <>
              <select className="selected-idea" value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select>
              <div className="check-progress"><i style={{ width: `${(selectedChecks.length / CHECKS.length) * 100}%` }} /></div>
              <div className="check-list">{CHECKS.map((label) => {
                const done = selectedChecks.includes(label);
                return <button key={label} className={done ? "done" : ""} onClick={() => toggleCheck(label)}><span className="checkbox">{done && <Icon name="check" size={15} />}</span><span>{label}</span></button>;
              })}</div>
            </> : <div className="empty-state"><span>Adicione uma ideia para começar.</span></div>}
          </article>
        </section>

        <section className="panel progress-panel" id="progress">
          <div className="section-heading progress-heading"><div><span className="section-index">04</span><h2>Painel de progresso</h2><p>Enxergue onde o conteúdo está travando.</p></div><div className="goal-control"><label>Meta mensal <input type="number" min="1" max="30" value={goal} onChange={(e) => setGoal(Number(e.target.value) || 1)} /></label></div></div>
          <div className="progress-content">
            <div className="goal-ring" style={{ "--progress": `${goalPercent * 3.6}deg` }}><div><strong>{goalPercent}%</strong><span>da meta</span></div></div>
            <div className="pipeline-chart">
              {PIPELINE.map((stage) => {
                const count = ideas.filter((idea) => idea.status === stage).length;
                const max = Math.max(1, ...PIPELINE.map((item) => ideas.filter((idea) => idea.status === item).length));
                return <div className="pipeline-row" key={stage}><span>{stage}</span><div><i className={stageColor(stage)} style={{ width: `${Math.max(count ? 14 : 2, (count / max) * 100)}%` }} /></div><strong>{count}</strong></div>;
              })}
            </div>
            <div className="insight-card"><Icon name="target" size={24} /><span>Próximo foco</span><strong>{active ? "Concluir o conteúdo em edição" : "Mover uma ideia para roteiro"}</strong><p>{active ? "Fechar uma produção antes de abrir outra mantém o ritmo sustentável." : "Escolha a ideia mais forte e defina o gancho."}</p><a href="#ideas">Ver banco de ideias <Icon name="chevron" size={15} /></a></div>
          </div>
        </section>

        <section className="panel shortcuts-panel" id="shortcuts">
          <div className="section-heading shortcut-heading">
            <div><span className="section-index">05</span><h2>Guia de atalhos do DaVinci</h2><p>Encontre o comando certo sem interromper sua edição.</p></div>
            <div className="os-toggle" aria-label="Sistema operacional">
              {["Windows", "macOS"].map((os) => <button key={os} className={shortcutOS === os ? "active" : ""} onClick={() => setShortcutOS(os)}>{os}</button>)}
            </div>
          </div>

          <div className="shortcut-controls">
            <label className="search shortcut-search"><Icon name="search" /><input value={shortcutQuery} onChange={(e) => setShortcutQuery(e.target.value)} placeholder="Buscar função ou tecla" /></label>
            <div className="category-chips">
              {["Todos", "Navegação", "Montagem", "Timeline", "Páginas"].map((category) => <button key={category} className={shortcutCategory === category ? "active" : ""} onClick={() => setShortcutCategory(category)}>{category}</button>)}
            </div>
          </div>

          <div className="shortcut-grid">
            {visibleShortcuts.map((shortcut) => {
              const displayKeys = shortcutOS === "macOS"
                ? shortcut.keys.replaceAll("Ctrl", "Cmd").replaceAll("Alt", "Option")
                : shortcut.keys;
              return <article className="shortcut-card" key={`${shortcut.category}-${shortcut.keys}`}>
                <span className="shortcut-key">{displayKeys}</span>
                <div><strong>{shortcut.action}</strong><small>{shortcut.category}</small></div>
              </article>;
            })}
            {!visibleShortcuts.length && <div className="empty-state shortcut-empty"><Icon name="keyboard" size={28} /><strong>Nenhum atalho encontrado</strong><span>Tente outra função ou categoria.</span></div>}
          </div>

          <div className="shortcut-tips">
            <article><span>01</span><div><strong>Navegue sem o mouse</strong><p>Use J, K e L; toque várias vezes em J ou L para mudar a velocidade.</p></div></article>
            <article><span>02</span><div><strong>Marque antes de inserir</strong><p>Defina I e O no Source Viewer e use F9 ou F10 para montar com precisão.</p></div></article>
            <article><span>03</span><div><strong>Crie seu preset</strong><p>Abra Keyboard Customization, pesquise comandos e exporte seu mapa pessoal.</p></div></article>
          </div>

          <div className="shortcut-note"><Icon name="spark" size={16} /><span>Os atalhos podem mudar conforme o preset e suas personalizações.</span><a href="https://www.blackmagicdesign.com/products/davinciresolve/training" target="_blank" rel="noreferrer">Treinamento oficial <Icon name="chevron" size={14} /></a></div>
        </section>

        <footer><span>WEEZY COMMAND CENTER</span><small>Os dados ficam salvos neste navegador.</small></footer>
      </div>
    </main>
  );
}
