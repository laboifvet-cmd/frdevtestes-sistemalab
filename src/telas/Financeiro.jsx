// Financeiro: resumo, a receber (fechamento por clínica), tabela de exames e clientes.
import { useMemo, useState, useEffect } from 'react';
import { useDados, acoes } from '../store.js';
import { Icone, Segmento, Kpi, Vazio, Folha, Campo, Interruptor, Confirmar, Ajuda, useAviso } from '../ui.jsx';
import { real, realCurto, hoje, mesDe, mesAnterior, mesNome, mesCurto, dataBR, dataCurta, plural, numBR, uid, nomeArquivo, semAcento } from '../util.js';
import { prazoTexto, valorTexto, nomeCompleto, CORES_CATEGORIA } from '../catalogo.js';
import { TabelaPrecos, Fatura } from '../papel.jsx';
import { gerarPdf } from '../pdf.js';

const FORMAS = ['Pix', 'Transferência', 'Boleto', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro'];

// ---------- Resumo ----------
function Resumo({ entradas, exames }) {
  const h = hoje();
  const mes = mesDe(h);
  const meses = [5, 4, 3, 2, 1, 0].map((n) => mesAnterior(mes, n));
  const ativos = entradas.filter((e) => e.status !== 'cancelado');
  const fat = meses.map((m) => ativos.filter((e) => mesDe(e.dataEntrada) === m).reduce((s, e) => s + e.valor, 0));
  const rec = meses.map((m) => ativos.filter((e) => e.pagamento.status === 'pago' && mesDe(e.pagamento.pagoEm) === m).reduce((s, e) => s + e.valor, 0));
  const max = Math.max(1, ...fat, ...rec);
  const doMes = ativos.filter((e) => mesDe(e.dataEntrada) === mes);
  const faturado = fat.at(-1);
  const recebido = rec.at(-1);
  const aReceber = ativos.filter((e) => e.pagamento.status !== 'pago').reduce((s, e) => s + e.valor, 0);
  const vencido = ativos.filter((e) => e.pagamento.status !== 'pago' && mesDe(e.dataEntrada) < mes).reduce((s, e) => s + e.valor, 0);
  const porExame = exames.map((x) => {
    const l = doMes.filter((e) => e.exameId === x.id);
    return { x, n: l.length, v: l.reduce((s, e) => s + e.valor, 0) };
  }).filter((r) => r.n).sort((a, b) => b.v - a.v);
  return (
    <>
      <section className="kpis">
        <Kpi rotulo={`Faturado em ${mesNome(mes).split(' ')[0]}`} valor={real(faturado)} sub={`${plural(doMes.length, 'exame', 'exames')} · ticket médio ${real(doMes.length ? faturado / doMes.length : 0)}`} />
        <Kpi rotulo="Recebido no mês" valor={real(recebido)} sub="pagamentos registrados neste mês" />
        <Kpi rotulo="A receber" valor={real(aReceber)} sub="todos os exames não pagos" />
        <Kpi rotulo="Em atraso" valor={real(vencido)} sub="de meses anteriores" tom={vencido ? 'alerta' : undefined} />
      </section>
      <div className="grade-painel">
        <section className="cartao">
          <header className="cartao__topo">
            <h2>Faturado e recebido</h2>
            <span className="legenda"><i className="leg leg--fat" /> faturado <i className="leg leg--rec" /> recebido</span>
          </header>
          <div className="grafico-duplo" role="img" aria-label={meses.map((m, i) => `${mesCurto(m)}: faturado ${real(fat[i])}, recebido ${real(rec[i])}`).join('; ')}>
            {meses.map((m, i) => (
              <div key={m} className={'grafico-duplo__mes' + (m === mes ? ' atual' : '')}>
                <div className="grafico-duplo__barras">
                  <span className="b-fat" style={{ height: (fat[i] / max) * 100 + '%' }} title={real(fat[i])} />
                  <span className="b-rec" style={{ height: (rec[i] / max) * 100 + '%' }} title={real(rec[i])} />
                </div>
                <span className="grafico-duplo__valor">{fat[i] ? realCurto(fat[i]) : '—'}</span>
                <span className="grafico-duplo__nome">{mesCurto(m)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="cartao">
          <header className="cartao__topo"><h2>Por exame em {mesNome(mes).split(' ')[0]}</h2></header>
          {porExame.length === 0 ? <p className="suave">Sem exames neste mês.</p> : (
            <table className="tabela tabela--compacta">
              <thead><tr><th>Exame</th><th className="num">Qtd.</th><th className="num">Valor</th></tr></thead>
              <tbody>
                {porExame.map((r) => <tr key={r.x.id}><td>{nomeCompleto(r.x)}</td><td className="num">{r.n}</td><td className="num">{real(r.v)}</td></tr>)}
              </tbody>
              <tfoot><tr><td>Total</td><td className="num">{doMes.length}</td><td className="num">{real(faturado)}</td></tr></tfoot>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

// ---------- A receber ----------
function AReceber({ entradas, clientes, lab }) {
  const avisar = useAviso();
  const h = hoje();
  const meses = [...new Set(entradas.map((e) => mesDe(e.dataEntrada)))].sort().reverse();
  const [mes, setMes] = useState(mesAnterior(mesDe(h)));
  const [cli, setCli] = useState('');
  const [sit, setSit] = useState('pendente');
  const [receber, setReceber] = useState(null);
  const [forma, setForma] = useState('Pix');
  const [gerando, setGerando] = useState(null);

  const lista = entradas.filter((e) => e.status !== 'cancelado' && (!mes || mesDe(e.dataEntrada) === mes) && (!cli || e.clienteId === cli) && (sit === 'todos' || (sit === 'pago' ? e.pagamento.status === 'pago' : e.pagamento.status !== 'pago')));
  const grupos = clientes.map((c) => ({ c, itens: lista.filter((e) => e.clienteId === c.id).sort((a, b) => (a.dataEntrada < b.dataEntrada ? -1 : 1)) })).filter((g) => g.itens.length);
  const total = lista.reduce((s, e) => s + e.valor, 0);

  const fatura = async (c) => {
    setGerando(c.id);
    try {
      const itens = entradas.filter((e) => e.status !== 'cancelado' && e.clienteId === c.id && mesDe(e.dataEntrada) === mes).sort((a, b) => (a.dataEntrada < b.dataEntrada ? -1 : 1));
      const r = await gerarPdf(<Fatura lab={lab} cliente={c} mes={mes} itens={itens} />, `Fechamento-${nomeArquivo(c.nome)}-${mes}.pdf`);
      if (r === 'salvo') avisar('Fechamento em PDF pronto.');
    } catch (err) {
      console.error(err);
      avisar('Não foi possível gerar o PDF.', 'erro');
    } finally {
      setGerando(null);
    }
  };

  return (
    <>
      <section className="filtros">
        <select aria-label="Mês de entrada" value={mes} onChange={(e) => setMes(e.target.value)}>
          <option value="">Todos os meses</option>
          {meses.map((m) => <option key={m} value={m}>{mesNome(m)}</option>)}
        </select>
        <select aria-label="Cliente" value={cli} onChange={(e) => setCli(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <Segmento pequeno rotulo="Situação" valor={sit} onChange={setSit} opcoes={[{ valor: 'pendente', nome: 'A receber' }, { valor: 'pago', nome: 'Pagos' }, { valor: 'todos', nome: 'Todos' }]} />
      </section>
      <p className="resumo-linha">{plural(lista.length, 'exame', 'exames')} · <strong>{real(total)}</strong>{mes && <> · entradas de {mesNome(mes)}</>}</p>
      {grupos.length === 0 ? (
        <Vazio icone="check" titulo={sit === 'pendente' ? 'Nada a receber neste filtro' : 'Nenhum exame neste filtro'} texto="Troque o mês ou a situação." />
      ) : grupos.map(({ c, itens }) => {
        const pend = itens.filter((e) => e.pagamento.status !== 'pago');
        const soma = itens.reduce((s, e) => s + e.valor, 0);
        return (
          <section key={c.id} className="cartao grupo-cliente">
            <header className="grupo-cliente__topo">
              <div>
                <h2>{c.nome}</h2>
                <span className="meta">{c.cobranca === 'mensal' ? 'Fechamento mensal' : 'Paga por exame'} · {plural(itens.length, 'exame', 'exames')} · <strong>{real(soma)}</strong></span>
              </div>
              <div className="grupo-cliente__acoes">
                {mes && <button className="botao botao--fantasma botao--peq" disabled={gerando === c.id} onClick={() => fatura(c)}><Icone nome="pdf" tam={16} /> {gerando === c.id ? 'Gerando…' : 'Fechamento em PDF'}</button>}
                {pend.length > 0 && <button className="botao botao--peq" onClick={() => setReceber({ c, ids: pend.map((e) => e.id), valor: pend.reduce((s, e) => s + e.valor, 0) })}><Icone nome="check" tam={16} /> Receber {real(pend.reduce((s, e) => s + e.valor, 0))}</button>}
              </div>
            </header>
            <ul className="linhas-receber">
              {itens.map((e) => (
                <li key={e.id}>
                  <span className="mono">{dataCurta(e.dataEntrada)}</span>
                  <span className="linhas-receber__meio"><strong>{e.paciente.nome}</strong> <span className="meta">{e.exameNome} · <span className="mono">{e.numero}</span></span></span>
                  <span className="mono num">{real(e.valor)}</span>
                  {e.pagamento.status === 'pago' ? (
                    <button className="chip chip--pago chip--botao" title="Desfazer pagamento" onClick={() => { acoes.desfazerPagamento(e.id); avisar('Pagamento desfeito.'); }}>Pago {dataCurta(e.pagamento.pagoEm)}</button>
                  ) : (
                    <button className="botao botao--fantasma botao--peq" onClick={() => setReceber({ c, ids: [e.id], valor: e.valor })}>Receber</button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <Confirmar
        aberta={!!receber}
        titulo={receber ? `Registrar pagamento de ${real(receber.valor)}` : ''}
        botao="Registrar pagamento"
        onNao={() => setReceber(null)}
        onSim={() => { acoes.marcarPago(receber.ids, forma); avisar(`${plural(receber.ids.length, 'exame marcado', 'exames marcados')} como pago.`); setReceber(null); }}
      >
        {receber && <p>{receber.c.nome} · {plural(receber.ids.length, 'exame', 'exames')}</p>}
        <div className="pilulas">
          {FORMAS.map((f) => (
            <label key={f} className={'pilula' + (forma === f ? ' ligada' : '')}><input type="radio" name="forma-receber" checked={forma === f} onChange={() => setForma(f)} /> {f}</label>
          ))}
        </div>
      </Confirmar>
    </>
  );
}

// ---------- Tabela de exames ----------
function EditarExame({ exame, onFechar, modelos, categorias }) {
  const avisar = useAviso();
  const [x, setX] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [faixa, setFaixa] = useState(false);
  useEffect(() => {
    setX(exame ? structuredClone(exame) : null);
    setFaixa(!!(exame?.prazoMin && exame.prazoMin < exame.prazo));
    setMotivo('');
  }, [exame]);
  if (!x) return null;
  const novo = !exame.historico;
  const mudouValor = !novo && Number(numBR(x.valor)) !== Number(exame.valor);
  const cat = categorias.find((c) => c.id === x.categoriaId);
  const salvar = () => {
    if (!x.nome.trim()) return avisar('Escreva o nome do exame.', 'erro');
    if (!x.categoriaId) return avisar('Escolha a categoria.', 'erro');
    const prazo = Math.max(0, Number(x.prazo) || 0);
    const prazoMin = faixa ? Math.min(Math.max(0, Number(x.prazoMin) || 0), prazo) : 0;
    acoes.salvarExame({ ...x, nome: x.nome.trim(), detalhe: (x.detalhe || '').trim(), valor: numBR(x.valor), prazo, prazoMin }, motivo || undefined);
    avisar(novo ? 'Exame criado.' : 'Exame atualizado.');
    onFechar();
  };
  return (
    <Folha
      aberta
      onFechar={onFechar}
      titulo={novo ? 'Novo exame' : nomeCompleto(x)}
      sub={novo ? 'Entra na tabela e na lista da entrada.' : 'Mudar o valor não altera exames que já deram entrada.'}
      rodape={<><button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button><button className="botao botao--primario" onClick={salvar}>Salvar</button></>}
    >
      <div className="form-grade form-grade--2">
        <Campo rotulo="Categoria" dica={cat ? `Número do exame começa com ${cat.prefixo} (ex.: ${cat.prefixo} ${String(new Date().getFullYear()).slice(2)}-0142)` : null}>
          {(id) => (
            <select id={id} value={x.categoriaId || ''} onChange={(e) => setX({ ...x, categoriaId: e.target.value })}>
              <option value="">Escolha…</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
        </Campo>
        <Campo rotulo="Modelo de laudo">
          {(id) => (
            <select id={id} value={x.modeloId || ''} onChange={(e) => setX({ ...x, modeloId: e.target.value || null })}>
              <option value="">Sem modelo</option>
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          )}
        </Campo>
        <Campo rotulo="Nome do exame" largo>{(id) => <input id={id} value={x.nome} placeholder="Ex.: Biópsia convencional" onChange={(e) => setX({ ...x, nome: e.target.value })} />}</Campo>
        <Campo rotulo="Detalhe (opcional)" largo dica="Sai menor, ao lado do nome. Ex.: 2 peças · até 10 kg · cadeia mamária e linfonodos">{(id) => <input id={id} value={x.detalhe || ''} onChange={(e) => setX({ ...x, detalhe: e.target.value })} />}</Campo>
      </div>
      <div className="campo">
        <span className="rotulo">Prazo do laudo</span>
        <div className="prazo-campos">
          {faixa && (
            <>
              <span className="com-prefixo"><span>de</span><input aria-label="Prazo mínimo" type="number" min={0} max={60} value={x.prazoMin || ''} onChange={(e) => setX({ ...x, prazoMin: Number(e.target.value) || 0 })} /></span>
              <span className="suave">a</span>
            </>
          )}
          <span className="com-sufixo"><input aria-label={faixa ? 'Prazo máximo' : 'Prazo'} type="number" min={0} max={60} value={x.prazo} onChange={(e) => setX({ ...x, prazo: Number(e.target.value) || 0 })} /><span>dias úteis</span></span>
          <label className="mini-check"><input type="checkbox" checked={faixa} onChange={(e) => { setFaixa(e.target.checked); if (e.target.checked && !x.prazoMin) setX({ ...x, prazoMin: Math.max(1, x.prazo - 2) }); }} /> prazo em faixa (ex.: 5 a 7)</label>
        </div>
        <small className="campo__dica">Na tabela sai “{prazoTexto({ ...x, prazoMin: faixa ? x.prazoMin : 0 })}”. A data de entrega usa o prazo maior. 0 = no mesmo dia.</small>
      </div>
      <div className="campo">
        <span className="rotulo">Valor</span>
        <div className="prazo-campos">
          <span className="com-prefixo"><span>R$</span><input aria-label="Valor" inputMode="decimal" disabled={x.sobConsulta} value={String(x.valor).replace('.', ',')} onChange={(e) => setX({ ...x, valor: e.target.value })} /></span>
          <label className="mini-check"><input type="checkbox" checked={!!x.sobConsulta} onChange={(e) => setX({ ...x, sobConsulta: e.target.checked })} /> sob consulta</label>
        </div>
        {x.sobConsulta && <small className="campo__dica">Na tabela sai “Sob consulta”. Na entrada, o valor é digitado na hora.</small>}
      </div>
      {mudouValor && (
        <Campo rotulo="Motivo do reajuste" dica="Fica no histórico do exame.">{(id) => <input id={id} value={motivo} placeholder="Ex.: reajuste anual" onChange={(e) => setMotivo(e.target.value)} />}</Campo>
      )}
      <Interruptor ligado={x.ativo} onChange={(v) => setX({ ...x, ativo: v })} rotulo="Ativo" dica="Inativo sai da tabela e da entrada, mas o histórico continua." />
      {!novo && exame.historico?.length > 0 && (
        <div className="historico-precos">
          <span className="rotulo">Histórico de valores</span>
          <ol>
            {[...exame.historico].reverse().map((hh, i) => (
              <li key={i}><span className="mono">{dataBR(hh.data)}</span><strong>{real(hh.valor)}</strong><span className="suave">{hh.motivo}</span></li>
            ))}
          </ol>
        </div>
      )}
    </Folha>
  );
}

function EditarCategoria({ categoria, onFechar, exames }) {
  const avisar = useAviso();
  const [c, setC] = useState(() => structuredClone(categoria));
  const [excluir, setExcluir] = useState(false);
  const { categorias } = useDados();
  const nova = !categorias.some((k) => k.id === categoria.id);
  const usam = exames.filter((x) => x.categoriaId === c.id).length;
  const salvar = () => {
    if (!c.nome.trim()) return avisar('Escreva o nome da categoria.', 'erro');
    const prefixo = c.prefixo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    if (!prefixo) return avisar('Escreva o prefixo do número (ex.: HP).', 'erro');
    if (categorias.some((k) => k.id !== c.id && k.prefixo === prefixo)) return avisar(`O prefixo ${prefixo} já é de outra categoria.`, 'erro');
    acoes.salvarCategoria({ ...c, nome: c.nome.trim(), prefixo });
    avisar(nova ? 'Categoria criada.' : 'Categoria atualizada.');
    onFechar();
  };
  return (
    <>
      <Folha
        aberta={!excluir}
        onFechar={onFechar}
        titulo={nova ? 'Nova categoria' : c.nome}
        sub="Agrupa os exames na tabela e define o começo do número do exame."
        rodape={
          <>
            {!nova && <button className="botao botao--fantasma botao--perigo-txt" onClick={() => (usam ? avisar(`Mude os ${usam} exames desta categoria antes de excluir.`, 'erro') : setExcluir(true))}><Icone nome="lixo" /> Excluir</button>}
            <span className="espaco" />
            <button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button>
            <button className="botao botao--primario" onClick={salvar}>Salvar</button>
          </>
        }
      >
        <div className="form-grade form-grade--2">
          <Campo rotulo="Nome">{(id) => <input id={id} value={c.nome} placeholder="Ex.: Histopatologia" onChange={(e) => setC({ ...c, nome: e.target.value })} />}</Campo>
          <Campo rotulo="Prefixo do número" dica={`Ex.: ${(c.prefixo || 'HP').toUpperCase()} ${String(new Date().getFullYear()).slice(2)}-0142`}>{(id) => <input id={id} value={c.prefixo} maxLength={3} placeholder="HP" onChange={(e) => setC({ ...c, prefixo: e.target.value.toUpperCase() })} />}</Campo>
          <Campo rotulo="Observação na tabela (opcional)" largo dica="Sai na faixa da categoria. Ex.: avaliação de margens inclusa.">{(id) => <input id={id} value={c.nota || ''} onChange={(e) => setC({ ...c, nota: e.target.value })} />}</Campo>
        </div>
        <div className="campo">
          <span className="rotulo">Cor na tabela</span>
          <div className="cores">
            {CORES_CATEGORIA.map((k) => (
              <button key={k} className={'cor' + (c.cor === k ? ' ligada' : '')} style={{ background: k }} aria-label={`Cor ${k}`} aria-pressed={c.cor === k} onClick={() => setC({ ...c, cor: k })} />
            ))}
          </div>
        </div>
      </Folha>
      <Confirmar aberta={excluir} titulo={`Excluir a categoria ${c.nome}?`} botao="Excluir" perigo onNao={() => setExcluir(false)}
        onSim={() => { acoes.excluirCategoria(c.id); avisar('Categoria excluída.'); onFechar(); }} />
    </>
  );
}

function Reajuste({ aberta, onFechar, exames, categorias }) {
  const avisar = useAviso();
  const [pct, setPct] = useState('8');
  const [arred, setArred] = useState('5');
  const [motivo, setMotivo] = useState(`Reajuste ${new Date().getFullYear() + 1}`);
  const [sel, setSel] = useState(() => exames.filter((x) => x.ativo && !x.sobConsulta).map((x) => x.id));
  const p = numBR(pct);
  const passo = Number(arred);
  const novo = (v) => {
    const bruto = v * (1 + p / 100);
    return passo ? Math.round(bruto / passo) * passo : Math.round(bruto * 100) / 100;
  };
  const lista = exames.filter((x) => !x.sobConsulta);
  const aplicar = () => {
    const vals = {};
    lista.forEach((x) => sel.includes(x.id) && (vals[x.id] = novo(x.valor)));
    acoes.reajusteEmLote(vals, `${motivo} (${p > 0 ? '+' : ''}${String(p).replace('.', ',')}%)`);
    avisar(`${plural(Object.keys(vals).length, 'exame reajustado', 'exames reajustados')}.`);
    onFechar();
  };
  const daCategoria = (id) => lista.filter((x) => x.categoriaId === id).map((x) => x.id);
  return (
    <Folha
      aberta={aberta}
      onFechar={onFechar}
      larga
      titulo="Reajuste em lote"
      sub="Confira antes de salvar. Exames que já deram entrada mantêm o valor antigo."
      rodape={<><button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button><button className="botao botao--primario" disabled={!sel.length || !p} onClick={aplicar}>Aplicar em {plural(sel.length, 'exame', 'exames')}</button></>}
    >
      <div className="form-grade form-grade--3">
        <Campo rotulo="Aumento">{(id) => <span className="com-sufixo"><input id={id} inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} /><span>%</span></span>}</Campo>
        <Campo rotulo="Arredondar para">
          {(id) => (
            <select id={id} value={arred} onChange={(e) => setArred(e.target.value)}>
              <option value="0">Centavos (sem arredondar)</option>
              <option value="1">R$ 1 mais próximo</option>
              <option value="5">R$ 5 mais próximo</option>
              <option value="10">R$ 10 mais próximo</option>
            </select>
          )}
        </Campo>
        <Campo rotulo="Motivo">{(id) => <input id={id} value={motivo} onChange={(e) => setMotivo(e.target.value)} />}</Campo>
      </div>
      <div className="tabela-caixa">
        <table className="tabela tabela--compacta">
          <thead><tr><th><span className="so-leitor">Incluir</span></th><th>Exame</th><th className="num">Hoje</th><th className="num">Novo valor</th><th className="num">Diferença</th></tr></thead>
          {categorias.map((c) => {
            const itens = lista.filter((x) => x.categoriaId === c.id);
            if (!itens.length) return null;
            const ids = daCategoria(c.id);
            const todos = ids.every((i) => sel.includes(i));
            return (
              <tbody key={c.id}>
                <tr className="linha-cat">
                  <td><input type="checkbox" aria-label={`Incluir toda ${c.nome}`} checked={todos} onChange={(e) => setSel((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((y) => !ids.includes(y))))} /></td>
                  <td colSpan={4}><i className="ponto-cat" style={{ background: c.cor }} />{c.nome}</td>
                </tr>
                {itens.map((x) => {
                  const on = sel.includes(x.id);
                  return (
                    <tr key={x.id} className={on ? '' : 'apagada'}>
                      <td><input type="checkbox" aria-label={`Incluir ${nomeCompleto(x)}`} checked={on} onChange={(e) => setSel((s) => (e.target.checked ? [...s, x.id] : s.filter((y) => y !== x.id)))} /></td>
                      <td>{x.nome}{x.detalhe && <span className="suave"> · {x.detalhe}</span>}</td>
                      <td className="num">{real(x.valor)}</td>
                      <td className="num"><strong>{on ? real(novo(x.valor)) : '—'}</strong></td>
                      <td className="num suave">{on ? '+' + real(novo(x.valor) - x.valor) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </Folha>
  );
}

function TabelaExames({ exames, modelos, clientes, lab, categorias }) {
  const avisar = useAviso();
  const [editar, setEditar] = useState(null);
  const [editarCat, setEditarCat] = useState(null);
  const [reaj, setReaj] = useState(false);
  const [exportar, setExportar] = useState(false);
  const [paraCli, setParaCli] = useState('');
  const [titulo, setTitulo] = useState(`Tabela de exames ${new Date().getFullYear()}`);
  const [gerando, setGerando] = useState(false);
  const [busca, setBusca] = useState('');
  const [inativos, setInativos] = useState(false);
  const termo = semAcento(busca.trim());
  const visivel = (x) => (inativos || x.ativo) && (!termo || termo.split(/\s+/).every((p) => semAcento(nomeCompleto(x)).includes(p)));
  const baixar = async () => {
    setGerando(true);
    try {
      const c = clientes.find((x) => x.id === paraCli);
      const r = await gerarPdf(<TabelaPrecos lab={lab} exames={exames} categorias={categorias} cliente={c} vigencia={hoje()} titulo={titulo} />, `${nomeArquivo(titulo)}${c ? '-' + nomeArquivo(c.nome) : ''}.pdf`);
      if (r === 'salvo') avisar('Tabela em PDF pronta.');
      setExportar(false);
    } catch (err) {
      console.error(err);
      avisar('Não foi possível gerar o PDF.', 'erro');
    } finally {
      setGerando(false);
    }
  };
  const novoExame = (categoriaId) => setEditar({ id: uid('ex-'), categoriaId: categoriaId || categorias[0]?.id || '', nome: '', detalhe: '', valor: 0, prazo: 5, prazoMin: 0, sobConsulta: false, modeloId: modelos[0]?.id || null, ativo: true });
  const totalAtivos = exames.filter((x) => x.ativo).length;
  return (
    <>
      <div className="barra-acoes">
        <div className="busca busca--peq">
          <Icone nome="busca" tam={16} />
          <input type="search" aria-label="Procurar exame" placeholder={`Procurar entre ${totalAtivos} exames`} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button className="botao botao--primario" onClick={() => novoExame()}><Icone nome="mais" /> Exame</button>
        <button className="botao" onClick={() => setEditarCat({ id: uid('cat-'), nome: '', prefixo: '', cor: CORES_CATEGORIA[categorias.length % CORES_CATEGORIA.length], nota: '' })}><Icone nome="mais" /> Categoria</button>
        <button className="botao" onClick={() => setReaj(true)}><Icone nome="percent" /> Reajuste</button>
        <button className="botao" onClick={() => setExportar(true)}><Icone nome="pdf" /> PDF da tabela</button>
        <label className="mini-check"><input type="checkbox" checked={inativos} onChange={(e) => setInativos(e.target.checked)} /> mostrar inativos</label>
        <Ajuda titulo="Regras da tabela">
          <p><strong>Categoria</strong> agrupa os exames (Citologia, Histopatologia…) e define o começo do número do exame: categoria com prefixo HP gera HP 26-0001, HP 26-0002…</p>
          <p><strong>Reajuste não mexe no passado.</strong> O exame guarda o valor do dia da entrada. O preço novo vale dali em diante.</p>
          <p><strong>Preço especial por clínica</strong> fica na ficha da clínica (aba Clientes) e vale por cima da tabela.</p>
          <p>O <strong>prazo</strong> conta dias úteis (sem sábado, domingo e feriados nacionais). Em faixa (5 a 7), a data de entrega usa o maior.</p>
        </Ajuda>
      </div>
      {categorias.map((c, ci) => {
        const itens = exames.filter((x) => x.categoriaId === c.id && visivel(x));
        if (termo && !itens.length) return null;
        return (
          <section key={c.id} className="tab-cat" style={{ '--cat': c.cor }}>
            <header className="tab-cat__topo">
              <span className="tab-cat__cor" aria-hidden="true" />
              <div className="tab-cat__nome">
                <h2>{c.nome} <span className="mono suave">{c.prefixo}</span></h2>
                {c.nota && <span className="meta">{c.nota}</span>}
              </div>
              <span className="tab-cat__acoes">
                <button className="botao botao--icone botao--peq" aria-label={`Subir ${c.nome}`} disabled={ci === 0} onClick={() => acoes.moverCategoria(c.id, -1)}><Icone nome="cima" /></button>
                <button className="botao botao--icone botao--peq" aria-label={`Descer ${c.nome}`} disabled={ci === categorias.length - 1} onClick={() => acoes.moverCategoria(c.id, 1)}><Icone nome="baixo" /></button>
                <button className="botao botao--fantasma botao--peq" onClick={() => setEditarCat(c)}>Editar</button>
                <button className="botao botao--fantasma botao--peq" onClick={() => novoExame(c.id)}><Icone nome="mais" /> Exame</button>
              </span>
            </header>
            {itens.length === 0 ? (
              <p className="tab-cat__vazio">Nenhum exame nesta categoria.</p>
            ) : (
              <ul className="tab-linhas">
                {itens.map((x) => (
                  <li key={x.id}>
                    <button className={'tab-linha' + (x.ativo ? '' : ' apagada')} onClick={() => setEditar(x)}>
                      <span className="tab-linha__nome">
                        {x.nome}{x.detalhe && <small> {x.detalhe}</small>}
                        {!x.ativo && <span className="etiqueta">inativo</span>}
                      </span>
                      <span className="tab-linha__modelo">{modelos.find((m) => m.id === x.modeloId)?.nome || 'sem modelo'}</span>
                      <span className="tab-linha__prazo">{prazoTexto(x)}</span>
                      <span className="tab-linha__valor">{valorTexto(x)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {editar && <EditarExame exame={editar} modelos={modelos} categorias={categorias} onFechar={() => setEditar(null)} />}
      {editarCat && <EditarCategoria categoria={editarCat} exames={exames} onFechar={() => setEditarCat(null)} />}
      {reaj && <Reajuste aberta onFechar={() => setReaj(false)} exames={exames} categorias={categorias} />}
      <Folha
        aberta={exportar}
        onFechar={() => setExportar(false)}
        titulo="PDF da tabela de exames"
        sub="Com a marca do laboratório, separada por categoria, pronta para mandar às clínicas."
        rodape={<><button className="botao botao--fantasma" onClick={() => setExportar(false)}>Cancelar</button><button className="botao botao--primario" disabled={gerando} onClick={baixar}><Icone nome="pdf" /> {gerando ? 'Gerando…' : 'Baixar PDF'}</button></>}
      >
        <Campo rotulo="Título">{(id) => <input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} />}</Campo>
        <Campo rotulo="Versão" dica="Na versão de uma clínica, os preços especiais dela entram no lugar da tabela.">
          {(id) => (
            <select id={id} value={paraCli} onChange={(e) => setParaCli(e.target.value)}>
              <option value="">Tabela geral</option>
              {clientes.filter((c) => c.tipo === 'clinica').map((c) => <option key={c.id} value={c.id}>{c.nome}{Object.keys(c.precos || {}).length ? ' (com preço especial)' : ''}</option>)}
            </select>
          )}
        </Campo>
      </Folha>
    </>
  );
}

// ---------- Clientes ----------
function EditarCliente({ cliente, exames, onFechar }) {
  const avisar = useAviso();
  const { categorias } = useDados();
  const [c, setC] = useState(() => structuredClone(cliente));
  const novo = !cliente.nome;
  const salvar = () => {
    if (!c.nome.trim()) return avisar('Escreva o nome do cliente.', 'erro');
    const precos = {};
    Object.entries(c.precos || {}).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) precos[k] = numBR(v);
    });
    acoes.salvarCliente({ ...c, precos, vets: c.vets.filter((v) => v.nome.trim()) });
    avisar(novo ? 'Cliente cadastrado.' : 'Cliente atualizado.');
    onFechar();
  };
  return (
    <Folha
      aberta
      larga
      onFechar={onFechar}
      titulo={novo ? 'Novo cliente' : c.nome}
      rodape={<><button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button><button className="botao botao--primario" onClick={salvar}>Salvar</button></>}
    >
      <div className="form-bloco">
        <h3>Dados</h3>
        <div className="form-grade form-grade--2">
          <Campo rotulo="Nome">{(id) => <input id={id} value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} />}</Campo>
          <Campo rotulo="Contato">{(id) => <input id={id} value={c.contato} onChange={(e) => setC({ ...c, contato: e.target.value })} />}</Campo>
          <Campo rotulo="Telefone">{(id) => <input id={id} inputMode="tel" value={c.telefone} onChange={(e) => setC({ ...c, telefone: e.target.value })} />}</Campo>
          <Campo rotulo="E-mail">{(id) => <input id={id} type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />}</Campo>
          <Campo rotulo="Endereço" largo>{(id) => <input id={id} value={c.endereco} onChange={(e) => setC({ ...c, endereco: e.target.value })} />}</Campo>
        </div>
        <span className="rotulo">Cobrança</span>
        <Segmento pequeno rotulo="Cobrança" valor={c.cobranca} onChange={(v) => setC({ ...c, cobranca: v })} opcoes={[{ valor: 'mensal', nome: 'Fechamento mensal' }, { valor: 'por_exame', nome: 'Paga por exame' }]} />
      </div>
      {c.tipo !== 'particular' && (
        <div className="form-bloco">
          <h3>Veterinários(as) que enviam exames</h3>
          <ul className="lista-vets">
            {c.vets.map((v, i) => (
              <li key={i}>
                <input aria-label="Nome" placeholder="Nome" value={v.nome} onChange={(e) => setC({ ...c, vets: c.vets.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
                <input aria-label="CRMV" placeholder="CRMV-CE 0000" value={v.crmv} onChange={(e) => setC({ ...c, vets: c.vets.map((x, j) => (j === i ? { ...x, crmv: e.target.value } : x)) })} />
                <button className="botao botao--icone" aria-label={`Tirar ${v.nome || 'veterinário'}`} onClick={() => setC({ ...c, vets: c.vets.filter((_, j) => j !== i) })}><Icone nome="lixo" tam={16} /></button>
              </li>
            ))}
          </ul>
          <button className="botao botao--fantasma botao--peq" onClick={() => setC({ ...c, vets: [...c.vets, { nome: '', crmv: '' }] })}>+ Adicionar veterinário(a)</button>
        </div>
      )}
      <div className="form-bloco">
        <h3>Preços especiais</h3>
        <p className="meta">Deixe em branco para usar o valor da tabela.</p>
        {categorias.map((k) => {
          const itens = exames.filter((x) => x.ativo && x.categoriaId === k.id);
          if (!itens.length) return null;
          return (
            <details key={k.id} className="precos-cat" open={itens.some((x) => c.precos?.[x.id] !== undefined && c.precos?.[x.id] !== '')}>
              <summary><i className="ponto-cat" style={{ background: k.cor }} />{k.nome}<span className="suave"> · {plural(itens.filter((x) => c.precos?.[x.id] !== undefined && c.precos?.[x.id] !== '').length, 'preço especial', 'preços especiais')}</span></summary>
              <ul className="lista-precos">
                {itens.map((x) => {
                  const v = c.precos?.[x.id];
                  return (
                    <li key={x.id}>
                      <span><strong>{x.nome}{x.detalhe && <span className="suave"> · {x.detalhe}</span>}</strong><span className="meta">tabela: {valorTexto(x)}</span></span>
                      <span className="com-prefixo">
                        <span>R$</span>
                        <input aria-label={`Preço especial de ${nomeCompleto(x)}`} inputMode="decimal" placeholder={x.sobConsulta ? '—' : String(x.valor).replace('.', ',')} value={v === undefined || v === null ? '' : String(v).replace('.', ',')}
                          onChange={(e) => setC({ ...c, precos: { ...c.precos, [x.id]: e.target.value } })} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
      <Interruptor ligado={c.ativo} onChange={(v) => setC({ ...c, ativo: v })} rotulo="Cliente ativo" dica="Inativo sai da lista da entrada." />
    </Folha>
  );
}

function Clientes({ clientes, entradas, exames }) {
  const [editar, setEditar] = useState(null);
  const mes = mesDe(hoje());
  return (
    <>
      <div className="barra-acoes">
        <button className="botao botao--primario" onClick={() => setEditar({ id: uid('cl-'), nome: '', tipo: 'clinica', cobranca: 'mensal', contato: '', telefone: '', email: '', endereco: '', vets: [], precos: {}, ativo: true })}><Icone nome="mais" /> Novo cliente</button>
      </div>
      <ul className="grade-clientes">
        {clientes.map((c) => {
          const doMes = entradas.filter((e) => e.clienteId === c.id && mesDe(e.dataEntrada) === mes);
          const aRec = entradas.filter((e) => e.clienteId === c.id && e.pagamento.status !== 'pago').reduce((s, e) => s + e.valor, 0);
          const esp = Object.keys(c.precos || {}).length;
          return (
            <li key={c.id}>
              <button className={'cartao-cliente' + (c.ativo ? '' : ' apagada')} onClick={() => setEditar(c)}>
                <span className="cartao-cliente__topo">
                  <strong>{c.nome}</strong>
                  <span className="chip">{c.cobranca === 'mensal' ? 'Mensal' : 'Por exame'}</span>
                </span>
                <span className="meta">{c.tipo === 'particular' ? 'Tutores que trazem a amostra direto' : plural(c.vets.length, 'veterinário(a)', 'veterinários(as)')}{esp ? ` · ${plural(esp, 'preço especial', 'preços especiais')}` : ''}</span>
                <span className="cartao-cliente__nums">
                  <span><small>Exames no mês</small><strong>{doMes.length}</strong></span>
                  <span><small>Faturado no mês</small><strong>{real(doMes.reduce((s, e) => s + e.valor, 0))}</strong></span>
                  <span><small>A receber</small><strong className={aRec ? 'tom-alerta' : ''}>{real(aRec)}</strong></span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {editar && <EditarCliente cliente={editar} exames={exames} onFechar={() => setEditar(null)} />}
    </>
  );
}

export default function Financeiro() {
  const { entradas, clientes, exames, modelos, lab, categorias } = useDados();
  const [aba, setAba] = useState('resumo');
  const pend = useMemo(() => entradas.filter((e) => e.pagamento.status !== 'pago').length, [entradas]);
  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Financeiro</h1>
          <p className="suave">{plural(pend, 'exame a receber', 'exames a receber')}</p>
        </div>
      </header>
      <Segmento
        rotulo="Financeiro"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { valor: 'resumo', nome: 'Resumo' },
          { valor: 'receber', nome: 'A receber', conta: pend },
          { valor: 'tabela', nome: 'Tabela' },
          { valor: 'clientes', nome: 'Clientes' },
        ]}
      />
      {aba === 'resumo' && <Resumo entradas={entradas} exames={exames} />}
      {aba === 'receber' && <AReceber entradas={entradas} clientes={clientes} lab={lab} />}
      {aba === 'tabela' && <TabelaExames exames={exames} modelos={modelos} clientes={clientes} lab={lab} categorias={categorias} />}
      {aba === 'clientes' && <Clientes clientes={clientes} entradas={entradas} exames={exames} />}
    </div>
  );
}
