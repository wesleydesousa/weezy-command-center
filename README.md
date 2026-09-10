# Weezy Command Center

Painel de conteúdo e editor de clipes para games e podcasts.

## Executar

```sh
npm ci
npm run dev
```

```sh
npm run build
npm start
```

## Recursos

- Banco de ideias, planejamento, checklist e progresso.
- Clipes com duração configurável até 4 minutos.
- Dois recortes simultâneos, zoom e posição independentes.
- Legendas locais com Whisper Tiny via Transformers.js, revisão dos textos e tempos e exportação SRT.
- Transcrição do vídeo inteiro para arquivos de até 800 MB.
- Exportação local em WebM com texto e legendas.

O modelo de transcrição é baixado no primeiro uso. A transcrição completa com áudio real ainda precisa de validação no navegador. A integração para postar diretamente no YouTube não está implementada.

Os dados de planejamento ficam no navegador. Vídeos, dados do navegador, dependências instaladas e segredos não fazem parte deste repositório. Não é necessária chave de API para a transcrição local.

A configuração `.openai/hosting.json` identifica o Site existente. Esta cópia no GitHub não configura publicação automática.
 
O limite de entrada de 800 MB não garante que todo arquivo possa ser decodificado: a transcrição local depende da RAM disponível e do codec do áudio. Não foi validada uma transcrição real de um arquivo de 800 MB.
