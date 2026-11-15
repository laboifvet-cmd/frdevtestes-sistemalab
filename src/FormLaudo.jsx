// Formulário de preenchimento de um laudo, montado a partir do modelo.
import { useRef } from 'react';
import { Icone, Campo } from './ui.jsx';
import { lerArquivoComoDataURL } from './util.js';

function Frases({ frases, onUsar }) {
  if (!frases?.length) return null;
  return (
    <div className="frases" aria-label="Frases prontas">
      {frases.map((f, i) => (
        <button key={i} type="button" className="frase" onClick={() => onUsar(f)} title={f}>
          <Icone nome="mais" tam={14} />
          <span>{f}</span>
        </button>
      ))}
    </div>
  );
}

function AreaTexto({ id, valor, onChange, travado, destaque }) {
  return (
    <textarea
      id={id}
      className={'area' + (destaque ? ' area--destaque' : '')}
      value={valor || ''}
      disabled={travado}
      rows={Math.min(14, Math.max(3, Math.ceil(String(valor || '').length / 70) + String(valor || '').split('\n').length))}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function Fotos({ c, valor, onChange, travado, avisar }) {
  const input = useRef(null);
  const fotos = Array.isArray(valor) ? valor : [];
  const adicionar = async (arquivos) => {
    const lista = [...arquivos].filter((a) => /^image\//.test(a.type)).slice(0, Math.max(0, (c.max || 6) - fotos.length));
    if (!lista.length) return avisar?.(`Este campo aceita até ${c.max || 6} fotos.`, 'erro');
    const novas = [];
    for (const a of lista) novas.push({ src: await lerArquivoComoDataURL(a, 1400, 0.82), legenda: '' });
    onChange([...fotos, ...novas]);
  };
  return (
    <div className="fotos-campo">
      {fotos.map((f, i) => (
        <div className="foto-item" key={i}>
          <img src={f.src} alt={f.legenda || `Foto ${i + 1}`} />
          <div className="foto-item__dados">
            <input
              aria-label={`Legenda da figura ${i + 1}`}
              placeholder={`Legenda da figura ${i + 1}`}
              value={f.legenda}
              disabled={travado}
              onChange={(e) => onChange(fotos.map((x, j) => (j === i ? { ...x, legenda: e.target.value } : x)))}
            />
            {!travado && (
              <button type="button" className="botao botao--fantasma botao--peq" onClick={() => onChange(fotos.filter((_, j) => j !== i))}>
                <Icone nome="lixo" tam={16} /> Tirar
              </button>
            )}
          </div>
        </div>
      ))}
      {!travado && fotos.length < (c.max || 6) && (
        <>
          <button type="button" className="soltar-foto" onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); adicionar(e.dataTransfer.files); }}>
            <Icone nome="imagens" tam={22} />
            <span><strong>Adicionar fotos</strong> ou arraste aqui</span>
            <small>até {c.max || 6} · JPG ou PNG</small>
          </button>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { adicionar(e.target.files); e.target.value = ''; }} />
        </>
      )}
    </div>
  );
}

