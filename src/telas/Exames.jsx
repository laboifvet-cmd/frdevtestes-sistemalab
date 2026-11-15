// Lista de todos os exames recebidos, com filtros, e a ficha de cada um.
import { useMemo, useState } from 'react';
import { useDados, acoes, emAndamento, atrasado, STATUS } from '../store.js';
import { Icone, Folha, Vazio, Confirmar, useAviso, useLargura } from '../ui.jsx';
import { real, hoje, dataBR, dataCurta, mesDe, mesAnterior, somaDias, semAcento, plural, quando } from '../util.js';
import { ChipStatus, ChipPrazo } from './comum.jsx';
import NovaEntrada from './NovaEntrada.jsx';

const FILTROS = [
  { valor: 'todos', nome: 'Todos' },
  { valor: 'andamento', nome: 'Em andamento' },
  { valor: 'atrasado', nome: 'Atrasados' },
  { valor: 'liberado', nome: 'Liberados' },
  { valor: 'entregue', nome: 'Entregues' },
];
const PERIODOS = [
  { valor: 'mes', nome: 'Este mês' },
  { valor: 'passado', nome: 'Mês passado' },
  { valor: '30', nome: 'Últimos 30 dias' },
  { valor: 'tudo', nome: 'Tudo' },
];

function passa(e, filtro, h) {
  if (filtro === 'andamento') return emAndamento(e);
  if (filtro === 'atrasado') return atrasado(e, h);
  if (filtro === 'liberado') return e.status === 'liberado';
  if (filtro === 'entregue') return e.status === 'entregue';
  return true;
}

export function Ficha({ entrada, onFechar }) {
  const { modelos } = useDados();
  const avisar = useAviso();
  const [editar, setEditar] = useState(false);
  const [excluir, setExcluir] = useState(false);
  if (!entrada) return null;
  const e = entrada;
  const modelo = modelos.find((m) => m.id === e.modeloId);
  const passos = ['recebido', 'em_analise', 'liberado', 'entregue'];
  const atual = passos.indexOf(e.status);
  return (
    <>
      <Folha
        aberta={!!entrada && !editar}
        onFechar={onFechar}
        titulo={`${e.paciente.nome} · ${e.exameNome}`}
        sub={<><span className="mono">{e.numero}</span> · entrou {quando(e.dataEntrada)} ({dataBR(e.dataEntrada)})</>}
        rodape={
          <>
            <button className="botao botao--fantasma botao--perigo-txt" onClick={() => setExcluir(true)}><Icone nome="lixo" /> Excluir</button>
            <span className="espaco" />
            {e.status === 'liberado' && <button className="botao" onClick={() => { acoes.mudarStatus(e.id, 'entregue'); avisar('Marcado como entregue.'); }}><Icone nome="enviar" /> Marcar entregue</button>}
            <a className="botao botao--primario" href={'#laudo-' + e.id}><Icone nome="laudos" /> {emAndamento(e) ? 'Fazer laudo' : 'Abrir laudo'}</a>
          </>
        }
      >
        <ol className="etapas" aria-label="Andamento">
          {passos.map((p, i) => (
            <li key={p} className={i < atual ? 'feita' : i === atual ? 'atual' : ''}>
              <span className="etapas__ponto">{i < atual ? <Icone nome="check" tam={14} /> : i + 1}</span>
              <span>{STATUS[p].curto}</span>
            </li>
          ))}
        </ol>
        <p className="ficha-prazo"><ChipPrazo e={e} /> <span className="suave">Prazo: {dataBR(e.dataPrevista)} ({e.prazo} {e.prazo === 1 ? 'dia útil' : 'dias úteis'})</span></p>

        <dl className="ficha-dados">
          <div><dt>Paciente</dt><dd>{e.paciente.nome} · {[e.paciente.especie, e.paciente.raca, e.paciente.sexo, e.paciente.idade].filter(Boolean).join(' · ')}</dd></div>
          <div><dt>Tutor(a)</dt><dd>{e.tutor.nome || '—'}{e.tutor.telefone && <span className="suave"> · {e.tutor.telefone}</span>}</dd></div>
          <div><dt>Clínica</dt><dd>{e.clienteNome}</dd></div>
          <div><dt>Requisitante</dt><dd>{e.vet.nome || '—'}{e.vet.crmv && <span className="suave"> · {e.vet.crmv}</span>}</dd></div>
          <div><dt>Material</dt><dd>{e.material || '—'}</dd></div>
          <div><dt>Modelo do laudo</dt><dd>{modelo?.nome || 'Sem modelo'}</dd></div>
          {e.historico && <div className="largo"><dt>Histórico clínico</dt><dd>{e.historico}</dd></div>}
        </dl>
        <button className="botao botao--fantasma botao--peq" onClick={() => setEditar(true)}><Icone nome="editar" tam={16} /> Corrigir dados da entrada</button>

        <div className="ficha-pag">
          <div>
            <span className="rotulo">Valor</span>
            <strong className="ficha-pag__valor">{real(e.valor)}</strong>
          </div>
          {e.pagamento.status === 'pago' ? (
            <div className="ficha-pag__estado">
              <span className="chip chip--pago">Pago</span>
              <span className="suave">{e.pagamento.forma} · {dataBR(e.pagamento.pagoEm)}</span>
              <button className="botao botao--fantasma botao--peq" onClick={() => { acoes.desfazerPagamento(e.id); avisar('Pagamento desfeito.'); }}>Desfazer</button>
            </div>
          ) : (
            <div className="ficha-pag__estado">
              <span className="chip chip--pendente">A receber</span>
              <button className="botao botao--peq" onClick={() => { acoes.marcarPago([e.id]); avisar('Pagamento registrado.'); }}><Icone nome="check" tam={16} /> Recebi (Pix)</button>
            </div>
          )}
        </div>
      </Folha>
      <NovaEntrada aberta={editar} editar={e} onFechar={() => setEditar(false)} />
      <Confirmar
        aberta={excluir}
        titulo={`Excluir ${e.numero}?`}
        texto="O exame, o laudo e o valor saem do sistema. Use só para entrada lançada por engano."
        botao="Excluir"
        perigo
        onNao={() => setExcluir(false)}
        onSim={() => { acoes.excluirEntrada(e.id); setExcluir(false); onFechar(); avisar('Exame excluído.'); }}
      />
    </>
  );
}

