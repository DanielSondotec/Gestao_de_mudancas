// Estrutura do formulário de mudança (baseada no protótipo da área do SGI).
// Aqui ficam só os dados fixos: etapas, tipos de mudança, perguntas e níveis.

// ---------- Etapas do fluxo ----------
export const ETAPA = {
  ABERTURA: "abertura",
  ANALISE: "analise",
  PROPOSTA: "proposta",
  EXECUCAO: "execucao",
  EFICACIA: "eficacia",
  CONCLUIDO: "concluido",
  CANCELADA: "cancelada",
};

// "perfil" é o nome do papel no processo (como no protótipo).
export const ETAPAS = [
  { key: ETAPA.ABERTURA, titulo: "Abertura", perfil: "Solicitante" },
  { key: ETAPA.ANALISE, titulo: "Análise SGI", perfil: "SGI" },
  { key: ETAPA.PROPOSTA, titulo: "Proposta de ação", perfil: "SGI" },
  { key: ETAPA.EXECUCAO, titulo: "Execução", perfil: "Responsável pela ação" },
  { key: ETAPA.EFICACIA, titulo: "Eficácia", perfil: "Verificador de eficácia" },
  { key: ETAPA.CONCLUIDO, titulo: "Concluído", perfil: null },
];

export const etapaTitulo = (key) =>
  key === ETAPA.CANCELADA ? "Cancelada" : ETAPAS.find((e) => e.key === key)?.titulo ?? "—";

// ---------- Tipos de mudança (pergunta 8 da abertura) ----------
export const TIPOS = {
  loc: "Local, condições ou organização do trabalho",
  eqp: "Setores/equipamentos: alteração de tecnologia ou ampliação",
  proc: "Procedimentos operacionais / orientação aos colaboradores",
  conh: "Novo conhecimento sobre aspectos, impactos ou perigos",
  tec: "Nova tecnologia ou alteração da vigente",
  fta: "Mudança na força de trabalho",
  srv: "Serviço novo ou modificado",
};

// Condições especiais marcadas na abertura (temporária, não intencional, legal).
export const CONDICOES = {
  temp: "Mudança temporária",
  inesp: "Mudança não intencional",
  legal: "Requisito legal ou do cliente",
};

// ---------- Checklists complementares ----------
// Por tipo de mudança:
export const COMPLEMENTARES_TIPO = {
  loc: [
    "Há licenças, alvarás, AVCB ou laudos a emitir ou renovar?",
    "O contrato de locação, o cliente ou o proprietário precisam aprovar ou ser comunicados?",
    "Ergonomia (AET) e organização do trabalho (turnos, jornada, postos) foram reavaliadas?",
    "Há interface com vizinhança ou comunidade (ruído, tráfego, acesso)?",
  ],
  eqp: [
    "Exige homologação, comissionamento ou teste de aceitação antes do uso?",
    "Há requisitos legais aplicáveis (NR-10, NR-12, NR-13) e documentação (manual, ART, inspeção)?",
    "A infraestrutura suporta a mudança (elétrica, TI, espaço, ventilação)?",
    "Há destino definido para o equipamento substituído (descarte, venda, logística reversa)?",
  ],
  proc: [
    "Quais documentos do SGI precisam ser criados ou revisados (procedimento, instrução, formulário)?",
    "A mudança foi comunicada aos colaboradores (DDS, reunião, ata de ciência)?",
    "Registros e indicadores do processo serão alterados?",
    "A mudança conflita com requisito do cliente ou do contrato?",
  ],
  conh: [
    "É necessário revisar aspectos e impactos (SGI-61-101)?",
    "É necessário revisar perigos e riscos (SGI-61-117)?",
    "Há novo requisito legal ou outro requisito a incluir na planilha CAL?",
    "As partes interessadas ou o contexto da organização foram alterados?",
  ],
  tec: [
    "Houve teste piloto ou validação antes da adoção em escala?",
    "Há impacto em segurança da informação, LGPD ou backup de dados?",
    "Existe plano de reversão caso a tecnologia falhe?",
    "O fornecedor foi avaliado e qualificado?",
  ],
  fta: [
    "As competências necessárias estão definidas e a matriz de treinamento será atualizada?",
    "Dimensionamento e carga de trabalho foram reavaliados?",
    "Há terceiros envolvidos que precisam de integração e documentação?",
    "Há exames ocupacionais, ASO ou PCMSO a atualizar?",
    "Há risco de perda de conhecimento crítico na transição?",
  ],
  srv: [
    "Os requisitos do cliente foram analisados criticamente (escopo, prazo, critérios de aceitação)?",
    "Há capacidade técnica e de recursos para entregar o serviço?",
    "Há novos aspectos ou perigos específicos desse serviço?",
    "Há provedores externos novos a qualificar?",
  ],
};