function Tabela({ c, valor, onChange, travado }) {
  const linhas = Array.isArray(valor) && valor.length ? valor : c.linhas;
  return (
    <div className="tabela-rolagem">
      <table className="tabela-form">
        <thead>
          <tr>{c.colunas.map((col, i) => <th key={i}>{col.nome}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((l, li) => (
            <tr key={li}>
              {c.colunas.map((col, ci) => (
                <td key={ci}>
                  {col.preenche ? (
                    <input
                      aria-label={`${l[0] || 'Linha ' + (li + 1)} · ${col.nome}`}
                      value={l[ci] || ''}
                      disabled={travado}
                      inputMode="decimal"
                      onChange={(e) => onChange(linhas.map((x, xi) => (xi === li ? x.map((y, yi) => (yi === ci ? e.target.value : y)) : x)))}
                    />
                  ) : (
                    <span className={ci === 0 ? 'forte' : 'suave'}>{l[ci]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampoLaudo({ c, valor, onChange, travado, faltando, avisar }) {
  if (c.tipo === 'secao') return <h3 className="form-secao" id={'campo-' + c.id}>{c.rotulo}</h3>;
  if (c.tipo === 'fixo') return <p className="form-fixo" id={'campo-' + c.id}><Icone nome="fixo" tam={14} /> {c.texto}</p>;
  const rot = (
    <>
      {c.rotulo}
      {c.obrigatorio && <span className="obrig" aria-label="obrigatório"> *</span>}
    </>
  );
  const erro = faltando ? 'Preencha antes de liberar.' : null;
  const classe = (c.largura === 'metade' ? 'campo--metade ' : '') + (faltando ? 'campo--falta' : '');
  switch (c.tipo) {
    case 'texto':
      return (
        <Campo rotulo={rot} erro={erro} className={classe}>
          {(id) => <input id={id} data-campo={c.id} value={valor || ''} disabled={travado} onChange={(e) => onChange(e.target.value)} />}
        </Campo>
      );
    case 'paragrafo':
      return (
        <Campo rotulo={rot} erro={erro} className={classe + ' campo--largo'}>
          {(id) => (
            <>
              <AreaTexto id={id} valor={valor} onChange={onChange} travado={travado} destaque={c.destaque} />
              {!travado && <Frases frases={c.frases} onUsar={(f) => onChange(((valor || '').trim() ? valor.trim() + ' ' : '') + f)} />}
            </>
          )}
        </Campo>
      );
    case 'numero':
      return (
        <Campo rotulo={rot} erro={erro} dica={c.referencia ? `Referência: ${c.referencia}${c.unidade ? ' ' + c.unidade : ''}` : null} className={classe}>
          {(id) => (
            <div className="com-sufixo">
              <input id={id} inputMode="decimal" value={valor || ''} disabled={travado} onChange={(e) => onChange(e.target.value)} />
              {c.unidade && <span>{c.unidade}</span>}
            </div>
          )}
        </Campo>
      );
    case 'data':
      return (
        <Campo rotulo={rot} erro={erro} className={classe}>
          {(id) => <input id={id} type="date" value={valor || ''} disabled={travado} onChange={(e) => onChange(e.target.value)} />}
        </Campo>
      );
    case 'selecao':
      return (
        <Campo rotulo={rot} erro={erro} className={classe}>
          {(id) => (
            <select id={id} value={valor || ''} disabled={travado} onChange={(e) => onChange(e.target.value)}>
              <option value="">Escolha…</option>
              {c.opcoes.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
        </Campo>
      );
    case 'unica':
      return (
        <fieldset className={'campo campo--largo ' + classe} id={'campo-' + c.id}>
          <legend>{rot}</legend>
          <div className="pilulas">
            {c.opcoes.map((o) => (
              <label key={o} className={'pilula' + (valor === o ? ' ligada' : '')}>
                <input type="radio" name={'r-' + c.id} checked={valor === o} disabled={travado} onChange={() => onChange(o)} onClick={() => valor === o && onChange('')} />
                {o}
              </label>
            ))}
          </div>
          {erro && <small className="campo__erro">{erro}</small>}
        </fieldset>
      );
    case 'multipla': {
      const lista = Array.isArray(valor) ? valor : [];
      return (
        <fieldset className={'campo campo--largo ' + classe} id={'campo-' + c.id}>
          <legend>{rot}</legend>
          <div className="pilulas">
            {c.opcoes.map((o) => (
              <label key={o} className={'pilula pilula--caixa' + (lista.includes(o) ? ' ligada' : '')}>
                <input type="checkbox" checked={lista.includes(o)} disabled={travado}
                  onChange={(e) => onChange(e.target.checked ? [...lista, o] : lista.filter((x) => x !== o))} />
                {o}
              </label>
            ))}
          </div>
          {erro && <small className="campo__erro">{erro}</small>}
        </fieldset>
      );
    }
    case 'tabela':
      return (
        <div className={'campo campo--largo ' + classe} id={'campo-' + c.id}>
          <span className="rotulo">{rot}</span>
          <Tabela c={c} valor={valor} onChange={onChange} travado={travado} />
          {erro && <small className="campo__erro">{erro}</small>}
        </div>
      );
    case 'imagens':
      return (
        <div className={'campo campo--largo ' + classe} id={'campo-' + c.id}>
          <span className="rotulo">{rot}</span>
          <Fotos c={c} valor={valor} onChange={onChange} travado={travado} avisar={avisar} />
          {erro && <small className="campo__erro">{erro}</small>}
        </div>
      );
    default:
      return null;
  }
}

export function FormLaudo({ modelo, valores, onChange, travado, faltando = [], avisar }) {
  return (
    <div className="form-laudo">
      {modelo.campos.map((c) => (
        <CampoLaudo
          key={c.id}
          c={c}
          valor={valores[c.id]}
          travado={travado}
          faltando={faltando.includes(c.id)}
          avisar={avisar}
          onChange={(v) => onChange(c.id, v)}
        />
      ))}
    </div>
  );
}
