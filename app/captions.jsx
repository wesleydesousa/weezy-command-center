"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_FORMATS, AudioBufferSink, BlobSource, Input } from "mediabunny";

const CHUNK_SECONDS = 90;
const TARGET_SAMPLE_RATE = 16000;
const MAX_VIDEO_BYTES = 3 * 1024 * 1024 * 1024;

function stamp(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
}

function audioBufferToMono(buffer, absoluteStart, absoluteEnd, timestamp) {
  const firstFrame = Math.max(0, Math.floor((absoluteStart - timestamp) * buffer.sampleRate));
  const lastFrame = Math.min(buffer.length, Math.ceil((absoluteEnd - timestamp) * buffer.sampleRate));
  if (lastFrame <= firstFrame) return new Float32Array(0);
  const ratio = buffer.sampleRate / TARGET_SAMPLE_RATE;
  const output = new Float32Array(Math.max(0, Math.floor((lastFrame - firstFrame) / ratio)));
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  for (let i = 0; i < output.length; i++) {
    const sourcePosition = firstFrame + i * ratio;
    const sourceIndex = Math.min(lastFrame - 1, Math.floor(sourcePosition));
    const nextIndex = Math.min(lastFrame - 1, sourceIndex + 1);
    const mix = sourcePosition - sourceIndex;
    let value = 0;
    for (const channel of channels) value += (channel[sourceIndex] || 0) * (1 - mix) + (channel[nextIndex] || 0) * mix;
    output[i] = value / Math.max(1, channels.length);
  }
  return output;
}

async function extractAudioChunk(sink, start, end) {
  const parts = [];
  let total = 0;
  for await (const { buffer, timestamp, duration } of sink.buffers(start, end)) {
    const part = audioBufferToMono(buffer, Math.max(start, timestamp), Math.min(end, timestamp + duration), timestamp);
    if (part.length) { parts.push(part); total += part.length; }
  }
  const merged = new Float32Array(total);
  let offset = 0;
  for (const part of parts) { merged.set(part, offset); offset += part.length; }
  let mean = 0;
  for (let i = 0; i < merged.length; i++) mean += merged[i];
  mean /= Math.max(1, merged.length);
  const alpha = Math.exp(-2 * Math.PI * 80 / TARGET_SAMPLE_RATE);
  let previousInput = 0, previousOutput = 0, squareSum = 0;
  for (let i = 0; i < merged.length; i++) {
    const input = merged[i] - mean;
    const filtered = input - previousInput + alpha * previousOutput;
    previousInput = input; previousOutput = filtered; merged[i] = filtered;
    squareSum += filtered * filtered;
  }
  const rms = Math.sqrt(squareSum / Math.max(1, merged.length));
  const gain = Math.min(4, Math.max(.75, .12 / Math.max(.001, rms)));
  for (let i = 0; i < merged.length; i++) merged[i] = Math.max(-.98, Math.min(.98, merged[i] * gain));
  return merged;
}

function groupWords(chunks, chunkStart, chunkEnd, idPrefix) {
  const cues = [];
  let group = null;
  const flush = () => {
    if (!group?.text) return;
    cues.push({ id: `${idPrefix}-${cues.length}`, start: group.start, end: group.end, text: group.text.trim() });
    group = null;
  };
  for (const chunk of chunks) {
    const text = String(chunk.text || "").trim();
    const start = chunkStart + Number(chunk.timestamp?.[0] || 0);
    const end = Math.min(chunkEnd, chunkStart + Number(chunk.timestamp?.[1] ?? chunkEnd - chunkStart));
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const nextText = group ? `${group.text}${/^[,.;!?)]/.test(text) ? "" : " "}${text}` : text;
    if (group && (nextText.length > 48 || end - group.start > 4.5 || /[.!?]$/.test(group.text))) flush();
    if (!group) group = { start, end, text };
    else { group.end = end; group.text = nextText; }
  }
  flush();
  return cues;
}

