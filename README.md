# VetDev Lab · sistema modelo para laboratórios veterinários

Demonstração da **FR Dev** de um sistema completo para laboratório de patologia veterinária. Os dados são fictícios e ficam guardados só no navegador de quem usa.

## O que tem

| Tela | Para que serve |
|---|---|
| **Painel** | Resumo do dia: laudos em andamento, atrasados, liberados, faturado no mês e a receber. |
| **Exames** | Entrada das amostras (um número e um laudo por exame), lista com busca e filtros, ficha de cada exame. |
| **Laudos** | Fila pela ordem do prazo. O laudo abre com o cabeçalho já preenchido; prévia da folha A4 ao lado; liberar e baixar o PDF. |
| **Modelos** | Criador de modelos de laudo: seções, texto curto e longo (com frases prontas), número com unidade e referência, listas, escolha única, caixas de marcar, tabelas, datas, fotos e texto fixo. A folha se monta enquanto você cria. |
| **Financeiro** | Resumo, a receber com fechamento mensal por clínica (PDF), tabela de exames (valor, prazo em dias úteis, modelo, ativo, reajuste em lote, PDF da tabela geral ou de uma clínica) e clientes com preço especial. |
| **Ajustes** | Nome, logo, cor, responsável técnico(a), assinatura, rodapé do laudo, chave Pix. Cópia dos dados (baixar e carregar). |

Regras da tabela de exames: reajuste não mexe no passado (o exame guarda o valor do dia da entrada); preço especial por clínica vale por cima da tabela; prazo conta só dias úteis (sem feriados nacionais).

## Como rodar no computador

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera dist/index.html (um arquivo só, com tudo dentro)
```

`dist/artifact.html` é a mesma página no formato do link de teste do Claude.

## Onde está cada coisa

- `src/store.js`: dados e regras (entrada, preço, número do exame, pagamentos). Para virar produto, troque o "carregar/gravar" do navegador por um servidor.
- `src/seed.js`: dados de exemplo.
- `src/campos.js`: tipos de campo e modelos prontos (histopatológico, citopatológico, necropsia, hemograma).
- `src/papel.jsx`: folhas A4 (laudo, tabela de preços, fechamento) com quebra de página.
- `src/pdf.js`: gera o PDF a partir das folhas.
- `src/telas/`: uma tela por arquivo.

Feito pela FR Dev · frdevbr.github.io
