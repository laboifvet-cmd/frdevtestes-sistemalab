// Página principal: o resumo do dia.
import { useMemo, useState } from 'react';
import { useDados, emAndamento, atrasado, venceHoje } from '../store.js';
import { Icone, Kpi, Vazio, ir } from '../ui.jsx';
import { real, realCurto, hoje, dataExtenso, diaSemana, mesDe, mesAnterior, mesNome, somaDias, ehDiaUtil, dataCurta, plural } from '../util.js';
import { ChipStatus, ChipPrazo } from './comum.jsx';
import NovaEntrada from './NovaEntrada.jsx';

function GraficoEntradas({ entradas }) {
  const h = hoje();
  const dias = [];
  for (let i = 20; i >= 0 && dias.length < 12; i--) {
    const d = somaDias(h, -i);
    if (ehDiaUtil(d) || d === h) dias.push(d);
  }
  const contas = dias.map((d) => entradas.filter((e) => e.dataEntrada === d).length);
  const max = Math.max(1, ...contas);
  const W = 100 / dias.length;
  return (
    <div className="grafico-barras" role="img" aria-label={`Entradas por dia útil: ${contas.join(', ')}`}>
      <div className="grafico-barras__area">
        {[0.5, 1].map((g) => <span key={g} className="grafico-barras__grade" style={{ bottom: g * 100 + '%' }} />)}
        {contas.map((c, i) => (
          <div key={dias[i]} className={'grafico-barras__col' + (dias[i] === h ? ' hoje' : '')} style={{ width: W + '%' }}>
            <span className="grafico-barras__valor">{c || ''}</span>
            <span className="grafico-barras__barra" style={{ height: (c / max) * 100 + '%' }} />
          </div>
        ))}
      </div>
      <div className="grafico-barras__eixo">
        {dias.map((d, i) => <span key={d} style={{ width: W + '%' }}>{i % 2 === (dias.length - 1) % 2 ? dataCurta(d).split(' ')[0] : ''}</span>)}
      </div>
    </div>
  );
}

