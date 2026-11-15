// Tipos de campo que um modelo de laudo pode ter, e os modelos prontos para começar.
import { uid } from './util.js';

export const TIPOS = {
  secao: { nome: 'Título de seção', dica: 'Separa o laudo em partes (ex.: Macroscopia)', icone: 'secao', curto: 'Seção' },
  texto: { nome: 'Texto curto', dica: 'Uma linha (ex.: local da lesão)', icone: 'texto', curto: 'Texto curto' },
  paragrafo: { nome: 'Texto longo', dica: 'Descrições, com frases prontas para inserir', icone: 'paragrafo', curto: 'Texto longo' },
  numero: { nome: 'Número', dica: 'Valor com unidade e referência', icone: 'numero', curto: 'Número' },
  selecao: { nome: 'Lista de opções', dica: 'Escolhe uma opção numa lista', icone: 'selecao', curto: 'Lista' },
  unica: { nome: 'Escolha única', dica: 'Botões redondos, só uma opção', icone: 'unica', curto: 'Escolha única' },
  multipla: { nome: 'Caixas de marcar', dica: 'Marca várias opções', icone: 'multipla', curto: 'Caixas' },
  tabela: { nome: 'Tabela', dica: 'Parâmetros, resultados e referências', icone: 'tabela', curto: 'Tabela' },
  data: { nome: 'Data', dica: 'Ex.: data da coleta ou do óbito', icone: 'data', curto: 'Data' },
  imagens: { nome: 'Fotos', dica: 'Fotos da lâmina ou da peça, com legenda', icone: 'imagens', curto: 'Fotos' },
  fixo: { nome: 'Texto fixo', dica: 'Nota que sai igual em todo laudo', icone: 'fixo', curto: 'Nota fixa' },
};

export const ORDEM_TIPOS = ['secao', 'texto', 'paragrafo', 'numero', 'selecao', 'unica', 'multipla', 'tabela', 'data', 'imagens', 'fixo'];

export function novoCampo(tipo) {
  const base = { id: uid('c'), tipo, rotulo: '', largura: 'inteira', obrigatorio: false, ocultarVazio: true };
  switch (tipo) {
    case 'secao': return { ...base, rotulo: 'Nova seção' };
    case 'texto': return { ...base, rotulo: 'Novo campo', padrao: '' };
    case 'paragrafo': return { ...base, rotulo: 'Descrição', padrao: '', frases: [], destaque: false };
    case 'numero': return { ...base, rotulo: 'Valor', unidade: '', referencia: '', largura: 'metade' };
    case 'selecao': return { ...base, rotulo: 'Escolha', opcoes: ['Opção 1', 'Opção 2'], largura: 'metade' };
    case 'unica': return { ...base, rotulo: 'Escolha', opcoes: ['Sim', 'Não'] };
    case 'multipla': return { ...base, rotulo: 'Marque', opcoes: ['Opção 1', 'Opção 2', 'Opção 3'] };
    case 'tabela':
      return {
        ...base, rotulo: 'Resultados',
        colunas: [
          { nome: 'Parâmetro', preenche: false },
          { nome: 'Resultado', preenche: true },
          { nome: 'Unidade', preenche: false },
          { nome: 'Referência', preenche: false },
        ],
        linhas: [['Parâmetro 1', '', '', ''], ['Parâmetro 2', '', '', '']],
      };
    case 'data': return { ...base, rotulo: 'Data', largura: 'metade' };
    case 'imagens': return { ...base, rotulo: 'Imagens', max: 4 };
    case 'fixo': return { ...base, rotulo: '', texto: 'Escreva aqui a nota que sai em todo laudo.' };
    default: return base;
  }
}

// Valor "vazio" de um campo, para saber se mostra no laudo
export function campoVazio(c, v) {
  if (c.tipo === 'secao' || c.tipo === 'fixo') return false;
  if (c.tipo === 'multipla') return !Array.isArray(v) || v.length === 0;
  if (c.tipo === 'imagens') return !Array.isArray(v) || v.length === 0;
  if (c.tipo === 'tabela') {
    if (!Array.isArray(v)) return true;
    return !v.some((linha) => linha.some((x) => String(x ?? '').trim()));
  }
  return v === undefined || v === null || String(v).trim() === '';
}

