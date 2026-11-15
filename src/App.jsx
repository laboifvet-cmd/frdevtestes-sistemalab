// Estrutura geral: menu lateral (computador) ou barra de baixo (celular), busca rápida e a tela da vez.
import { useState, useEffect } from 'react';
import { useDados, acoes, atrasado, emAndamento } from './store.js';
import { Icone, useRota, ProvedorAviso, Confirmar } from './ui.jsx';
import { LogoLab } from './papel.jsx';
import Busca from './Busca.jsx';
import Painel from './telas/Painel.jsx';
import Exames from './telas/Exames.jsx';
import { FilaLaudos, EditorLaudo } from './telas/Laudos.jsx';
import { ListaModelos, EditorModelo } from './telas/Modelos.jsx';
import Financeiro from './telas/Financeiro.jsx';
import Ajustes from './telas/Ajustes.jsx';
import Equipe from './telas/Equipe.jsx';

const GRUPOS = [
  {
    nome: 'Rotina',
    itens: [
      { rota: 'painel', nome: 'Painel', icone: 'painel' },
      { rota: 'exames', nome: 'Exames', icone: 'exames' },
      { rota: 'laudos', nome: 'Laudos', icone: 'laudos' },
    ],
  },
  {
    nome: 'Gestão',
    itens: [
      { rota: 'modelos', nome: 'Modelos de laudo', curto: 'Modelos', icone: 'modelos' },
      { rota: 'financeiro', nome: 'Financeiro', icone: 'financeiro' },
      { rota: 'equipe', nome: 'Equipe', icone: 'usuarios', soComputador: true },
      { rota: 'ajustes', nome: 'Ajustes', icone: 'ajustes', soComputador: true },
    ],
  },
];
const TODOS = GRUPOS.flatMap((g) => g.itens);
const ehMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function Tela({ rota }) {
  if (rota.startsWith('laudo-')) return <EditorLaudo id={rota.slice(6)} />;
  if (rota.startsWith('modelo-')) return <EditorModelo id={rota.slice(7)} />;
  if (rota.startsWith('exames')) return <Exames rota={rota} />;
  switch (rota) {
    case 'laudos': return <FilaLaudos />;
    case 'modelos': return <ListaModelos />;
    case 'financeiro': return <Financeiro />;
    case 'ajustes': return <Ajustes />;
    case 'equipe': return <Equipe />;
    default: return <Painel />;
  }
}

export default function App() {
  const dados = useDados();
  const rota = useRota();
  const [restaurar, setRestaurar] = useState(false);
  const [busca, setBusca] = useState(false);
  const base = rota.startsWith('laudo-') ? 'laudos' : rota.startsWith('modelo-') ? 'modelos' : rota.split('-')[0];
  const atrasados = dados.entradas.filter((e) => atrasado(e)).length;
  const andamento = dados.entradas.filter(emAndamento).length;
  const foco = rota.startsWith('laudo-') || rota.startsWith('modelo-');

  useEffect(() => {
    const tecla = (e) => {
      const digitando = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBusca((b) => !b); }
      else if (e.key === '/' && !digitando) { e.preventDefault(); setBusca(true); }
    };
    addEventListener('keydown', tecla);
    return () => removeEventListener('keydown', tecla);
  }, []);

  const contador = (r) => {
    if (r === 'laudos' && atrasados) return <span className="menu__conta menu__conta--alerta" title={`${atrasados} atrasados`}>{atrasados}</span>;
    if (r === 'exames' && andamento) return <span className="menu__conta" title={`${andamento} em andamento`}>{andamento}</span>;
    return null;
  };

  return (
    <ProvedorAviso>
      <a href="#conteudo" className="pular" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Ir para o conteúdo</a>
      <div className={'casca' + (foco ? ' casca--foco' : '')}>
        <aside className="menu" aria-label="Menu principal">
          <a className="menu__marca" href="#painel">
            <LogoLab lab={dados.lab} tam={28} />
            <span>
              <strong>{dados.lab.nome}</strong>
              <small>{dados.lab.descricao}</small>
            </span>
          </a>
          <button className="menu__busca" onClick={() => setBusca(true)}>
            <Icone nome="busca" tam={16} />
            <span>Buscar</span>
            <kbd>{ehMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
          <nav className="menu__nav">
            {GRUPOS.map((g) => (
              <div key={g.nome} className="menu__grupo">
                <span className="menu__titulo">{g.nome}</span>
                {g.itens.map((m) => (
                  <a key={m.rota} href={'#' + m.rota} className={'menu__item' + (base === m.rota ? ' ativo' : '')} aria-current={base === m.rota ? 'page' : undefined} title={m.nome}>
                    <Icone nome={m.icone} tam={17} />
                    <span>{m.nome}</span>
                    {contador(m.rota)}
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="menu__pe">
            {dados.lab.demonstracao && (
              <div className="demo-selo">
                <span className="demo-selo__ponto" aria-hidden="true" />
                <span>Demonstração com dados fictícios</span>
                <button className="link" onClick={() => setRestaurar(true)}>Restaurar</button>
              </div>
            )}
            <a className="assinatura" href="https://frdevbr.github.io" target="_blank" rel="noreferrer">
              <span className="assinatura__selo">FR</span>
              <span>Feito pela FR Dev</span>
            </a>
          </div>
        </aside>

        <header className="topo-cel">
          <a className="topo-cel__marca" href="#painel">
            <LogoLab lab={dados.lab} tam={26} />
            <strong>{dados.lab.nome}</strong>
          </a>
          <button className="botao botao--icone" aria-label="Buscar" onClick={() => setBusca(true)}><Icone nome="busca" /></button>
          <a href="#ajustes" className="botao botao--icone" aria-label="Ajustes"><Icone nome="ajustes" /></a>
        </header>

        <main className="conteudo" id="conteudo" tabIndex={-1}>
          <Tela rota={rota} key={rota} />
        </main>

        <nav className="barra-cel" aria-label="Menu">
          {TODOS.filter((m) => !m.soComputador).map((m) => (
            <a key={m.rota} href={'#' + m.rota} className={base === m.rota ? 'ativo' : ''} aria-current={base === m.rota ? 'page' : undefined}>
              <span className="barra-cel__icone">
                <Icone nome={m.icone} tam={21} />
                {m.rota === 'laudos' && atrasados > 0 && <span className="menu__conta menu__conta--alerta">{atrasados}</span>}
              </span>
              <span>{m.curto || m.nome}</span>
            </a>
          ))}
        </nav>
      </div>
      <Busca aberta={busca} onFechar={() => setBusca(false)} />
      <Confirmar
        aberta={restaurar}
        titulo="Restaurar os dados de exemplo?"
        texto="Tudo o que você mudou nesta demonstração volta ao início: exames, laudos, modelos, tabela e clientes."
        botao="Restaurar"
        perigo
        onNao={() => setRestaurar(false)}
        onSim={() => { acoes.restaurarExemplo(); setRestaurar(false); location.hash = 'painel'; }}
      />
    </ProvedorAviso>
  );
}
