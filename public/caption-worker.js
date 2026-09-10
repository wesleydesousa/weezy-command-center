let transcriber;
self.onmessage = async ({ data }) => {
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels = false;
    env.backends.onnx.wasm.numThreads = 1;
    transcriber ||= await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
      device: 'wasm', dtype: 'q8',
      progress_callback: p => self.postMessage({ type: 'progress', message: p.status === 'progress' ? `Baixando modelo: ${Math.round(p.progress || 0)}% (${p.file || ''})` : 'Preparando IA gratuita…' })
    });
    self.postMessage({ type: 'progress', message: 'Transcrevendo no seu computador… Pode levar alguns minutos.' });
    const result = await transcriber(data.audio, { language: data.language, task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 });
    self.postMessage({ type: 'done', chunks: result.chunks || [] });
  } catch (error) {
    self.postMessage({ type: 'error', message: 'Não foi possível carregar ou executar a IA. Confira a internet, feche abas para liberar memória e tente novamente no Chrome ou Edge.' });
  }
};