// Valor inicial ao abrir um laudo novo
export function valorInicial(c) {
  if (c.tipo === 'texto' || c.tipo === 'paragrafo') return c.padrao || '';
  if (c.tipo === 'multipla' || c.tipo === 'imagens') return [];
  if (c.tipo === 'tabela') return c.linhas.map((l) => [...l]);
  return '';
}

// ---------- Modelos prontos ----------
const s = (rotulo) => ({ ...novoCampo('secao'), rotulo });
const t = (rotulo, extra = {}) => ({ ...novoCampo('texto'), rotulo, ...extra });
const p = (rotulo, extra = {}) => ({ ...novoCampo('paragrafo'), rotulo, ...extra });
const n = (rotulo, unidade, extra = {}) => ({ ...novoCampo('numero'), rotulo, unidade, ...extra });
const sel = (rotulo, opcoes, extra = {}) => ({ ...novoCampo('selecao'), rotulo, opcoes, ...extra });
const un = (rotulo, opcoes, extra = {}) => ({ ...novoCampo('unica'), rotulo, opcoes, ...extra });
const mul = (rotulo, opcoes, extra = {}) => ({ ...novoCampo('multipla'), rotulo, opcoes, ...extra });
const img = (rotulo = 'Imagens') => ({ ...novoCampo('imagens'), rotulo });
const fixo = (texto) => ({ ...novoCampo('fixo'), texto });

