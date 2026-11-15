# VetDev Lab (FR Dev) — instruções para o Claude

Sistema modelo para laboratórios de patologia veterinária. Demonstração para vender a laboratórios (primeiro alvo: Laforvet, que hoje usa o Easyvet). Projeto da **FR Dev**: não misturar com a marca IFVET.

- Responda em português do Brasil, direto. O Fábio é iniciante: código completo, explicar sem jargão.
- Dados fictícios e marcados como demonstração (marca d'água nos PDFs). Nunca usar dado real de paciente ou tutor.
- React 19 + Vite, saída em um arquivo só (`vite-plugin-singlefile`). Dados no navegador (`src/store.js`).
- Padrão de entrega: bonito, organizado e funcional; conferir 390, 820 e 1280 px sem rolagem lateral.
- Folha A4 (`src/papel.jsx`): o gerador de PDF (html2canvas) não entende `color-mix()`; cores do papel vêm de `varsDaCor`.
- Hash de rota só `#nome` (letras, números e hífen): `#laudo-<id>`, `#modelo-<id>`, `#exames-atrasado`.
