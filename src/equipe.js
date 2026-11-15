// Equipe do laboratório e quem assina cada laudo.
import { uid } from './util.js';

export const FUNCOES = {
  patologista: { nome: 'Patologista', plural: 'Patologistas', assina: true },
  residente: { nome: 'Residente / pós-graduando(a)', plural: 'Residentes', assina: true },
  tecnico: { nome: 'Técnico(a) de laboratório', plural: 'Técnicos de laboratório', assina: false },
  recepcao: { nome: 'Recepção', plural: 'Recepção', assina: false },
  administrativo: { nome: 'Administrativo e financeiro', plural: 'Administrativo', assina: false },
};

export const podeAssinar = (m) => !!m && m.ativo !== false && !!FUNCOES[m.funcao]?.assina;

export function novoMembro(funcao = 'patologista') {
  return {
    id: uid('p'), nome: '', funcao, titulo: funcao === 'patologista' ? 'Médica(o) Veterinária(o) Patologista' : '',
    crmv: '', email: '', telefone: '', assinatura: null, assinaPadrao: false, ativo: true,
  };
}

// Quem assina um laudo: os escolhidos nele; se ninguém foi escolhido, os marcados como "assina por padrão".
export function assinantesDoLaudo(lab, entrada) {
  const equipe = lab.equipe || [];
  const escolhidos = entrada?.laudo?.assinantes;
  if (Array.isArray(escolhidos) && escolhidos.length) {
    const lista = escolhidos.map((id) => equipe.find((m) => m.id === id)).filter(Boolean);
    if (lista.length) return lista;
  }
  const padrao = equipe.filter((m) => podeAssinar(m) && m.assinaPadrao);
  if (padrao.length) return padrao;
  const primeiro = equipe.find(podeAssinar);
  if (primeiro) return [primeiro];
  return lab.responsavel ? [{ id: 'resp', ...lab.responsavel }] : [];
}

export const nomesDe = (lista) => lista.map((m) => m.nome).join(' e ');

// Assinatura de exemplo (rabisco desenhado), para a demonstração não sair com o espaço vazio.
export function assinaturaDeExemplo(nome, semente = 1) {
  let s = (semente * 7919 + String(nome).length * 104729) % 233280;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const partes = String(nome).replace(/^(Dra?\.)\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2);
  const base = 66;
  let x = 14;
  let d = '';
  partes.forEach((p, i) => {
    const alto = 30 + r() * 22;
    const larg = 14 + r() * 12;
    // maiúscula: haste alta com laçada
    d += `M${x} ${base + 4} C${x + larg * 0.2} ${base - alto} ${x + larg} ${base - alto - 4 - r() * 8} ${x + larg * 0.7} ${base - 10} `;
    d += `S${x + 2} ${base - 6 + r() * 4} ${x + larg + 4} ${base - 4} `;
    x += larg + 4;
    // minúsculas: ondas e voltinhas de tamanhos diferentes
    const n = Math.min(8, Math.max(3, p.length - 1));
    for (let k = 0; k < n; k++) {
      const a = 5 + r() * 11;
      const w = 7 + r() * 7;
      if (r() < 0.25) d += `C${x + w * 0.5} ${base - a - 14} ${x + w} ${base - a - 6} ${x + w * 0.6} ${base} `;
      else d += `Q${x + w * 0.5} ${base - a} ${x + w} ${base + (r() - 0.5) * 4} `;
      x += w;
    }
    x += 8 + r() * 10;
  });
  const fim = Math.min(x, 300);
  const y0 = base + 10 + r() * 6;
  d += `M${8 + r() * 20} ${y0} C${fim * (0.3 + r() * 0.2)} ${y0 - 8 - r() * 8} ${fim * 0.75} ${y0 + 10} ${fim + 6} ${y0 - 14 - r() * 10}`;
  const inclina = -(8 + r() * 14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fim + 40} 100" width="${fim + 40}" height="100"><path transform="translate(14 0) skewX(${inclina.toFixed(1)})" d="${d}" fill="none" stroke="#1F2A55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

export function equipeDeExemplo() {
  const p = (id, nome, titulo, crmv, sem, extra = {}) => ({
    id, nome, funcao: 'patologista', titulo, crmv, email: '', telefone: '', assinatura: assinaturaDeExemplo(nome, sem), assinaPadrao: false, ativo: true, ...extra,
  });
  return [
    p('p-marina', 'Dra. Marina Fontes', 'Médica Veterinária Patologista · Responsável técnica', 'CRMV-CE 0000', 3, { assinaPadrao: true, email: 'marina@vetdevlab.exemplo' }),
    p('p-caio', 'Dr. Caio Albuquerque', 'Médico Veterinário Patologista', 'CRMV-CE 0001', 7, { email: 'caio@vetdevlab.exemplo' }),
    p('p-helena', 'Dra. Helena Duarte', 'Médica Veterinária Patologista', 'CRMV-CE 0002', 11, { email: 'helena@vetdevlab.exemplo' }),
    { ...novoMembro('residente'), id: 'p-bruno', nome: 'Bruno Teixeira', titulo: 'Médico Veterinário Residente em Patologia', crmv: 'CRMV-CE 0003', assinatura: assinaturaDeExemplo('Bruno Teixeira', 5) },
    { ...novoMembro('tecnico'), id: 'p-joana', nome: 'Joana Ribeiro', titulo: 'Técnica em histologia' },
    { ...novoMembro('recepcao'), id: 'p-lucas', nome: 'Lucas Martins', titulo: 'Recepção e entrada de amostras' },
  ];
}
