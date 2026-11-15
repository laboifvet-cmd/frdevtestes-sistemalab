// Página pública de conferência: quem recebeu o laudo confere se ele é autêntico e se ainda vale.
import { useState } from 'react';
import { useDados } from '../store.js';
import { Icone } from '../ui.jsx';
import { acharCodigo, limparCodigo, formatarCodigo } from '../selo.js';
import { dataBR, dataExtenso } from '../util.js';
import { Laudo, FolhasEscaladas, LogoLab } from '../papel.jsx';

export default function Verificar({ codigoInicial }) {
  const { entradas, modelos, lab } = useDados();
  const ini = limparCodigo(codigoInicial);
  const [txt, setTxt] = useState(ini.length > 4 ? ini.slice(0, 4) + '-' + ini.slice(4) : ini);
  const [buscado, setBuscado] = useState(ini);
  const [verLaudo, setVerLaudo] = useState(false);
  const achado = buscado ? acharCodigo(entradas, buscado) : null;

  const conferir = (ev) => {
    ev.preventDefault();
    const c = limparCodigo(txt);
    setBuscado(c);
    setVerLaudo(false);
    history.replaceState(null, '', '#verificar' + (c ? '-' + c : ''));
  };

  let resultado = null;
  if (buscado && buscado.length < 8) {
    resultado = <div className="ver-res ver-res--erro"><Icone nome="alerta" /><div><strong>Código incompleto</strong><p>O código tem 8 letras e números, como 7F3A-91C2. Ele fica embaixo do QR code, no fim do laudo.</p></div></div>;
  } else if (buscado && !achado) {
    resultado = (
      <div className="ver-res ver-res--erro">
        <Icone nome="alerta" />
        <div>
          <strong>Nenhum laudo com o código {formatarCodigo(buscado)}</strong>
          <p>Confira se digitou certo. Se o código estiver certo e não aparecer aqui, o documento pode não ter sido emitido por este laboratório: fale com a gente antes de usar.</p>
        </div>
      </div>
    );
  } else if (achado) {
    const { e, versao, atual, posterior } = achado;
    const modelo = modelos.find((m) => m.id === versao.modeloId) || modelos.find((m) => m.id === e.modeloId);
    const original = { ...e, modeloId: versao.modeloId, laudo: { ...e.laudo, valores: versao.valores, liberadoEm: versao.liberadoEm, assinantes: versao.assinantes.map((a) => a.id), assinantesSalvos: versao.assinantes, codigo: versao.codigo, hash: versao.hash } };
    resultado = (
      <>
        <div className={'ver-res ' + (atual ? 'ver-res--ok' : 'ver-res--aviso')}>
          <Icone nome={atual ? 'check' : 'alerta'} />
          <div>
            <strong>{atual ? 'Laudo autêntico e válido' : 'Laudo autêntico, mas substituído'}</strong>
            <p>
              {atual
                ? `Emitido por ${lab.nome} e liberado em ${dataExtenso(versao.liberadoEm)}. Se o conteúdo do seu PDF for diferente do laudo original abaixo, ele foi alterado depois de emitido.`
                : `Este laudo foi reaberto para correção${versao.substituidaEm ? ' em ' + dataBR(versao.substituidaEm) : ''}${posterior.length ? ' e liberado de novo com o código ' + posterior.at(-1).codigo : ''}. Use a versão mais nova.`}
            </p>
          </div>
        </div>
        <dl className="ver-dados">
          <div><dt>Laudo</dt><dd className="mono">{e.numero}</dd></div>
          <div><dt>Exame</dt><dd>{e.exameNome}</dd></div>
          <div><dt>Paciente</dt><dd>{e.paciente.nome} · {e.paciente.especie}</dd></div>
          <div><dt>Clínica</dt><dd>{e.clienteNome}</dd></div>
          <div><dt>Liberado em</dt><dd>{dataBR(versao.liberadoEm)}</dd></div>
          <div><dt>Código</dt><dd className="mono">{versao.codigo}</dd></div>
          <div className="largo"><dt>Assinado por</dt><dd>{versao.assinantes.map((a) => `${a.nome}${a.crmv ? ' (' + a.crmv + ')' : ''}`).join(' · ')}</dd></div>
          <div className="largo"><dt>Impressão digital (SHA-256)</dt><dd className="mono ver-hash">{versao.hash}</dd></div>
        </dl>
        {modelo && (
          <>
            <button className="botao" onClick={() => setVerLaudo((v) => !v)}><Icone nome="olho" /> {verLaudo ? 'Esconder o laudo original' : 'Ver o laudo original'}</button>
            {verLaudo && (
              <div className="ver-papel">
                <FolhasEscaladas maxEscala={0.9}><Laudo lab={lab} modelo={modelo} entrada={original} valores={versao.valores} /></FolhasEscaladas>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="ver">
      <header className="ver__topo">
        <LogoLab lab={lab} tam={34} />
        <div><strong>{lab.nome}</strong><span>Conferência de laudos</span></div>
        <a className="link ver__voltar" href="#painel">Voltar ao sistema</a>
      </header>
      <main className="ver__corpo">
        <h1>Confira se o laudo é autêntico</h1>
        <p className="suave">Digite o código que aparece no fim do laudo, ao lado do QR code.</p>
        <form className="ver-form" onSubmit={conferir}>
          <input
            aria-label="Código do laudo"
            value={txt}
            placeholder="0000-0000"
            maxLength={9}
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(e) => {
              const c = limparCodigo(e.target.value);
              setTxt(c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c);
            }}
          />
          <button className="botao botao--primario" type="submit">Conferir</button>
        </form>
        {resultado}
        {lab.demonstracao && (
          <p className="ver-nota">
            <Icone nome="alerta" tam={14} /> Demonstração: aqui a conferência só encontra laudos liberados neste navegador. No sistema do laboratório, esta página fica no endereço dele e funciona para qualquer pessoa.
          </p>
        )}
      </main>
    </div>
  );
}
