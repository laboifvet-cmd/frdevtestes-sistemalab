// Equipe: cadastro de quem trabalha no laboratório e as assinaturas dos patologistas.
import { useEffect, useRef, useState } from 'react';
import { useDados, acoes } from '../store.js';
import { Icone, Folha, Campo, Interruptor, Confirmar, Segmento, Vazio, useAviso } from '../ui.jsx';
import { FUNCOES, novoMembro, podeAssinar } from '../equipe.js';
import { lerArquivoComoDataURL, plural } from '../util.js';

// Quadro para desenhar a assinatura com o dedo, a caneta ou o mouse
function QuadroAssinatura({ onPronto, onCancelar }) {
  const tela = useRef(null);
  const desenhando = useRef(false);
  const ultimo = useRef(null);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const c = tela.current;
    const ajustar = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = '#1F2A55';
    };
    ajustar();
  }, []);

  const ponto = (e) => {
    const r = tela.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 };
  };
  const inicio = (e) => {
    e.preventDefault();
    tela.current.setPointerCapture(e.pointerId);
    desenhando.current = true;
    ultimo.current = ponto(e);
  };
  const move = (e) => {
    if (!desenhando.current) return;
    const g = tela.current.getContext('2d');
    const p = ponto(e);
    const a = ultimo.current;
    g.lineWidth = 1.6 + (e.pointerType === 'pen' ? p.p * 2 : 1);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.quadraticCurveTo(a.x, a.y, (a.x + p.x) / 2, (a.y + p.y) / 2);
    g.lineTo(p.x, p.y);
    g.stroke();
    ultimo.current = p;
    if (vazio) setVazio(false);
  };
  const fim = () => { desenhando.current = false; };
  const limpar = () => {
    const c = tela.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setVazio(true);
  };
  const usar = () => {
    // recorta o espaço vazio em volta
    const c = tela.current;
    const g = c.getContext('2d');
    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 <= x0) return;
    const m = 8;
    const out = document.createElement('canvas');
    out.width = x1 - x0 + m * 2;
    out.height = y1 - y0 + m * 2;
    out.getContext('2d').drawImage(c, x0 - m, y0 - m, out.width, out.height, 0, 0, out.width, out.height);
    onPronto(out.toDataURL('image/png'));
  };
  return (
    <div className="quadro-assina">
      <canvas ref={tela} onPointerDown={inicio} onPointerMove={move} onPointerUp={fim} onPointerCancel={fim} onPointerLeave={fim} aria-label="Área para desenhar a assinatura" />
      <span className="quadro-assina__linha" aria-hidden="true" />
      {vazio && <span className="quadro-assina__dica">Assine aqui com o dedo, a caneta ou o mouse</span>}
      <div className="quadro-assina__acoes">
        <button className="botao botao--fantasma botao--peq" onClick={onCancelar}>Cancelar</button>
        <span className="espaco" />
        <button className="botao botao--peq" onClick={limpar} disabled={vazio}>Limpar</button>
        <button className="botao botao--primario botao--peq" onClick={usar} disabled={vazio}>Usar esta assinatura</button>
      </div>
    </div>
  );
}

function CampoAssinatura({ valor, onChange }) {
  const [desenhar, setDesenhar] = useState(false);
  const arquivo = useRef(null);
  const avisar = useAviso();
  if (desenhar) return <QuadroAssinatura onPronto={(v) => { onChange(v); setDesenhar(false); }} onCancelar={() => setDesenhar(false)} />;
  return (
    <div className="assina-campo">
      <div className="assina-campo__previa">
        {valor ? <img src={valor} alt="Assinatura" /> : <span>Sem assinatura cadastrada</span>}
        <span className="assina-campo__linha" aria-hidden="true" />
      </div>
      <div className="barra-acoes">
        <button className="botao botao--peq" onClick={() => setDesenhar(true)}><Icone nome="editar" /> {valor ? 'Desenhar de novo' : 'Desenhar'}</button>
        <button className="botao botao--peq" onClick={() => arquivo.current?.click()}><Icone nome="imagens" /> Enviar imagem</button>
        {valor && <button className="botao botao--fantasma botao--peq botao--perigo-txt" onClick={() => onChange(null)}>Tirar</button>}
        <input ref={arquivo} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => {
          const a = e.target.files?.[0];
          e.target.value = '';
          if (!a) return;
          try { onChange(await lerArquivoComoDataURL(a, 700)); } catch (err) { avisar(err.message, 'erro'); }
        }} />
      </div>
      <small className="campo__dica">Foto ou escaneado da assinatura em papel branco também serve. PNG com fundo transparente fica melhor.</small>
    </div>
  );
}

