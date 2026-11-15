// Modelos de laudo: lista e o criador (campos de um lado, laudo se formando do outro).
import { useEffect, useRef, useState } from 'react';
import { useDados, acoes } from '../store.js';
import { Icone, Vazio, Segmento, Confirmar, Interruptor, Campo, useAviso, useLargura, ir, Ajuda } from '../ui.jsx';
import { TIPOS, ORDEM_TIPOS, novoCampo, valorInicial, modelosProntos, modeloEmBranco } from '../campos.js';
import { uid, dataBR, plural } from '../util.js';
import { FormLaudo } from '../FormLaudo.jsx';
import { Laudo, FolhasEscaladas } from '../papel.jsx';

export function ListaModelos() {
  const { modelos, exames } = useDados();
  const avisar = useAviso();
  const [excluir, setExcluir] = useState(null);
  const criar = (base) => {
    const m = base ? { ...structuredClone(base), id: uid('m'), nome: base.nome + ' (cópia)' } : modeloEmBranco();
    m.campos = m.campos.map((c) => ({ ...c, id: uid('c') }));
    acoes.salvarModelo(m);
    ir('modelo-' + m.id);
  };
  const prontos = modelosProntos().filter((p) => !modelos.some((m) => m.nome === p.nome));
  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Modelos de laudo</h1>
          <p className="suave">Monte qualquer laudo: escolha os campos e veja a folha pronta enquanto cria.</p>
        </div>
        <div className="tela__acoes">
          <button className="botao botao--primario" onClick={() => criar()}><Icone nome="mais" /> Novo modelo</button>
        </div>
      </header>
      {modelos.length === 0 ? (
        <Vazio icone="modelos" titulo="Nenhum modelo ainda" texto="Comece do zero ou use um dos modelos prontos abaixo." />
      ) : (
        <ul className="grade-modelos">
          {modelos.map((m) => {
            const usam = exames.filter((x) => x.modeloId === m.id);
            const tipos = [...new Set(m.campos.map((c) => c.tipo))].filter((t) => t !== 'secao').slice(0, 6);
            return (
              <li key={m.id} className="cartao-modelo">
                <a href={'#modelo-' + m.id} className="cartao-modelo__link">
                  <span className="cartao-modelo__folha" aria-hidden="true">
                    {m.campos.slice(0, 9).map((c) => <span key={c.id} className={'mini mini--' + c.tipo + (c.largura === 'metade' ? ' mini--meia' : '')} />)}
                  </span>
                  <strong>{m.nome}</strong>
                  <span className="meta">{plural(m.campos.filter((c) => c.tipo !== 'secao').length, 'campo', 'campos')}{m.atualizadoEm ? ` · editado em ${dataBR(m.atualizadoEm)}` : ''}</span>
                  <span className="cartao-modelo__tipos">{tipos.map((t) => <Icone key={t} nome={TIPOS[t].icone} tam={15} aria-label={TIPOS[t].nome} />)}</span>
                  <span className="meta">{usam.length ? 'Usado em: ' + usam.map((x) => x.nome).join(', ') : 'Nenhum exame usa ainda'}</span>
                </a>
                <div className="cartao-modelo__acoes">
                  <button className="botao botao--fantasma botao--peq" onClick={() => criar(m)}><Icone nome="copiar" tam={16} /> Duplicar</button>
                  <button className="botao botao--fantasma botao--peq botao--perigo-txt" onClick={() => setExcluir(m)}><Icone nome="lixo" tam={16} /> Excluir</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {prontos.length > 0 && (
        <section className="cartao">
          <header className="cartao__topo"><h2>Modelos prontos para começar</h2></header>
          <div className="atalhos atalhos--sem-margem">
            {prontos.map((p) => (
              <button key={p.id} className="atalho" onClick={() => criar({ ...p, nome: p.nome.replace(/$/, '') })}>
                <Icone nome="modelos" />
                <span><strong>{p.nome}</strong><small>{plural(p.campos.length, 'campo', 'campos')}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Confirmar
        aberta={!!excluir}
        titulo={`Excluir “${excluir?.nome}”?`}
        texto="Laudos já feitos com este modelo continuam guardados, mas não poderão ser editados por ele. Os exames da tabela que usam este modelo ficam sem modelo."
        botao="Excluir modelo"
        perigo
        onNao={() => setExcluir(null)}
        onSim={() => { acoes.excluirModelo(excluir.id); setExcluir(null); avisar('Modelo excluído.'); }}
      />
    </div>
  );
}

// ---------- Editor de um campo ----------
function ListaOpcoes({ opcoes, onChange }) {
  return (
    <Campo rotulo="Opções" dica="Uma por linha.">
      {(id) => <textarea id={id} rows={Math.min(8, Math.max(3, opcoes.length + 1))} value={opcoes.join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} onBlur={(e) => onChange(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />}
    </Campo>
  );
}

function EditorTabela({ c, set }) {
  const addCol = () => set({ colunas: [...c.colunas, { nome: 'Coluna', preenche: false }], linhas: c.linhas.map((l) => [...l, '']) });
  const tiraCol = (i) => set({ colunas: c.colunas.filter((_, j) => j !== i), linhas: c.linhas.map((l) => l.filter((_, j) => j !== i)) });
  return (
    <div className="ed-tabela">
      <div className="tabela-rolagem">
        <table className="tabela-form">
          <thead>
            <tr>
              {c.colunas.map((col, i) => (
                <th key={i}>
                  <input aria-label={`Nome da coluna ${i + 1}`} value={col.nome} onChange={(e) => set({ colunas: c.colunas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
                  <label className="mini-check">
                    <input type="checkbox" checked={col.preenche} onChange={(e) => set({ colunas: c.colunas.map((x, j) => (j === i ? { ...x, preenche: e.target.checked } : x)) })} />
                    preenche no laudo
                  </label>
                  {c.colunas.length > 1 && <button className="botao botao--icone botao--peq" aria-label={`Tirar coluna ${col.nome}`} onClick={() => tiraCol(i)}><Icone nome="fechar" tam={14} /></button>}
                </th>
              ))}
              <th><button className="botao botao--fantasma botao--peq" onClick={addCol}>+ coluna</button></th>
            </tr>
          </thead>
          <tbody>
            {c.linhas.map((l, li) => (
              <tr key={li}>
                {c.colunas.map((col, ci) => (
                  <td key={ci}>
                    {col.preenche ? <span className="suave">(no laudo)</span> : (
                      <input aria-label={`Linha ${li + 1}, ${col.nome}`} value={l[ci] || ''} onChange={(e) => set({ linhas: c.linhas.map((x, xi) => (xi === li ? x.map((y, yi) => (yi === ci ? e.target.value : y)) : x)) })} />
                    )}
                  </td>
                ))}
                <td><button className="botao botao--icone botao--peq" aria-label={`Tirar linha ${li + 1}`} onClick={() => set({ linhas: c.linhas.filter((_, j) => j !== li) })}><Icone nome="lixo" tam={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="botao botao--fantasma botao--peq" onClick={() => set({ linhas: [...c.linhas, c.colunas.map(() => '')] })}>+ linha</button>
    </div>
  );
}

function EditorCampo({ c, aberto, onAbrir, set, onSubir, onDescer, onDuplicar, onTirar, primeiro, ultimo }) {
  const t = TIPOS[c.tipo];
  const nome = c.tipo === 'fixo' ? (c.texto || '').slice(0, 48) + ((c.texto || '').length > 48 ? '…' : '') : c.rotulo || '(sem nome)';
  const temLargura = ['texto', 'numero', 'selecao', 'data', 'unica', 'multipla'].includes(c.tipo);
  return (
    <li className={'ed-campo' + (aberto ? ' aberto' : '') + (c.tipo === 'secao' ? ' ed-campo--secao' : '')} id={'ed-' + c.id}>
      <div className="ed-campo__linha">
        <button className="ed-campo__abrir" onClick={onAbrir} aria-expanded={aberto}>
          <span className="ed-campo__icone"><Icone nome={t.icone} tam={17} /></span>
          <span className="ed-campo__nome">
            <strong>{nome}</strong>
            <small>{t.nome}{c.obrigatorio ? ' · obrigatório' : ''}{c.largura === 'metade' ? ' · meia largura' : ''}</small>
          </span>
        </button>
        <div className="ed-campo__mover">
          <button className="botao botao--icone botao--peq" aria-label="Subir" disabled={primeiro} onClick={onSubir}><Icone nome="cima" tam={16} /></button>
          <button className="botao botao--icone botao--peq" aria-label="Descer" disabled={ultimo} onClick={onDescer}><Icone nome="baixo" tam={16} /></button>
        </div>
      </div>
      {aberto && (
        <div className="ed-campo__corpo">
          {c.tipo === 'fixo' ? (
            <Campo rotulo="Texto">{(id) => <textarea id={id} rows={3} value={c.texto} onChange={(e) => set({ texto: e.target.value })} />}</Campo>
          ) : (
            <Campo rotulo={c.tipo === 'secao' ? 'Título da seção' : 'Nome do campo'}>{(id) => <input id={id} value={c.rotulo} onChange={(e) => set({ rotulo: e.target.value })} />}</Campo>
          )}
          {(c.tipo === 'texto' || c.tipo === 'paragrafo') && (
            <Campo rotulo="Texto que já vem escrito" dica="Opcional. Aparece preenchido em todo laudo novo.">
              {(id) => (c.tipo === 'texto' ? <input id={id} value={c.padrao || ''} onChange={(e) => set({ padrao: e.target.value })} /> : <textarea id={id} rows={2} value={c.padrao || ''} onChange={(e) => set({ padrao: e.target.value })} />)}
            </Campo>
          )}
          {c.tipo === 'paragrafo' && (
            <Campo rotulo="Frases prontas" dica="Uma por linha. Viram botões para inserir com um toque.">
              {(id) => <textarea id={id} rows={3} value={(c.frases || []).join('\n')} onChange={(e) => set({ frases: e.target.value.split('\n') })} onBlur={(e) => set({ frases: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })} />}
            </Campo>
          )}
          {c.tipo === 'numero' && (
            <div className="form-grade form-grade--2 sem-margem">
              <Campo rotulo="Unidade">{(id) => <input id={id} value={c.unidade} placeholder="cm, mg/dL…" onChange={(e) => set({ unidade: e.target.value })} />}</Campo>
              <Campo rotulo="Referência">{(id) => <input id={id} value={c.referencia || ''} placeholder="Ex.: 6,0 – 8,0" onChange={(e) => set({ referencia: e.target.value })} />}</Campo>
            </div>
          )}
          {['selecao', 'unica', 'multipla'].includes(c.tipo) && <ListaOpcoes opcoes={c.opcoes} onChange={(opcoes) => set({ opcoes })} />}
          {['unica', 'multipla'].includes(c.tipo) && (
            <Interruptor ligado={c.mostrarTodas} onChange={(v) => set({ mostrarTodas: v })} rotulo="No laudo, mostrar todas as opções com a marcada" dica="Desligado: aparece só o que foi marcado." />
          )}
          {c.tipo === 'tabela' && <EditorTabela c={c} set={set} />}
          {c.tipo === 'imagens' && (
            <Campo rotulo="Máximo de fotos">{(id) => <input id={id} type="number" min={1} max={12} value={c.max || 4} onChange={(e) => set({ max: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })} />}</Campo>
          )}
          {c.tipo !== 'secao' && c.tipo !== 'fixo' && (
            <div className="ed-campo__opcoes">
              <Interruptor ligado={c.obrigatorio} onChange={(v) => set({ obrigatorio: v })} rotulo="Obrigatório para liberar" />
              {c.tipo === 'paragrafo' && <Interruptor ligado={c.destaque} onChange={(v) => set({ destaque: v })} rotulo="Destacar no laudo" dica="Bom para o diagnóstico." />}
              <Interruptor ligado={c.ocultarVazio} onChange={(v) => set({ ocultarVazio: v })} rotulo="Esconder do laudo se ficar vazio" />
              {temLargura && <Interruptor ligado={c.largura === 'metade'} onChange={(v) => set({ largura: v ? 'metade' : 'inteira' })} rotulo="Meia largura" dica="Dois campos lado a lado." />}
            </div>
          )}
          <div className="ed-campo__pe">
            <button className="botao botao--fantasma botao--peq" onClick={onDuplicar}><Icone nome="copiar" tam={16} /> Duplicar</button>
            <button className="botao botao--fantasma botao--peq botao--perigo-txt" onClick={onTirar}><Icone nome="lixo" tam={16} /> Tirar campo</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function EditorModelo({ id }) {
  const { modelos, lab, exames } = useDados();
  const salvo = modelos.find((m) => m.id === id);
  const larg = useLargura();
  const avisar = useAviso();
  const [m, setM] = useState(() => salvo && structuredClone(salvo));
  const [aberto, setAberto] = useState(null);
  const [vista, setVista] = useState('campos');
  const [lado, setLado] = useState('papel');
  const [teste, setTeste] = useState({});
  const [estado, setEstado] = useState('salvo');
  const timer = useRef(null);

  useEffect(() => {
    if (!m) return;
    setTeste((t) => {
      const n = {};
      m.campos.forEach((c) => (n[c.id] = t[c.id] !== undefined ? t[c.id] : valorInicial(c)));
      return n;
    });
  }, [m]);

  if (!m) {
    return <div className="tela"><Vazio icone="modelos" titulo="Modelo não encontrado" acao={<a className="botao" href="#modelos">Ver modelos</a>} /></div>;
  }

  const atualizar = (novo) => {
    setM(novo);
    setEstado('salvando');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      acoes.salvarModelo(novo);
      setEstado('salvo');
    }, 500);
  };
  const setCampo = (cid, mud) => atualizar({ ...m, campos: m.campos.map((c) => (c.id === cid ? { ...c, ...mud } : c)) });
  const mover = (i, d) => {
    const cs = [...m.campos];
    [cs[i], cs[i + d]] = [cs[i + d], cs[i]];
    atualizar({ ...m, campos: cs });
  };
  const adicionar = (tipo) => {
    const novo = novoCampo(tipo);
    const i = aberto ? m.campos.findIndex((c) => c.id === aberto) : -1;
    const cs = [...m.campos];
    cs.splice(i >= 0 ? i + 1 : cs.length, 0, novo);
    atualizar({ ...m, campos: cs });
    setAberto(novo.id);
    setTimeout(() => document.getElementById('ed-' + novo.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
  };
  const usam = exames.filter((x) => x.modeloId === m.id);
  const duas = larg > 1100;
  const entradaExemplo = {
    numero: 'HP 26-0000', clienteNome: 'Clínica de exemplo', vet: { nome: 'Dra. Exemplo', crmv: 'CRMV-CE 0000' }, tutor: { nome: 'Tutor de exemplo' },
    paciente: { nome: 'Paciente', especie: 'Canina', raca: 'SRD', sexo: 'Fêmea', idade: '8 anos' }, material: 'Material de exemplo', dataEntrada: new Date().toISOString().slice(0, 10), laudo: {},
  };
  const papel = <Laudo lab={lab} modelo={m} entrada={entradaExemplo} valores={lado === 'teste' ? teste : {}} previa />;

  const painelCampos = (
    <div className="ed-esq">
      <section className="cartao">
        <div className="form-grade form-grade--2 sem-margem">
          <Campo rotulo="Título do laudo">{(fid) => <input id={fid} value={m.nome} onChange={(e) => atualizar({ ...m, nome: e.target.value })} />}</Campo>
          <Campo rotulo="Subtítulo" dica="Opcional">{(fid) => <input id={fid} value={m.subtitulo || ''} onChange={(e) => atualizar({ ...m, subtitulo: e.target.value })} />}</Campo>
        </div>
      </section>
      <section className="cartao">
        <header className="cartao__topo">
          <h2>Campos <span className="suave">{m.campos.length}</span></h2>
          <Ajuda titulo="Como montar o modelo">
            <p>Toque num campo para editar. As setas mudam a ordem.</p>
            <p>Um campo novo entra logo abaixo do campo aberto (ou no fim, se nenhum estiver aberto).</p>
            <p><strong>Seção</strong> separa o laudo em partes. <strong>Texto longo</strong> aceita frases prontas, que viram botões na hora de laudar. <strong>Tabela</strong> serve para hemograma, bioquímico e qualquer exame com referência.</p>
            <p>Campos marcados como <strong>obrigatórios</strong> precisam estar preenchidos para liberar o laudo.</p>
          </Ajuda>
        </header>
        <ul className="ed-campos">
          {m.campos.map((c, i) => (
            <EditorCampo
              key={c.id}
              c={c}
              aberto={aberto === c.id}
              onAbrir={() => setAberto(aberto === c.id ? null : c.id)}
              set={(mud) => setCampo(c.id, mud)}
              primeiro={i === 0}
              ultimo={i === m.campos.length - 1}
              onSubir={() => mover(i, -1)}
              onDescer={() => mover(i, 1)}
              onDuplicar={() => {
                const cs = [...m.campos];
                const copia = { ...structuredClone(c), id: uid('c') };
                cs.splice(i + 1, 0, copia);
                atualizar({ ...m, campos: cs });
                setAberto(copia.id);
              }}
              onTirar={() => { atualizar({ ...m, campos: m.campos.filter((x) => x.id !== c.id) }); setAberto(null); }}
            />
          ))}
        </ul>
        <div className="paleta" aria-label="Adicionar campo">
          <span className="rotulo">Adicionar {aberto ? 'abaixo do campo aberto' : 'no fim'}</span>
          <div className="paleta__grade">
            {ORDEM_TIPOS.map((t) => (
              <button key={t} className="paleta__item" onClick={() => adicionar(t)} title={TIPOS[t].dica}>
                <Icone nome={TIPOS[t].icone} tam={18} />
                <span>{TIPOS[t].nome}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const painelDireito = (
    <div className="ed-dir">
      <div className="ed-dir__topo">
        <Segmento pequeno rotulo="Prévia" valor={lado} onChange={setLado} opcoes={[{ valor: 'papel', nome: 'Laudo em branco' }, { valor: 'teste', nome: 'Testar preenchendo' }]} />
      </div>
      {lado === 'teste' && (
        <section className="cartao ed-teste">
          <p className="meta">Teste à vontade: nada daqui é salvo em nenhum exame.</p>
          <FormLaudo modelo={m} valores={teste} onChange={(cid, v) => setTeste((t) => ({ ...t, [cid]: v }))} avisar={avisar} />
        </section>
      )}
      <FolhasEscaladas maxEscala={duas ? 0.72 : 1}>{papel}</FolhasEscaladas>
    </div>
  );

  return (
    <div className="tela tela--modelo">
      <header className="laudo-topo">
        <a href="#modelos" className="botao botao--icone" aria-label="Voltar para os modelos"><Icone nome="voltar" /></a>
        <div className="laudo-topo__titulo">
          <h1>{m.nome || 'Modelo sem nome'}</h1>
          <p className="meta">{usam.length ? 'Usado em: ' + usam.map((x) => x.nome).join(', ') : 'Ligue este modelo a um exame em Financeiro › Tabela de exames.'}</p>
        </div>
        <div className="laudo-topo__acoes">
          <span className={'salvo' + (estado === 'salvando' ? ' salvo--andando' : '')} aria-live="polite">{estado === 'salvando' ? 'Salvando…' : 'Salvo'}</span>
          <a href="#modelos" className="botao botao--primario"><Icone nome="check" /> Pronto</a>
        </div>
      </header>
      {!duas && (
        <Segmento rotulo="Ver" valor={vista} onChange={setVista} opcoes={[{ valor: 'campos', nome: 'Campos', icone: 'modelos' }, { valor: 'previa', nome: 'Prévia do laudo', icone: 'olho' }]} />
      )}
      <div className={'laudo-corpo' + (duas ? ' laudo-corpo--duas laudo-corpo--modelo' : '')}>
        {(duas || vista === 'campos') && painelCampos}
        {(duas || vista === 'previa') && painelDireito}
      </div>
    </div>
  );
}
