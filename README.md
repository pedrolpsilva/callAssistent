# CallAssistent 🎙️

Aplicativo Desktop 100% local para Windows de gravação, transcrição com identificação de vozes (diarização) e geração de atas/documentações de produto e desenvolvimento via **Google Gemini**.

## 🚀 Como Executar

### Pré-requisitos
- Python 3.14+ (já configurado no ambiente `venv`)
- Node.js 22+

### 1. Iniciar Tudo com 1 Comando (Backend + Interface Desktop)
```bash
npm run dev
```

Ou separadamente em dois terminais:
```bash
# Terminal 1: Backend FastAPI com motor de áudio WASAPI
npm run backend

# Terminal 2: Interface Desktop (Electron + Vite)
npm run dev:ui
npm run electron
```

## 📂 Diretório Padrão de Salvamento
As atas de reuniões em formato Markdown (.md) são salvas automaticamente em:
`C:\Users\pedri\OneDrive\Documentos\transcriptions\[YYYY-MM-DD]-[HH-MM-SS].md`

## ⚙️ Configuração da Chave Gemini
Configure no arquivo `.env` ou direto pela interface do aplicativo no ícone de engrenagem:
```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
OUTPUT_DIR=C:\Users\pedri\OneDrive\Documentos\transcriptions
```
