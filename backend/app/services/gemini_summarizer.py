import os
import re
from datetime import datetime
from pathlib import Path
from google import genai
from app.core.config import settings

class GeminiSummarizerService:
    def generate_documentation(
        self,
        transcript_text: str,
        meeting_title: str = "Reunião de Alinhamento",
        participants: list[str] | None = None
    ) -> dict:
        if not settings.gemini_api_key:
            return {
                "success": False,
                "error": "Chave da API do Google Gemini (GEMINI_API_KEY) não configurada."
            }

        client = genai.Client(api_key=settings.gemini_api_key)
        
        participants_str = ", ".join(participants) if participants else "Equipe"
        now_str = datetime.now().strftime("%d/%m/%Y às %H:%M")

        prompt = f"""Você é um Principal Product Manager e Tech Lead sênior.
Com base na transcrição da reunião abaixo, gere uma documentação estruturada, altamente objetiva e técnica para projetos de software e produto.

Metadados:
- Título Sugerido: {meeting_title}
- Data/Hora: {now_str}
- Participantes: {participants_str}

Estrutura obrigatória em Markdown (mantenha exatamente esses títulos e seções):

# Reunião: [Título curto e descritivo baseado no assunto principal]
- **Data e Hora**: {now_str}
- **Participantes**: {participants_str}

## 1. Resumo Executivo
[2 a 3 frases concisas resumindo o objetivo da reunião e as conclusões gerais]

## 2. Decisões Técnicas & Arquitetura
[Lista pontual de todas as decisões tomadas: tecnologias, padrões, integrações, infraestrutura, modelagem]

## 3. Requisitos de Produto & Escopo
- **O que entra no escopo**: [itens definidos para implementação]
- **O que NÃO entra no escopo**: [itens descartados ou adiados]

## 4. Plano de Ação & Próximos Passos
[Lista de tarefas no formato de checklist com responsável e prazo quando citados:
- [ ] Tarefa a realizar - Responsável: Nome (Prazo: data/quando aplicável)]

---
## Transcrição Integral da Reunião
{transcript_text}

Transcrição da Reunião para analisar:
\"\"\"
{transcript_text}
\"\"\"
"""

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        doc_content = response.text or ""

        # Extrai o título gerado da documentação
        title_match = re.search(r"^#\s*Reunião:\s*\[?(.*?)\]?$", doc_content, re.MULTILINE | re.IGNORECASE)
        if not title_match:
            title_match = re.search(r"^#\s*(.+)$", doc_content, re.MULTILINE)

        raw_title = title_match.group(1).strip() if title_match else meeting_title
        # Remove colchetes residuais e caracteres inválidos para nomes de arquivos no Windows
        raw_title = re.sub(r"[\[\]]", "", raw_title).strip()
        sanitized_title = re.sub(r'[\\/*?:"<>|]', '', raw_title).strip()
        sanitized_title = re.sub(r"\s+", "-", sanitized_title)
        if not sanitized_title:
            sanitized_title = "Reuniao"
        sanitized_title = sanitized_title[:60].rstrip("-")

        # Salva no diretório padrão: [DATA]-[HORA]-[TITULO].md
        file_timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        file_name = f"{file_timestamp}-{sanitized_title}.md"
        output_path = Path(settings.output_dir) / file_name

        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(doc_content)
            saved_ok = True
        except Exception as e:
            print(f"[GeminiSummarizer] Erro ao salvar arquivo: {e}")
            saved_ok = False

        return {
            "success": True,
            "document_markdown": doc_content,
            "file_path": str(output_path),
            "file_name": file_name,
            "saved": saved_ok
        }

gemini_summarizer_service = GeminiSummarizerService()
