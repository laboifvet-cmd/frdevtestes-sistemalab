// Modelos de laudo: lista e o criador (campos de um lado, a folha se formando do outro).
import { useEffect, useRef, useState } from 'react';
import { useDados, acoes } from '../store.js';
import { Icone, Vazio, Segmento, Confirmar, Campo, Folha, useAviso, useLargura, ir, Ajuda } from '../ui.jsx';
import { TIPOS, ORDEM_TIPOS, novoCampo, valorInicial, modelosProntos, modeloEmBranco } from '../campos.js';
import { uid, dataBR, plural, hoje } from '../util.js';
import { FormLaudo } from '../FormLaudo.jsx';
import { Laudo, FolhasEscaladas } from '../papel.jsx';

// tira opções e frases em branco antes de salvar ou mostrar
const limpar = (m) => ({
  ...m,
  campos: m.campos.map((c) => ({
    ...c,
    ...(c.opcoes ? { opcoes: c.opcoes.map((o) => o.trim()).filter(Boolean) } : {}),
    ...(c.frases ? { frases: c.frases.map((o) => o.trim()).filter(Boolean) } : {}),
  })),
});

function MiniFolha({ campos }) {
  return (
    <span className="cartao-modelo__folha" aria-hidden="true">
      {campos.slice(0, 9).map((c) => <span key={c.id} className={'mini mini--' + c.tipo + (c.largura === 'metade' ? ' mini--meia' : '')} />)}
    </span>
  );
}