export default function Painel() {
  const { entradas, clientes } = useDados();
  const [nova, setNova] = useState(false);
  const h = hoje();
  const mes = mesDe(h);

  const r = useMemo(() => {
    const ativos = entradas.filter((e) => e.status !== 'cancelado');
    const andamento = ativos.filter(emAndamento).sort((a, b) => (a.dataPrevista < b.dataPrevista ? -1 : 1));
    const atras = andamento.filter((e) => atrasado(e, h));
    const hojeVence = andamento.filter((e) => venceHoje(e, h));
    const liberadosHoje = ativos.filter((e) => e.laudo.liberadoEm === h);
    const prontosNaoEntregues = ativos.filter((e) => e.status === 'liberado');
    const doMes = ativos.filter((e) => mesDe(e.dataEntrada) === mes);
    const mesPassado = mesAnterior(mes);
    // compara com o mesmo período do mês passado
    const diaHoje = Number(h.slice(8));
    const doMesPassadoAteHoje = ativos.filter((e) => mesDe(e.dataEntrada) === mesPassado && Number(e.dataEntrada.slice(8)) <= diaHoje);
    const faturado = doMes.reduce((s, e) => s + e.valor, 0);
    const faturadoAntes = doMesPassadoAteHoje.reduce((s, e) => s + e.valor, 0);
    const aReceber = ativos.filter((e) => e.pagamento.status !== 'pago').reduce((s, e) => s + e.valor, 0);
    const porCliente = {};
    doMes.forEach((e) => (porCliente[e.clienteId] = (porCliente[e.clienteId] || 0) + e.valor));
    const topClientes = Object.entries(porCliente).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const entradasHoje = ativos.filter((e) => e.dataEntrada === h).length;
    return { andamento, atras, hojeVence, liberadosHoje, prontosNaoEntregues, doMes, faturado, faturadoAntes, aReceber, topClientes, entradasHoje };
  }, [entradas, h, mes]);

  const variacao = r.faturadoAntes ? Math.round(((r.faturado - r.faturadoAntes) / r.faturadoAntes) * 100) : null;
  const maxCli = r.topClientes[0]?.[1] || 1;

  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Painel</h1>
          <p className="suave">
            <span className="olho">{diaSemana(h)}, {dataExtenso(h)}</span>
            {' · '}{r.entradasHoje ? plural(r.entradasHoje, 'entrada hoje', 'entradas hoje') : 'nenhuma entrada hoje'}
          </p>
        </div>
        <div className="tela__acoes">
          <button className="botao botao--primario" onClick={() => setNova(true)}><Icone nome="mais" /> Nova entrada</button>
        </div>
      </header>

      {r.atras.length > 0 && (
        <button className="faixa-alerta" onClick={() => ir('laudos')}>
          <Icone nome="alerta" tam={16} />
          <span><strong>{plural(r.atras.length, 'laudo atrasado', 'laudos atrasados')}.</strong> O mais antigo venceu em {dataCurta(r.atras[0].dataPrevista)}: <span className="mono">{r.atras[0].numero}</span>, {r.atras[0].paciente.nome}.</span>
          <span className="faixa-alerta__ir">Abrir fila →</span>
        </button>
      )}

      <section className="kpis" aria-label="Resumo">
        <Kpi rotulo="Em andamento" valor={r.andamento.length} sub={r.hojeVence.length ? `${r.hojeVence.length} ${r.hojeVence.length === 1 ? 'vence' : 'vencem'} hoje` : 'nenhum vence hoje'} tom={r.atras.length ? 'alerta' : undefined} onClick={() => ir('laudos')} />
        <Kpi rotulo="Liberados hoje" valor={r.liberadosHoje.length} sub={`${r.prontosNaoEntregues.length} prontos para entregar`} onClick={() => ir('exames-liberado')} />
        <Kpi rotulo={`Faturado em ${mesNome(mes).split(' ')[0]}`} valor={real(r.faturado)} sub={variacao === null ? `${r.doMes.length} exames` : `${variacao >= 0 ? '+' : ''}${variacao}% vs. mesmo período do mês anterior`} tom={variacao !== null && variacao < 0 ? 'baixa' : variacao > 0 ? 'alta' : undefined} onClick={() => ir('financeiro')} />
        <Kpi rotulo="A receber" valor={real(r.aReceber)} sub="exames ainda não pagos" onClick={() => ir('financeiro')} />
      </section>

      <div className="grade-painel">
        <section className="cartao">
          <header className="cartao__topo">
            <h2>Próximos prazos <span className="suave">{r.andamento.length}</span></h2>
            <a className="link" href="#laudos">Ver fila completa →</a>
          </header>
          {r.andamento.length === 0 ? (
            <Vazio icone="check" titulo="Nenhum laudo pendente" texto="Quando um exame der entrada, ele aparece aqui pela ordem do prazo." acao={<button className="botao" onClick={() => setNova(true)}>Dar entrada em um exame</button>} />
          ) : (
            <ul className="lista-prazos">
              {r.andamento.slice(0, 7).map((e) => (
                <li key={e.id}>
                  <a href={'#laudo-' + e.id} className="lista-prazos__linha">
                    <ChipPrazo e={e} />
                    <span className="lista-prazos__meio">
                      <strong>{e.paciente.nome} <span className="suave">· {e.paciente.especie}</span></strong>
                      <span className="meta"><span className="mono">{e.numero}</span> · {e.exameNome} · {e.clienteNome}</span>
                    </span>
                    <ChipStatus status={e.status} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {r.andamento.length > 7 && <a className="cartao__mais" href="#laudos">Ver os outros {r.andamento.length - 7}</a>}
        </section>

        <div className="coluna">
          <section className="cartao">
            <header className="cartao__topo">
              <h2>Entradas por dia</h2>
              <span className="suave">últimos 12 dias úteis</span>
            </header>
            <GraficoEntradas entradas={entradas} />
          </section>
          <section className="cartao">
            <header className="cartao__topo">
              <h2>Clientes do mês</h2>
              <span className="suave">{mesNome(mes)}</span>
            </header>
            {r.topClientes.length === 0 ? (
              <p className="suave">Ainda sem exames neste mês.</p>
            ) : (
              <ul className="barras-h">
                {r.topClientes.map(([id, v]) => (
                  <li key={id}>
                    <span className="barras-h__nome">{clientes.find((c) => c.id === id)?.nome || '—'}</span>
                    <span className="barras-h__trilho"><span style={{ width: (v / maxCli) * 100 + '%' }} /></span>
                    <span className="barras-h__valor">{realCurto(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>


      <NovaEntrada aberta={nova} onFechar={() => setNova(false)} />
    </div>
  );
}

