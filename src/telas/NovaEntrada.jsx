// Folha de entrada de exames (também serve para corrigir os dados de uma entrada).
import { useEffect, useMemo, useState } from 'react';
import { useDados, acoes, precoPara } from '../store.js';
import { Folha, Campo, Icone, Interruptor, useAviso, ir } from '../ui.jsx';
import { hoje, real, somaDiasUteis, dataBR, plural, numBR } from '../util.js';
import { prazoTexto, nomeCompleto } from '../catalogo.js';
import { semAcento } from '../util.js';

const ESPECIES = ['Canina', 'Felina', 'Equina', 'Bovina', 'Ave', 'Roedor', 'Réptil', 'Outra'];

function vazio(clienteId) {
  return {
    clienteId: clienteId || '',
    vet: { nome: '', crmv: '' },
    tutor: { nome: '', telefone: '' },
    paciente: { nome: '', especie: 'Canina', raca: '', sexo: '', idade: '' },
    material: '', historico: '', dataEntrada: hoje(), pagoNaHora: false, formaPagamento: 'Pix',
  };
}

export default function NovaEntrada({ aberta, onFechar, editar }) {
  const { clientes, exames, categorias } = useDados();
  const [busca, setBusca] = useState('');
  const avisar = useAviso();
  const [f, setF] = useState(vazio());
  const [marcados, setMarcados] = useState([]);
  const [valores, setValores] = useState({});
  const [erros, setErros] = useState({});
  const [vetOutro, setVetOutro] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    if (editar) {
      setF({ ...vazio(), ...structuredClone(editar), pagoNaHora: false });
      setMarcados([editar.exameId]);
      setValores({ [editar.exameId]: editar.valor });
      const cli = clientes.find((c) => c.id === editar.clienteId);
      setVetOutro(!!editar.vet?.nome && !cli?.vets?.some((v) => v.nome === editar.vet.nome));
    } else {
      setF(vazio());
      setMarcados([]);
      setValores({});
      setVetOutro(false);
      setBusca('');
    }
    setErros({});
  }, [aberta, editar]); // eslint-disable-line

  const cliente = clientes.find((c) => c.id === f.clienteId);
  const ativos = exames.filter((x) => x.ativo || x.id === editar?.exameId);
  const termo = semAcento(busca.trim());
  const visiveis = ativos.filter((x) => marcados.includes(x.id) || !termo || termo.split(/\s+/).every((p) => semAcento(nomeCompleto(x) + ' ' + (categorias.find((c) => c.id === x.categoriaId)?.nome || '')).includes(p)));
  const grupos = [...categorias, null].map((c) => ({ c, itens: visiveis.filter((x) => (c ? x.categoriaId === c.id : !categorias.some((k) => k.id === x.categoriaId))) })).filter((g) => g.itens.length);
  const set = (caminho, v) =>
    setF((o) => {
      const n = structuredClone(o);
      const ps = caminho.split('.');
      let p = n;
      ps.slice(0, -1).forEach((k) => (p = p[k]));
      p[ps.at(-1)] = v;
      return n;
    });

  const total = marcados.reduce((s, id) => s + (valores[id] ?? precoPara(exames.find((x) => x.id === id), cliente)), 0);
  const prazoMax = useMemo(() => {
    const ps = marcados.map((id) => exames.find((x) => x.id === id)?.prazo || 0);
    return ps.length ? somaDiasUteis(f.dataEntrada, Math.max(...ps)) : null;
  }, [marcados, f.dataEntrada, exames]);

  const salvar = () => {
    const e = {};
    if (!f.clienteId) e.cliente = 'Escolha quem enviou o exame.';
    if (!f.paciente.nome.trim()) e.paciente = 'Escreva o nome do paciente.';
    if (!marcados.length) e.exames = 'Marque pelo menos um exame.';
    if (cliente?.tipo === 'particular' && !f.tutor.nome.trim()) e.tutor = 'Para particular, o nome do tutor é obrigatório.';
    setErros(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.querySelector('.folha .campo__erro')?.closest('.campo, fieldset')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 30);
      return;
    }
    if (editar) {
      const exame = exames.find((x) => x.id === marcados[0]);
      acoes.editarEntrada(editar.id, {
        clienteId: f.clienteId, vet: f.vet, tutor: f.tutor, paciente: f.paciente, material: f.material, historico: f.historico,
        dataEntrada: f.dataEntrada, exameId: exame.id, exameNome: nomeCompleto(exame), prazo: exame.prazo, valor: Number(valores[exame.id] ?? precoPara(exame, cliente)),
      });
      avisar('Dados da entrada atualizados.');
      onFechar();
      return;
    }
    const ids = acoes.novaEntrada({ ...f, valores }, marcados);
    avisar(`${plural(ids.length, 'exame registrado', 'exames registrados')}.`, 'ok', { texto: 'Abrir laudo', fazer: () => ir('laudo-' + ids[0]) });
    onFechar();
  };

  return (
    <Folha
      aberta={aberta}
      onFechar={onFechar}
      larga
      titulo={editar ? `Corrigir entrada ${editar.numero}` : 'Nova entrada'}
      sub={editar ? 'O número do exame não muda.' : 'Um registro e um laudo para cada exame marcado.'}
      rodape={
        <>
          <span className="folha__resumo">
            {marcados.length ? <><strong>{real(total)}</strong> · {plural(marcados.length, 'exame', 'exames')}{prazoMax && <> · laudo até {dataBR(prazoMax)}</>}</> : 'Nenhum exame marcado'}
          </span>
          <button className="botao botao--fantasma" onClick={onFechar}>Cancelar</button>
          <button className="botao botao--primario" onClick={salvar}><Icone nome="check" /> {editar ? 'Salvar' : 'Registrar entrada'}</button>
        </>
      }
    >
      <div className="form-bloco">
        <h3>Quem enviou</h3>
        <div className="form-grade">
          <Campo rotulo="Clínica ou cliente" erro={erros.cliente}>
            {(id) => (
              <select id={id} value={f.clienteId} onChange={(e) => { set('clienteId', e.target.value); set('vet', { nome: '', crmv: '' }); setVetOutro(false); setValores({}); }}>
                <option value="">Escolha…</option>
                {clientes.filter((c) => c.ativo || c.id === f.clienteId).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            )}
          </Campo>
          {cliente?.tipo !== 'particular' && (
            !vetOutro && cliente?.vets?.length ? (
              <Campo rotulo="Veterinário(a) requisitante">
                {(id) => (
                  <select id={id} value={f.vet.nome} onChange={(e) => {
                    if (e.target.value === '__outro') { setVetOutro(true); set('vet', { nome: '', crmv: '' }); return; }
                    const v = cliente.vets.find((x) => x.nome === e.target.value);
                    set('vet', v ? { ...v } : { nome: '', crmv: '' });
                  }}>
                    <option value="">Escolha…</option>
                    {cliente.vets.map((v) => <option key={v.nome} value={v.nome}>{v.nome}</option>)}
                    <option value="__outro">Outro(a)…</option>
                  </select>
                )}
              </Campo>
            ) : (
              <div className="form-grade form-grade--2 sem-margem">
                <Campo rotulo="Veterinário(a) requisitante">{(id) => <input id={id} value={f.vet.nome} onChange={(e) => set('vet.nome', e.target.value)} />}</Campo>
                <Campo rotulo="CRMV">{(id) => <input id={id} value={f.vet.crmv} placeholder="CRMV-CE 0000" onChange={(e) => set('vet.crmv', e.target.value)} />}</Campo>
              </div>
            )
          )}
        </div>
      </div>

      <div className="form-bloco">
        <h3>Paciente e tutor</h3>
        <div className="form-grade form-grade--3">
          <Campo rotulo="Nome do paciente" erro={erros.paciente}>{(id) => <input id={id} value={f.paciente.nome} onChange={(e) => set('paciente.nome', e.target.value)} />}</Campo>
          <Campo rotulo="Espécie">
            {(id) => (
              <select id={id} value={ESPECIES.includes(f.paciente.especie) ? f.paciente.especie : 'Outra'} onChange={(e) => set('paciente.especie', e.target.value)}>
                {ESPECIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </Campo>
          <Campo rotulo="Raça">{(id) => <input id={id} value={f.paciente.raca} placeholder="SRD" onChange={(e) => set('paciente.raca', e.target.value)} />}</Campo>
          <Campo rotulo="Sexo">
            {(id) => (
              <select id={id} value={f.paciente.sexo} onChange={(e) => set('paciente.sexo', e.target.value)}>
                <option value="">—</option><option>Macho</option><option>Fêmea</option><option>Macho castrado</option><option>Fêmea castrada</option>
              </select>
            )}
          </Campo>
          <Campo rotulo="Idade">{(id) => <input id={id} value={f.paciente.idade} placeholder="8 anos" onChange={(e) => set('paciente.idade', e.target.value)} />}</Campo>
          <Campo rotulo="Tutor(a)" erro={erros.tutor}>{(id) => <input id={id} value={f.tutor.nome} onChange={(e) => set('tutor.nome', e.target.value)} />}</Campo>
          <Campo rotulo="WhatsApp do tutor">{(id) => <input id={id} inputMode="tel" value={f.tutor.telefone} placeholder="(85) 9…" onChange={(e) => set('tutor.telefone', e.target.value)} />}</Campo>
        </div>
      </div>

      <fieldset className="form-bloco">
        <legend><h3>{editar ? 'Exame' : 'Exames'}</h3></legend>
        {erros.exames && <small className="campo__erro">{erros.exames}</small>}
        {!editar && (
          <div className="busca busca--peq">
            <Icone nome="busca" tam={16} />
            <input type="search" aria-label="Procurar exame" placeholder="Procurar exame (ex.: mastectomia, pele, necropsia)" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        )}
        {grupos.length === 0 && <p className="suave">Nenhum exame com “{busca}”.</p>}
        {grupos.map(({ c, itens }) => (
          <div key={c?.id || 'sem'} className="escolha-grupo">
            <span className="escolha-grupo__titulo"><i style={{ background: c?.cor || '#888' }} />{c?.nome || 'Sem categoria'}</span>
            <ul className="escolha-exames">
              {itens.map((x) => {
                const preco = precoPara(x, cliente);
                const especial = cliente?.precos?.[x.id] !== undefined && cliente?.precos?.[x.id] !== '';
                const on = marcados.includes(x.id);
                return (
                  <li key={x.id} className={on ? 'ligado' : ''}>
                    <label>
                      <input
                        type={editar ? 'radio' : 'checkbox'}
                        name="exame"
                        checked={on}
                        onChange={(e) => setMarcados((m) => (editar ? [x.id] : e.target.checked ? [...m, x.id] : m.filter((y) => y !== x.id)))}
                      />
                      <span className="escolha-exames__nome">
                        <strong>{x.nome}{x.detalhe && <span className="suave"> · {x.detalhe}</span>}</strong>
                        <small>{prazoTexto(x)}</small>
                      </span>
                    </label>
                    {on ? (
                      <span className="com-prefixo escolha-exames__valor">
                        <span>R$</span>
                        <input aria-label={`Valor de ${nomeCompleto(x)}`} inputMode="decimal" value={String(valores[x.id] ?? preco).replace('.', ',')}
                          onChange={(e) => setValores((v) => ({ ...v, [x.id]: numBR(e.target.value) }))} />
                      </span>
                    ) : (
                      <span className="escolha-exames__preco">
                        {x.sobConsulta && !especial ? 'Sob consulta' : real(preco)}
                        {especial && <em>preço da clínica</em>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </fieldset>

      <div className="form-bloco">
        <h3>Amostra</h3>
        <div className="form-grade form-grade--2">
          <Campo rotulo="Material enviado" dica="Ex.: nódulo cutâneo em formol, 2 lâminas de PAAF">{(id) => <input id={id} value={f.material} onChange={(e) => set('material', e.target.value)} />}</Campo>
          <Campo rotulo="Data de entrada">{(id) => <input id={id} type="date" value={f.dataEntrada} onChange={(e) => set('dataEntrada', e.target.value || hoje())} />}</Campo>
        </div>
        <Campo rotulo="Histórico clínico" dica="Aparece no cabeçalho do laudo.">{(id) => <textarea id={id} rows={3} value={f.historico} onChange={(e) => set('historico', e.target.value)} />}</Campo>
      </div>

      {!editar && cliente && cliente.cobranca !== 'mensal' && (
        <div className="form-bloco">
          <h3>Pagamento</h3>
          <Interruptor ligado={f.pagoNaHora} onChange={(v) => set('pagoNaHora', v)} rotulo="Já pagou na entrega da amostra" dica={cliente.tipo === 'particular' ? 'Particular costuma pagar na hora.' : 'Este cliente paga por exame.'} />
          {f.pagoNaHora && (
            <div className="pilulas" style={{ marginTop: 10 }}>
              {['Pix', 'Cartão de débito', 'Cartão de crédito', 'Dinheiro'].map((o) => (
                <label key={o} className={'pilula' + (f.formaPagamento === o ? ' ligada' : '')}>
                  <input type="radio" name="forma" checked={f.formaPagamento === o} onChange={() => set('formaPagamento', o)} /> {o}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      {!editar && cliente?.cobranca === 'mensal' && <p className="nota"><Icone nome="financeiro" tam={16} /> {cliente.nome} paga no fechamento do mês. O valor entra em “A receber”.</p>}
    </Folha>
  );
}