function EditarMembro({ membro, onFechar }) {
  const avisar = useAviso();
  const [m, setM] = useState(() => structuredClone(membro));
  const [excluir, setExcluir] = useState(false);
  const { lab } = useDados();
  const novo = !lab.equipe?.some((x) => x.id === membro.id);
  const assina = FUNCOES[m.funcao]?.assina;
  const set = (k, v) => setM((o) => ({ ...o, [k]: v }));
  const salvar = () => {
    if (!m.nome.trim()) return avisar('Escreva o nome.', 'erro');
    if (assina && !m.crmv.trim()) return avisar('Quem assina laudo precisa do CRMV.', 'erro');
    acoes.salvarMembro({ ...m, nome: m.nome.trim(), assinaPadrao: assina ? m.assinaPadrao : false });
    avisar(novo ? 'Pessoa cadastrada na equipe.' : 'Cadastro atualizado.');
    onFechar();
  };
  return (
    <>
      <Folha
        aberta={!excluir}
        larga
        onFechar={onFechar}
        titulo={novo ? 'Nova pessoa na equipe' : m.nome}
        sub={FUNCOES[m.funcao]?.nome}
        rodape={
          <>
            {!novo && <button className="botao botao--fantasma botao--perigo-txt" onClick={() => setExcluir(true)}><Icone nome="lixo" /> Tirar da equipe</button>}
            <span className="espaco" />
            <button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button>
            <button className="botao botao--primario" onClick={salvar}>Salvar</button>
          </>
        }
      >
        <div className="form-bloco">
          <h3>Dados</h3>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Nome como sai no laudo">{(id) => <input id={id} value={m.nome} placeholder="Ex.: Dra. Ana Souza" onChange={(e) => set('nome', e.target.value)} />}</Campo>
            <Campo rotulo="Função">
              {(id) => (
                <select id={id} value={m.funcao} onChange={(e) => set('funcao', e.target.value)}>
                  {Object.entries(FUNCOES).map(([k, f]) => <option key={k} value={k}>{f.nome}</option>)}
                </select>
              )}
            </Campo>
            <Campo rotulo="Título ou cargo" dica={assina ? 'Aparece embaixo da assinatura.' : null}>{(id) => <input id={id} value={m.titulo} onChange={(e) => set('titulo', e.target.value)} />}</Campo>
            <Campo rotulo={assina ? 'CRMV' : 'CRMV (se tiver)'}>{(id) => <input id={id} value={m.crmv} placeholder="CRMV-CE 0000" onChange={(e) => set('crmv', e.target.value)} />}</Campo>
            <Campo rotulo="E-mail">{(id) => <input id={id} type="email" value={m.email} onChange={(e) => set('email', e.target.value)} />}</Campo>
            <Campo rotulo="WhatsApp">{(id) => <input id={id} inputMode="tel" value={m.telefone} onChange={(e) => set('telefone', e.target.value)} />}</Campo>
          </div>
        </div>
        {assina && (
          <div className="form-bloco">
            <h3>Assinatura nos laudos</h3>
            <CampoAssinatura valor={m.assinatura} onChange={(v) => set('assinatura', v)} />
            <Interruptor ligado={m.assinaPadrao} onChange={(v) => set('assinaPadrao', v)} rotulo="Já vem marcado para assinar todo laudo novo" dica="Em cada laudo dá para trocar quem assina ou incluir mais alguém." />
          </div>
        )}
        <Interruptor ligado={m.ativo !== false} onChange={(v) => set('ativo', v)} rotulo="Ativo" dica="Inativo não aparece para assinar, mas os laudos antigos continuam com o nome." />
      </Folha>
      <Confirmar
        aberta={excluir}
        titulo={`Tirar ${m.nome} da equipe?`}
        texto="Laudos já liberados continuam com o nome e a assinatura no PDF. Para só pausar, desligue “Ativo”."
        botao="Tirar da equipe"
        perigo
        onNao={() => setExcluir(false)}
        onSim={() => { acoes.excluirMembro(m.id); avisar('Saiu da equipe.'); onFechar(); }}
      />
    </>
  );
}

