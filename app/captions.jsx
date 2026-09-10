"use client";
import { useEffect, useRef, useState } from 'react';

function stamp(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}

export default function Captions({ file, duration, settings, onChange, disabled, videoRef }) {
  const start = 0, end = duration;
  const [language, setLanguage] = useState('portuguese');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const worker = useRef(null), generation = useRef(0);
  const cues = settings.captions || [];
  useEffect(() => () => { generation.current++; worker.current?.terminate(); }, []);
  function cancel() { generation.current++; worker.current?.terminate(); worker.current = null; setBusy(false); setMessage('Geração cancelada. As legendas anteriores foram mantidas.'); }
  async function generate() {
    if (busy) return;
    if (!Number.isFinite(duration) || duration <= 0) { setMessage('Aguarde o carregamento da duração do vídeo.'); return; }
    if (file.size > 800 * 1024 * 1024) { setMessage('Este arquivo ultrapassa 800 MB, o limite de arquivo desta transcrição local. Carregue uma versão mais compacta do vídeo completo. Nenhuma parte foi transcrita.'); return; }
    const job = ++generation.current;
    setBusy(true); setMessage('Extraindo o áudio do vídeo inteiro, do início ao fim…');
    let context;
    try {
      context = new AudioContext();
      const decoded = await context.decodeAudioData(await file.arrayBuffer());
      await context.close(); context = null;
      if (job !== generation.current) return;
      const length = Math.min(end - start, decoded.duration - start);
      if (length <= 0) throw new Error('no audio');
      const offline = new OfflineAudioContext(1, Math.ceil(length * 16000), 16000);
      const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start(0, start, length);
      const rendered = await offline.startRendering();
      const audio = rendered.getChannelData(0).slice();
      if (job !== generation.current) return;
      let peak = 0; for (let i = 0; i < audio.length; i++) peak = Math.max(peak, Math.abs(audio[i]));
      if (peak < .0001) { setBusy(false); setMessage('Não há áudio audível neste trecho.'); return; }
      setMessage('Carregando IA gratuita. O primeiro uso baixa o modelo; o áudio permanece neste navegador.');
      worker.current?.terminate();
      worker.current = new Worker('/caption-worker.js', { type: 'module' });
      worker.current.onerror = () => { if (job !== generation.current) return; setBusy(false); setMessage('Falha ao iniciar a IA local. Confira sua conexão e tente novamente.'); worker.current?.terminate(); };
      worker.current.onmessage = ({ data }) => {
        if (job !== generation.current) return;
        if (data.type === 'progress') setMessage(data.message);
        else if (data.type === 'error') { setBusy(false); setMessage(data.message); }
        else if (data.type === 'done') {
          const next = data.chunks.map((chunk, index) => ({ id: `cue-${job}-${index}-${Date.now()}`, start: start + Number(chunk.timestamp?.[0] || 0), end: Math.min(end, start + Number(chunk.timestamp?.[1] ?? length)), text: chunk.text.trim() })).filter(c => Number.isFinite(c.start) && Number.isFinite(c.end) && c.end > c.start && c.text);
          if (next.length) onChange(current => ({ ...current, captions: next.sort((a,b) => a.start-b.start), captionsEnabled: true }));
          setBusy(false); setMessage(next.length ? 'Transcrição do vídeo inteiro concluída. Revise nomes, palavras e tempos antes de exportar.' : 'Nenhuma fala identificada no vídeo. As legendas anteriores foram mantidas.');
        }
      };
      worker.current.postMessage({ audio, language }, [audio.buffer]);
    } catch { if (job === generation.current) { setBusy(false); setMessage('Não foi possível decodificar o áudio deste arquivo. Tente uma versão do vídeo completo em WebM com áudio.'); } }
    finally { if (context) await context.close().catch(() => {}); }
  }
  function update(id, patch) { onChange(current => ({ ...current, captions: (current.captions || []).map(c => c.id === id ? { ...c, ...patch } : c) })); }
  const invalid = cues.some(c => !Number.isFinite(c.start) || !Number.isFinite(c.end) || c.start < 0 || c.end <= c.start || c.end > duration);
  function downloadSrt() {
    const selected = cues.filter(c => c.end > start && c.start < end).sort((a,b) => a.start-b.start);
    const text = selected.map((c,i) => `${i+1}\n${stamp(Math.max(0,c.start-start))} --> ${stamp(Math.min(end,c.end)-start)}\n${c.text}\n`).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type:'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href=url; a.download='legendas-do-video-completo.srt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="captions-panel">
    <h3>Legendas automáticas · IA gratuita</h3>
    <p>A transcrição sempre cobre o vídeo inteiro, do início ao fim, independentemente do clipe selecionado. Whisper Tiny roda no navegador; seu áudio não é enviado. O primeiro uso baixa o modelo. Arquivos de até 800 MB; o processamento depende da memória disponível no navegador e vídeos longos podem levar mais tempo.</p>
    <fieldset disabled={disabled || busy}><div className="caption-tools">
      <p>Vídeo completo · 00:00 até {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</p>
      <label>Idioma<select value={language} onChange={e => setLanguage(e.target.value)}><option value="portuguese">Português</option><option value="english">Inglês</option><option value="spanish">Espanhol</option></select></label>
      <button className="primary" type="button" onClick={generate}>Legendar vídeo inteiro grátis</button>
    </div></fieldset>
    {busy && <button className="ghost" type="button" onClick={cancel}>Cancelar geração</button>}
    <p role="status" aria-live="polite">{message}</p>
    {!!cues.length && <fieldset disabled={disabled || busy}>
      <div className="caption-tools"><label><span>Mostrar na prévia e no vídeo exportado</span><input type="checkbox" checked={settings.captionsEnabled !== false} onChange={e => onChange(current => ({...current,captionsEnabled:e.target.checked}))}/></label>
      <label>Posição vertical<input type="range" min="20" max="90" value={settings.captionY || 65} onChange={e => onChange(current => ({...current,captionY:Number(e.target.value)}))}/></label>
      <button type="button" className="ghost" disabled={invalid || end <= start || !cues.some(c => c.end>start && c.start<end)} onClick={downloadSrt}>Baixar SRT completo</button></div>
      {invalid && <p role="alert">Corrija os tempos: cada legenda precisa terminar depois do início e ficar dentro do vídeo.</p>}
      <div className="caption-list">{cues.map((c,i) => <div className="caption-row" key={c.id}>
        <button type="button" className="ghost" onClick={() => { videoRef.current.currentTime = Math.max(0, Math.min(duration, c.start)); }}>{i+1} · Ver</button>
        <label>Início<input type="number" step="0.1" min="0" max={duration} value={c.start} onChange={e => update(c.id,{start:Number(e.target.value)})}/></label>
        <label>Fim<input type="number" step="0.1" min="0" max={duration} value={c.end} onChange={e => update(c.id,{end:Number(e.target.value)})}/></label>
        <label>Texto<textarea rows="2" maxLength="400" value={c.text} onChange={e => update(c.id,{text:e.target.value})}/></label>
        <button type="button" className="ghost" onClick={() => onChange(current => ({...current,captions:current.captions.filter(item=>item.id!==c.id)}))}>Excluir</button>
      </div>)}</div>
    </fieldset>}
  </section>;
}
