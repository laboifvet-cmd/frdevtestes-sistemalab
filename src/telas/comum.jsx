// Peças usadas por várias telas de exames e laudos.
import { STATUS, atrasado, venceHoje } from '../store.js';
import { hoje, difDias, dataCurta, ehDiaUtil, somaDias } from '../util.js';
import { Icone } from '../ui.jsx';

export function ChipStatus({ status }) {
  return <span className={'chip chip--' + status}>{STATUS[status]?.curto || status}</span>;
}

// dias úteis até o prazo (negativo = atrasado)
export function diasUteisAte(iso, h = hoje()) {
  if (iso === h) return 0;
  let n = 0;
  if (iso > h) {
    for (let d = h; d < iso; ) { d = somaDias(d, 1); if (ehDiaUtil(d)) n++; }
    return n;
  }
  for (let d = h; d > iso; ) { if (ehDiaUtil(d)) n--; d = somaDias(d, -1); }
  return n;
}

export function ChipPrazo({ e }) {
  const h = hoje();
  if (e.status === 'liberado' || e.status === 'entregue') {
    const noPrazo = (e.laudo.liberadoEm || h) <= e.dataPrevista;
    return <span className={'prazo ' + (noPrazo ? 'prazo--ok' : 'prazo--tarde')}><Icone nome="check" tam={14} />{noPrazo ? 'no prazo' : 'após o prazo'}</span>;
  }
  if (atrasado(e, h)) {
    const d = Math.abs(diasUteisAte(e.dataPrevista, h));
    return <span className="prazo prazo--atraso"><Icone nome="alerta" tam={14} />{d <= 1 ? '1 dia útil' : d + ' dias úteis'} de atraso</span>;
  }
  if (venceHoje(e, h)) return <span className="prazo prazo--hoje"><Icone nome="relogio" tam={14} />vence hoje</span>;
  const d = diasUteisAte(e.dataPrevista, h);
  return <span className={'prazo' + (d === 1 ? ' prazo--perto' : '')}><Icone nome="relogio" tam={14} />{d === 1 ? 'amanhã' : `até ${dataCurta(e.dataPrevista)}`}</span>;
}

export const progresso = (modelo, valores) => {
  if (!modelo) return { feitos: 0, total: 0 };
  const obrig = modelo.campos.filter((c) => c.obrigatorio);
  const feitos = obrig.filter((c) => {
    const v = valores[c.id];
    return Array.isArray(v) ? v.length : String(v ?? '').trim();
  }).length;
  return { feitos, total: obrig.length };
};

export { difDias };
