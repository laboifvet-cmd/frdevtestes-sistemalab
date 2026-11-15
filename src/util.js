// Utilidades: dinheiro, datas, dias úteis, ids e textos.

export const real = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const realCurto = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
  return real(n);
};

// Aceita "1.200,50", "1200.5", "R$ 90"
export function numBR(txt) {
  if (typeof txt === 'number') return txt;
  let s = String(txt || '').replace(/[^\d,.-]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export const semAcento = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- Datas (sempre texto AAAA-MM-DD, sem fuso) ----------
const pad = (n) => String(n).padStart(2, '0');
export const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dataDe = (iso) => {
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1, 12);
};
export const hoje = () => isoDe(new Date());
export const somaDias = (iso, n) => {
  const d = dataDe(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
};
export const difDias = (a, b) => Math.round((dataDe(b) - dataDe(a)) / 86400000);

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export const dataBR = (iso) => (iso ? dataDe(iso).toLocaleDateString('pt-BR') : '—');
export const dataCurta = (iso) => {
  if (!iso) return '—';
  const d = dataDe(iso);
  return `${d.getDate()} ${MESES_C[d.getMonth()]}`;
};
export const dataExtenso = (iso) => {
  const d = dataDe(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};
export const diaSemana = (iso) => SEMANA[dataDe(iso).getDay()];
export const mesNome = (aaaamm) => {
  const [a, m] = aaaamm.split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
};
export const mesCurto = (aaaamm) => {
  const [a, m] = aaaamm.split('-').map(Number);
  return `${MESES_C[m - 1]}/${String(a).slice(2)}`;
};
export const mesDe = (iso) => String(iso || '').slice(0, 7);
export const mesAnterior = (aaaamm, n = 1) => {
  const [a, m] = aaaamm.split('-').map(Number);
  const d = new Date(a, m - 1 - n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// Quanto tempo atrás, em palavras
export function quando(iso) {
  const d = difDias(iso, hoje());
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d === -1) return 'amanhã';
  if (d > 1) return `há ${d} dias`;
  return `em ${-d} dias`;
}

// ---------- Feriados nacionais e dias úteis ----------
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDe(new Date(ano, mes - 1, dia, 12));
}
const cacheFeriados = {};
export function feriados(ano) {
  if (cacheFeriados[ano]) return cacheFeriados[ano];
  const p = pascoa(ano);
  const fixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].map((x) => `${ano}-${x}`);
  const moveis = [somaDias(p, -48), somaDias(p, -47), somaDias(p, -2), somaDias(p, 60)]; // carnaval (2), sexta santa, corpus christi
  return (cacheFeriados[ano] = new Set([...fixos, ...moveis]));
}
export const ehDiaUtil = (iso) => {
  const d = dataDe(iso).getDay();
  return d !== 0 && d !== 6 && !feriados(dataDe(iso).getFullYear()).has(iso);
};
export function somaDiasUteis(iso, n) {
  let d = iso;
  let falta = n;
  while (falta > 0) {
    d = somaDias(d, 1);
    if (ehDiaUtil(d)) falta--;
  }
  return d;
}

// ---------- Arquivos ----------
export function lerArquivoComoDataURL(arquivo, maxLado = 1600, qualidade = 0.86) {
  return new Promise((ok, erro) => {
    const r = new FileReader();
    r.onerror = () => erro(new Error('Não foi possível ler o arquivo.'));
    r.onload = () => {
      if (!/^image\//.test(arquivo.type) || arquivo.type === 'image/svg+xml') return ok(r.result);
      const img = new Image();
      img.onload = () => {
        const esc = Math.min(1, maxLado / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * esc);
        c.height = Math.round(img.height * esc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(arquivo.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = () => erro(new Error('Imagem inválida.'));
      img.src = r.result;
    };
    r.readAsDataURL(arquivo);
  });
}

// Salva um arquivo: no link de teste usa a janela de download do Claude; no site normal, baixa direto.
export async function salvarArquivo(nome, blob) {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) {
        await dl.save({ filename: nome, data: blob });
        return 'salvo';
      }
    }
  } catch (e) {
    if (e && e.code === 'declined') return 'cancelado';
    if (e && e.code && !['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].includes(e.code)) throw e;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'salvo';
}

export const nomeArquivo = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Código de verificação do laudo (só para mostrar; não é segurança)
export function codigoVerificacao(txt) {
  let h = 2166136261;
  for (const ch of String(txt)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const s = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return s.slice(0, 4) + '-' + s.slice(4);
}
