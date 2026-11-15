// Ajustes: dados do laboratório que saem no laudo, e os dados da demonstração.
import { useRef, useState, useEffect } from 'react';
import { useDados, acoes, pegar } from '../store.js';
import { Icone, Campo, Interruptor, Confirmar, useAviso } from '../ui.jsx';
import { lerArquivoComoDataURL, salvarArquivo, hoje } from '../util.js';
import { LogoLab } from '../papel.jsx';

const CORES = ['#1F4E5A', '#0E4D4A', '#283A6B', '#5B2A6E', '#7A2E3A', '#2F5D34', '#3A3A3A'];

function Imagem({ rotulo, dica, valor, onChange, alt = 64 }) {
  const ref = useRef(null);
  const avisar = useAviso();
  return (
    <div className="campo">
      <span className="rotulo">{rotulo}</span>
      <div className="imagem-campo">
        <span className="imagem-campo__previa" style={{ height: alt }}>{valor ? <img src={valor} alt="" /> : <span className="suave">sem imagem</span>}</span>
        <button className="botao botao--peq" onClick={() => ref.current?.click()}>{valor ? 'Trocar' : 'Enviar imagem'}</button>
        {valor && <button className="botao botao--fantasma botao--peq" onClick={() => onChange(null)}>Tirar</button>}
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => {
          const a = e.target.files?.[0];
          e.target.value = '';
          if (!a) return;
          try { onChange(await lerArquivoComoDataURL(a, 600)); } catch (err) { avisar(err.message, 'erro'); }
        }} />
      </div>
      {dica && <small className="campo__dica">{dica}</small>}
    </div>
  );
}