export function ListaModelos() {
  const { modelos, exames } = useDados();
  const avisar = useAviso();
  const [excluir, setExcluir] = useState(null);
  const [novo, setNovo] = useState(false);
  const criar = (base, copia) => {
    const m = base ? { ...structuredClone(base), id: uid('m'), nome: copia ? base.nome + ' (cópia)' : base.nome } : modeloEmBranco();
    m.campos = m.campos.map((c) => ({ ...c, id: uid('c') }));
    acoes.salvarModelo(m);
    ir('modelo-' + m.id);
  };
  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Modelos de laudo</h1>
          <p className="suave">Monte qualquer laudo: escolha os campos e veja a folha pronta enquanto cria.</p>
        </div>
        <div className="tela__acoes">
          <button className="botao botao--primario" onClick={() => setNovo(true)}><Icone nome="mais" /> Novo modelo</button>
        </div>
      </header>
      {modelos.length === 0 ? (
        <Vazio icone="modelos" titulo="Nenhum modelo ainda" texto="Comece em branco ou a partir de um modelo pronto." acao={<button className="botao botao--primario" onClick={() => setNovo(true)}>Criar o primeiro modelo</button>} />
      ) : (
        <ul className="grade-modelos">
          {modelos.map((m) => {
            const usam = exames.filter((x) => x.modeloId === m.id);
            return (
              <li key={m.id} className="cartao-modelo">
                <a href={'#modelo-' + m.id} className="cartao-modelo__link">
                  <MiniFolha campos={m.campos} />
                  <strong>{m.nome || 'Modelo sem nome'}</strong>
                  <span className="meta">{plural(m.campos.filter((c) => c.tipo !== 'secao').length, 'campo', 'campos')}{m.atualizadoEm ? ` · editado em ${dataBR(m.atualizadoEm)}` : ''}</span>
                  <span className={'meta' + (usam.length ? '' : ' tom-aviso')}>{usam.length ? 'Usado em: ' + usam.map((x) => x.nome).join(', ') : 'Ainda não está ligado a nenhum exame'}</span>
                </a>
                <div className="cartao-modelo__acoes">
                  <a className="botao botao--fantasma botao--peq" href={'#modelo-' + m.id}><Icone nome="editar" tam={16} /> Editar</a>
                  <button className="botao botao--fantasma botao--peq" onClick={() => criar(m, true)}><Icone nome="copiar" tam={16} /> Duplicar</button>
                  <span className="espaco" />
                  <button className="botao botao--icone botao--peq botao--perigo-txt" aria-label={`Excluir ${m.nome}`} onClick={() => setExcluir(m)}><Icone nome="lixo" tam={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Folha aberta={novo} onFechar={() => setNovo(false)} titulo="Novo modelo de laudo" sub="Escolha por onde começar. Depois dá para mudar tudo.">
        <button className="opcao-inicio" onClick={() => criar()}>
          <span className="opcao-inicio__icone"><Icone nome="mais" tam={22} /></span>
          <span><strong>Em branco</strong><small>Só o básico: uma descrição e uma conclusão.</small></span>
        </button>
        <span className="rotulo">Ou a partir de um modelo pronto</span>
        {modelosProntos().map((p) => (
          <button key={p.id} className="opcao-inicio" onClick={() => criar(p)}>
            <MiniFolha campos={p.campos} />
            <span><strong>{p.nome}</strong><small>{p.subtitulo} · {plural(p.campos.filter((c) => c.tipo !== 'secao').length, 'campo', 'campos')}</small></span>
          </button>
        ))}
      </Folha>
      <Confirmar
        aberta={!!excluir}
        titulo={`Excluir “${excluir?.nome}”?`}
        texto="Os laudos já liberados com ele continuam guardados. Os exames da tabela que usam este modelo ficam sem modelo."
        botao="Excluir modelo"
        perigo
        onNao={() => setExcluir(null)}
        onSim={() => { acoes.excluirModelo(excluir.id); setExcluir(null); avisar('Modelo excluído.'); }}
      />
    </div>
  );
}

// ---------- Peças do editor ----------
// Lista de linhas editáveis (opções, frases): Enter cria a próxima
function ListaEditavel({ itens, onChange, rotulo, novoTexto, placeholder, botao }) {
  const caixa = useRef(null);
  const focar = (i) => setTimeout(() => {
    const el = caixa.current?.querySelectorAll('input')[i];
    el?.focus();
    el?.select();
  }, 30);
  const adicionar = (depois = itens.length - 1) => {
    const n = [...itens];
    n.splice(depois + 1, 0, novoTexto ? novoTexto(itens.length + 1) : '');
    onChange(n);
    focar(depois + 1);
  };
  return (
    <div className="campo">
      <span className="rotulo">{rotulo}</span>
      <ul className="lista-editavel" ref={caixa}>
        {itens.map((o, i) => (
          <li key={i}>
            <span className="lista-editavel__n">{i + 1}</span>
            <input
              aria-label={`${rotulo} ${i + 1}`}
              value={o}
              placeholder={placeholder}
              onChange={(e) => onChange(itens.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); adicionar(i); }
                if (e.key === 'Backspace' && !o && itens.length > 1) { e.preventDefault(); onChange(itens.filter((_, j) => j !== i)); focar(Math.max(0, i - 1)); }
              }}
            />
            <button className="botao botao--icone botao--peq" aria-label={`Tirar ${o || 'linha ' + (i + 1)}`} onClick={() => onChange(itens.filter((_, j) => j !== i))}><Icone nome="fechar" tam={15} /></button>
          </li>
        ))}
      </ul>
      <button className="botao botao--fantasma botao--peq lista-editavel__mais" onClick={() => adicionar()}><Icone nome="mais" tam={16} /> {botao}</button>
    </div>
  );
}

// Botão liga/desliga em forma de etiqueta
function Chave({ ligado, onChange, children, dica }) {
  return (
    <button type="button" className={'chave' + (ligado ? ' ligada' : '')} aria-pressed={!!ligado} title={dica} onClick={() => onChange(!ligado)}>
      <span className="chave__marca" aria-hidden="true">{ligado && <Icone nome="check" tam={12} />}</span>
      {children}
    </button>
  );
}

function EditorTabela({ c, set }) {
  const addCol = () => set({ colunas: [...c.colunas, { nome: 'Coluna', preenche: false }], linhas: c.linhas.map((l) => [...l, '']) });
  const tiraCol = (i) => set({ colunas: c.colunas.filter((_, j) => j !== i), linhas: c.linhas.map((l) => l.filter((_, j) => j !== i)) });
  return (
    <div className="ed-tabela">
      <span className="rotulo">Colunas e linhas</span>
      <p className="campo__dica">Marque “preenche no laudo” nas colunas de resultado. As outras ficam fixas (parâmetro, unidade, referência).</p>
      <div className="tabela-rolagem">
        <table className="tabela-form">
          <thead>
            <tr>
              {c.colunas.map((col, i) => (
                <th key={i}>
                  <span className="ed-tabela__col">
                    <input aria-label={`Nome da coluna ${i + 1}`} value={col.nome} onChange={(e) => set({ colunas: c.colunas.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} />
                    {c.colunas.length > 1 && <button className="botao botao--icone botao--peq" aria-label={`Tirar coluna ${col.nome}`} onClick={() => tiraCol(i)}><Icone nome="fechar" tam={14} /></button>}
                  </span>
                  <label className="mini-check">
                    <input type="checkbox" checked={col.preenche} onChange={(e) => set({ colunas: c.colunas.map((x, j) => (j === i ? { ...x, preenche: e.target.checked } : x)) })} />
                    preenche no laudo
                  </label>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {c.linhas.map((l, li) => (
              <tr key={li}>
                {c.colunas.map((col, ci) => (
                  <td key={ci}>
                    {col.preenche ? <span className="ed-tabela__res">resultado</span> : (
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
      <div className="barra-acoes">
        <button className="botao botao--fantasma botao--peq" onClick={() => set({ linhas: [...c.linhas, c.colunas.map(() => '')] })}><Icone nome="mais" tam={16} /> Linha</button>
        <button className="botao botao--fantasma botao--peq" onClick={addCol}><Icone nome="mais" tam={16} /> Coluna</button>
      </div>
    </div>
  );
}

function resumoDoCampo(c) {
  const t = TIPOS[c.tipo].nome;
  if (c.tipo === 'numero' && c.unidade) return `${t} · ${c.unidade}`;
  if (['selecao', 'unica', 'multipla'].includes(c.tipo)) return `${t} · ${plural(c.opcoes.filter((o) => o.trim()).length, 'opção', 'opções')}`;
  if (c.tipo === 'tabela') return `${t} · ${plural(c.linhas.length, 'linha', 'linhas')}`;
  if (c.tipo === 'paragrafo' && c.frases?.filter((f) => f.trim()).length) return `${t} · ${plural(c.frases.filter((f) => f.trim()).length, 'frase pronta', 'frases prontas')}`;
  return t;
}

function CartaoCampo({ c, aberto, novo, onAbrir, set, onSubir, onDescer, onDuplicar, onTirar, primeiro, ultimo, arrasto }) {
  const t = TIPOS[c.tipo];
  const corpo = useRef(null);
  const nome = c.tipo === 'fixo' ? (c.texto || 'Texto fixo') : c.rotulo || 'Sem nome';
  const temLargura = ['texto', 'numero', 'selecao', 'data', 'unica', 'multipla'].includes(c.tipo);
  useEffect(() => {
    if (aberto && novo) {
      const el = corpo.current?.querySelector('input, textarea');
      el?.focus();
      el?.select?.();
    }
  }, [aberto, novo]);
  return (
    <li
      className={'ed-campo' + (aberto ? ' aberto' : '') + (c.tipo === 'secao' ? ' ed-campo--secao' : '') + (arrasto.sobre === 'antes' ? ' solta-antes' : arrasto.sobre === 'depois' ? ' solta-depois' : '') + (arrasto.este ? ' arrastando' : '')}
      id={'ed-' + c.id}
      draggable={arrasto.pode}
      onDragStart={arrasto.inicio}
      onDragEnd={arrasto.fim}
      onDragOver={arrasto.passa}
      onDrop={arrasto.solta}
    >
      <div className="ed-campo__linha">
        <span className="ed-campo__pega" title="Arraste para mudar a ordem" onPointerDown={arrasto.pegar} onPointerUp={arrasto.largar} aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </span>
        <button className="ed-campo__abrir" onClick={onAbrir} aria-expanded={aberto}>
          <span className="ed-campo__icone"><Icone nome={t.icone} tam={17} /></span>
          <span className="ed-campo__nome">
            <strong>{nome}{c.obrigatorio && <span className="obrig" title="Obrigatório"> *</span>}</strong>
            <small>{resumoDoCampo(c)}{c.largura === 'metade' && temLargura ? ' · meia largura' : ''}</small>
          </span>
          <Icone nome={aberto ? 'cima' : 'baixo'} tam={18} className="ed-campo__seta" />
        </button>
      </div>
      {aberto && (
        <div className="ed-campo__corpo" ref={corpo}>
          {c.tipo === 'fixo' ? (
            <Campo rotulo="Texto" dica="Sai igual em todo laudo (ex.: nota sobre o método).">{(id) => <textarea id={id} rows={3} value={c.texto} onChange={(e) => set({ texto: e.target.value })} />}</Campo>
          ) : (
            <Campo rotulo={c.tipo === 'secao' ? 'Título da seção' : 'Nome do campo'}>{(id) => <input id={id} value={c.rotulo} placeholder="Como aparece no laudo" onChange={(e) => set({ rotulo: e.target.value })} />}</Campo>
          )}

          {c.tipo === 'numero' && (
            <div className="form-grade form-grade--2 sem-margem">
              <Campo rotulo="Unidade">{(id) => <input id={id} value={c.unidade} placeholder="cm, g/dL, %…" onChange={(e) => set({ unidade: e.target.value })} />}</Campo>
              <Campo rotulo="Valor de referência">{(id) => <input id={id} value={c.referencia || ''} placeholder="Ex.: 6,0 – 8,0" onChange={(e) => set({ referencia: e.target.value })} />}</Campo>
            </div>
          )}
          {['selecao', 'unica', 'multipla'].includes(c.tipo) && (
            <ListaEditavel rotulo="Opções" itens={c.opcoes} onChange={(opcoes) => set({ opcoes })} novoTexto={(n) => 'Opção ' + n} botao="Adicionar opção" />
          )}
          {c.tipo === 'tabela' && <EditorTabela c={c} set={set} />}
          {c.tipo === 'imagens' && (
            <Campo rotulo="Quantas fotos no máximo">
              {() => (
                <div className="pilulas">
                  {[2, 4, 6, 8, 12].map((n) => (
                    <label key={n} className={'pilula' + ((c.max || 4) === n ? ' ligada' : '')}><input type="radio" name={'max-' + c.id} checked={(c.max || 4) === n} onChange={() => set({ max: n })} /> {n}</label>
                  ))}
                </div>
              )}
            </Campo>
          )}
          {c.tipo === 'paragrafo' && (
            <ListaEditavel rotulo="Frases prontas" itens={c.frases || []} onChange={(frases) => set({ frases })} placeholder="Frase que você usa sempre" botao="Adicionar frase pronta" />
          )}
          {(c.tipo === 'texto' || c.tipo === 'paragrafo') && (
            <Campo rotulo="Já vem escrito" dica="Opcional. Todo laudo novo abre com este texto.">
              {(id) => (c.tipo === 'texto' ? <input id={id} value={c.padrao || ''} onChange={(e) => set({ padrao: e.target.value })} /> : <textarea id={id} rows={2} value={c.padrao || ''} onChange={(e) => set({ padrao: e.target.value })} />)}
            </Campo>
          )}

          {c.tipo !== 'secao' && c.tipo !== 'fixo' && (
            <div className="chaves">
              <Chave ligado={c.obrigatorio} onChange={(v) => set({ obrigatorio: v })} dica="Precisa estar preenchido para liberar o laudo">Obrigatório</Chave>
              {temLargura && <Chave ligado={c.largura === 'metade'} onChange={(v) => set({ largura: v ? 'metade' : 'inteira' })} dica="Dois campos de meia largura ficam lado a lado">Meia largura</Chave>}
              {c.tipo === 'paragrafo' && <Chave ligado={c.destaque} onChange={(v) => set({ destaque: v })} dica="Sai em negrito, dentro de um quadro. Bom para o diagnóstico">Destacar no laudo</Chave>}
              {['unica', 'multipla'].includes(c.tipo) && <Chave ligado={c.mostrarTodas} onChange={(v) => set({ mostrarTodas: v })} dica="Mostra todas as opções com a marcada, como num formulário">Mostrar todas as opções</Chave>}
              <Chave ligado={c.ocultarVazio} onChange={(v) => set({ ocultarVazio: v })} dica="Se ninguém preencher, o campo não aparece no laudo">Some se ficar vazio</Chave>
            </div>
          )}

          <div className="ed-campo__pe">
            <span className="ed-campo__mover">
              <button className="botao botao--peq" disabled={primeiro} onClick={onSubir}><Icone nome="cima" tam={16} /> Subir</button>
              <button className="botao botao--peq" disabled={ultimo} onClick={onDescer}><Icone nome="baixo" tam={16} /> Descer</button>
            </span>
            <span className="ed-campo__mover">
              <button className="botao botao--fantasma botao--peq" onClick={onDuplicar}><Icone nome="copiar" tam={16} /> Duplicar</button>
              <button className="botao botao--fantasma botao--peq botao--perigo-txt" onClick={onTirar}><Icone nome="lixo" tam={16} /> Tirar</button>
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

function Paleta({ onAdicionar }) {
  return (
    <div className="paleta__grade">
      {ORDEM_TIPOS.map((t) => (
        <button key={t} className="paleta__item" onClick={() => onAdicionar(t)} title={TIPOS[t].dica}>
          <Icone nome={TIPOS[t].icone} tam={18} />
          <span><strong>{TIPOS[t].nome}</strong><small>{TIPOS[t].dica}</small></span>
        </button>
      ))}
    </div>
  );
}

export function EditorModelo({ id }) {
  const { modelos, lab, exames } = useDados();
  const salvo = modelos.find((m) => m.id === id);
  const larg = useLargura();
  const avisar = useAviso();
  const [m, setM] = useState(() => salvo && structuredClone(salvo));
  const [aberto, setAberto] = useState(null);
  const [novoId, setNovoId] = useState(null);
  const [vista, setVista] = useState('campos');
  const [lado, setLado] = useState('papel');
  const [teste, setTeste] = useState({});
  const [estado, setEstado] = useState('salvo');
  const [paleta, setPaleta] = useState(false);
  const [arr, setArr] = useState({ de: null, sobre: null, pos: null, pode: null });
  const timer = useRef(null);
  const ultimo = useRef(m);

  useEffect(() => {
    if (!m) return;
    setTeste((t) => {
      const n = {};
      m.campos.forEach((c) => (n[c.id] = t[c.id] !== undefined ? t[c.id] : valorInicial(c)));
      return n;
    });
  }, [m]);
  // salva o que faltar ao sair da tela
  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      if (ultimo.current) acoes.salvarModelo(limpar(ultimo.current));
    }
  }, []);

  if (!m) {
    return <div className="tela"><Vazio icone="modelos" titulo="Modelo não encontrado" acao={<a className="botao" href="#modelos">Ver modelos</a>} /></div>;
  }

  const atualizar = (novo) => {
    setM(novo);
    ultimo.current = novo;
    setEstado('salvando');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      acoes.salvarModelo(limpar(novo));
      timer.current = null;
      setEstado('salvo');
    }, 500);
  };
  const setCampo = (cid, mud) => atualizar({ ...m, campos: m.campos.map((c) => (c.id === cid ? { ...c, ...mud } : c)) });
  const mover = (de, para) => {
    if (para < 0 || para >= m.campos.length || de === para) return;
    const cs = [...m.campos];
    const [x] = cs.splice(de, 1);
    cs.splice(para, 0, x);
    atualizar({ ...m, campos: cs });
  };
  const abrir = (cid, rolar) => {
    setAberto(cid);
    setNovoId(null);
    if (rolar && cid) setTimeout(() => document.getElementById('ed-' + cid)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  };
  const adicionar = (tipo) => {
    const novo = novoCampo(tipo);
    const i = aberto ? m.campos.findIndex((c) => c.id === aberto) : -1;
    const cs = [...m.campos];
    cs.splice(i >= 0 ? i + 1 : cs.length, 0, novo);
    atualizar({ ...m, campos: cs });
    setAberto(novo.id);
    setNovoId(novo.id);
    setPaleta(false);
    setVista('campos');
    setTimeout(() => document.getElementById('ed-' + novo.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
  };
  const tirar = (c) => {
    const antes = m;
    atualizar({ ...m, campos: m.campos.filter((x) => x.id !== c.id) });
    setAberto(null);
    avisar(`“${c.rotulo || TIPOS[c.tipo].nome}” saiu do modelo.`, 'ok', { texto: 'Desfazer', fazer: () => atualizar(antes) });
  };

  const usam = exames.filter((x) => x.modeloId === m.id);
  const duas = larg > 1100;
  const tres = larg >= 1480;
  const sigla = usam[0]?.sigla || 'EX';
  const entradaExemplo = {
    numero: `${sigla} ${hoje().slice(2, 4)}-0001`, clienteNome: 'Clínica de exemplo', vet: { nome: 'Dra. Exemplo', crmv: 'CRMV-CE 0000' }, tutor: { nome: 'Tutor de exemplo' },
    paciente: { nome: 'Paciente', especie: 'Canina', raca: 'SRD', sexo: 'Fêmea', idade: '8 anos' }, material: 'Material de exemplo', dataEntrada: hoje(), laudo: {},
  };
  const ver = limpar(m);
  const abertoCampo = m.campos.find((c) => c.id === aberto);

  // arrastar para mudar a ordem (computador)
  const arrasto = (c, i) => ({
    pode: arr.pode === c.id,
    este: arr.de === i,
    sobre: arr.sobre === i && arr.de !== null && arr.de !== i ? arr.pos : null,
    pegar: () => setArr((a) => ({ ...a, pode: c.id })),
    largar: () => setArr((a) => ({ ...a, pode: null })),
    inicio: (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', c.id);
      setArr((a) => ({ ...a, de: i }));
    },
    fim: () => setArr({ de: null, sobre: null, pos: null, pode: null }),
    passa: (e) => {
      if (arr.de === null) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const pos = e.clientY < r.top + r.height / 2 ? 'antes' : 'depois';
      if (arr.sobre !== i || arr.pos !== pos) setArr((a) => ({ ...a, sobre: i, pos }));
    },
    solta: (e) => {
      e.preventDefault();
      if (arr.de === null) return;
      let para = arr.pos === 'antes' ? i : i + 1;
      if (arr.de < para) para--;
      mover(arr.de, para);
      setArr({ de: null, sobre: null, pos: null, pode: null });
    },
  });

  const painelCampos = (
    <div className="ed-esq">
      <section className="cartao">
        <div className="form-grade form-grade--2 sem-margem">
          <Campo rotulo="Título do laudo">{(fid) => <input id={fid} value={m.nome} placeholder="Ex.: Exame histopatológico" autoFocus={m.nome === 'Novo modelo de laudo'} onFocus={(e) => m.nome === 'Novo modelo de laudo' && e.target.select()} onChange={(e) => atualizar({ ...m, nome: e.target.value })} />}</Campo>
          <Campo rotulo="Subtítulo (opcional)">{(fid) => <input id={fid} value={m.subtitulo || ''} placeholder="Ex.: Biópsia excisional" onChange={(e) => atualizar({ ...m, subtitulo: e.target.value })} />}</Campo>
        </div>
        <div className="campo">
          <span className="rotulo">Exames que usam este modelo</span>
          <div className="pilulas">
            {exames.filter((x) => x.ativo || x.modeloId === m.id).map((x) => {
              const on = x.modeloId === m.id;
              return (
                <label key={x.id} className={'pilula pilula--caixa' + (on ? ' ligada' : '')}>
                  <input type="checkbox" checked={on} onChange={(e) => acoes.salvarExame({ ...x, modeloId: e.target.checked ? m.id : null })} />
                  {x.nome}
                </label>
              );
            })}
          </div>
          <small className="campo__dica">Ao dar entrada em um exame marcado, o laudo já abre neste modelo.</small>
        </div>
      </section>

      <section className="cartao cartao--campos">
        <header className="cartao__topo">
          <h2>Campos do laudo <span className="suave">{m.campos.length}</span></h2>
          <Ajuda titulo="Como montar o modelo">
            <p><strong>Para adicionar:</strong> toque num tipo de campo na lista “Adicionar campo”. Ele entra logo abaixo do campo que estiver aberto (ou no fim, se nenhum estiver aberto) e já fica pronto para você digitar o nome.</p>
            <p><strong>Para editar:</strong> toque no campo aqui na lista, ou direto na folha ao lado.</p>
            <p><strong>Para mudar a ordem:</strong> arraste pelos pontinhos à esquerda, ou abra o campo e use Subir e Descer.</p>
            <p><strong>Seção</strong> separa o laudo em partes. <strong>Texto longo</strong> aceita frases prontas, que viram botões na hora de laudar. <strong>Tabela</strong> serve para hemograma, bioquímico e qualquer exame com valores de referência.</p>
          </Ajuda>
        </header>
        {duas && !tres && (
          <div className="paleta-faixa" aria-label="Adicionar campo">
            <span className="paleta-faixa__onde">Adicionar {abertoCampo ? <>abaixo de <strong>{abertoCampo.rotulo || TIPOS[abertoCampo.tipo].nome}</strong></> : 'no fim'}</span>
            <div className="paleta-faixa__tipos">
              {ORDEM_TIPOS.map((t) => (
                <button key={t} className="paleta-chip" onClick={() => adicionar(t)} title={TIPOS[t].dica}><Icone nome={TIPOS[t].icone} tam={15} /> {TIPOS[t].curto}</button>
              ))}
            </div>
          </div>
        )}
        {m.campos.length === 0 ? (
          <Vazio icone="modelos" titulo="Este modelo está sem campos" texto="Escolha um tipo de campo em “Adicionar campo” para começar." />
        ) : (
          <ul className="ed-campos">
            {m.campos.map((c, i) => (
              <CartaoCampo
                key={c.id}
                c={c}
                aberto={aberto === c.id}
                novo={novoId === c.id}
                onAbrir={() => abrir(aberto === c.id ? null : c.id)}
                set={(mud) => setCampo(c.id, mud)}
                primeiro={i === 0}
                ultimo={i === m.campos.length - 1}
                onSubir={() => mover(i, i - 1)}
                onDescer={() => mover(i, i + 1)}
                onDuplicar={() => {
                  const cs = [...m.campos];
                  const copia = { ...structuredClone(c), id: uid('c'), rotulo: c.rotulo ? c.rotulo + ' (cópia)' : c.rotulo };
                  cs.splice(i + 1, 0, copia);
                  atualizar({ ...m, campos: cs });
                  setAberto(copia.id);
                  setNovoId(copia.id);
                }}
                onTirar={() => tirar(c)}
                arrasto={arrasto(c, i)}
              />
            ))}
          </ul>
        )}
        {!duas && <button className="botao botao--primario ed-mais" onClick={() => setPaleta(true)}><Icone nome="mais" /> Adicionar campo</button>}
      </section>
    </div>
  );

  const painelPaleta = (
    <aside className="ed-paleta" aria-label="Adicionar campo">
      <h2>Adicionar campo</h2>
      <p className="ed-paleta__onde">{abertoCampo ? <>Entra abaixo de <strong>{abertoCampo.rotulo || TIPOS[abertoCampo.tipo].nome}</strong></> : 'Entra no fim do laudo'}</p>
      <Paleta onAdicionar={adicionar} />
    </aside>
  );

  const painelDireito = (
    <div className="ed-dir">
      <div className="ed-dir__topo">
        <Segmento pequeno rotulo="Prévia" valor={lado} onChange={setLado} opcoes={[{ valor: 'papel', nome: 'Folha em branco', icone: 'laudos' }, { valor: 'teste', nome: 'Testar preenchendo', icone: 'editar' }]} />
      </div>
      {lado === 'teste' && (
        <section className="cartao ed-teste">
          <p className="meta">É assim que o patologista vai preencher. Nada daqui é salvo em nenhum exame.</p>
          <FormLaudo modelo={ver} valores={teste} onChange={(cid, v) => setTeste((t) => ({ ...t, [cid]: v }))} avisar={avisar} />
        </section>
      )}
      <div
        className="papel-editavel"
        onClick={(e) => {
          const el = e.target.closest('[data-campo]');
          if (el) { abrir(el.dataset.campo, true); setVista('campos'); }
        }}
      >
        <FolhasEscaladas maxEscala={duas ? 0.76 : 1}>
          <Laudo lab={lab} modelo={ver} entrada={entradaExemplo} valores={lado === 'teste' ? teste : {}} previa sel={aberto} />
        </FolhasEscaladas>
      </div>
      {lado === 'papel' && <p className="meta ed-dir__dica">Toque num campo da folha para editar.</p>}
    </div>
  );

  return (
    <div className="tela tela--modelo">
      <header className="laudo-topo">
        <a href="#modelos" className="botao botao--icone" aria-label="Voltar para os modelos"><Icone nome="voltar" /></a>
        <div className="laudo-topo__titulo">
          <h1>{m.nome || 'Modelo sem nome'}</h1>
          <p className="meta">{usam.length ? 'Usado em: ' + usam.map((x) => x.nome).join(', ') : 'Ainda não está ligado a nenhum exame'}</p>
        </div>
        <div className="laudo-topo__acoes">
          <span className={'salvo' + (estado === 'salvando' ? ' salvo--andando' : '')} aria-live="polite">{estado === 'salvando' ? 'Salvando…' : <><Icone nome="check" tam={14} /> Salvo</>}</span>
          <a href="#modelos" className="botao botao--primario"><Icone nome="check" /> Pronto</a>
        </div>
      </header>
      {!duas && (
        <Segmento rotulo="Ver" valor={vista} onChange={setVista} opcoes={[{ valor: 'campos', nome: 'Campos', icone: 'modelos' }, { valor: 'previa', nome: 'Ver a folha', icone: 'olho' }]} />
      )}
      <div className={'ed-corpo' + (tres ? ' ed-corpo--tres' : duas ? ' ed-corpo--duas' : '')}>
        {tres && painelPaleta}
        {(duas || vista === 'campos') && painelCampos}
        {(duas || vista === 'previa') && painelDireito}
      </div>
      <Folha aberta={paleta} onFechar={() => setPaleta(false)} titulo="Adicionar campo" sub={abertoCampo ? `Entra abaixo de “${abertoCampo.rotulo || TIPOS[abertoCampo.tipo].nome}”.` : 'Entra no fim do laudo.'}>
        <Paleta onAdicionar={adicionar} />
      </Folha>
    </div>
  );
}
