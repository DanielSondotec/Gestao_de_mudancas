// Dados iniciais. SGI-GMU-2026-04 vem da planilha real "Mudança de Endereço SGI";
// os demais são exemplos fictícios para o painel não nascer vazio
// (podem ser apagados em Configurações).
import { CHECKLISTS } from "./checklists";

// Marca como "sim" os itens listados e "não" todos os outros.
function respostas(checklist, sim) {
  return Object.fromEntries(
    CHECKLISTS[checklist].items.map((i) => [i.n, sim.includes(i.n) ? "sim" : "nao"]),
  );
}

const ef = (responsavel, dataPrevista, extra = {}) => ({
  responsavel,
  dataPrevista,
  dataReal: null,
  eficaz: null,
  observacao: "",
  ...extra,
});

export function createSeed() {
  return [
    {
      id: "SGI-GMU-2026-04",
      titulo: "Mudança de Endereço SGI",
      descricao: "Mudança de endereço da área do SGI, com novo layout e adequações de iluminação e ar condicionado.",
      elaborador: "Mayara Cavalcante de Paula",
      aprovador: "Maria de Fátima",
      data: "2026-05-30",
      checklists: { qualidade: true, sms: true },
      respostas: {
        qualidade: respostas("qualidade", [3]),
        sms: respostas("sms", [3, 4, 5, 6, 7, 8, 14]),
      },
      riscoSignificativo: false,
      especialista: "",
      acoes: [
        { id: "seed-04-a1", checklist: "qualidade", item: 3, acao: "Definir o layout / mobiliário (planta em anexo)", responsavel: "Mayara", prazo: "2026-06-30", termino: "2026-06-26" },
        { id: "seed-04-a2", checklist: "sms", item: 14, acao: "Solicitação da AEP (iluminação e ar condicionado)", responsavel: "Carmem", prazo: "2026-07-30", termino: null },
      ],
      eficacia: ef("João Dias", "2027-01-30"),
      historico: [{ id: "seed-04-h1", tipo: "criada", texto: "Mudança registrada (importada da planilha SGI-GMU-2026-04).", em: "2026-05-30T12:00:00.000Z" }],
    },
    {
      id: "SGI-GMU-2026-01",
      titulo: "Mudança de procedimento interno",
      descricao: "Revisão do procedimento de verificação formal de relatórios antes do envio ao cliente.",
      elaborador: "Carlos Souza",
      aprovador: "Maria de Fátima",
      data: "2026-02-10",
      checklists: { qualidade: true, sms: false },
      respostas: { qualidade: respostas("qualidade", [2, 6, 10]), sms: {} },
      riscoSignificativo: false,
      especialista: "",
      acoes: [
        { id: "seed-01-a1", checklist: "qualidade", item: 2, acao: "Atualizar o procedimento de produção do serviço", responsavel: "Carlos Souza", prazo: "2026-03-10", termino: "2026-03-08" },
        { id: "seed-01-a2", checklist: "qualidade", item: 10, acao: "Treinar a equipe no novo procedimento", responsavel: "Ana Costa", prazo: "2026-03-25", termino: "2026-03-24" },
      ],
      eficacia: ef("Maria de Fátima", "2026-09-25", { dataReal: "2026-09-20", eficaz: true, observacao: "Procedimento aplicado em todos os contratos; sem não conformidades." }),
      historico: [
        { id: "seed-01-h1", tipo: "criada", texto: "Mudança registrada.", em: "2026-02-10T12:00:00.000Z" },
        { id: "seed-01-h2", tipo: "eficacia", texto: "Eficácia verificada: eficaz.", em: "2026-09-20T12:00:00.000Z" },
      ],
    },
    {
      id: "SGI-GMU-2026-02",
      titulo: "Implementação de nova tecnologia",
      descricao: "Adoção de nova ferramenta de modelagem hidráulica nos projetos de saneamento.",
      elaborador: "Maria Santos",
      aprovador: "Maria de Fátima",
      data: "2026-09-14",
      checklists: { qualidade: true, sms: false },
      respostas: { qualidade: respostas("qualidade", [1, 4, 10]), sms: {} },
      riscoSignificativo: true,
      especialista: "Gerência de TI",
      acoes: [
        { id: "seed-02-a1", checklist: "qualidade", item: 4, acao: "Avaliar desempenho das estações e comprar licenças", responsavel: "Gerência de TI", prazo: "2026-10-30", termino: null },
        { id: "seed-02-a2", checklist: "qualidade", item: 10, acao: "Treinamento da equipe de projeto na ferramenta", responsavel: "Maria Santos", prazo: "2026-12-15", termino: null },
      ],
      eficacia: ef("Maria de Fátima", "2027-06-15"),
      historico: [{ id: "seed-02-h1", tipo: "criada", texto: "Mudança registrada.", em: "2026-09-14T12:00:00.000Z" }],
    },
    {
      id: "SGI-GMU-2026-03",
      titulo: "Alteração de infraestrutura",
      descricao: "Reforma da sala de reuniões da Sede.",
      elaborador: "Ana Costa",
      aprovador: "Maria de Fátima",
      data: "2026-10-20",
      checklists: { qualidade: false, sms: true },
      respostas: { qualidade: {}, sms: respostas("sms", [1, 7]) },
      riscoSignificativo: false,
      especialista: "",
      acoes: [],
      eficacia: ef("João Dias", ""),
      historico: [{ id: "seed-03-h1", tipo: "criada", texto: "Mudança registrada.", em: "2026-10-20T12:00:00.000Z" }],
    },
  ];
}