export function modelosProntos() {
  return [
    {
      id: 'm-histo', nome: 'Exame histopatológico', subtitulo: 'Biópsia excisional ou incisional',
      campos: [
        s('Amostra'),
        t('Material enviado', { obrigatorio: true, largura: 'metade' }),
        sel('Fixação', ['Formol 10% tamponado', 'Formol 10%', 'Álcool 70%', 'Sem fixador'], { largura: 'metade' }),
        n('Fragmentos recebidos', 'fragmento(s)'),
        n('Maior dimensão', 'cm'),
        s('Macroscopia'),
        p('Descrição macroscópica', {
          obrigatorio: true,
          frases: [
            'Recebido fragmento de pele com nódulo em derme, medindo __ x __ x __ cm, firme, branco-acinzentado ao corte.',
            'Amostra totalmente incluída para processamento histológico.',
            'Margens cirúrgicas pintadas com tinta nanquim.',
          ],
        }),
        s('Microscopia'),
        p('Descrição microscópica', { obrigatorio: true }),
        s('Diagnóstico'),
        p('Diagnóstico', { obrigatorio: true, destaque: true }),
        sel('Graduação', ['Não se aplica', 'Baixo grau (Kiupel)', 'Alto grau (Kiupel)', 'Grau I', 'Grau II', 'Grau III'], { largura: 'metade' }),
        n('Índice mitótico', 'mitoses/2,37 mm²', { largura: 'metade' }),
        un('Margens cirúrgicas', ['Livres', 'Exíguas', 'Comprometidas', 'Não avaliáveis']),
        n('Menor distância até a margem', 'mm'),
        p('Comentários'),
        img('Fotomicrografias'),
      ],
    },
    {
      id: 'm-cito', nome: 'Exame citopatológico', subtitulo: 'Punção aspirativa e citologia esfoliativa',
      campos: [
        s('Amostra'),
        t('Local da coleta', { obrigatorio: true }),
        mul('Método de coleta', ['Punção aspirativa (PAAF)', 'Punção não aspirativa', 'Imprint', 'Swab', 'Escarificação', 'Lavado']),
        n('Lâminas recebidas', 'lâmina(s)', { largura: 'metade' }),
        sel('Coloração', ['Panótico rápido', 'Giemsa', 'May-Grünwald-Giemsa', 'Azul de toluidina'], { largura: 'metade' }),
        un('Qualidade da amostra', ['Adequada', 'Pouco celular', 'Hemodiluída', 'Inadequada para avaliação']),
        s('Avaliação citológica'),
        p('Descrição citológica', {
          obrigatorio: true,
          frases: [
            'Esfregaços de celularidade moderada, em fundo hemorrágico.',
            'Observa-se população de células redondas, com grânulos citoplasmáticos metacromáticos.',
            'Presença de neutrófilos íntegros e degenerados e macrófagos ativados.',
          ],
        }),
        s('Interpretação'),
        p('Interpretação citológica', { obrigatorio: true, destaque: true }),
        p('Comentários', {
          frases: ['Recomenda-se exame histopatológico para confirmação diagnóstica e graduação.'],
        }),
        img('Fotomicrografias'),
      ],
    },
    {
      id: 'm-necro', nome: 'Relatório de necropsia', subtitulo: 'Exame anatomopatológico post mortem',
      campos: [
        s('Dados do óbito'),
        { ...novoCampo('data'), rotulo: 'Data do óbito' },
        sel('Conservação do cadáver', ['Refrigerado', 'Congelado', 'Sem refrigeração'], { largura: 'metade' }),
        n('Intervalo óbito–necropsia', 'horas', { largura: 'metade' }),
        un('Estado de conservação', ['Bom', 'Moderado (autólise discreta)', 'Ruim (autólise acentuada)']),
        s('Histórico clínico'),
        p('Histórico'),
        s('Achados macroscópicos'),
        p('Exame externo'),
        p('Cavidade torácica'),
        p('Cavidade abdominal'),
        p('Sistema nervoso central'),
        s('Conclusão'),
        p('Diagnósticos morfológicos', { destaque: true, obrigatorio: true }),
        p('Causa mortis', { destaque: true }),
        img('Fotografias'),
      ],
    },
    {
      id: 'm-hemo', nome: 'Hemograma completo', subtitulo: 'Cães e gatos',
      campos: [
        s('Eritrograma'),
        {
          ...novoCampo('tabela'), rotulo: 'Eritrograma',
          colunas: [
            { nome: 'Parâmetro', preenche: false }, { nome: 'Resultado', preenche: true },
            { nome: 'Unidade', preenche: false }, { nome: 'Referência (cão)', preenche: false },
          ],
          linhas: [
            ['Hemácias', '', 'x10⁶/µL', '5,5 – 8,5'],
            ['Hemoglobina', '', 'g/dL', '12,0 – 18,0'],
            ['Hematócrito', '', '%', '37 – 55'],
            ['VCM', '', 'fL', '60 – 77'],
            ['CHCM', '', 'g/dL', '32 – 36'],
          ],
        },
        s('Leucograma'),
        {
          ...novoCampo('tabela'), rotulo: 'Leucograma',
          colunas: [
            { nome: 'Parâmetro', preenche: false }, { nome: 'Relativo (%)', preenche: true },
            { nome: 'Absoluto (/µL)', preenche: true }, { nome: 'Referência (/µL)', preenche: false },
          ],
          linhas: [
            ['Leucócitos totais', '—', '', '6.000 – 17.000'],
            ['Neutrófilos segmentados', '', '', '3.000 – 11.500'],
            ['Linfócitos', '', '', '1.000 – 4.800'],
            ['Monócitos', '', '', '150 – 1.350'],
            ['Eosinófilos', '', '', '100 – 1.250'],
          ],
        },
        n('Plaquetas', 'x10³/µL', { referencia: '200 – 500' }),
        n('Proteína plasmática total', 'g/dL', { referencia: '6,0 – 8,0' }),
        p('Observações hematológicas'),
        fixo('Valores de referência para cães adultos. Interpretar em conjunto com o quadro clínico.'),
      ],
    },
  ];
}

// Gera um modelo em branco
export function modeloEmBranco() {
  return { id: uid('m'), nome: 'Novo modelo de laudo', subtitulo: '', campos: [s('Resultado'), p('Descrição'), p('Conclusão', { destaque: true })] };
}