export default function Captions({ file, duration, settings, onChange, disabled, videoRef }) {
  const [language, setLanguage] = useState("portuguese");
  const [quality, setQuality] = useState("detailed");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const worker = useRef(null);
  const generation = useRef(0);
  const pendingReject = useRef(null);
  const cues = settings.captions || [];

  useEffect(() => () => {
    generation.current++;
    pendingReject.current?.(new Error("cancelled"));
    worker.current?.terminate();
  }, []);

  function cancel() {
    generation.current++;
    pendingReject.current?.(new Error("cancelled"));
    pendingReject.current = null;
    worker.current?.terminate(); worker.current = null;
    setBusy(false); setMessage("Geração cancelada. As legendas anteriores foram mantidas.");
  }

  function transcribeChunk(audio, languageCode, qualityMode, requestId, chunkNumber, chunkTotal) {
    return new Promise((resolve, reject) => {
      pendingReject.current = reject;
      worker.current.onmessage = ({ data }) => {
        if (data.requestId !== requestId) return;
        if (data.type === "progress") setMessage(`Trecho ${chunkNumber} de ${chunkTotal} · ${data.message}`);
        if (data.type === "error") { pendingReject.current = null; reject(new Error(data.message)); }
        if (data.type === "done") { pendingReject.current = null; resolve({ chunks: data.chunks || [], usedQuality: data.usedQuality || qualityMode }); }
      };
      worker.current.onerror = () => { pendingReject.current = null; reject(new Error("Falha ao iniciar a IA local.")); };
      worker.current.postMessage({ audio, language: languageCode, quality: qualityMode, requestId }, [audio.buffer]);
    });
  }

  async function generate() {
    if (busy) return;
    if (!Number.isFinite(duration) || duration <= 0) { setMessage("Aguarde o carregamento da duração do vídeo."); return; }
    if (file.size > MAX_VIDEO_BYTES) { setMessage("Escolha um vídeo de até 3 GB."); return; }
    const job = ++generation.current;
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    setBusy(true); setMessage("Preparando a transcrição local por partes…");
    try {
      if (!await input.canRead()) throw new Error("Formato de áudio não reconhecido.");
      const track = await input.getPrimaryAudioTrack();
      if (!track) throw new Error("O vídeo não possui uma faixa de áudio.");
      if (!await track.canDecode()) throw new Error("O navegador não consegue decodificar o áudio deste vídeo.");
      const sink = new AudioBufferSink(track);
      const totalChunks = Math.ceil(duration / CHUNK_SECONDS);
      const next = [];
      let fallbackUsed = false;
      worker.current = new Worker("/caption-worker.js", { type: "module" });

      for (let index = 0; index < totalChunks; index++) {
        if (job !== generation.current) throw new Error("cancelled");
        const start = index * CHUNK_SECONDS;
        const end = Math.min(duration, start + CHUNK_SECONDS);
        setMessage(`Extraindo áudio do trecho ${index + 1} de ${totalChunks}…`);
        const audio = await extractAudioChunk(sink, start, end);
        if (!audio.length) continue;
        let peak = 0;
        for (let i = 0; i < audio.length; i++) peak = Math.max(peak, Math.abs(audio[i]));
        if (peak < .0001) continue;
        const result = await transcribeChunk(audio, language, quality, `${job}-${index}`, index + 1, totalChunks);
        if (quality === "detailed" && result.usedQuality === "fast") fallbackUsed = true;
        next.push(...groupWords(result.chunks, start, end, `cue-${job}-${index}`));
      }

      if (job !== generation.current) return;
      if (next.length) onChange(current => ({ ...current, captions: next.sort((a, b) => a.start - b.start), captionsEnabled: true }));
      setMessage(next.length ? `Transcrição completa: ${next.length} legendas salvas${fallbackUsed ? " no modo rápido automático" : ""}.` : "Nenhuma fala identificada. As legendas anteriores foram mantidas.");
    } catch (error) {
      if (job === generation.current && error?.message !== "cancelled") setMessage(error?.message || "Não foi possível gerar as legendas. Recarregue a página e tente novamente.");
    } finally {
      input.dispose();
      if (job === generation.current) {
        pendingReject.current = null;
        worker.current?.terminate(); worker.current = null;
        setBusy(false);
      }
    }
  }

  function update(id, patch) { onChange(current => ({ ...current, captions: (current.captions || []).map(c => c.id === id ? { ...c, ...patch } : c) })); }
  const invalid = cues.some(c => !Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < 0 || c.end <= c.start || c.end > duration);
  function downloadSrt() {
    const text = cues.slice().sort((a, b) => a.start - b.start).map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "legendas-do-video-completo.srt"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="captions-panel">
    <h3>Legendas automáticas · IA gratuita</h3>
    <p>O áudio é lido em trechos de 90 segundos, recebe tratamento para destacar a voz e gera tempos mais precisos por palavra. A transcrição cobre o vídeo inteiro, aceita arquivos de até 3 GB e permanece neste navegador.</p>
    <fieldset disabled={disabled || busy}><div className="caption-tools">
      <p>Vídeo completo · 00:00 até {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</p>
      <label>Idioma<select value={language} onChange={event => setLanguage(event.target.value)}><option value="portuguese">Português</option><option value="english">Inglês</option><option value="spanish">Espanhol</option></select></label>
      <label>Qualidade da voz<select value={quality} onChange={event => setQuality(event.target.value)}><option value="detailed">Detalhada · mais precisa</option><option value="fast">Rápida · usa menos memória</option></select></label>
      <button className="primary" type="button" onClick={generate}>Legendar vídeo inteiro</button>
    </div></fieldset>
    {busy && <button className="ghost" type="button" onClick={cancel}>Cancelar geração</button>}
    <p role="status" aria-live="polite">{message}</p>
    {!!cues.length && <fieldset disabled={disabled || busy}>
      <div className="caption-tools"><label><span>Mostrar na prévia e no vídeo exportado</span><input type="checkbox" checked={settings.captionsEnabled !== false} onChange={event => onChange(current => ({ ...current, captionsEnabled: event.target.checked }))} /></label>
      <label>Posição vertical<input type="range" min="20" max="90" value={settings.captionY || 65} onChange={event => onChange(current => ({ ...current, captionY: Number(event.target.value) }))} /></label>
      <button type="button" className="ghost" disabled={invalid} onClick={downloadSrt}>Baixar SRT completo</button></div>
      {invalid && <p role="alert">Corrija os tempos: cada legenda precisa terminar depois do início e ficar dentro do vídeo.</p>}
      <div className="caption-list">{cues.map((cue, index) => <div className="caption-row" key={cue.id}>
        <button type="button" className="ghost" onClick={() => { videoRef.current.currentTime = Math.max(0, Math.min(duration, cue.start)); }}>{index + 1} · Ver</button>
        <label>Início<input type="number" step="0.1" min="0" max={duration} value={cue.start} onChange={event => update(cue.id, { start: Number(event.target.value) })} /></label>
        <label>Fim<input type="number" step="0.1" min="0" max={duration} value={cue.end} onChange={event => update(cue.id, { end: Number(event.target.value) })} /></label>
        <label>Texto<textarea rows="2" maxLength="800" value={cue.text} onChange={event => update(cue.id, { text: event.target.value })} /></label>
        <button type="button" className="ghost" onClick={() => onChange(current => ({ ...current, captions: current.captions.filter(item => item.id !== cue.id) }))}>Excluir</button>
      </div>)}</div>
    </fieldset>}
  </section>;
}
