// Onde ficam os dados. Nesta demonstração, tudo fica guardado no navegador de quem usa.
// Para virar produto, basta trocar "carregar" e "gravar" por chamadas ao servidor.
import { useSyncExternalStore } from 'react';
import { dadosDeExemplo } from './seed.js';
import { uid, hoje, somaDiasUteis, dataDe } from './util.js';
import { valorInicial } from './campos.js';
import { prefixoDe, nomeCompleto } from './catalogo.js';
import { assinantesDoLaudo, nomesDe, equipeDeExemplo } from './equipe.js';

const CHAVE = 'vetdevlab:v2';
let estado = carregar();
const ouvintes = new Set();
let avisoEspaco = null;

function carregar() {
  try {
    const txt = localStorage.getItem(CHAVE);
    if (txt) {
      const d = JSON.parse(txt);
      if (d && d.versao === 2 && Array.isArray(d.entradas)) {
        // dados salvos antes de existir a Equipe
        if (!Array.isArray(d.lab.equipe)) d.lab.equipe = equipeDeExemplo();
        return d;
      }
    }
  } catch {
    /* navegador sem acesso ao armazenamento: segue só na memória */
  }
  return dadosDeExemplo();
}

let timer = null;
function gravar() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      avisoEspaco = null;
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) avisoEspaco = 'O navegador ficou sem espaço para guardar tudo (muitas fotos). As mudanças valem até fechar a página.';
    }
  }, 250);
}

function mudar(fn) {
  const novo = structuredClone(estado);
  fn(novo);
  estado = novo;
  gravar();
  ouvintes.forEach((o) => o());
}

export function useDados() {
  return useSyncExternalStore(
    (o) => (ouvintes.add(o), () => ouvintes.delete(o)),
    () => estado,
  );
}
export const pegar = () => estado;
export const pegarAvisoEspaco = () => avisoEspaco;

// ---------- Regras ----------
export function precoPara(exame, cliente) {
  if (!exame) return 0;
  const especial = cliente?.precos?.[exame.id];
  return especial !== undefined && especial !== null && especial !== '' ? Number(especial) : Number(exame.valor);
}

export function proximoNumero(prefixoExame, dataIso, entradas = estado.entradas) {
  const ano = String(dataDe(dataIso).getFullYear()).slice(2);
  const prefixo = `${prefixoExame} ${ano}-`;
  const maior = entradas
    .filter((e) => e.numero.startsWith(prefixo))
    .reduce((m, e) => Math.max(m, Number(e.numero.slice(prefixo.length)) || 0), 0);
  return prefixo + String(maior + 1).padStart(4, '0');
}

export const STATUS = {
  recebido: { nome: 'Recebido', curto: 'Recebido' },
  em_analise: { nome: 'Em análise', curto: 'Em análise' },
  liberado: { nome: 'Laudo liberado', curto: 'Liberado' },
  entregue: { nome: 'Entregue', curto: 'Entregue' },
  cancelado: { nome: 'Cancelado', curto: 'Cancelado' },
};

export const emAndamento = (e) => e.status === 'recebido' || e.status === 'em_analise';
export const atrasado = (e, h = hoje()) => emAndamento(e) && e.dataPrevista < h;
export const venceHoje = (e, h = hoje()) => emAndamento(e) && e.dataPrevista === h;

