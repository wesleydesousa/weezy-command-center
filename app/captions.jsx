"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_FORMATS, AudioBufferSink, BlobSource, Input } from "mediabunny";

const CHUNK_SECONDS = 90;
const TARGET_SAMPLE_RATE = 16000;

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
    const sourceIndex = Math.min(lastFrame - 1, firstFrame + Math.floor(i * ratio));
    let value = 0;
    for (const channel of channels) value += channel[sourceIndex] || 0;
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
  return merged;
}

export default function Captions({ file, duration, settings, onChange, disabled, videoRef }) {
  const [language, setLanguage] = useState("portuguese");
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

  function transcribeChunk(audio, languageCode, requestId, chunkNumber, chunkTotal) {
    return new Promise((resolve, reject) => {
      pendingReject.current = reject;
      worker.current.onmessage = ({ data }) => {
        if (data.requestId !== requestId) return;
        if (data.type === "progress") setMessage(`Trecho ${chunkNumber} de ${chunkTotal} · ${data.message}`);
        if (data.type === "error") { pendingReject.current = null; reject(new Error(data.message)); }
        if (data.type === "done") { pendingReject.current = null; resolve(data.chunks || []); }
      };
      worker.current.onerror = () => { pendingReject.current = null; reject(new Error("Falha ao iniciar a IA local.")); };
      worker.current.postMessage({ audio, language: languageCode, requestId }, [audio.buffer]);
    });
  }

  async function generate() {
    if (busy) return;
    if (!Number.isFinite(duration) || duration <= 0) { setMessage("Aguarde o carregamento da duração do vídeo."); return; }
    if (file.size > 800 * 1024 * 1024) { setMessage("Escolha um vídeo de até 800 MB."); return; }
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
        const chunks = await transcribeChunk(audio, language, `${job}-${index}`, index + 1, totalChunks);
        for (const [chunkIndex, chunk] of chunks.entries()) {
          const cueStart = start + Number(chunk.timestamp?.[0] || 0);
          const cueEnd = Math.min(end, start + Number(chunk.timestamp?.[1] ?? end - start));
          if (Number.isFinite(cueStart) && Number.isFinite(cueEnd) && cueEnd > cueStart && chunk.text?.trim()) {
            next.push({ id: `cue-${job}-${index}-${chunkIndex}`, start: cueStart, end: cueEnd, text: chunk.text.trim() });
          }
        }
      }

      if (job !== generation.current) return;
      if (next.length) onChange(current => ({ ...current, captions: next.sort((a, b) => a.start - b.start), captionsEnabled: true }));
      setMessage(next.length ? `Transcrição completa: ${next.length} legendas salvas temporariamente neste navegador.` : "Nenhuma fala identificada. As legendas anteriores foram mantidas.");
    } catch (error) {
      if (job === generation.current && error?.message !== "cancelled") setMessage(`${error?.message || "Não foi possível gerar as legendas"} Use Chrome ou Edge atualizado e tente novamente.`);
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
    <p>O áudio é lido em trechos de 90 segundos para usar menos memória. A transcrição cobre o vídeo inteiro, aceita arquivos de até 800 MB e permanece temporariamente neste navegador.</p>
    <fieldset disabled={disabled || busy}><div className="caption-tools">
      <p>Vídeo completo · 00:00 até {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</p>
      <label>Idioma<select value={language} onChange={event => setLanguage(event.target.value)}><option value="portuguese">Português</option><option value="english">Inglês</option><option value="spanish">Espanhol</option></select></label>
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
