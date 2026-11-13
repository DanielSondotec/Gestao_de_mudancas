// Checklists oficiais do SGI (Manual SGI-75-001, item 6.3 e Anexo I).
// Textos copiados do modelo SGI-GMU (abas "Qualidade" e "SMS").
import { gruposComplementares } from "./formulario";

export const CHECKLISTS = {
  qualidade: {
    key: "qualidade",
    short: "Qualidade",
    title: "Avaliação de Gestão de Mudanças na Qualidade do Serviço",
    items: [
      { n: 1, text: "Requer o domínio de nova tecnologia ou metodologia de cálculo diferentes das já conhecidas?" },
      { n: 2, text: "Altera procedimentos de produção de serviços?" },
      { n: 3, text: "Requer provisionamento de nova área física ou mudança significativa de lay-out?" },
      { n: 4, text: "Afeta o desempenho dos recursos de informática ou a necessidade de aquisição de novos dispositivos?" },
      { n: 5, text: "Exige adequação da força de trabalho (quantidade ou qualidade)?" },
      { n: 6, text: "Exige alteração da verificação formal do serviço?" },
      { n: 7, text: "Exige novos monitoramentos?" },
      { n: 8, text: "Introduz riscos relativos à qualidade do serviço requerido pelo cliente?" },
      { n: 9, text: "Requer inclusão, exclusão, modificação no plano de manutenção preventiva e plano de calibração?" },
      { n: 10, text: "Requer treinamento para implementação?" },
      { n: 11, text: "Outros itens a acrescentar caso a caso.", outros: true },
    ],
  },
  sms: {
    key: "sms",
    short: "SMS",
    title: "Avaliação de Gestão de Mudanças em Saúde, Meio Ambiente e Segurança (SMS)",
    items: [
      { n: 1, text: "Traz novos perigos e riscos que não foram identificados na planilha de identificação e avaliação dos perigos e danos? Caso positivo, atualizar a planilha de identificação e avaliação de perigos e danos, PGR e PCMSO." },
      { n: 2, text: "Irá gerar atualização das instruções existentes das atividades ou processos?" },
      { n: 3, text: "Irá gerar atualização do PAE?" },
      { n: 4, text: "Afetará dispositivos de combate à incêndio (hidrantes, extintores, sprinklers e etc.)?" },
      { n: 5, text: "Exige reposicionamento de extintores?" },
      { n: 6, text: "Irá impactar a rota de fuga (Sinalização de rota de fuga, luz de emergência e porta corta fogo)?" },
      { n: 7, text: "Alteração do ambiente (Arranjo físico, mobiliário, iluminação e ar condicionado)?" },
      { n: 8, text: "Impacta o conforto térmico do ambiente?" },
      { n: 9, text: "Altera o nível de ruído no local de trabalho ou extra muro?" },
      { n: 10, text: "Requer treinamento para implementação (operação/manutenção/segurança)?" },
      { n: 11, text: "Adequação para guarda de produtos químicos (Armário, compatibilidade química, bandeja de contenção e FDS)?" },
      { n: 12, text: "Requer inclusão, exclusão, modificação no plano de manutenção preventiva, plano de calibração?" },
      { n: 13, text: "Requer treinamento (Capacitação em: NR-05, NR-06, NR-10, NR-18, NR-33, NR-35, BVI e etc.)?" },
      { n: 14, text: "Monitoramento ou avaliação ambiental (Ruído, poeira, substância química, fumo, vibração, ergonômico e etc.)?" },
      { n: 15, text: "Requer estudo e compra de novos EPIs?" },
      { n: 16, text: "Risco de contaminação do ar, solo e lençol freático?" },
      { n: 17, text: "Produz novo resíduo ou altera a quantidade gerada?" },
      { n: 18, text: "Introduz riscos relativos a possibilidade de incêndios ou explosões?" },
      { n: 19, text: "Introduz riscos relativos ao armazenamento e empilhamento de materiais?" },
      { n: 20, text: "Eleva o consumo de matérias-primas e recursos naturais?" },
      { n: 21, text: "Outros itens não mencionados acima que devem ser acrescentados caso a caso.", outros: true },
    ],
  },
};

export const CHECKLIST_KEYS = Object.keys(CHECKLISTS);

function encontrarComplementar(change, id) {
  if (!change) return null;
  for (const grupo of gruposComplementares(change)) {
    const item = grupo.itens.find((complementar) => complementar.id === id);
    if (item) return { ...item, grupo: grupo.titulo };
  }
  return null;
}

export function itemText(checklist, n, change) {
  if (checklist === "comp") {
    return encontrarComplementar(change, n)?.texto ?? `Pergunta complementar ${n}`;
  }
  return CHECKLISTS[checklist]?.items.find((i) => i.n === n)?.text ?? "";
}

// "Qualidade · 3" | "SMS · 14" | "Complementar · loc1" | "Geral"
export function itemLabel(checklist, n, change) {
  if (!checklist || !n) return "Geral";
  if (checklist === "comp") {
    const item = encontrarComplementar(change, n);
    return item ? `${item.grupo} · ${item.id}` : `Complementar · ${n}`;
  }
  return `${CHECKLISTS[checklist].short} · ${n}`;
}
