// Peças de interface reaproveitadas em todas as telas.
import { useEffect, useRef, useState, useCallback, createContext, useContext, useId } from 'react';
import { createPortal } from 'react-dom';

// ---------- Ícones (traço simples, 24px) ----------
const P = {
  painel: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z',
  exames: 'M9 3h6M10 3v6.5L5.2 18a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3L14 9.5V3M7.5 15h9',
  laudos: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  modelos: 'M4 5h16M4 5v14h16V5M9 5v14M12 9h5M12 13h5',
  financeiro: 'M3 7h18v12H3zM3 11h18M7 15h3',
  ajustes: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  mais: 'M12 5v14M5 12h14',
  voltar: 'M15 18l-6-6 6-6',
  fechar: 'M6 6l12 12M18 6L6 18',
  busca: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  baixar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  cima: 'M6 15l6-6 6 6',
  baixo: 'M6 9l6 6 6-6',
  copiar: 'M9 9h11v11H9zM5 15V4h11',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5 9-10',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  relogio: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  editar: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  olho: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  enviar: 'M4 12l16-8-6 16-2-7z',
  cadeado: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  // tipos de campo
  secao: 'M4 6h16M4 12h10M4 18h6',
  texto: 'M4 7V5h16v2M12 5v14M9 19h6',
  paragrafo: 'M4 6h16M4 10h16M4 14h16M4 18h10',
  numero: 'M9 4L7 20M17 4l-2 16M4 9h16M3 15h16',
  selecao: 'M4 6h16v5H4zM15 8.5l1.5 1.5 1.5-1.5M4 15h10M4 19h7',
  unica: 'M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM13 6h8M13 18h8',
  multipla: 'M4 4h6v6H4zM5.5 7l1.3 1.3L9 5.8M4 14h6v6H4zM14 7h7M14 17h7',
  tabela: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
  data: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  imagens: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  fixo: 'M7 4h10v4l-2 3v3l-3 3-3-3v-3L7 8zM12 17v4',
  pdf: 'M7 3h7l5 5v13H7zM14 3v5h5M9.5 17v-4h1.2a1.3 1.3 0 0 1 0 2.6H9.5M14 13v4M14 13h2M14 15h1.5',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  usuarios: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  percent: 'M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
};
export function Icone({ nome, tam = 20, ...rest }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={P[nome] || P.mais} />
    </svg>
  );
}

// ---------- Rotas (só #nome) ----------
export function useRota() {
  const ler = () => decodeURIComponent((location.hash || '').replace(/^#/, '')) || 'painel';
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const f = () => {
      setRota(ler());
      document.querySelector('.conteudo')?.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return rota;
}
export const ir = (r) => {
  location.hash = r;
};

// ---------- Avisos rápidos (toast) ----------
const AvisoCtx = createContext(() => {});
export const useAviso = () => useContext(AvisoCtx);
export function ProvedorAviso({ children }) {
  const [lista, setLista] = useState([]);
  const avisar = useCallback((texto, tipo = 'ok', acao) => {
    const id = Math.random();
    setLista((l) => [...l, { id, texto, tipo, acao }]);
    setTimeout(() => setLista((l) => l.filter((x) => x.id !== id)), acao ? 6000 : 3200);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={'aviso aviso--' + a.tipo}>
            <Icone nome={a.tipo === 'erro' ? 'alerta' : 'check'} tam={18} />
            <span>{a.texto}</span>
            {a.acao && (
              <button className="aviso__acao" onClick={a.acao.fazer}>
                {a.acao.texto}
              </button>
            )}
          </div>
        ))}
      </div>
    </AvisoCtx.Provider>
  );
}

// ---------- Folha lateral (no celular, sobe de baixo) ----------
export function Folha({ aberta, titulo, sub, onFechar, children, rodape, larga }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aberta) return;
    const antes = document.activeElement;
    const tecla = (e) => {
      if (e.key === 'Escape') onFechar();
      if (e.key === 'Tab' && ref.current) {
        const foc = ref.current.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])');
        if (!foc.length) return;
        const pri = foc[0], ult = foc[foc.length - 1];
        if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
      }
    };
    document.addEventListener('keydown', tecla);
    document.body.classList.add('sem-rolagem');
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus?.(), 60);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.classList.remove('sem-rolagem');
      antes?.focus?.();
    };
  }, [aberta, onFechar]);
  if (!aberta) return null;
  return createPortal(
    <div className="folha-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <section className={'folha' + (larga ? ' folha--larga' : '')} role="dialog" aria-modal="true" aria-label={titulo} ref={ref}>
        <header className="folha__topo">
          <div>
            <h2>{titulo}</h2>
            {sub && <p className="suave">{sub}</p>}
          </div>
          <button className="botao botao--icone" onClick={onFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </header>
        <div className="folha__corpo">{children}</div>
        {rodape && <footer className="folha__rodape">{rodape}</footer>}
      </section>
    </div>,
    document.body,
  );
}

