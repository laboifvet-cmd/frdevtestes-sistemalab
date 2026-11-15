// Fila de laudos e a tela de fazer o laudo (formulário de um lado, folha pronta do outro).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDados, acoes, emAndamento, atrasado } from '../store.js';
import { Icone, Vazio, Segmento, Confirmar, useAviso, useLargura } from '../ui.jsx';
import { dataBR, dataCurta, hoje, plural, nomeArquivo, somaDias } from '../util.js';
import { campoVazio } from '../campos.js';
import { FormLaudo } from '../FormLaudo.jsx';
import { Laudo, FolhasEscaladas } from '../papel.jsx';
import { gerarPdf } from '../pdf.js';
import { ChipStatus, ChipPrazo, progresso } from './comum.jsx';
import { Ficha } from './Exames.jsx';
import NovaEntrada from './NovaEntrada.jsx';

export function FilaLaudos() {
  const { entradas, modelos } = useDados();
  const [aba, setAba] = useState('fazer');
  const [nova, setNova] = useState(false);
  const h = hoje();
  const fazer = entradas.filter(emAndamento).sort((a, b) => (a.dataPrevista < b.dataPrevista ? -1 : a.dataPrevista > b.dataPrevista ? 1 : a.numero < b.numero ? -1 : 1));
  const prontos = entradas.filter((e) => e.status === 'liberado' || (e.status === 'entregue' && e.laudo.liberadoEm >= somaDias(h, -14)))
    .sort((a, b) => (a.laudo.liberadoEm < b.laudo.liberadoEm ? 1 : -1));
  const lista = aba === 'fazer' ? fazer : prontos;
  const atras = fazer.filter((e) => atrasado(e, h)).length;

  // agrupa por prazo
  const grupos = useMemo(() => {
    if (aba !== 'fazer') return [{ nome: 'Liberados nos últimos 14 dias', itens: lista }];
    const g = [
      { nome: 'Atrasados', itens: [], tom: 'alerta' },
      { nome: 'Vencem hoje', itens: [] },
      { nome: 'Próximos dias', itens: [] },
    ];
    lista.forEach((e) => (e.dataPrevista < h ? g[0] : e.dataPrevista === h ? g[1] : g[2]).itens.push(e));
    return g.filter((x) => x.itens.length);
  }, [lista, aba, h]);

  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Laudos</h1>
          <p className="suave">{fazer.length ? `${plural(fazer.length, 'laudo', 'laudos')} para fazer${atras ? `, ${atras} ${atras === 1 ? 'atrasado' : 'atrasados'}` : ''}.` : 'Nenhum laudo pendente.'}</p>
        </div>
        <div className="tela__acoes">
          <button className="botao" onClick={() => setNova(true)}><Icone nome="mais" /> Nova entrada</button>
        </div>
      </header>
      <Segmento rotulo="Laudos" valor={aba} onChange={setAba} opcoes={[{ valor: 'fazer', nome: 'Para fazer', conta: fazer.length }, { valor: 'prontos', nome: 'Liberados', conta: prontos.length }]} />

      {lista.length === 0 ? (
        <Vazio icone="check" titulo={aba === 'fazer' ? 'Fila zerada' : 'Nenhum laudo liberado nos últimos dias'} texto={aba === 'fazer' ? 'Cada exame que der entrada aparece aqui, pela ordem do prazo.' : ''} />
      ) : (
        grupos.map((g) => (
          <section key={g.nome} className="grupo-fila">
            <h2 className={'grupo-fila__titulo' + (g.tom ? ' grupo-fila__titulo--' + g.tom : '')}>{g.nome} <span>{g.itens.length}</span></h2>
            <ul className="fila">
              {g.itens.map((e) => {
                const m = modelos.find((x) => x.id === e.modeloId);
                const pr = progresso(m, e.laudo.valores);
                return (
                  <li key={e.id}>
                    <a href={'#laudo-' + e.id} className="fila__item">
                      <span className="fila__prazo"><ChipPrazo e={e} /></span>
                      <span className="fila__meio">
                        <strong>{e.paciente.nome} <span className="suave">· {e.paciente.especie}{e.paciente.raca ? ', ' + e.paciente.raca : ''}</span></strong>
                        <span className="meta"><span className="mono">{e.numero}</span> · {e.exameNome} · {e.clienteNome}</span>
                      </span>
                      {aba === 'fazer' ? (
                        <span className="fila__prog" title={`${pr.feitos} de ${pr.total} campos obrigatórios`}>
                          <span className="barra-prog"><span style={{ width: (pr.total ? (pr.feitos / pr.total) * 100 : 0) + '%' }} /></span>
                          <small>{pr.feitos}/{pr.total}</small>
                        </span>
                      ) : (
                        <span className="fila__prog"><small>{dataCurta(e.laudo.liberadoEm)}</small></span>
                      )}
                      <ChipStatus status={e.status} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      <NovaEntrada aberta={nova} onFechar={() => setNova(false)} />
    </div>
  );
}

export function EditorLaudo({ id }) {
  const { entradas, modelos, lab } = useDados();
  const e = entradas.find((x) => x.id === id);
  const avisar = useAviso();
  const larg = useLargura();
  const [valores, setValores] = useState(() => e?.laudo.valores || {});
  const [vista, setVista] = useState('form');
  const [faltando, setFaltando] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [ficha, setFicha] = useState(false);
  const [trocar, setTrocar] = useState(null);
  const timers = useRef({});

  useEffect(() => {
    if (e) setValores(e.laudo.valores);
  }, [e?.modeloId, e?.laudo?.liberadoEm]); // eslint-disable-line

  if (!e) {
    return (
      <div className="tela">
        <Vazio icone="laudos" titulo="Laudo não encontrado" texto="Ele pode ter sido excluído." acao={<a className="botao" href="#laudos">Voltar para a fila</a>} />
      </div>
    );
  }
  const modelo = modelos.find((m) => m.id === e.modeloId);
  const travado = e.status === 'liberado' || e.status === 'entregue';
  const pr = progresso(modelo, valores);

  const mudar = (campoId, v) => {
    setValores((o) => ({ ...o, [campoId]: v }));
    setFaltando((f) => f.filter((x) => x !== campoId));
    clearTimeout(timers.current[campoId]);
    timers.current[campoId] = setTimeout(() => acoes.salvarValor(e.id, campoId, v), 350);
  };

  const liberar = () => {
    if (!modelo) return avisar('Escolha um modelo de laudo antes de liberar.', 'erro');
    const falta = modelo.campos.filter((c) => c.obrigatorio && campoVazio(c, valores[c.id])).map((c) => c.id);
    if (falta.length) {
      setFaltando(falta);
      setVista('form');
      avisar(`Faltam ${plural(falta.length, 'campo obrigatório', 'campos obrigatórios')}.`, 'erro');
      setTimeout(() => document.querySelector('.campo--falta')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
      return;
    }
    Object.values(timers.current).forEach(clearTimeout);
    Object.entries(valores).forEach(([k, v]) => acoes.salvarValor(e.id, k, v));
    acoes.mudarStatus(e.id, 'liberado');
    avisar('Laudo liberado. Já pode baixar o PDF.');
  };

  const baixar = async () => {
    setGerando(true);
    try {
      const res = await gerarPdf(
        <Laudo lab={lab} modelo={modelo} entrada={{ ...e, laudo: { ...e.laudo, valores } }} valores={valores} />,
        `${nomeArquivo(e.numero)}-${nomeArquivo(e.paciente.nome)}.pdf`,
      );
      if (res === 'salvo') avisar('PDF pronto.');
    } catch (err) {
      console.error(err);
      avisar('Não foi possível gerar o PDF. Tente de novo.', 'erro');
    } finally {
      setGerando(false);
    }
  };

  const doc = <Laudo lab={lab} modelo={modelo} entrada={{ ...e, laudo: { ...e.laudo, valores } }} valores={valores} />;
  const duasColunas = larg > 1100;

  return (
    <div className="tela tela--laudo">
      <header className="laudo-topo">
        <a href="#laudos" className="botao botao--icone" aria-label="Voltar para a fila"><Icone nome="voltar" /></a>
        <div className="laudo-topo__titulo">
          <h1>{e.paciente.nome} <span className="suave">· {e.paciente.especie}</span></h1>
          <p className="meta"><span className="mono">{e.numero}</span> · {e.exameNome} · {e.clienteNome}</p>
        </div>
        <div className="laudo-topo__acoes">
          <ChipStatus status={e.status} />
          <button className="botao" onClick={baixar} disabled={gerando}>
            <Icone nome="pdf" /> {gerando ? 'Gerando…' : travado ? 'Baixar PDF' : 'PDF da prévia'}
          </button>
          {travado ? (
            e.status === 'liberado' ? (
              <button className="botao botao--primario" onClick={() => { acoes.mudarStatus(e.id, 'entregue'); avisar('Marcado como entregue.'); }}><Icone nome="enviar" /> Marcar entregue</button>
            ) : null
          ) : (
            <button className="botao botao--primario" onClick={liberar}><Icone nome="check" /> Liberar laudo</button>
          )}
        </div>
      </header>

      {!duasColunas && (
        <Segmento rotulo="Ver" valor={vista} onChange={setVista} opcoes={[{ valor: 'form', nome: 'Preencher', icone: 'editar' }, { valor: 'papel', nome: 'Ver laudo', icone: 'olho' }]} />
      )}

      <div className={'laudo-corpo' + (duasColunas ? ' laudo-corpo--duas' : '')}>
        {(duasColunas || vista === 'form') && (
          <div className="laudo-form">
            <section className="cartao cartao--cab">
              <div className="cab-resumo">
                <div><span className="rotulo">Clínica</span><strong>{e.clienteNome}</strong><span className="meta">{e.vet.nome}{e.vet.crmv ? ' · ' + e.vet.crmv : ''}</span></div>
                <div><span className="rotulo">Tutor(a)</span><strong>{e.tutor.nome || '—'}</strong><span className="meta">{[e.paciente.raca, e.paciente.sexo, e.paciente.idade].filter(Boolean).join(' · ')}</span></div>
                <div><span className="rotulo">Prazo</span><ChipPrazo e={e} /><span className="meta">entrada {dataBR(e.dataEntrada)}</span></div>
              </div>
              <div className="cab-acoes">
                <label className="campo-inline">
                  <span>Modelo</span>
                  <select value={e.modeloId || ''} disabled={travado} onChange={(ev) => setTrocar(ev.target.value)}>
                    {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </label>
                <button className="botao botao--fantasma botao--peq" onClick={() => setFicha(true)}><Icone nome="editar" tam={16} /> Dados do cabeçalho</button>
              </div>
              {!travado && modelo && (
                <div className="cab-prog">
                  <span className="barra-prog"><span style={{ width: (pr.total ? (pr.feitos / pr.total) * 100 : 100) + '%' }} /></span>
                  <small>{pr.feitos} de {pr.total} campos obrigatórios · salva sozinho</small>
                </div>
              )}
            </section>
            {travado && (
              <div className="faixa-info">
                <Icone nome="cadeado" />
                <span>Liberado em {dataBR(e.laudo.liberadoEm)} por {e.laudo.liberadoPor}. Para corrigir, reabra o laudo.</span>
                <button className="botao botao--peq" onClick={() => { acoes.mudarStatus(e.id, 'em_analise'); avisar('Laudo reaberto para edição.'); }}>Reabrir</button>
              </div>
            )}
            {modelo ? (
              <section className="cartao">
                <FormLaudo modelo={modelo} valores={valores} onChange={mudar} travado={travado} faltando={faltando} avisar={avisar} />
              </section>
            ) : (
              <Vazio icone="modelos" titulo="Este exame está sem modelo" texto="Escolha um modelo acima ou crie um em Modelos." />
            )}
          </div>
        )}
        {(duasColunas || vista === 'papel') && modelo && (
          <div className="laudo-papel">
            <div className="laudo-papel__fixo">
              <FolhasEscaladas maxEscala={duasColunas ? 0.78 : 1}>{doc}</FolhasEscaladas>
            </div>
          </div>
        )}
      </div>

      <Ficha entrada={ficha ? e : null} onFechar={() => setFicha(false)} />
      <Confirmar
        aberta={!!trocar}
        titulo="Trocar o modelo deste laudo?"
        texto="Os campos que existem nos dois modelos continuam preenchidos; os outros começam em branco."
        botao="Trocar modelo"
        onNao={() => setTrocar(null)}
        onSim={() => { acoes.trocarModelo(e.id, trocar); setTrocar(null); avisar('Modelo trocado.'); }}
      />
    </div>
  );
}
