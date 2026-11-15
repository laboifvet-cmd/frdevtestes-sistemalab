// Folhas A4: divide o conteúdo em páginas (medindo cada bloco) e desenha laudo, tabela de preços e fatura.
import { useLayoutEffect, useRef, useState, useEffect, Fragment } from 'react';
import { campoVazio } from './campos.js';
import { assinantesDoLaudo } from './equipe.js';

// cidade para a data do laudo, tirada do endereço ("… · Fortaleza - CE")
export function cidadeDe(lab) {
  const m = String(lab.endereco || '').split('·').pop().trim().match(/^([^-–,]+)/);
  return (m && m[1].trim()) || 'Fortaleza';
}
import { dataBR, real, codigoVerificacao, dataExtenso, hoje, mesNome } from './util.js';

// mistura a cor da marca com branco (o gerador de PDF não entende color-mix)
function misturar(hex, pct) {
  const h = String(hex || '#1F4E5A').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16) || 0;
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * pct + 255 * (1 - pct)));
  return `rgb(${c.join(',')})`;
}
function varsDaCor(cor) {
  const h = String(cor || '#1F4E5A').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16) || 0;
  return {
    '--cor': cor, '--cor-fundo': misturar(cor, 0.06), '--cor-borda': misturar(cor, 0.18), '--cor-linha': misturar(cor, 0.4),
    '--cor-marca': `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.06)`,
  };
}

export const A4 = { larg: 794, alt: 1123, margemX: 56, margemTopo: 44, margemBase: 40 };

// ---------- Paginador genérico ----------
// blocos: [{ chave, no: <elemento>, junto: true (fica com o próximo) }]
export function Paginas({ primeiro, demais, blocos, rodape, marca, classe = '', cor }) {
  const medidor = useRef(null);
  const [paginas, setPaginas] = useState([blocos.map((_, i) => i)]);
  const [versaoFonte, setVersaoFonte] = useState(0);

  useEffect(() => {
    document.fonts?.ready?.then(() => setVersaoFonte((v) => v + 1));
  }, []);

  useLayoutEffect(() => {
    const m = medidor.current;
    if (!m) return;
    const alt = (sel) => m.querySelector(sel)?.offsetHeight || 0; // offsetHeight ignora a redução da prévia
    const hPrim = alt('[data-medir="primeiro"]');
    const hDem = alt('[data-medir="demais"]');
    const hRod = alt('[data-medir="rodape"]');
    const hs = [...m.querySelectorAll('[data-bloco]')].map((el) => el.offsetHeight);
    const util = A4.alt - A4.margemTopo - A4.margemBase - hRod - 8;
    const res = [];
    let atual = [];
    let livre = util - hPrim;
    for (let i = 0; i < blocos.length; i++) {
      let h = hs[i];
      // título que ficaria sozinho no fim da página vai junto com o próximo
      if (blocos[i].junto && i + 1 < blocos.length) h += hs[i + 1];
      if (h > livre && atual.length) {
        res.push(atual);
        atual = [];
        livre = util - hDem;
      }
      atual.push(i);
      livre -= hs[i];
    }
    res.push(atual);
    const novo = JSON.stringify(res);
    if (novo !== JSON.stringify(paginas)) setPaginas(res);
  });

  const total = paginas.length;
  return (
    <>
      <div className="papel-medidor" ref={medidor} aria-hidden="true">
        <div className="papel-pagina papel-pagina--medir" style={varsDaCor(cor)}>
          <div data-medir="primeiro">{primeiro}</div>
          <div data-medir="demais">{demais}</div>
          {blocos.map((b, i) => (
            <div key={b.chave + '-m'} data-bloco={i} className={'papel-bloco' + (b.aperto ? ' papel-bloco--aperto' : '')}>{b.no}</div>
          ))}
          <div data-medir="rodape">{rodape(1, 1)}</div>
          <span hidden>{versaoFonte}</span>
        </div>
      </div>
      <div className={'papel-paginas ' + classe}>
        {paginas.map((idx, p) => (
          <div className="papel-pagina" key={p} data-pagina={p + 1} style={varsDaCor(cor)}>
            {marca && <div className="papel-marca" aria-hidden="true">{marca}</div>}
            {p === 0 ? primeiro : demais}
            <div className="papel-conteudo">
              {idx.map((i) => blocos[i] && (
                <div key={blocos[i].chave} className={'papel-bloco' + (blocos[i].aperto ? ' papel-bloco--aperto' : '')}>{blocos[i].no}</div>
              ))}
            </div>
            {rodape(p + 1, total)}
          </div>
        ))}
      </div>
    </>
  );
}

