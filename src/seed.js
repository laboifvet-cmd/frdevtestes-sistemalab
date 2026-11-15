// Dados de exemplo (fictícios) para a demonstração. Tudo é inventado.
import { modelosProntos, valorInicial } from './campos.js';
import { equipeDeExemplo } from './equipe.js';
import { hoje, somaDias, ehDiaUtil, somaDiasUteis, dataDe, mesDe, mesAnterior } from './util.js';

const NOMES_PAT = { 'p-marina': 'Dra. Marina Fontes', 'p-caio': 'Dr. Caio Albuquerque', 'p-helena': 'Dra. Helena Duarte' };

function rng(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LAB_PADRAO = {
  nome: 'VetDev Lab',
  descricao: 'Patologia Veterinária',
  endereco: 'Av. Exemplo, 1000 · Aldeota · Fortaleza - CE',
  telefone: '(85) 90000-0000',
  email: 'laudos@vetdevlab.exemplo',
  site: 'vetdevlab.exemplo',
  cor: '#1F4E5A',
  logo: null,
  responsavel: { nome: 'Dra. Marina Fontes', titulo: 'Médica Veterinária Patologista', crmv: 'CRMV-CE 0000', assinatura: null },
  rodape: 'Este laudo tem valor diagnóstico quando interpretado em conjunto com o histórico e o exame clínico do paciente.',
  demonstracao: true,
};

const CLIENTES = [
  {
    id: 'cl-vetdev', nome: 'Clínica VetDev', tipo: 'clinica', cobranca: 'mensal', contato: 'Recepção', telefone: '(85) 90000-0101',
    email: 'contato@clinicavetdev.exemplo', endereco: 'Rua das Acácias, 120 · Meireles', vets: [{ nome: 'Dra. Camila Rocha', crmv: 'CRMV-CE 0001' }, { nome: 'Dr. Paulo Sérgio Alves', crmv: 'CRMV-CE 0002' }],
    precos: {}, ativo: true,
  },
  {
    id: 'cl-farol', nome: 'Hospital Veterinário Farol Azul', tipo: 'clinica', cobranca: 'mensal', contato: 'Financeiro', telefone: '(85) 90000-0202',
    email: 'financeiro@farolazul.exemplo', endereco: 'Av. Beira Mar, 3000 · Mucuripe', vets: [{ nome: 'Dr. Ricardo Menezes', crmv: 'CRMV-CE 0003' }, { nome: 'Dra. Juliana Prado', crmv: 'CRMV-CE 0004' }, { nome: 'Dra. Bruna Teles', crmv: 'CRMV-CE 0005' }],
    precos: { 'ex-cito': 100, 'ex-histo': 165 }, ativo: true,
  },
  {
    id: 'cl-manda', nome: 'Clínica Mandacaru Pet', tipo: 'clinica', cobranca: 'mensal', contato: 'Dra. Lívia', telefone: '(85) 90000-0303',
    email: 'mandacarupet@exemplo', endereco: 'Rua do Sertão, 45 · Messejana', vets: [{ nome: 'Dra. Lívia Barros', crmv: 'CRMV-CE 0006' }],
    precos: { 'ex-cito': 110 }, ativo: true,
  },
  {
    id: 'cl-jangada', nome: 'Consultório Jangada Vet', tipo: 'clinica', cobranca: 'por_exame', contato: 'Dr. Tiago', telefone: '(85) 90000-0404',
    email: 'jangadavet@exemplo', endereco: 'Rua da Praia, 77 · Praia de Iracema', vets: [{ nome: 'Dr. Tiago Nogueira', crmv: 'CRMV-CE 0007' }],
    precos: {}, ativo: true,
  },
  {
    id: 'cl-part', nome: 'Particular (tutor)', tipo: 'particular', cobranca: 'por_exame', contato: '', telefone: '', email: '', endereco: '', vets: [],
    precos: {}, ativo: true,
  },
];

const EXAMES = [
  { id: 'ex-histo', nome: 'Histopatológico', sigla: 'HP', valor: 180, prazo: 7, modeloId: 'm-histo', ativo: true },
  { id: 'ex-histom', nome: 'Histopatológico com avaliação de margens', sigla: 'HP', valor: 230, prazo: 8, modeloId: 'm-histo', ativo: true },
  { id: 'ex-cito', nome: 'Citopatológico', sigla: 'CT', valor: 120, prazo: 3, modeloId: 'm-cito', ativo: true },
  { id: 'ex-rev', nome: 'Revisão de lâmina (segunda opinião)', sigla: 'RV', valor: 150, prazo: 5, modeloId: 'm-cito', ativo: true },
  { id: 'ex-necro', nome: 'Necropsia', sigla: 'NC', valor: 450, prazo: 10, modeloId: 'm-necro', ativo: true },
  { id: 'ex-hemo', nome: 'Hemograma completo', sigla: 'HM', valor: 45, prazo: 1, modeloId: 'm-hemo', ativo: true },
  { id: 'ex-ihq', nome: 'Imuno-histoquímica (painel)', sigla: 'IH', valor: 650, prazo: 15, modeloId: 'm-histo', ativo: false },
];

const PACIENTES = [
  ['Thor', 'Canina', 'Labrador', 'Macho', '9 anos'], ['Mel', 'Canina', 'SRD', 'Fêmea', '11 anos'], ['Luna', 'Felina', 'SRD', 'Fêmea', '6 anos'],
  ['Bob', 'Canina', 'Boxer', 'Macho', '8 anos'], ['Nina', 'Canina', 'Poodle', 'Fêmea', '13 anos'], ['Pipoca', 'Canina', 'Shih-tzu', 'Fêmea', '10 anos'],
  ['Fred', 'Canina', 'Pug', 'Macho', '7 anos'], ['Belinha', 'Canina', 'Yorkshire', 'Fêmea', '12 anos'], ['Simba', 'Felina', 'Persa', 'Macho', '9 anos'],
  ['Frajola', 'Felina', 'SRD', 'Macho', '4 anos'], ['Bento', 'Canina', 'Golden Retriever', 'Macho', '10 anos'], ['Amora', 'Canina', 'SRD', 'Fêmea', '5 anos'],
  ['Zeus', 'Canina', 'Rottweiler', 'Macho', '8 anos'], ['Lola', 'Canina', 'Dachshund', 'Fêmea', '9 anos'], ['Toby', 'Canina', 'Beagle', 'Macho', '6 anos'],
  ['Pandora', 'Felina', 'Siamês', 'Fêmea', '11 anos'], ['Chico', 'Canina', 'SRD', 'Macho', '14 anos'], ['Cacau', 'Canina', 'Pinscher', 'Fêmea', '3 anos'],
  ['Max', 'Canina', 'Pastor Alemão', 'Macho', '10 anos'], ['Jade', 'Canina', 'Lhasa Apso', 'Fêmea', '8 anos'], ['Tom', 'Felina', 'SRD', 'Macho', '12 anos'],
  ['Kiara', 'Canina', 'Pit Bull', 'Fêmea', '7 anos'], ['Paçoca', 'Canina', 'SRD', 'Macho', '2 anos'], ['Maya', 'Canina', 'Border Collie', 'Fêmea', '9 anos'],
];
const TUTORES = [
  'Ana Beatriz Moura', 'Carlos Henrique Lima', 'Fernanda Sales', 'João Victor Araújo', 'Patrícia Gomes', 'Rafael Cavalcante', 'Luciana Freitas',
  'Marcos Aurélio Dias', 'Débora Pinheiro', 'Gustavo Matos', 'Helena Sampaio', 'Igor Bezerra', 'Larissa Queiroz', 'Renato Vieira',
  'Sabrina Lopes', 'Vinícius Torres', 'Aline Batista', 'Eduardo Farias',
];

// Laudos de exemplo por tipo de exame (textos curtos, revisáveis)
const CASOS = {
  'm-histo': [
    {
      'Material enviado': 'Nódulo cutâneo, região torácica lateral esquerda', Fixação: 'Formol 10% tamponado', 'Fragmentos recebidos': '1', 'Maior dimensão': '2,8',
      'Descrição macroscópica': 'Recebido fragmento de pele com nódulo em derme, medindo 2,8 x 2,1 x 1,5 cm, firme, branco-amarelado ao corte. Margens cirúrgicas pintadas com tinta nanquim. Amostra totalmente incluída.',
      'Descrição microscópica': 'Proliferação neoplásica de células redondas em derme profunda e subcutâneo, dispostas em mantos e cordões, sustentadas por delicado estroma fibrovascular. As células têm citoplasma moderado, levemente granular, e núcleos redondos centrais com cromatina finamente pontilhada. Anisocitose e anisocariose discretas. Infiltrado eosinofílico moderado entremeado à neoplasia.',
      Diagnóstico: 'Mastocitoma cutâneo de baixo grau (Kiupel, 2011); grau II (Patnaik, 1984).', Graduação: 'Baixo grau (Kiupel)', 'Índice mitótico': '2',
      'Margens cirúrgicas': 'Livres', 'Menor distância até a margem': '3', Comentários: 'Margem profunda exígua (3 mm). Recomenda-se acompanhamento clínico do leito cirúrgico.',
    },
    {
      'Material enviado': 'Nódulo em glândula mamária abdominal caudal direita (M4)', Fixação: 'Formol 10% tamponado', 'Fragmentos recebidos': '1', 'Maior dimensão': '3,4',
      'Descrição macroscópica': 'Recebida cadeia mamária com nódulo de 3,4 x 2,6 x 2,0 cm, bem delimitado, firme, branco ao corte, com pequenas áreas císticas.',
      'Descrição microscópica': 'Proliferação neoplásica epitelial, bem delimitada e parcialmente encapsulada, formando túbulos revestidos por uma a duas camadas de células cuboides, com citoplasma eosinofílico moderado e núcleos ovais. Pleomorfismo discreto. Não se observa invasão vascular nas secções avaliadas.',
      Diagnóstico: 'Carcinoma mamário tubular, grau histológico I (Peña et al., 2013).', Graduação: 'Grau I', 'Índice mitótico': '4',
      'Margens cirúrgicas': 'Livres', 'Menor distância até a margem': '6',
    },
    {
      'Material enviado': 'Massa subcutânea, região inguinal', Fixação: 'Formol 10%', 'Fragmentos recebidos': '1', 'Maior dimensão': '6,0',
      'Descrição macroscópica': 'Recebida massa de 6,0 x 4,5 x 3,0 cm, macia, amarelada, untuosa ao corte, envolta por fina cápsula.',
      'Descrição microscópica': 'Proliferação de adipócitos bem diferenciados, organizados em lóbulos separados por finos septos fibrovasculares, sem atipias.',
      Diagnóstico: 'Lipoma.', Graduação: 'Não se aplica', 'Margens cirúrgicas': 'Não avaliáveis',
    },
    {
      'Material enviado': 'Nódulo perianal', Fixação: 'Formol 10% tamponado', 'Fragmentos recebidos': '2', 'Maior dimensão': '1,9',
      'Descrição macroscópica': 'Recebidos dois fragmentos, o maior com 1,9 x 1,4 x 1,0 cm, firmes, castanho-claros ao corte.',
      'Descrição microscópica': 'Proliferação neoplásica de células poligonais semelhantes a hepatócitos, com citoplasma amplo e eosinofílico, dispostas em lóbulos e trabéculas, circundadas por camada de células de reserva. Atipias discretas e raras figuras de mitose.',
      Diagnóstico: 'Adenoma de glândulas hepatoides (circum-anais).', Graduação: 'Não se aplica', 'Índice mitótico': '1', 'Margens cirúrgicas': 'Livres', 'Menor distância até a margem': '2',
    },
    {
      'Material enviado': 'Nódulo cutâneo, pavilhão auricular direito', Fixação: 'Formol 10% tamponado', 'Fragmentos recebidos': '1', 'Maior dimensão': '1,1',
      'Descrição macroscópica': 'Recebido fragmento de pele com nódulo de 1,1 x 0,9 x 0,6 cm, róseo, macio.',
      'Descrição microscópica': 'Proliferação de células redondas a ovais em derme, em mantos, com citoplasma moderado e núcleos ovais a reniformes. Infiltrado linfocitário multifocal na base da lesão. Mitoses frequentes.',
      Diagnóstico: 'Histiocitoma cutâneo canino.', Graduação: 'Não se aplica', 'Margens cirúrgicas': 'Livres', Comentários: 'Lesão de comportamento benigno, com regressão espontânea frequente.',
    },
  ],
  'm-cito': [
    {
      'Local da coleta': 'Nódulo cutâneo, membro torácico esquerdo', 'Método de coleta': ['Punção aspirativa (PAAF)'], 'Lâminas recebidas': '3', Coloração: 'Panótico rápido',
      'Qualidade da amostra': 'Adequada',
      'Descrição citológica': 'Esfregaços de alta celularidade, compostos por população monomórfica de células redondas com moderada quantidade de grânulos citoplasmáticos metacromáticos, núcleos redondos centrais. Presença de eosinófilos em meio às células.',
      'Interpretação citológica': 'Neoplasia de células redondas, compatível com mastocitoma.',
      Comentários: 'Recomenda-se exame histopatológico para confirmação diagnóstica e graduação.',
    },
    {
      'Local da coleta': 'Linfonodo submandibular', 'Método de coleta': ['Punção aspirativa (PAAF)'], 'Lâminas recebidas': '4', Coloração: 'Panótico rápido', 'Qualidade da amostra': 'Adequada',
      'Descrição citológica': 'Esfregaços de alta celularidade, com predomínio (mais de 80%) de linfócitos grandes, com núcleos maiores que dois hemácias, cromatina frouxa e nucléolos evidentes. Corpúsculos linfoglandulares e figuras de mitose frequentes.',
      'Interpretação citológica': 'Linfoma de grandes células (alto grau).',
      Comentários: 'Sugere-se imunofenotipagem para classificação.',
    },
    {
      'Local da coleta': 'Massa subcutânea, região costal', 'Método de coleta': ['Punção não aspirativa'], 'Lâminas recebidas': '2', Coloração: 'Panótico rápido', 'Qualidade da amostra': 'Pouco celular',
      'Descrição citológica': 'Esfregaços com gotículas lipídicas abundantes e raros agrupamentos de adipócitos maduros, sem atipias.',
      'Interpretação citológica': 'Tecido adiposo; compatível com lipoma.',
    },
    {
      'Local da coleta': 'Lesão ulcerada, região cervical', 'Método de coleta': ['Imprint', 'Escarificação'], 'Lâminas recebidas': '2', Coloração: 'Panótico rápido', 'Qualidade da amostra': 'Adequada',
      'Descrição citológica': 'Celularidade moderada, com neutrófilos íntegros e degenerados, macrófagos ativados e epitelioides e raras células gigantes multinucleadas. Não se observam agentes infecciosos.',
      'Interpretação citológica': 'Processo inflamatório piogranulomatoso.',
      Comentários: 'Recomenda-se cultura e exame histopatológico com colorações especiais.',
    },
  ],
  'm-necro': [
    {
      'Conservação do cadáver': 'Refrigerado', 'Intervalo óbito–necropsia': '6', 'Estado de conservação': 'Bom',
      Histórico: 'Animal com histórico de apatia, dispneia e distensão abdominal há três dias. Óbito durante o atendimento.',
      'Exame externo': 'Mucosas pálidas. Escore corporal 3/5.',
      'Cavidade torácica': 'Pulmões difusamente avermelhados e não colapsados.',
      'Cavidade abdominal': 'Hemoperitônio (aproximadamente 800 mL). Baço com massa de 9 cm, friável, rompida, vermelho-escura.',
      'Diagnósticos morfológicos': 'Massa esplênica rompida com hemoperitônio acentuado; congestão e edema pulmonar difusos.',
      'Causa mortis': 'Choque hipovolêmico por hemorragia abdominal (massa esplênica; aguarda histopatológico).',
    },
  ],
  'm-hemo': [
    { tabela: true },
  ],
};

export function dadosDeExemplo() {
  const r = rng(20261114);
  const modelos = modelosProntos();
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const hojeIso = hoje();
  const entradas = [];
  const seq = {};

  // dias úteis dos últimos ~60 dias
  const dias = [];
  for (let i = 160; i >= 0; i--) {
    const d = somaDias(hojeIso, -i);
    if (ehDiaUtil(d)) dias.push(d);
  }

  const pesoExame = ['ex-histo', 'ex-histo', 'ex-histo', 'ex-histom', 'ex-cito', 'ex-cito', 'ex-cito', 'ex-cito', 'ex-hemo', 'ex-hemo', 'ex-rev', 'ex-necro'];
  const pesoCliente = ['cl-vetdev', 'cl-vetdev', 'cl-farol', 'cl-farol', 'cl-farol', 'cl-manda', 'cl-manda', 'cl-jangada', 'cl-part'];
  let pac = 0;

  dias.forEach((dia, idx) => {
    const quantos = dia === hojeIso ? 3 : 2 + Math.floor(r() * 3.4);
    for (let q = 0; q < quantos; q++) {
      const exId = pick(pesoExame);
      const cliId = pick(pesoCliente);
      const exame = EXAMES.find((e) => e.id === exId);
      const cliente = CLIENTES.find((c) => c.id === cliId);
      const [nomeP, especie, raca, sexo, idade] = PACIENTES[pac++ % PACIENTES.length];
      const ano = String(dataDe(dia).getFullYear()).slice(2);
      const chave = exame.sigla + ano;
      seq[chave] = (seq[chave] || 0) + 1;
      const previsto = somaDiasUteis(dia, exame.prazo);
      const restam = dias.length - 1 - idx; // dias úteis desde a entrada
      let status;
      if (dia === hojeIso) status = 'recebido';
      else if (previsto < hojeIso) status = r() < 0.12 && restam < 14 ? 'em_analise' : restam > 8 || r() < 0.6 ? 'entregue' : 'liberado';
      else status = r() < 0.35 ? 'liberado' : r() < 0.5 ? 'recebido' : 'em_analise';
      const vet = cliente.vets.length ? pick(cliente.vets) : { nome: '', crmv: '' };
      const valor = cliente.precos[exame.id] ?? exame.valor;
      const modelo = modelos.find((m) => m.id === exame.modeloId);
      const valores = {};
      modelo.campos.forEach((c) => (valores[c.id] = valorInicial(c)));
      const casos = CASOS[modelo.id];
      const caso = casos[Math.floor(r() * casos.length)];
      const preencher = (todos) => {
        modelo.campos.forEach((c) => {
          if (c.tipo === 'tabela' && modelo.id === 'm-hemo') {
            valores[c.id] = c.linhas.map((l) => l.map((cel, ci) => (c.colunas[ci].preenche ? exemploHemo(l[0], ci, r) : cel)));
          } else if (c.tipo === 'numero' && modelo.id === 'm-hemo') {
            valores[c.id] = c.rotulo.startsWith('Plaquetas') ? String(220 + Math.floor(r() * 200)) : (6.2 + r() * 1.4).toFixed(1).replace('.', ',');
          } else if (caso[c.rotulo] !== undefined && (todos || /Material|Local|Fixa|Fragment|Maior|macrosc|Método|Lâminas|Colora|Qualidade|Histórico|Conserva|Intervalo|Estado/.test(c.rotulo))) {
            valores[c.id] = caso[c.rotulo];
          }
        });
        if (modelo.id === 'm-hemo' && todos) {
          const obs = modelo.campos.find((c) => c.rotulo === 'Observações hematológicas');
          if (obs) valores[obs.id] = 'Morfologia eritrocitária sem alterações dignas de nota.';
        }
        if (modelo.id === 'm-necro') {
          const d = modelo.campos.find((c) => c.tipo === 'data');
          if (d) valores[d.id] = somaDias(dia, -1);
        }
      };
      if (status === 'em_analise') preencher(false);
      if (['liberado', 'entregue'].includes(status)) preencher(true);
      const liberadoEm = ['liberado', 'entregue'].includes(status)
        ? (previsto < hojeIso ? somaDiasUteis(dia, Math.max(1, exame.prazo - (r() < 0.8 ? 1 : 0))) : somaDiasUteis(dia, 1) > hojeIso ? hojeIso : somaDiasUteis(dia, 1))
        : null;
      // quem assina: quase sempre um patologista; necropsia e alguns casos saem com dois
      const p1 = pick(['p-marina', 'p-marina', 'p-caio', 'p-helena']);
      const assin = modelo.id === 'm-necro' || r() < 0.15 ? [p1, p1 === 'p-caio' ? 'p-marina' : 'p-caio'] : [p1];
      const mesEntrada = mesDe(dia);
      const mesAtual = mesDe(hojeIso);
      let pagamento;
      if (cliente.cobranca === 'por_exame') pagamento = { status: r() < 0.85 || dia < somaDias(hojeIso, -10) ? 'pago' : 'pendente', pagoEm: dia, forma: pick(['Pix', 'Pix', 'Cartão de crédito', 'Dinheiro']) };
      else if (mesEntrada < mesAtual && !(cliente.id === 'cl-manda' && mesEntrada === mesAnterior(mesAtual)))
        pagamento = { status: 'pago', pagoEm: somaDias(mesEntrada + '-01', 38), forma: 'Pix' };
      else pagamento = { status: 'pendente' };
      if (pagamento.pagoEm && pagamento.pagoEm > hojeIso) pagamento.pagoEm = hojeIso;

      entradas.push({
        id: 'e' + entradas.length + '-' + chave,
        numero: `${exame.sigla} ${ano}-${String(seq[chave]).padStart(4, '0')}`,
        exameId: exame.id, exameNome: exame.nome, modeloId: modelo.id,
        clienteId: cliente.id, clienteNome: cliente.nome,
        vet: { ...vet },
        tutor: { nome: TUTORES[Math.floor(r() * TUTORES.length)], telefone: '' },
        paciente: { nome: nomeP, especie, raca, sexo, idade },
        material: caso['Material enviado'] || caso['Local da coleta'] || (modelo.id === 'm-necro' ? 'Cadáver' : modelo.id === 'm-hemo' ? 'Sangue total (EDTA)' : ''),
        historico: '',
        dataEntrada: dia, prazo: exame.prazo, dataPrevista: previsto, valor,
        status,
        laudo: { valores, liberadoEm, liberadoPor: liberadoEm ? assin.map((a) => NOMES_PAT[a]).join(' e ') : null, assinantes: assin },
        pagamento,
        criadoEm: dia,
      });
    }
  });

  // dois atrasados para o painel mostrar o aviso
  const emAndamento = entradas.filter((e) => ['recebido', 'em_analise'].includes(e.status) && e.dataPrevista < hojeIso);
  if (emAndamento.length < 2) {
    entradas
      .filter((e) => e.status === 'entregue' && e.exameId === 'ex-histo')
      .slice(-2)
      .forEach((e) => {
        e.status = 'em_analise';
        e.laudo.liberadoEm = null;
        e.laudo.liberadoPor = null;
      });
  }

  return {
    versao: 1,
    lab: { ...structuredClone(LAB_PADRAO), equipe: equipeDeExemplo() },
    clientes: structuredClone(CLIENTES),
    exames: EXAMES.map((e) => ({ ...e, historico: [{ data: somaDias(hojeIso, -200), valor: e.valor, motivo: 'Tabela inicial' }] })),
    modelos,
    entradas: entradas.reverse(),
  };
}

function exemploHemo(param, coluna, r) {
  const tab = {
    Hemácias: () => (6 + r() * 1.8).toFixed(2).replace('.', ','),
    Hemoglobina: () => (13 + r() * 4).toFixed(1).replace('.', ','),
    Hematócrito: () => String(40 + Math.floor(r() * 12)),
    VCM: () => String(64 + Math.floor(r() * 9)),
    CHCM: () => (33 + r() * 2).toFixed(1).replace('.', ','),
  };
  if (tab[param]) return tab[param]();
  if (param === 'Leucócitos totais') return coluna === 1 ? '—' : (8000 + Math.floor(r() * 60) * 100).toLocaleString('pt-BR');
  const rel = { 'Neutrófilos segmentados': 68, Linfócitos: 22, Monócitos: 5, Eosinófilos: 5 }[param] || 0;
  return coluna === 1 ? String(rel) : (rel * 100 + Math.floor(r() * 20) * 10).toLocaleString('pt-BR');
}