export default function Exames({ rota }) {
  const { entradas, clientes, exames } = useDados();
  const larg = useLargura();
  const h = hoje();
  const inicial = rota.split('-')[1];
  const [filtro, setFiltro] = useState(FILTROS.some((f) => f.valor === inicial) ? inicial : 'todos');
  const [periodo, setPeriodo] = useState(inicial ? 'tudo' : 'mes');
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState('');
  const [exame, setExame] = useState('');
  const [nova, setNova] = useState(inicial === 'nova');
  const [aberta, setAberta] = useState(null);

  const base = useMemo(() => {
    const termo = semAcento(busca.trim());
    const mes = mesDe(h);
    return entradas.filter((e) => {
      if (periodo === 'mes' && mesDe(e.dataEntrada) !== mes) return false;
      if (periodo === 'passado' && mesDe(e.dataEntrada) !== mesAnterior(mes)) return false;
      if (periodo === '30' && e.dataEntrada < somaDias(h, -30)) return false;
      if (cliente && e.clienteId !== cliente) return false;
      if (exame && e.exameId !== exame) return false;
      if (termo) {
        const txt = semAcento([e.numero, e.paciente.nome, e.tutor.nome, e.clienteNome, e.exameNome, e.vet.nome, e.material].join(' '));
        if (!termo.split(/\s+/).every((p) => txt.includes(p))) return false;
      }
      return true;
    });
  }, [entradas, busca, periodo, cliente, exame, h]);

  const lista = base.filter((e) => passa(e, filtro, h));
  const total = lista.reduce((s, e) => s + e.valor, 0);
  const contas = Object.fromEntries(FILTROS.map((f) => [f.valor, base.filter((e) => passa(e, f.valor, h)).length]));
  const abertaEntrada = entradas.find((e) => e.id === aberta);
  const filtrosAtivos = busca || cliente || exame || filtro !== 'todos' || periodo !== 'mes';

  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Exames</h1>
          <p className="suave">{plural(entradas.filter(emAndamento).length, 'em andamento', 'em andamento')} · {plural(entradas.length, 'exame no total', 'exames no total')}</p>
        </div>
        <div className="tela__acoes">
          <button className="botao botao--primario" onClick={() => setNova(true)}><Icone nome="mais" /> Nova entrada</button>
        </div>
      </header>

      <section className="filtros" aria-label="Filtros">
        <div className="busca">
          <Icone nome="busca" tam={18} />
          <input type="search" aria-label="Buscar" placeholder="Buscar por nº, paciente, tutor ou clínica" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select aria-label="Período" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.nome}</option>)}
        </select>
        <select aria-label="Clínica" value={cliente} onChange={(e) => setCliente(e.target.value)}>
          <option value="">Todas as clínicas</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select aria-label="Exame" value={exame} onChange={(e) => setExame(e.target.value)}>
          <option value="">Todos os exames</option>
          {exames.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </section>
      <div className="chips-filtro" role="group" aria-label="Situação">
        {FILTROS.map((f) => (
          <button key={f.valor} className={'chip-filtro' + (filtro === f.valor ? ' ativo' : '') + (f.valor === 'atrasado' && contas.atrasado ? ' alerta' : '')} aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>
            {f.nome} <span>{contas[f.valor]}</span>
          </button>
        ))}
        {filtrosAtivos && <button className="botao botao--fantasma botao--peq" onClick={() => { setBusca(''); setCliente(''); setExame(''); setFiltro('todos'); setPeriodo('mes'); }}>Limpar filtros</button>}
      </div>

      {lista.length === 0 ? (
        <Vazio icone="busca" titulo="Nenhum exame encontrado" texto={filtrosAtivos ? 'Tente outro período ou limpe os filtros.' : 'Registre a primeira amostra recebida.'} acao={<button className="botao" onClick={() => setNova(true)}>Nova entrada</button>} />
      ) : larg > 900 ? (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nº</th><th>Entrada</th><th>Paciente</th><th>Exame</th><th>Clínica</th><th>Prazo</th><th>Situação</th><th className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id} className="clicavel" onClick={() => setAberta(e.id)}>
                  <td><button className="link-linha mono" onClick={() => setAberta(e.id)}>{e.numero}</button></td>
                  <td>{dataCurta(e.dataEntrada)}</td>
                  <td><strong>{e.paciente.nome}</strong><span className="meta">{e.paciente.especie}{e.tutor.nome ? ' · ' + e.tutor.nome : ''}</span></td>
                  <td>{e.exameNome}</td>
                  <td>{e.clienteNome}</td>
                  <td><ChipPrazo e={e} /></td>
                  <td><ChipStatus status={e.status} /></td>
                  <td className="num">{real(e.valor)}{e.pagamento.status !== 'pago' && <span className="meta">a receber</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={7}>{plural(lista.length, 'exame', 'exames')}</td><td className="num">{real(total)}</td></tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <>
          <ul className="cartoes">
            {lista.map((e) => (
              <li key={e.id}>
                <button className="cartao-exame" onClick={() => setAberta(e.id)}>
                  <span className="cartao-exame__topo">
                    <span className="mono">{e.numero}</span>
                    <ChipStatus status={e.status} />
                  </span>
                  <strong>{e.paciente.nome} <span className="suave">· {e.paciente.especie}</span></strong>
                  <span className="meta">{e.exameNome} · {e.clienteNome}</span>
                  <span className="cartao-exame__pe">
                    <ChipPrazo e={e} />
                    <span className="mono">{real(e.valor)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="total-lista">{plural(lista.length, 'exame', 'exames')} · <strong>{real(total)}</strong></p>
        </>
      )}

      <NovaEntrada aberta={nova} onFechar={() => setNova(false)} />
      {abertaEntrada && <Ficha entrada={abertaEntrada} onFechar={() => setAberta(null)} />}
    </div>
  );
}
