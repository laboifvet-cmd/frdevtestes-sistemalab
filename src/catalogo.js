// Tabela de exames: categorias (com o prefixo do número do exame) e textos de prazo e valor.
import { real } from './util.js';

// "1 dia útil", "5 a 7 dias úteis", "no mesmo dia"
export function prazoTexto(x, curto = false) {
  const max = Number(x?.prazo) || 0;
  const min = Number(x?.prazoMin) || 0;
  if (!max) return 'no mesmo dia';
  const faixa = min && min < max ? `${min} a ${max}` : `${max}`;
  if (curto) return faixa;
  return `${faixa} ${max === 1 && !(min && min < max) ? 'dia útil' : 'dias úteis'}`;
}

export const valorTexto = (x, valor) => (x?.sobConsulta ? 'Sob consulta' : real(valor ?? x?.valor));

export const categoriaDe = (categorias, exame) => (categorias || []).find((c) => c.id === exame?.categoriaId);

// prefixo do número do exame (ex.: HP 26-0142) vem da categoria
export const prefixoDe = (categorias, exame) => categoriaDe(categorias, exame)?.prefixo || 'EX';

// nome completo para listas: "Biópsia convencional (1 peça)"
export const nomeCompleto = (x) => (x?.detalhe ? `${x.nome} (${x.detalhe})` : x?.nome || '');

export const CORES_CATEGORIA = ['#6D4AA8', '#1E7A66', '#2F5D9E', '#8A4B16', '#B03A48', '#3F4A55', '#A3720C', '#0F6E8C'];