function iniciais(n) {
  return String(n || '?').replace(/^(Dra?\.)\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function Equipe() {
  const { lab, entradas } = useDados();
  const [editar, setEditar] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const equipe = lab.equipe || [];
  const assinam = equipe.filter(podeAssinar);
  const lista = equipe.filter((m) => filtro === 'todos' || (filtro === 'assinam' ? FUNCOES[m.funcao]?.assina : !FUNCOES[m.funcao]?.assina));
  const laudosDe = (id) => entradas.filter((e) => e.laudo.liberadoEm && e.laudo.assinantes?.includes(id)).length;
  const grupos = Object.keys(FUNCOES).map((f) => ({ f, itens: lista.filter((m) => m.funcao === f) })).filter((g) => g.itens.length);

  return (
    <div className="tela">
      <header className="tela__topo">
        <div>
          <h1>Equipe</h1>
          <p className="suave">{plural(equipe.length, 'pessoa', 'pessoas')} · {plural(assinam.length, 'assina laudos', 'assinam laudos')}</p>
        </div>
        <div className="tela__acoes">
          <button className="botao botao--primario" onClick={() => setEditar(novoMembro('patologista'))}><Icone nome="mais" /> Adicionar pessoa</button>
        </div>
      </header>
      <Segmento rotulo="Filtrar" valor={filtro} onChange={setFiltro} opcoes={[
        { valor: 'todos', nome: 'Todos', conta: equipe.length },
        { valor: 'assinam', nome: 'Assinam laudos', conta: equipe.filter((m) => FUNCOES[m.funcao]?.assina).length },
        { valor: 'apoio', nome: 'Apoio', conta: equipe.filter((m) => !FUNCOES[m.funcao]?.assina).length },
      ]} />
      {lista.length === 0 ? (
        <Vazio icone="usuarios" titulo="Ninguém aqui ainda" texto="Cadastre os patologistas com a assinatura para os laudos saírem assinados." acao={<button className="botao" onClick={() => setEditar(novoMembro('patologista'))}>Adicionar patologista</button>} />
      ) : grupos.map(({ f, itens }) => (
        <section key={f} className="grupo-fila">
          <h2 className="grupo-fila__titulo">{FUNCOES[f].plural} <span>{itens.length}</span></h2>
          <ul className="fila">
            {itens.map((m) => {
              const n = FUNCOES[m.funcao]?.assina ? laudosDe(m.id) : null;
              return (
                <li key={m.id}>
                  <button className={'pessoa' + (m.ativo === false ? ' apagada' : '')} onClick={() => setEditar(m)}>
                    <span className="pessoa__avatar" aria-hidden="true">{iniciais(m.nome)}</span>
                    <span className="pessoa__nome">
                      <strong>{m.nome}</strong>
                      <span className="meta">{[m.titulo, m.crmv].filter(Boolean).join(' · ') || FUNCOES[m.funcao]?.nome}</span>
                    </span>
                    {FUNCOES[m.funcao]?.assina ? (
                      <span className="pessoa__assina">{m.assinatura ? <img src={m.assinatura} alt={`Assinatura de ${m.nome}`} /> : <span className="tom-aviso">sem assinatura</span>}</span>
                    ) : <span />}
                    <span className="pessoa__info">
                      {m.assinaPadrao && <span className="etiqueta">assina por padrão</span>}
                      {m.ativo === false && <span className="etiqueta">inativo</span>}
                      {n !== null && <span className="meta">{plural(n, 'laudo assinado', 'laudos assinados')}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {editar && <EditarMembro membro={editar} onFechar={() => setEditar(null)} />}
    </div>
  );
}
