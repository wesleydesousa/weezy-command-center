const transcribers = new Map();

async function transformersModule() {
  try {
    return await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  } catch {
    return import('https://unpkg.com/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  }
}

async function loadTranscriber(quality, requestId) {
  const cached = transcribers.get(quality);
  if (cached) return cached;
  const { pipeline, env } = await transformersModule();
  env.allowLocalModels = false;
  env.backends.onnx.wasm.numThreads = 1;
  const model = quality === 'detailed' ? 'onnx-community/whisper-base' : 'onnx-community/whisper-tiny';
  const transcriber = await pipeline('automatic-speech-recognition', model, {
    device: 'wasm', dtype: 'q8',
    progress_callback: p => self.postMessage({ type: 'progress', requestId, message: p.status === 'progress' ? `Baixando modelo de voz: ${Math.round(p.progress || 0)}% (${p.file || ''})` : 'Preparando IA de voz…' })
  });
  transcribers.set(quality, transcriber);
  return transcriber;
}

async function runTranscription(transcriber, data, wordTimestamps = true) {
  return transcriber(data.audio, {
    language: data.language,
    task: 'transcribe',
    return_timestamps: wordTimestamps ? 'word' : true,
    chunk_length_s: 30,
    stride_length_s: 5
  });
}

self.onmessage = async ({ data }) => {
  const requestId = data.requestId;
  try {
    let quality = data.quality === 'fast' ? 'fast' : 'detailed';
    if (quality === 'detailed' && self.navigator?.deviceMemory && self.navigator.deviceMemory < 8) {
      quality = 'fast';
      self.postMessage({ type: 'progress', requestId, message: 'Memória limitada detectada. Usando automaticamente o modo rápido…' });
    }
    let result;
    try {
      const transcriber = await loadTranscriber(quality, requestId);
      self.postMessage({ type: 'progress', requestId, message: quality === 'detailed' ? 'Analisando voz e sincronizando cada palavra…' : 'Transcrevendo no modo rápido…' });
      result = await runTranscription(transcriber, data, true);
    } catch (firstError) {
      if (quality === 'fast') {
        const transcriber = transcribers.get('fast') || await loadTranscriber('fast', requestId);
        result = await runTranscription(transcriber, data, false);
      } else {
      transcribers.delete('detailed');
      quality = 'fast';
      self.postMessage({ type: 'progress', requestId, message: 'O modo detalhado não abriu. Continuando automaticamente no modo rápido…' });
      const transcriber = await loadTranscriber('fast', requestId);
      try {
        result = await runTranscription(transcriber, data, true);
      } catch {
        result = await runTranscription(transcriber, data, false);
      }
      }
    }
    self.postMessage({ type: 'done', requestId, chunks: result.chunks || [], usedQuality: quality });
  } catch (error) {
    self.postMessage({ type: 'error', requestId, message: 'A IA local não conseguiu iniciar. Recarregue a página e tente o modo Rápida; o vídeo e o projeto continuam salvos no navegador.' });
  }
};