// Mostra as folhas reduzidas para caber na largura disponível
export function FolhasEscaladas({ children, maxEscala = 1 }) {
  const caixa = useRef(null);
  const dentro = useRef(null);
  const [esc, setEsc] = useState(0.6);
  const [alt, setAlt] = useState(800);
  useLayoutEffect(() => {
    const c = caixa.current;
    if (!c) return;
    const medir = () => {
      const e = Math.min(maxEscala, (c.clientWidth - 2) / A4.larg);
      setEsc(e);
      setAlt((dentro.current?.scrollHeight || 0) * e);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(c);
    if (dentro.current) ro.observe(dentro.current);
    return () => ro.disconnect();
  }, [maxEscala]);
  return (
    <div className="folhas-escala" ref={caixa} style={{ height: alt }}>
      <div ref={dentro} style={{ transform: `scale(${esc})`, transformOrigin: 'top left', width: A4.larg }}>{children}</div>
    </div>
  );
}

// ---------- Cabeçalho do laboratório ----------
function iniciais(nome) {
  return String(nome || 'LB').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}
export function LogoLab({ lab, tam = 54 }) {
  if (lab.logo) return <img src={lab.logo} alt="" className="papel-logo" style={{ height: tam, maxWidth: tam * 3 }} />;
  return (
    <span className="papel-monograma" style={{ width: tam, height: tam, background: lab.cor, fontSize: tam * 0.38 }}>
      {iniciais(lab.nome)}
    </span>
  );
}

function CabecalhoLab({ lab }) {
  return (
    <div className="pp-lab" style={{ '--cor': lab.cor }}>
      <div className="pp-lab__marca">
        <LogoLab lab={lab} />
        <div>
          <div className="pp-lab__nome">{lab.nome}</div>
          {lab.descricao && <div className="pp-lab__desc">{lab.descricao}</div>}
        </div>
      </div>
      <div className="pp-lab__contato">
        {lab.endereco && <div>{lab.endereco}</div>}
        <div>{[lab.telefone, lab.email].filter(Boolean).join(' · ')}</div>
        {lab.site && <div>{lab.site}</div>}
      </div>
    </div>
  );
}

// ---------- Laudo ----------
const linhaVazia = <span className="pp-vazio">_______________</span>;

function textoValor(c, v) {
  if (c.tipo === 'numero') {
    const ref = c.referencia ? <span className="pp-ref"> (referência: {c.referencia}{c.unidade ? ' ' + c.unidade : ''})</span> : null;
    return (
      <>
        <span className="pp-val">{v}{c.unidade ? ' ' + c.unidade : ''}</span>
        {ref}
      </>
    );
  }
  if (c.tipo === 'data') return <span className="pp-val">{dataBR(v)}</span>;
  return <span className="pp-val">{v}</span>;
}

function Opcoes({ c, v, previa }) {
  const marcadas = c.tipo === 'multipla' ? (Array.isArray(v) ? v : []) : v ? [v] : [];
  if (c.mostrarTodas) {
    return (
      <span className="pp-opcoes">
        {c.opcoes.map((o) => (
          <span key={o} className={marcadas.includes(o) ? 'marcada' : ''}>
            <span className="pp-caixa" aria-hidden="true">{marcadas.includes(o) ? '✓' : ''}</span>
            {o}
          </span>
        ))}
      </span>
    );
  }
  if (!marcadas.length) return previa ? linhaVazia : null;
  return <span className="pp-val">{marcadas.join(', ')}</span>;
}

function BlocoCampo({ c, v, previa }) {
  const vazio = campoVazio(c, v);
  switch (c.tipo) {
    case 'secao':
      return <h3 className="pp-secao">{c.rotulo}</h3>;
    case 'fixo':
      return <p className="pp-fixo">{c.texto}</p>;
    case 'paragrafo':
      return (
        <div className={'pp-par' + (c.destaque ? ' pp-par--destaque' : '')}>
          {c.rotulo && <div className="pp-rotulo">{c.rotulo}</div>}
          {vazio ? <div className="pp-linhas" aria-hidden="true"><span /><span /><span /></div> : String(v).split(/\n+/).map((t, i) => <p key={i}>{t}</p>)}
        </div>
      );
    case 'unica':
    case 'multipla':
      return (
        <div className="pp-inline">
          <span className="pp-rotulo-in">{c.rotulo}:</span> <Opcoes c={c} v={v} previa={previa} />
        </div>
      );
    case 'tabela': {
      const linhas = Array.isArray(v) && v.length ? v : c.linhas;
      return (
        <div className="pp-tab-caixa">
          {c.rotulo && <div className="pp-rotulo">{c.rotulo}</div>}
          <table className="pp-tab">
            <thead>
              <tr>{c.colunas.map((col, i) => <th key={i}>{col.nome}</th>)}</tr>
            </thead>
            <tbody>
              {linhas.map((l, li) => (
                <tr key={li}>
                  {c.colunas.map((col, ci) => (
                    <td key={ci} className={col.preenche ? 'res' : ''}>{l[ci] || (col.preenche && previa ? '—' : l[ci])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'imagens': {
      const fotos = Array.isArray(v) ? v : [];
      return (
        <div>
          {c.rotulo && <div className="pp-rotulo">{c.rotulo}</div>}
          {fotos.length ? (
            <div className="pp-fotos">
              {fotos.map((f, i) => (
                <figure key={i}>
                  <img src={f.src} alt={f.legenda || ''} />
                  <figcaption><strong>Figura {i + 1}.</strong> {f.legenda}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="pp-fotos pp-fotos--vazio"><span>foto</span><span>foto</span></div>
          )}
        </div>
      );
    }
    default:
      return (
        <div className="pp-inline">
          <span className="pp-rotulo-in">{c.rotulo}:</span> {vazio ? linhaVazia : textoValor(c, v)}
        </div>
      );
  }
}

// monta a lista de blocos de um laudo (campos de meia largura vão lado a lado)
export function blocosDoLaudo(modelo, valores, previa, sel) {
  const blocos = [];
  const env = (c, no) => <div data-campo={c.id} className={'pp-campo' + (sel === c.id ? ' pp-sel' : '')}>{no}</div>;
  const largo = (c) => ['secao', 'paragrafo', 'tabela', 'imagens', 'fixo'].includes(c.tipo);
  const visiveis = modelo.campos.filter((c) => previa || !(c.ocultarVazio && campoVazio(c, valores[c.id])) || c.tipo === 'secao' || c.tipo === 'fixo');
  // tira seções que ficaram sem nada embaixo
  const finais = visiveis.filter((c, i) => {
    if (c.tipo !== 'secao' || previa) return true;
    const prox = visiveis[i + 1];
    return prox && prox.tipo !== 'secao';
  });
  for (let i = 0; i < finais.length; i++) {
    const c = finais[i];
    const v = valores[c.id];
    const prox = finais[i + 1];
    if (c.largura === 'metade' && !largo(c) && prox && prox.largura === 'metade' && !largo(prox)) {
      blocos.push({
        chave: c.id + '+' + prox.id,
        no: (
          <div className="pp-dupla">
            {env(c, <BlocoCampo c={c} v={v} previa={previa} />)}
            {env(prox, <BlocoCampo c={prox} v={valores[prox.id]} previa={previa} />)}
          </div>
        ),
      });
      i++;
      continue;
    }
    if (c.tipo === 'imagens' && Array.isArray(v) && v.length > 2) {
      // fotos em linhas de duas, para quebrar página entre elas
      for (let k = 0; k < v.length; k += 2) {
        blocos.push({
          chave: c.id + '-' + k,
          no: env(c, (
            <div>
              {k === 0 && c.rotulo && <div className="pp-rotulo">{c.rotulo}</div>}
              <div className="pp-fotos">
                {v.slice(k, k + 2).map((f, j) => (
                  <figure key={j}>
                    <img src={f.src} alt={f.legenda || ''} />
                    <figcaption><strong>Figura {k + j + 1}.</strong> {f.legenda}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )),
        });
      }
      continue;
    }
    // texto longo com vários parágrafos: um bloco por parágrafo, para a página quebrar entre eles
    const partes = c.tipo === 'paragrafo' && !c.destaque && !campoVazio(c, v) ? String(v).split(/\n+/).filter((t) => t.trim()) : [];
    if (partes.length > 1) {
      partes.forEach((t, k) =>
        blocos.push({
          chave: c.id + '-p' + k,
          aperto: k < partes.length - 1,
          junto: k === 0,
          no: env(c, (
            <div className="pp-par">
              {k === 0 && c.rotulo && <div className="pp-rotulo">{c.rotulo}</div>}
              <p>{t}</p>
            </div>
          )),
        }),
      );
      continue;
    }
    blocos.push({ chave: c.id, no: env(c, <BlocoCampo c={c} v={v} previa={previa} />), junto: c.tipo === 'secao' });
  }
  return blocos;
}

export function Laudo({ lab, modelo, entrada, valores, previa, sel }) {
  const e = entrada;
  const liberado = !!e?.laudo?.liberadoEm;
  const cod = codigoVerificacao((e?.numero || 'previa') + (e?.laudo?.liberadoEm || ''));
  const pac = e?.paciente || {};
  const dados = [
    ['Paciente', pac.nome], ['Espécie', pac.especie], ['Raça', pac.raca], ['Sexo', pac.sexo], ['Idade', pac.idade],
    ['Tutor(a)', e?.tutor?.nome], ['Clínica', e?.clienteNome], ['Requisitante', e?.vet?.nome ? `${e.vet.nome}${e.vet.crmv ? ' · ' + e.vet.crmv : ''}` : ''],
    ['Material', e?.material], ['Entrada', e ? dataBR(e.dataEntrada) : ''], ['Liberação', liberado ? dataBR(e.laudo.liberadoEm) : ''],
  ];
  const primeiro = (
    <div className="pp-topo" style={{ '--cor': lab.cor }}>
      <CabecalhoLab lab={lab} />
      <div className="pp-titulo">
        <div>
          <h1>{modelo.nome}</h1>
          {modelo.subtitulo && <div className="pp-sub">{modelo.subtitulo}</div>}
        </div>
        <div className="pp-num">
          <span>Nº</span>
          <strong>{e?.numero || 'XX 00-0000'}</strong>
        </div>
      </div>
      <dl className="pp-dados">
        {dados.map(([r, v]) => (
          <div key={r} className={r === 'Requisitante' || r === 'Material' ? 'largo' : ''}>
            <dt>{r}</dt>
            <dd>{v || (previa ? '—' : '—')}</dd>
          </div>
        ))}
      </dl>
      {e?.historico && (
        <div className="pp-historico">
          <span className="pp-rotulo-in">Histórico clínico:</span> {e.historico}
        </div>
      )}
    </div>
  );
  const demais = (
    <div className="pp-topo-curto" style={{ '--cor': lab.cor }}>
      <span><strong>{lab.nome}</strong> · {modelo.nome}</span>
      <span>Nº {e?.numero || '—'} · {pac.nome || 'Paciente'} · continuação</span>
    </div>
  );
  const blocos = blocosDoLaudo(modelo, valores, previa, sel);
  const quem = assinantesDoLaudo(lab, e);
  blocos.push({
    chave: 'assinatura',
    no: (
      <div className={'pp-assina pp-assina--' + Math.min(3, quem.length)} style={{ '--cor': lab.cor }}>
        <div className="pp-assina__data">
          {liberado ? <>{cidadeDe(lab)}, {dataExtenso(e.laudo.liberadoEm)}.</> : <span className="pp-carimbo">Prévia · laudo ainda não liberado</span>}
        </div>
        <div className="pp-assina__pessoas">
          {quem.map((m) => (
            <div className="pp-assina__quem" key={m.id}>
              {m.assinatura && liberado ? <img src={m.assinatura} alt="" /> : <span className="pp-assina__espaco" />}
              <div className="pp-assina__linha" />
              <strong>{m.nome}</strong>
              {m.titulo && <span>{m.titulo}</span>}
              {m.crmv && <span>{m.crmv}</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  });
  const rodape = (p, t) => (
    <div className="pp-rodape" style={{ '--cor': lab.cor }}>
      <span className="pp-rodape__txt">{lab.rodape}</span>
      <span className="pp-rodape__pag">
        {liberado && <>Verificação {cod} · </>}Página {p} de {t}
      </span>
    </div>
  );
  return (
    <Paginas
      primeiro={primeiro}
      demais={demais}
      blocos={blocos}
      rodape={rodape}
      marca={lab.demonstracao ? 'DEMONSTRAÇÃO' : !liberado && !previa ? 'PRÉVIA' : null}
      cor={lab.cor}
    />
  );
}

// ---------- Documentos simples (tabela de preços, fatura) ----------
export function Documento({ lab, titulo, subtitulo, ladoDireito, blocos, notaFinal }) {
  const primeiro = (
    <div className="pp-topo" style={{ '--cor': lab.cor }}>
      <CabecalhoLab lab={lab} />
      <div className="pp-titulo">
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <div className="pp-sub">{subtitulo}</div>}
        </div>
        {ladoDireito}
      </div>
    </div>
  );
  const demais = (
    <div className="pp-topo-curto" style={{ '--cor': lab.cor }}>
      <span><strong>{lab.nome}</strong> · {titulo}</span>
      <span>continuação</span>
    </div>
  );
  const todos = [...blocos];
  if (notaFinal) todos.push({ chave: 'nota', no: <div className="pp-nota">{notaFinal}</div> });
  const rodape = (p, t) => (
    <div className="pp-rodape" style={{ '--cor': lab.cor }}>
      <span className="pp-rodape__txt">Emitido em {dataBR(hoje())} · {lab.nome}</span>
      <span className="pp-rodape__pag">Página {p} de {t}</span>
    </div>
  );
  return <Paginas primeiro={primeiro} demais={demais} blocos={todos} rodape={rodape} marca={lab.demonstracao ? 'DEMONSTRAÇÃO' : null} cor={lab.cor} />;
}

// linhas de tabela viram blocos de 1 linha para quebrar a página no lugar certo
export function blocosDeTabela(chave, colunas, linhas, total, alinhamentos = []) {
  const cab = (
    <div className="pp-lin pp-lin--cab" style={{ gridTemplateColumns: colunas.map((c) => c.larg || '1fr').join(' ') }}>
      {colunas.map((c, i) => <span key={i} style={{ textAlign: alinhamentos[i] || 'left' }}>{c.nome}</span>)}
    </div>
  );
  const blocos = [{ chave: chave + '-cab', no: cab, junto: true }];
  linhas.forEach((l, li) =>
    blocos.push({
      chave: chave + '-' + li,
      no: (
        <div className={'pp-lin' + (li % 2 ? ' pp-lin--par' : '')} style={{ gridTemplateColumns: colunas.map((c) => c.larg || '1fr').join(' ') }}>
          {l.map((x, i) => <span key={i} style={{ textAlign: alinhamentos[i] || 'left' }}>{x}</span>)}
        </div>
      ),
    }),
  );
  if (total) {
    blocos.push({
      chave: chave + '-total',
      no: (
        <div className="pp-lin pp-lin--total" style={{ gridTemplateColumns: colunas.map((c) => c.larg || '1fr').join(' ') }}>
          {total.map((x, i) => <span key={i} style={{ textAlign: alinhamentos[i] || 'left' }}>{x}</span>)}
        </div>
      ),
    });
  }
  return blocos;
}

export function TabelaPrecos({ lab, exames, cliente, vigencia }) {
  const ativos = exames.filter((x) => x.ativo);
  const linhas = ativos.map((x) => {
    const esp = cliente?.precos?.[x.id];
    const valor = esp !== undefined && esp !== '' && esp !== null ? Number(esp) : x.valor;
    return [
      <Fragment key="n"><strong>{x.nome}</strong>{esp !== undefined && esp !== '' && esp !== null && <em className="pp-esp"> preço especial</em>}</Fragment>,
      x.sigla,
      `${x.prazo} ${x.prazo === 1 ? 'dia útil' : 'dias úteis'}`,
      real(valor),
    ];
  });
  return (
    <Documento
      lab={lab}
      titulo="Tabela de exames"
      subtitulo={(cliente ? `Valores para ${cliente.nome} · ` : '') + `vigência a partir de ${dataBR(vigencia)}`}
      ladoDireito={<div className="pp-num"><span>Exames</span><strong>{ativos.length}</strong></div>}
      blocos={blocosDeTabela('t', [{ nome: 'Exame', larg: '2.6fr' }, { nome: 'Sigla', larg: '.6fr' }, { nome: 'Prazo do laudo', larg: '1.2fr' }, { nome: 'Valor', larg: '1fr' }], linhas, null, ['left', 'left', 'left', 'right'])}
      notaFinal={
        <>
          Prazos contados em dias úteis a partir do recebimento da amostra no laboratório. Valores sujeitos a reajuste; exames já recebidos mantêm o valor da data de entrada.
          {lab.telefone && <> Dúvidas: {lab.telefone}{lab.email ? ' · ' + lab.email : ''}.</>}
        </>
      }
    />
  );
}

export function Fatura({ lab, cliente, mes, itens }) {
  const total = itens.reduce((s, e) => s + Number(e.valor || 0), 0);
  const pago = itens.filter((e) => e.pagamento.status === 'pago').reduce((s, e) => s + Number(e.valor || 0), 0);
  const linhas = itens.map((e) => [dataBR(e.dataEntrada), e.numero, `${e.paciente.nome} (${e.paciente.especie})`, e.exameNome, real(e.valor)]);
  return (
    <Documento
      lab={lab}
      titulo="Fechamento mensal"
      subtitulo={`${cliente.nome} · ${mesNome(mes)}`}
      ladoDireito={<div className="pp-num"><span>Total</span><strong>{real(total)}</strong></div>}
      blocos={blocosDeTabela('f', [{ nome: 'Entrada', larg: '.9fr' }, { nome: 'Nº', larg: '1fr' }, { nome: 'Paciente', larg: '1.5fr' }, { nome: 'Exame', larg: '2fr' }, { nome: 'Valor', larg: '.9fr' }], linhas, ['', '', '', `${itens.length} ${itens.length === 1 ? 'exame' : 'exames'}`, real(total)], ['left', 'left', 'left', 'left', 'right'])}
      notaFinal={
        <>
          {pago > 0 && pago < total && <div><strong>Já pago:</strong> {real(pago)} · <strong>A pagar:</strong> {real(total - pago)}</div>}
          {lab.pix ? <div><strong>Pagamento por Pix:</strong> {lab.pix}</div> : null}
          <div>Em caso de dúvida sobre algum exame desta lista, fale com o laboratório antes do pagamento.</div>
        </>
      }
    />
  );
}