// Por condição especial:
export const COMPLEMENTARES_CONDICAO = {
  temp: [
    "Foram definidos a data de término e o plano de retorno à condição original?",
    "Os controles temporários estão identificados e comunicados?",
  ],
  inesp: [
    "As consequências da mudança não intencional foram analisadas?",
    "Há medidas de mitigação e plano de contingência definidos?",
  ],
  legal: [
    "A planilha de Controle e Avaliação de Legislação (CAL) foi atualizada?",
    "Há prazo legal ou contratual que condicione a implantação?",
  ],
};

// ---------- Análise de impacto no negócio ----------
// Duas perguntas específicas para cada tipo de mudança.
export const IMPACTO_TIPO = {
  loc: ["Custo de adequação do espaço e prazo de mobilização", "Haverá interrupção da operação durante a mudança?"],
  eqp: ["Investimento (CAPEX) e retorno esperado", "Dias de indisponibilidade do equipamento ou setor"],
  proc: ["Impacto na produtividade (horas ou %)", "Risco de não conformidade com requisito do cliente"],
  conh: ["Multas ou sanções potenciais", "Contratos afetados pelos novos perigos ou aspectos"],
  tec: ["Investimento e custo recorrente (licenças, suporte)", "Dias de queda de produtividade na curva de aprendizado"],
  fta: ["Custo de pessoal (admissão, desligamento, treinamento)", "Risco de perda de conhecimento crítico"],
  srv: ["Receita e margem previstas", "Capacidade técnica instalada versus demanda"],
};

export const NIVEIS = ["Nenhum", "Baixo", "Médio", "Alto"];

// Campos de nível da análise de impacto: [campo, rótulo]
export const IMPACTO_NIVEIS = [
  ["receita", "Receita e contratos"],
  ["cliente", "Satisfação do cliente"],
  ["legal", "Conformidade legal"],
  ["sma", "Segurança e meio ambiente"],
  ["rep", "Reputação"],
  ["cert", "Certificações (ISO 9001/14001/45001, QUALIHAB)"],
];

export const PARECERES = [
  { value: "aprovar", label: "Aprovar" },
  { value: "condicoes", label: "Aprovar com condições" },
  { value: "reprovar", label: "Reprovar" },
];

// ---------- Regras derivadas ----------

// Quais anexos (Qualidade / SMS) são sugeridos pelas respostas da abertura.
export function sugerirAnexos({ tipos = [], quimico = false }) {
  return {
    qualidade: tipos.some((k) => ["proc", "tec", "fta", "srv", "eqp"].includes(k)),
    sms: quimico || tipos.some((k) => ["loc", "eqp", "proc", "conh", "fta"].includes(k)),
  };
}

// Severidade (1–5) x probabilidade (1–5) -> { valor, nivel }
export function nivelRisco(severidade, probabilidade) {
  const valor = (Number(severidade) || 0) * (Number(probabilidade) || 0);
  if (!valor) return { valor: 0, nivel: "—" };
  const nivel = valor <= 4 ? "Baixo" : valor <= 9 ? "Médio" : valor <= 16 ? "Alto" : "Crítico";
  return { valor, nivel };
}

// Checklists complementares que se aplicam a uma mudança:
// um por tipo marcado + um por condição especial.
export function gruposComplementares(change) {
  const grupos = (change.tipos ?? []).map((k) => ({
    titulo: `Complementar · ${TIPOS[k]}`,
    itens: COMPLEMENTARES_TIPO[k].map((texto, j) => ({ id: `${k}${j + 1}`, texto })),
  }));

  const condicoes = {
    temp: change.temporaria,
    inesp: change.naoIntencional,
    legal: change.requisitoLegal,
  };
  for (const [k, ativa] of Object.entries(condicoes)) {
    if (!ativa) continue;
    grupos.push({
      titulo: `Complementar · ${CONDICOES[k]}`,
      itens: COMPLEMENTARES_CONDICAO[k].map((texto, j) => ({ id: `${k}${j + 1}`, texto })),
    });
  }
  return grupos;
}