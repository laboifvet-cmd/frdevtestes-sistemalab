// Busca rápida (Ctrl+K ou /): exames por nº, paciente, tutor ou clínica, e atalhos.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDados } from './store.js';
import { Icone, ir } from './ui.jsx';
import { semAcento, dataCurta } from './util.js';
import { ChipStatus } from './telas/comum.jsx';

const ATALHOS = [
  { nome: 'Nova entrada de exame', rota: 'exames-nova', icone: 'mais', chave: 'nova entrada exame amostra registrar' },
  { nome: 'Fila de laudos', rota: 'laudos', icone: 'laudos', chave: 'laudos fila fazer' },
  { nome: 'Exames atrasados', rota: 'exames-atrasado', icone: 'alerta', chave: 'atrasados prazo' },
  { nome: 'Modelos de laudo', rota: 'modelos', icone: 'modelos', chave: 'modelos laudo criar campos' },
  { nome: 'Financeiro', rota: 'financeiro', icone: 'financeiro', chave: 'financeiro tabela preços receber clientes fatura' },
  { nome: 'Equipe e assinaturas', rota: 'equipe', icone: 'usuarios', chave: 'equipe patologista assinatura colaborador crmv' },
  { nome: 'Ajustes do laboratório', rota: 'ajustes', icone: 'ajustes', chave: 'ajustes logo assinatura cor laboratório' },
];

export default function Busca({ aberta, onFechar }) {
  const { entradas } = useDados();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef(null);
  const lista = useRef(null);

  useEffect(() => {
    if (!aberta) return;
    setQ('');
    setSel(0);
    const antes = document.activeElement;
    setTimeout(() => input.current?.focus(), 20);
    return () => antes?.focus?.();
  }, [aberta]);

  const res = useMemo(() => {
    const t = semAcento(q.trim());
    const partes = t.split(/\s+/).filter(Boolean);
    const atalhos = ATALHOS.filter((a) => !t || partes.every((p) => semAcento(a.nome + ' ' + a.chave).includes(p))).map((a) => ({ ...a, tipo: 'atalho' }));
    const exames = t
      ? entradas.filter((e) => {
        const txt = semAcento([e.numero, e.numero.replace(/\s/g, ''), e.paciente.nome, e.tutor.nome, e.clienteNome, e.exameNome].join(' '));
        return partes.every((p) => txt.includes(p));
      }).slice(0, 8).map((e) => ({ tipo: 'exame', e, rota: 'laudo-' + e.id }))
      : entradas.slice(0, 5).map((e) => ({ tipo: 'exame', e, rota: 'laudo-' + e.id }));
    return t ? [...exames, ...atalhos] : [...atalhos.slice(0, 4), ...exames];
  }, [q, entradas]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!aberta) return null;
  const abrir = (r) => {
    onFechar();
    ir(r.rota);
  };
  const tecla = (ev) => {
    if (ev.key === 'Escape') onFechar();
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); setSel((s) => Math.min(res.length - 1, s + 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (ev.key === 'Enter' && res[sel]) { ev.preventDefault(); abrir(res[sel]); }
  };
  const exames = res.filter((r) => r.tipo === 'exame');
  const atalhos = res.filter((r) => r.tipo === 'atalho');
  const grupos = q.trim() ? [['Exames', exames], ['Ir para', atalhos]] : [['Ir para', atalhos], ['Entradas recentes', exames]];
  let idx = -1;

  return createPortal(
    <div className="busca-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="busca-caixa" role="dialog" aria-modal="true" aria-label="Busca rápida">
        <div className="busca-caixa__campo">
          <Icone nome="busca" tam={18} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={tecla}
            placeholder="Nº do exame, paciente, tutor ou clínica…"
            role="combobox"
            aria-expanded="true"
            aria-controls="busca-lista"
            aria-activedescendant={res[sel] ? 'busca-op-' + sel : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="busca-caixa__lista" id="busca-lista" role="listbox" ref={lista}>
          {res.length === 0 && <p className="busca-caixa__vazio">Nada encontrado para “{q}”.</p>}
          {grupos.map(([nome, itens]) => itens.length > 0 && (
            <div key={nome} role="group" aria-label={nome}>
              <span className="busca-caixa__grupo">{nome}</span>
              {itens.map((r) => {
                idx++;
                const i = idx;
                return (
                  <button
                    key={r.rota}
                    id={'busca-op-' + i}
                    role="option"
                    aria-selected={sel === i}
                    className="busca-op"
                    onMouseMove={() => sel !== i && setSel(i)}
                    onClick={() => abrir(r)}
                  >
                    {r.tipo === 'atalho' ? (
                      <>
                        <Icone nome={r.icone} tam={16} />
                        <span className="busca-op__nome">{r.nome}</span>
                      </>
                    ) : (
                      <>
                        <span className="mono busca-op__num">{r.e.numero}</span>
                        <span className="busca-op__nome">
                          <strong>{r.e.paciente.nome}</strong>
                          <span className="suave"> · {r.e.exameNome} · {r.e.clienteNome}</span>
                        </span>
                        <span className="busca-op__dir"><ChipStatus status={r.e.status} /><span className="suave">{dataCurta(r.e.dataEntrada)}</span></span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="busca-caixa__pe">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
