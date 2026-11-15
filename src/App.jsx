// Estrutura geral: menu lateral (computador) ou barra de baixo (celular) e a tela da vez.
import { useState } from 'react';
import { useDados, acoes, atrasado } from './store.js';
import { Icone, useRota, ProvedorAviso, Confirmar } from './ui.jsx';
import { LogoLab } from './papel.jsx';
import Painel from './telas/Painel.jsx';
import Exames from './telas/Exames.jsx';
import { FilaLaudos, EditorLaudo } from './telas/Laudos.jsx';
import { ListaModelos, EditorModelo } from './telas/Modelos.jsx';
import Financeiro from './telas/Financeiro.jsx';
import Ajustes from './telas/Ajustes.jsx';

const MENU = [
  { rota: 'painel', nome: 'Painel', icone: 'painel' },
  { rota: 'exames', nome: 'Exames', icone: 'exames' },
  { rota: 'laudos', nome: 'Laudos', icone: 'laudos' },
  { rota: 'modelos', nome: 'Modelos', icone: 'modelos' },
  { rota: 'financeiro', nome: 'Financeiro', icone: 'financeiro' },
  { rota: 'ajustes', nome: 'Ajustes', icone: 'ajustes', soComputador: true },
];

function Tela({ rota }) {
  if (rota.startsWith('laudo-')) return <EditorLaudo id={rota.slice(6)} />;
  if (rota.startsWith('modelo-')) return <EditorModelo id={rota.slice(7)} />;
  if (rota.startsWith('exames')) return <Exames rota={rota} />;
  switch (rota) {
    case 'laudos': return <FilaLaudos />;
    case 'modelos': return <ListaModelos />;
    case 'financeiro': return <Financeiro />;
    case 'ajustes': return <Ajustes />;
    default: return <Painel />;
  }
}

export default function App() {
  const dados = useDados();
  const rota = useRota();
  const [restaurar, setRestaurar] = useState(false);
  const base = rota.startsWith('laudo-') ? 'laudos' : rota.startsWith('modelo-') ? 'modelos' : rota.split('-')[0];
  const atrasados = dados.entradas.filter((e) => atrasado(e)).length;
  const foco = rota.startsWith('laudo-') || rota.startsWith('modelo-');

  return (
    <ProvedorAviso>
      <a href="#conteudo" className="pular" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Ir para o conteúdo</a>
      <div className={'casca' + (foco ? ' casca--foco' : '')}>
        <aside className="menu" aria-label="Menu principal">
          <a className="menu__marca" href="#painel">
            <LogoLab lab={dados.lab} tam={36} />
            <span>
              <strong>{dados.lab.nome}</strong>
              <small>{dados.lab.descricao}</small>
            </span>
          </a>
          <nav>
            {MENU.map((m) => (
              <a key={m.rota} href={'#' + m.rota} className={'menu__item' + (base === m.rota ? ' ativo' : '')} aria-current={base === m.rota ? 'page' : undefined}>
                <Icone nome={m.icone} />
                <span>{m.nome}</span>
                {m.rota === 'laudos' && atrasados > 0 && <span className="menu__alerta" title={`${atrasados} atrasados`}>{atrasados}</span>}
              </a>
            ))}
          </nav>
          <div className="menu__pe">
            {dados.lab.demonstracao && (
              <div className="demo-selo">
                <strong>Demonstração</strong>
                <span>Dados fictícios, guardados só neste navegador.</span>
                <button className="botao botao--fantasma botao--peq" onClick={() => setRestaurar(true)}>Restaurar exemplo</button>
              </div>
            )}
            <a className="assinatura" href="https://frdevbr.github.io" target="_blank" rel="noreferrer">
              <span className="assinatura__selo">FR</span>
              <span>Sistema feito pela <strong>FR Dev</strong></span>
            </a>
          </div>
        </aside>

        <header className="topo-cel">
          <a className="topo-cel__marca" href="#painel">
            <LogoLab lab={dados.lab} tam={30} />
            <strong>{dados.lab.nome}</strong>
          </a>
          {dados.lab.demonstracao && <span className="chip chip--demo">Demonstração</span>}
          <a href="#ajustes" className="botao botao--icone" aria-label="Ajustes"><Icone nome="ajustes" /></a>
        </header>

        <main className="conteudo" id="conteudo" tabIndex={-1}>
          <Tela rota={rota} key={rota.split('?')[0]} />
        </main>

        <nav className="barra-cel" aria-label="Menu">
          {MENU.filter((m) => !m.soComputador).map((m) => (
            <a key={m.rota} href={'#' + m.rota} className={base === m.rota ? 'ativo' : ''} aria-current={base === m.rota ? 'page' : undefined}>
              <span className="barra-cel__icone">
                <Icone nome={m.icone} tam={22} />
                {m.rota === 'laudos' && atrasados > 0 && <span className="menu__alerta">{atrasados}</span>}
              </span>
              <span>{m.nome}</span>
            </a>
          ))}
        </nav>
      </div>
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
