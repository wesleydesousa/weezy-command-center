const transcribers = new Map();
self.onmessage = async ({ data }) => {
  const requestId = data.requestId;
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels = false;
    env.backends.onnx.wasm.numThreads = 1;
    const quality = data.quality === 'fast' ? 'fast' : 'detailed';
    const model = quality === 'detailed' ? 'onnx-community/whisper-base' : 'onnx-community/whisper-tiny';
    let transcriber = transcribers.get(quality);
    if (!transcriber) transcriber = await pipeline('automatic-speech-recognition', model, {
      device: 'wasm', dtype: 'q8',
      progress_callback: p => self.postMessage({ type: 'progress', requestId, message: p.status === 'progress' ? `Baixando modelo de voz: ${Math.round(p.progress || 0)}% (${p.file || ''})` : 'Preparando IA de voz…' })
    });
    transcribers.set(quality, transcriber);
    self.postMessage({ type: 'progress', requestId, message: quality === 'detailed' ? 'Analisando voz e sincronizando cada palavra…' : 'Transcrevendo no modo rápido…' });
    const result = await transcriber(data.audio, { language: data.language, task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
    self.postMessage({ type: 'done', requestId, chunks: result.chunks || [] });
  } catch (error) {
    self.postMessage({ type: 'error', requestId, message: 'Não foi possível carregar ou executar a IA. Confira a internet, feche abas para liberar memória e tente novamente no Chrome ou Edge.' });
  }
};
