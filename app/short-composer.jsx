"use client";
import { useEffect, useRef } from "react";

export const INITIAL_COMPOSITION = { layout: "single", split: 35, a: { x: 50, y: 50, zoom: 1 }, b: { x: 50, y: 50, zoom: 1 }, text: "" };

export function cropRect(vw, vh, dw, dh, crop) {
  const scale = Math.max(dw / vw, dh / vh) * crop.zoom;
  const sw = dw / scale, sh = dh / scale;
  return [(vw - sw) * crop.x / 100, (vh - sh) * crop.y / 100, sw, sh];
}

export function drawComposition(ctx, video, width, height, settings) {
  if (!video.videoWidth || video.readyState < 2) return;
  const region = (crop, x, y, w, h) => ctx.drawImage(video, ...cropRect(video.videoWidth, video.videoHeight, w, h, crop), x, y, w, h);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  if (settings.layout === "single") region(settings.a, 0, 0, width, height);
  else {
    const top = Math.round(height * settings.split / 100);
    region(settings.a, 0, 0, width, top);
    region(settings.b, 0, top, width, height - top);
  }
  if (settings.text.trim()) {
    ctx.font = `bold ${Math.round(width * .052)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.lineWidth = width * .012;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    settings.text.split("\n").slice(0, 3).forEach((line, i) => {
      const y = height * .76 + i * width * .065;
      ctx.strokeText(line, width / 2, y, width * .86);
      ctx.fillText(line, width / 2, y, width * .86);
    });
  }
  const cue = settings.captionsEnabled !== false && (settings.captions || []).find(c => video.currentTime >= c.start && video.currentTime < c.end);
  if (cue) {
    const words = cue.text.trim().split(/\s+/);
    let fontSize = Math.round(width * .05), lines;
    do {
      ctx.font = `bold ${fontSize}px sans-serif`;
      lines = []; let line = '';
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > width * .86) { lines.push(line); line = word; } else line = next;
      }
      if (line) lines.push(line);
      if (lines.length <= 4 || fontSize <= width * .026) break;
      fontSize -= 2;
    } while (true);
    ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = width * .009;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000';
    const y = Math.min(height * .92 - lines.length * fontSize * 1.2, height * (settings.captionY || 65) / 100);
    lines.forEach((line, i) => { ctx.strokeText(line, width / 2, y + i * fontSize * 1.2, width * .9); ctx.fillText(line, width / 2, y + i * fontSize * 1.2, width * .9); });
  }
}

export default function ShortComposer({ videoRef, settings, onChange, vertical, disabled }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let frame;
    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas && videoRef.current) drawComposition(canvas.getContext("2d"), videoRef.current, canvas.width, canvas.height, settings);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [videoRef, settings, vertical]);
  function preset(layout) {
    onChange({ ...settings, layout, split: layout === "podcast" ? 50 : 30,
      a: { x: layout === "podcast" ? 0 : 50, y: 50, zoom: 1 },
      b: { x: layout === "podcast" ? 100 : 50, y: 50, zoom: 1 } });
  }
  return <section className="short-composer">
    <div><h3>Montagem do Short</h3><p>Dois cantos do mesmo vídeo, no mesmo instante. Use os controles do vídeo original para reproduzir.</p>
      <canvas ref={canvasRef} width={vertical ? 720 : 1280} height={vertical ? 1280 : 720} aria-label="Prévia da composição que será exportada" />
    </div>
    <fieldset disabled={disabled}>
      <legend>Enquadramento e texto</legend>
      <label>Layout<select value={settings.layout} onChange={e => preset(e.target.value)}><option value="single">Um recorte</option><option value="game">Game + webcam (em cima)</option><option value="podcast">Podcast: duas pessoas</option></select></label>
      {settings.layout !== "single" && <label>Altura de cima: {settings.split}%<input type="range" min="20" max="80" value={settings.split} onChange={e => onChange({ ...settings, split: Number(e.target.value) })} /></label>}
      {(settings.layout === "single" ? ["a"] : ["a", "b"]).map((key, index) => <div className="crop-controls" key={key}><strong>{settings.layout === "single" ? "Recorte" : index === 0 ? "Recorte A · em cima" : "Recorte B · embaixo"}</strong>{[["x", "Horizontal", 0, 100, 1], ["y", "Vertical", 0, 100, 1], ["zoom", "Zoom", 1, 4, .05]].map(([axis, label, min, max, step]) => <label key={axis}>{label}: {settings[key][axis]}<input type="range" min={min} max={max} step={step} value={settings[key][axis]} onChange={e => onChange({ ...settings, [key]: { ...settings[key], [axis]: Number(e.target.value) } })} /></label>)}</div>)}
      {settings.layout !== "single" && <button type="button" className="ghost" onClick={() => onChange({ ...settings, a: settings.b, b: settings.a })}>Trocar os recortes</button>}
      <label>Texto fixo no vídeo<textarea rows="3" maxLength="120" value={settings.text} placeholder="Gancho ou chamada · até 3 linhas" onChange={e => onChange({ ...settings, text: e.target.value })} /></label>
      <p>Os ajustes se aplicam a todos os clipes na próxima exportação. O texto é manual, não uma transcrição automática.</p>
    </fieldset>
  </section>;
}