export default function Ajustes() {
  const { lab } = useDados();
  const avisar = useAviso();
  const [l, setL] = useState(() => structuredClone(lab));
  const [confirmar, setConfirmar] = useState(null);
  const arquivo = useRef(null);
  useEffect(() => setL(structuredClone(lab)), [lab]);
  const mudou = JSON.stringify(l) !== JSON.stringify(lab);
  const set = (k, v) => setL((o) => ({ ...o, [k]: v }));

  const baixarCopia = async () => {
    const blob = new Blob([JSON.stringify(pegar(), null, 1)], { type: 'application/json' });
    const r = await salvarArquivo(`copia-laboratorio-${hoje()}.json`, blob).catch(() => null);
    if (r === 'salvo') avisar('Cópia salva.');
  };
  const carregarCopia = async (a) => {
    try {
      acoes.importar(JSON.parse(await a.text()));
      avisar('Cópia carregada.');
    } catch (err) {
      avisar(err.message || 'Arquivo inválido.', 'erro');
    }
  };

  return (
    <div className="tela tela--estreita">
      <header className="tela__topo">
        <div>
          <h1>Ajustes</h1>
          <p className="suave">Dados do laboratório que saem nos laudos, tabelas e fechamentos</p>
        </div>
      </header>

      <section className="cartao">
        <header className="cartao__topo"><h2>Laboratório</h2></header>
        <div className="previa-marca" style={{ '--cor': l.cor }}>
          <LogoLab lab={l} tam={48} />
          <div><strong>{l.nome || 'Nome do laboratório'}</strong><span>{l.descricao}</span></div>
        </div>
        <div className="form-grade form-grade--2">
          <Campo rotulo="Nome">{(id) => <input id={id} value={l.nome} onChange={(e) => set('nome', e.target.value)} />}</Campo>
          <Campo rotulo="Descrição">{(id) => <input id={id} value={l.descricao} onChange={(e) => set('descricao', e.target.value)} />}</Campo>
          <Campo rotulo="Endereço" largo>{(id) => <input id={id} value={l.endereco} onChange={(e) => set('endereco', e.target.value)} />}</Campo>
          <Campo rotulo="Telefone">{(id) => <input id={id} value={l.telefone} onChange={(e) => set('telefone', e.target.value)} />}</Campo>
          <Campo rotulo="E-mail">{(id) => <input id={id} value={l.email} onChange={(e) => set('email', e.target.value)} />}</Campo>
          <Campo rotulo="Site">{(id) => <input id={id} value={l.site} onChange={(e) => set('site', e.target.value)} />}</Campo>
          <Campo rotulo="Chave Pix" dica="Sai no fechamento mensal das clínicas.">{(id) => <input id={id} value={l.pix || ''} onChange={(e) => set('pix', e.target.value)} />}</Campo>
        </div>
        <div className="campo">
          <span className="rotulo">Cor da marca</span>
          <div className="cores">
            {CORES.map((c) => (
              <button key={c} className={'cor' + (l.cor === c ? ' ligada' : '')} style={{ background: c }} aria-label={`Cor ${c}`} aria-pressed={l.cor === c} onClick={() => set('cor', c)} />
            ))}
            <label className="cor cor--livre" aria-label="Outra cor">
              <input type="color" value={l.cor} onChange={(e) => set('cor', e.target.value)} />
            </label>
          </div>
        </div>
        <Imagem rotulo="Logo" dica="PNG com fundo transparente fica melhor. Sem logo, entram as iniciais." valor={l.logo} onChange={(v) => set('logo', v)} />
      </section>

      <section className="cartao">
        <header className="cartao__topo">
          <h2>Laudo</h2>
          <a className="link" href="#equipe">Patologistas e assinaturas ficam em Equipe →</a>
        </header>
        <Campo rotulo="Texto do rodapé do laudo">{(id) => <textarea id={id} rows={2} value={l.rodape} onChange={(e) => set('rodape', e.target.value)} />}</Campo>
        <Interruptor ligado={l.demonstracao} onChange={(v) => set('demonstracao', v)} rotulo="Marca d’água “Demonstração” nos PDFs" dica="Desligue quando o laboratório for usar de verdade." />
      </section>

      {mudou && (
        <div className="salvar-fixo">
          <span>Há mudanças não salvas.</span>
          <button className="botao botao--fantasma" onClick={() => setL(structuredClone(lab))}>Desfazer</button>
          <button className="botao botao--primario" onClick={() => { acoes.salvarLab(l); avisar('Ajustes salvos.'); }}><Icone nome="check" /> Salvar</button>
        </div>
      )}

      <section className="cartao">
        <header className="cartao__topo"><h2>Dados desta demonstração</h2></header>
        <p className="meta">Tudo fica guardado só neste navegador. Para levar para outro computador, baixe uma cópia e carregue lá.</p>
        <div className="barra-acoes">
          <button className="botao" onClick={baixarCopia}><Icone nome="baixar" /> Baixar cópia</button>
          <button className="botao" onClick={() => arquivo.current?.click()}>Carregar cópia</button>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ''; if (a) carregarCopia(a); }} />
          <button className="botao botao--fantasma" onClick={() => setConfirmar('exemplo')}>Restaurar exemplo</button>
          <button className="botao botao--fantasma botao--perigo-txt" onClick={() => setConfirmar('zero')}>Começar do zero</button>
        </div>
      </section>

      <p className="assinatura-pe">
        <span className="assinatura__selo">FR</span> Sistema feito pela <a href="https://frdevbr.github.io" target="_blank" rel="noreferrer">FR Dev</a>
      </p>

      <Confirmar
        aberta={!!confirmar}
        titulo={confirmar === 'zero' ? 'Começar do zero?' : 'Restaurar os dados de exemplo?'}
        texto={confirmar === 'zero' ? 'Apaga exames, laudos e clientes. Ficam os modelos de laudo, a tabela de exames e os dados do laboratório de exemplo.' : 'Tudo o que você mudou volta ao início.'}
        botao={confirmar === 'zero' ? 'Apagar e começar' : 'Restaurar'}
        perigo
        onNao={() => setConfirmar(null)}
        onSim={() => { if (confirmar === 'zero') acoes.comecarDoZero(); else acoes.restaurarExemplo(); setConfirmar(null); avisar('Pronto.'); }}
      />
    </div>
  );
}
