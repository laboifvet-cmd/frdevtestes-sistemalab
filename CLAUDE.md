# VetDev Lab (FR Dev) — instruções para o Claude

Sistema modelo para laboratórios de patologia veterinária. Demonstração para vender a laboratórios (primeiro alvo: Laforvet, que hoje usa o Easyvet). Projeto da **FR Dev**: não misturar com a marca IFVET.

- Responda em português do Brasil, direto. O Fábio é iniciante: código completo, explicar sem jargão.
- Dados fictícios e marcados como demonstração (marca d'água nos PDFs). Nunca usar dado real de paciente ou tutor.
- React 19 + Vite, saída em um arquivo só (`vite-plugin-singlefile`). Dados no navegador (`src/store.js`). Equipe e assinaturas em `src/equipe.js` (um laudo pode ter até 3 assinantes, `laudo.assinantes`).
- Padrão de entrega: bonito, organizado e funcional; conferir 390, 820 e 1280 px sem rolagem lateral.
- Folha A4 (`src/papel.jsx`): o gerador de PDF (html2canvas) não entende `color-mix()`; cores do papel vêm de `varsDaCor`.
- Tabela de exames (`src/catalogo.js`): categorias com prefixo do número do exame (HP, CT…), cor e observação; exame com detalhe, prazo em faixa (`prazoMin` a `prazo`) e "sob consulta". Dados salvos com `versao: 2` (chave `vetdevlab:v2`).
- Hash de rota só `#nome` (letras, números e hífen): `#laudo-<id>`, `#modelo-<id>`, `#exames-atrasado`.
- Visual (nov/2026): Geist + Geist Mono, base neutra, um destaque só (rosa eosina `--acento`), linhas finas no lugar de caixas, botão principal escuro. Estilos da interface em `src/estilo.css`; da folha A4 em `src/papel.css`.
- Publicação: `git push` na `main` → GitHub Actions publica em https://laboifvet-cmd.github.io/frdevtestes-sistemalab/ (uns 2 min).