// Confirmação dentro da página (a janela confirm() não funciona no link de teste)
export function Confirmar({ aberta, titulo, texto, botao = 'Confirmar', perigo, onSim, onNao, children }) {
  return (
    <Folha
      aberta={aberta}
      titulo={titulo}
      onFechar={onNao}
      rodape={
        <>
          <button className="botao botao--fantasma" onClick={onNao}>Cancelar</button>
          <button className={'botao ' + (perigo ? 'botao--perigo' : 'botao--primario')} onClick={onSim}>{botao}</button>
        </>
      }
    >
      {texto && <p>{texto}</p>}
      {children}
    </Folha>
  );
}

// ---------- Campos de formulário ----------
export function Campo({ rotulo, dica, erro, children, largo, className = '' }) {
  const id = useId();
  const filho = typeof children === 'function' ? children(id) : children;
  return (
    <div className={'campo ' + (largo ? 'campo--largo ' : '') + className}>
      {rotulo && <label htmlFor={id}>{rotulo}</label>}
      {filho}
      {dica && !erro && <small className="campo__dica">{dica}</small>}
      {erro && <small className="campo__erro">{erro}</small>}
    </div>
  );
}

export function Segmento({ opcoes, valor, onChange, rotulo, pequeno }) {
  const refs = useRef([]);
  const tecla = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + opcoes.length) % opcoes.length;
    onChange(opcoes[n].valor);
    refs.current[n]?.focus();
  };
  return (
    <div className={'segmento' + (pequeno ? ' segmento--peq' : '')} role="tablist" aria-label={rotulo}>
      {opcoes.map((o, i) => (
        <button
          key={o.valor}
          ref={(el) => (refs.current[i] = el)}
          role="tab"
          aria-selected={valor === o.valor}
          tabIndex={valor === o.valor ? 0 : -1}
          className={valor === o.valor ? 'ativo' : ''}
          onClick={() => onChange(o.valor)}
          onKeyDown={(e) => tecla(e, i)}
        >
          {o.icone && <Icone nome={o.icone} tam={16} />}
          {o.nome}
          {o.conta !== undefined && <span className="segmento__conta">{o.conta}</span>}
        </button>
      ))}
    </div>
  );
}

export function Interruptor({ ligado, onChange, rotulo, dica }) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={!!ligado} onChange={(e) => onChange(e.target.checked)} />
      <span className="interruptor__trilho" aria-hidden="true" />
      <span>
        {rotulo}
        {dica && <small className="campo__dica">{dica}</small>}
      </span>
    </label>
  );
}

// ---------- Peças de leitura ----------
export function Vazio({ icone = 'laudos', titulo, texto, acao }) {
  return (
    <div className="vazio">
      <span className="vazio__icone"><Icone nome={icone} tam={26} /></span>
      <strong>{titulo}</strong>
      {texto && <p className="suave">{texto}</p>}
      {acao}
    </div>
  );
}

export function Kpi({ rotulo, valor, sub, tom, onClick, icone }) {
  const C = onClick ? 'button' : 'div';
  return (
    <C className={'kpi' + (tom ? ' kpi--' + tom : '') + (onClick ? ' kpi--clica' : '')} onClick={onClick}>
      <span className="kpi__rotulo">
        {icone && <Icone nome={icone} tam={16} />}
        {rotulo}
      </span>
      <strong className="kpi__valor">{valor}</strong>
      {sub && <span className="kpi__sub">{sub}</span>}
    </C>
  );
}

export function Ajuda({ children, titulo = 'Como funciona' }) {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      <button className="botao botao--icone botao--ajuda" onClick={() => setAberta(true)} aria-label={titulo}>?</button>
      <Folha aberta={aberta} titulo={titulo} onFechar={() => setAberta(false)}>
        <div className="texto-ajuda">{children}</div>
      </Folha>
    </>
  );
}

// Retângulo animado enquanto algo carrega
export const Esqueleto = ({ alt = 16, larg = '100%' }) => <span className="esqueleto" style={{ height: alt, width: larg }} />;

// Tamanho da tela
export function useLargura() {
  const [l, setL] = useState(() => window.innerWidth);
  useEffect(() => {
    const f = () => setL(window.innerWidth);
    addEventListener('resize', f);
    return () => removeEventListener('resize', f);
  }, []);
  return l;
}