// ---------- Ações ----------
export const acoes = {
  // Entradas (um registro por exame)
  novaEntrada(dados, exameIds) {
    const criados = [];
    mudar((d) => {
      const cliente = d.clientes.find((c) => c.id === dados.clienteId);
      exameIds.forEach((exId) => {
        const exame = d.exames.find((x) => x.id === exId);
        const modelo = d.modelos.find((m) => m.id === exame.modeloId) || d.modelos[0];
        const valores = {};
        modelo?.campos.forEach((c) => (valores[c.id] = valorInicial(c)));
        const e = {
          id: uid('e'),
          numero: proximoNumero(prefixoDe(d.categorias, exame), dados.dataEntrada, d.entradas),
          exameId: exame.id, exameNome: nomeCompleto(exame), modeloId: modelo?.id || null,
          clienteId: cliente.id, clienteNome: cliente.nome,
          vet: { ...dados.vet }, tutor: { ...dados.tutor }, paciente: { ...dados.paciente },
          material: dados.material || '', historico: dados.historico || '',
          dataEntrada: dados.dataEntrada, prazo: exame.prazo,
          dataPrevista: somaDiasUteis(dados.dataEntrada, exame.prazo),
          valor: dados.valores?.[exId] ?? precoPara(exame, cliente),
          status: 'recebido',
          laudo: { valores, liberadoEm: null, liberadoPor: null },
          pagamento: dados.pagoNaHora ? { status: 'pago', pagoEm: dados.dataEntrada, forma: dados.formaPagamento || 'Pix' } : { status: 'pendente' },
          criadoEm: hoje(),
        };
        d.entradas.unshift(e);
        criados.push(e.id);
      });
    });
    return criados;
  },
  editarEntrada(id, campos) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      if (!e) return;
      Object.assign(e, campos);
      if (campos.clienteId) e.clienteNome = d.clientes.find((c) => c.id === campos.clienteId)?.nome || e.clienteNome;
      if (campos.dataEntrada || campos.prazo) e.dataPrevista = somaDiasUteis(e.dataEntrada, e.prazo);
    });
  },
  mudarStatus(id, status) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      if (!e) return;
      e.status = status;
      if (status === 'liberado' && !e.laudo.liberadoEm) {
        e.laudo.liberadoEm = hoje();
        const quem = assinantesDoLaudo(d.lab, e);
        e.laudo.assinantes = quem.map((m) => m.id);
        e.laudo.liberadoPor = nomesDe(quem);
      }
      if (status === 'em_analise' || status === 'recebido') {
        e.laudo.liberadoEm = null;
        e.laudo.liberadoPor = null;
      }
    });
  },
  excluirEntrada(id) {
    mudar((d) => {
      d.entradas = d.entradas.filter((x) => x.id !== id);
    });
  },
  // Laudo
  salvarValor(id, campoId, valor) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      if (!e) return;
      e.laudo.valores[campoId] = valor;
      if (e.status === 'recebido') e.status = 'em_analise';
    });
  },
  definirAssinantes(id, ids) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      if (e) e.laudo.assinantes = ids;
    });
  },
  salvarMembro(m) {
    mudar((d) => {
      d.lab.equipe = d.lab.equipe || [];
      const i = d.lab.equipe.findIndex((x) => x.id === m.id);
      if (i >= 0) d.lab.equipe[i] = m;
      else d.lab.equipe.push(m);
    });
  },
  excluirMembro(id) {
    mudar((d) => {
      d.lab.equipe = (d.lab.equipe || []).filter((x) => x.id !== id);
    });
  },
  trocarModelo(id, modeloId) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      const m = d.modelos.find((x) => x.id === modeloId);
      if (!e || !m) return;
      const antigos = e.laudo.valores;
      const valores = {};
      m.campos.forEach((c) => (valores[c.id] = antigos[c.id] !== undefined ? antigos[c.id] : valorInicial(c)));
      e.modeloId = modeloId;
      e.laudo.valores = valores;
    });
  },
  // Pagamentos
  marcarPago(ids, forma = 'Pix', data = hoje()) {
    mudar((d) => {
      d.entradas.forEach((e) => {
        if (ids.includes(e.id)) e.pagamento = { status: 'pago', pagoEm: data, forma };
      });
    });
  },
  desfazerPagamento(id) {
    mudar((d) => {
      const e = d.entradas.find((x) => x.id === id);
      if (e) e.pagamento = { status: 'pendente' };
    });
  },
  // Modelos
  salvarModelo(modelo) {
    mudar((d) => {
      const i = d.modelos.findIndex((m) => m.id === modelo.id);
      const m = { ...modelo, atualizadoEm: hoje() };
      if (i >= 0) d.modelos[i] = m;
      else d.modelos.push(m);
    });
  },
  excluirModelo(id) {
    mudar((d) => {
      d.modelos = d.modelos.filter((m) => m.id !== id);
      d.exames.forEach((x) => {
        if (x.modeloId === id) x.modeloId = null;
      });
    });
  },
  // Tabela de exames
  salvarExame(exame, motivo) {
    mudar((d) => {
      const i = d.exames.findIndex((x) => x.id === exame.id);
      if (i >= 0) {
        const antes = d.exames[i];
        const hist = [...(antes.historico || [])];
        if (Number(antes.valor) !== Number(exame.valor)) hist.push({ data: hoje(), valor: Number(exame.valor), motivo: motivo || 'Ajuste manual' });
        d.exames[i] = { ...exame, valor: Number(exame.valor), prazo: Number(exame.prazo), prazoMin: Number(exame.prazoMin) || 0, historico: hist };
      } else {
        d.exames.push({ ...exame, valor: Number(exame.valor), prazo: Number(exame.prazo), prazoMin: Number(exame.prazoMin) || 0, historico: [{ data: hoje(), valor: Number(exame.valor), motivo: 'Exame criado' }] });
      }
    });
  },
  salvarCategoria(c) {
    mudar((d) => {
      const i = d.categorias.findIndex((x) => x.id === c.id);
      if (i >= 0) d.categorias[i] = c;
      else d.categorias.push(c);
    });
  },
  excluirCategoria(id) {
    mudar((d) => {
      d.categorias = d.categorias.filter((x) => x.id !== id);
    });
  },
  moverCategoria(id, passo) {
    mudar((d) => {
      const i = d.categorias.findIndex((x) => x.id === id);
      const j = i + passo;
      if (i < 0 || j < 0 || j >= d.categorias.length) return;
      [d.categorias[i], d.categorias[j]] = [d.categorias[j], d.categorias[i]];
    });
  },
  reajusteEmLote(novosValores, motivo) {
    mudar((d) => {
      d.exames.forEach((x) => {
        if (novosValores[x.id] !== undefined && Number(novosValores[x.id]) !== Number(x.valor)) {
          x.valor = Number(novosValores[x.id]);
          x.historico = [...(x.historico || []), { data: hoje(), valor: x.valor, motivo }];
        }
      });
    });
  },
  // Clientes
  salvarCliente(cliente) {
    mudar((d) => {
      const i = d.clientes.findIndex((c) => c.id === cliente.id);
      if (i >= 0) d.clientes[i] = cliente;
      else d.clientes.push(cliente);
      d.entradas.forEach((e) => {
        if (e.clienteId === cliente.id) e.clienteNome = cliente.nome;
      });
    });
  },
  // Laboratório
  salvarLab(lab) {
    mudar((d) => {
      d.lab = lab;
    });
  },
  restaurarExemplo() {
    estado = dadosDeExemplo();
    gravar();
    ouvintes.forEach((o) => o());
  },
  comecarDoZero() {
    const ex = dadosDeExemplo();
    estado = { ...ex, entradas: [], clientes: ex.clientes.filter((c) => c.tipo === 'particular') };
    gravar();
    ouvintes.forEach((o) => o());
  },
  importar(dados) {
    if (!dados || dados.versao !== 2 || !Array.isArray(dados.entradas)) throw new Error('Arquivo de cópia inválido ou de uma versão antiga do sistema.');
    if (!Array.isArray(dados.lab?.equipe)) dados.lab.equipe = equipeDeExemplo();
    estado = dados;
    gravar();
    ouvintes.forEach((o) => o());
  },
};
