# CallAssistent 🎙️

Aplicação 100% Web para gravação, transcrição com identificação de vozes (diarização) e geração de atas/documentações de produto e desenvolvimento via **Google Gemini**, otimizada para o **Google Chrome** no **Windows** e **macOS**.

---

## 🚀 Como Iniciar

### 1. Iniciar com 1 Comando (Backend + Web no Google Chrome)
- **No Windows:**
  ```bash
  npm run dev
  ```
- **No macOS:**
  ```bash
  npm run dev:mac
  ```

*(O comando inicia o servidor local FastAPI e abre automaticamente a aba do aplicativo no seu navegador padrão em `http://localhost:5173`).*

---

## 💡 Como Funciona a Captura no Google Chrome
1. Clique em **"Iniciar Gravação na Guia"**.
2. O Google Chrome exibirá a janela nativa para selecionar o que capturar:
   - Escolha a **Guia do Chrome** onde está a sua reunião (Google Meet, Teams, YouTube, etc.).
   - **IMPORTANTE:** Certifique-se de marcar a opção **"Compartilhar áudio da guia"** para gravar as outras vozes.
3. Fale à vontade: seu microfone é capturado de forma independente e isolada, garantindo sua autoria (Pedro Luiz).
4. Ao clicar em **"Finalizar & Gerar Ata"**, o áudio é processado pelo Google Gemini e a ata estruturada em Markdown é criada.

---

## 💻 Instalação como App Nativo (PWA no Chrome)
Você pode transformar o CallAssistent em uma janela independente com ícone próprio:
1. Abra `http://localhost:5173` no Google Chrome.
2. Na barra de endereços (à direita), clique no ícone **"Instalar CallAssistent"**.
3. O app ganhará uma janela limpa sem abas de navegador e um atalho no seu Desktop (Windows) ou Dock/Launchpad (macOS).

---

## 📂 Diretório Padrão de Salvamento
As atas em formato Markdown (.md) são salvas automaticamente em disco com o nome `[DATA]-[HORA]-[TITULO].md`:
- **Windows:** `C:\Users\pedri\OneDrive\Documentos\transcriptions`
- **macOS:** `~/Documents/transcriptions`
*(Além do salvamento automático, o app oferece o botão **"Baixar .md"** direto no navegador).*

---

## ⚙️ Configuração da Chave Gemini
Configure no arquivo `.env` ou direto pela interface do aplicativo no ícone de engrenagem:
```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
```
