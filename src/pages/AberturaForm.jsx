import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { blankChange } from "../utils/changes";
import { CHECKLISTS, CHECKLIST_KEYS } from "../data/checklists";
import { ETAPA, TIPOS, gruposComplementares, sugerirAnexos } from "../data/formulario";
import { todayISO } from "../utils/dates";
import "../styles/ui.css";

// Pergunta Sim/Não (valor booleano).
function SimNao({ name, value, onChange }) {
  return (
    <div className="check-options">
      <label className="pill-radio">
        <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} />
        <span className="yes">Sim</span>
      </label>
      <label className="pill-radio">
        <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} />
        <span className="no">Não</span>
      </label>
    </div>
  );
}

// Linha de checklist: a resposta guardada é "sim" ou "nao".
function LinhaSimNao({ numero, texto, nome, valor, onChange }) {
  return (
    <div className="check-row">
      <span className="check-n">{numero}</span>
      <span className="check-text">{texto}</span>
      <div className="check-options">
        <label className="pill-radio">
          <input type="radio" name={nome} checked={valor === "sim"} onChange={() => onChange("sim")} />
          <span className="yes">Sim</span>
        </label>
        <label className="pill-radio">
          <input type="radio" name={nome} checked={valor === "nao"} onChange={() => onChange("nao")} />
          <span className="no">Não</span>
        </label>
      </div>
    </div>
  );
}

// Etapa 1 do fluxo: abertura da mudança pelo solicitante (cliente).
function AberturaForm() {
  const { user } = useAuth();
  const { addChange } = useChanges();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({ ...blankChange(), solicitante: user?.nome ?? "" }));
  const [errors, setErrors] = useState([]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const toggleTipo = (key) =>
    setForm((f) => ({
      ...f,
      tipos: f.tipos.includes(key) ? f.tipos.filter((t) => t !== key) : [...f.tipos, key],
    }));

  const setResposta = (k, n, valor) =>
    setForm((f) => ({ ...f, respostas: { ...f.respostas, [k]: { ...f.respostas[k], [n]: valor } } }));

  const setOutros = (k, valor) => setForm((f) => ({ ...f, outros: { ...f.outros, [k]: valor } }));

  const setComplementar = (id, valor) =>
    setForm((f) => ({ ...f, complementares: { ...f.complementares, [id]: valor } }));

  // checklists que aparecem para o cliente, conforme as respostas acima
  const anexos = sugerirAnexos(form);
  const grupos = gruposComplementares(form);

  function validar() {
    const errs = [];
    if (!form.titulo.trim()) errs.push("Informe o título da mudança.");
    if (!form.solicitante.trim()) errs.push("Informe o solicitante.");
    if (!form.gestorProcesso.trim()) errs.push("Informe o gestor do processo.");
    if (!form.area.trim()) errs.push("Informe a área ou o contrato.");
    if (!form.descricao.trim()) errs.push("Descreva o que muda, de onde para onde.");
    if (!form.motivo.trim()) errs.push("Informe por que mudar e o benefício esperado.");
    if (form.tipos.length === 0) errs.push("Marque pelo menos um tipo de mudança.");
    if (!form.dataPrevista) errs.push("Informe a data prevista de implantação.");
    if (form.temporaria && !form.dataFim) errs.push("Informe a data de término da mudança temporária.");

    for (const k of CHECKLIST_KEYS) {
      if (!anexos[k]) continue;
      const faltam = CHECKLISTS[k].items.filter((i) => !form.respostas[k]?.[i.n]).length;
      if (faltam) errs.push(`Checklist ${CHECKLISTS[k].short}: ${faltam} pergunta(s) sem resposta.`);

      const itemOutros = CHECKLISTS[k].items.find((i) => i.outros);
      if (itemOutros && form.respostas[k]?.[itemOutros.n] === "sim" && !form.outros[k]?.trim()) {
        errs.push(`Checklist ${CHECKLISTS[k].short}: descreva o item "Outros" (${itemOutros.n}).`);
      }
    }
    const faltamComp = grupos.flatMap((g) => g.itens).filter((i) => !form.complementares[i.id]).length;
    if (faltamComp) errs.push(`Checklists complementares: ${faltamComp} pergunta(s) sem resposta.`);

    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validar();
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // guarda só as respostas dos checklists que realmente se aplicam
    const respostas = {};
    const outros = {};
    for (const k of CHECKLIST_KEYS) {
      respostas[k] = anexos[k] ? form.respostas[k] : {};
      outros[k] = anexos[k] ? form.outros[k].trim() : "";
    }
    const complementares = {};
    for (const item of grupos.flatMap((g) => g.itens)) complementares[item.id] = form.complementares[item.id];

    const id = addChange({
      ...form,
      titulo: form.titulo.trim(),
      solicitante: form.solicitante.trim(),
      gestorProcesso: form.gestorProcesso.trim(),
      area: form.area.trim(),
      descricao: form.descricao.trim(),
      motivo: form.motivo.trim(),
      semFazer: form.semFazer.trim(),
      dataFim: form.temporaria ? form.dataFim : "",

      data: todayISO(),
      // campos antigos, mantidos para as telas atuais continuarem funcionando
      elaborador: form.solicitante.trim(),
      aprovador: form.gestorProcesso.trim(),

      checklists: anexos,
      respostas,
      outros,
      complementares,

      etapa: ETAPA.ANALISE,
    });

    navigate(`/mudancas/${id}`);
  }

  return (
    <form className="page" onSubmit={handleSubmit} noValidate>
      <header className="page-header">
        <div>
          <span className="page-eyebrow">ETAPA 1 · ABERTURA</span>
          <h1>Abertura do chamado</h1>
          <p>Responda antes de enviar ao SGI. As respostas definem quais checklists você precisa responder abaixo.</p>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="form-errors" role="alert">
          <strong>Corrija os pontos abaixo:</strong>
          <ul>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <h2>Identificação</h2>
        <p className="card-sub">Quem pede a mudança e onde ela acontece.</p>
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="titulo">1. Título da mudança *</label>
            <input id="titulo" className="input" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="solicitante">2. Solicitante *</label>
            <input id="solicitante" className="input" value={form.solicitante} onChange={(e) => set("solicitante", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="gestor">3. Gestor do processo *</label>
            <input id="gestor" className="input" value={form.gestorProcesso} onChange={(e) => set("gestorProcesso", e.target.value)} />
          </div>
          <div className="field span-2">
            <label htmlFor="area">4. Área ou contrato *</label>
            <input id="area" className="input" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>A mudança</h2>
        <p className="card-sub">O que muda, por quê e o que acontece se não for feita.</p>
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="desc">5. O que muda? Descreva de onde para onde *</label>
            <textarea id="desc" className="input" rows={3} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="motivo">6. Por que mudar? Benefício esperado *</label>
            <textarea id="motivo" className="input" rows={3} value={form.motivo} onChange={(e) => set("motivo", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="semfazer">7. O que acontece se não fizermos a mudança?</label>
            <textarea id="semfazer" className="input" rows={3} value={form.semFazer} onChange={(e) => set("semFazer", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>8. Tipo de mudança *</h2>
        <p className="card-sub">Marque todos os que se aplicam. Eles definem os checklists da análise.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(TIPOS).map(([key, texto]) => (
            <label key={key} className="toggle-card">
              <input type="checkbox" checked={form.tipos.includes(key)} onChange={() => toggleTipo(key)} />
              {texto}
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Prazo e condições</h2>
        <p className="card-sub">Datas e situações especiais.</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="prev">9. Data prevista de implantação *</label>
            <input id="prev" type="date" className="input" value={form.dataPrevista} onChange={(e) => set("dataPrevista", e.target.value)} />
          </div>
          <div />

          <div className="field">
            <span className="label">10. É temporária?</span>
            <SimNao name="temporaria" value={form.temporaria} onChange={(v) => set("temporaria", v)} />
          </div>
          {form.temporaria ? (
            <div className="field">
              <label htmlFor="fim">Data de término prevista *</label>
              <input id="fim" type="date" className="input" value={form.dataFim} onChange={(e) => set("dataFim", e.target.value)} />
            </div>
          ) : (
            <div />
          )}

          <div className="field">
            <span className="label">11. Decorre de evento não intencional (epidemia, acidente, indisponibilidade)?</span>
            <SimNao name="naoIntencional" value={form.naoIntencional} onChange={(v) => set("naoIntencional", v)} />
          </div>
          <div className="field">
            <span className="label">12. Envolve requisito legal, do cliente ou contratual?</span>
            <SimNao name="requisitoLegal" value={form.requisitoLegal} onChange={(v) => set("requisitoLegal", v)} />
          </div>
          <div className="field">
            <span className="label">13. Envolve produto químico, resíduo ou energia perigosa?</span>
            <SimNao name="quimico" value={form.quimico} onChange={(v) => set("quimico", v)} />
          </div>
          <div className="field">
            <span className="label">14. Envolve terceiros ou outro contrato?</span>
            <SimNao name="terceiros" value={form.terceiros} onChange={(v) => set("terceiros", v)} />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Checklists</h2>
        <p className="card-sub">
          Cada resposta "Sim" vira uma ação, que o SGI vai detalhar em um plano de ação (5W2H).
        </p>
        {form.tipos.length === 0 && !anexos.qualidade && !anexos.sms && (
          <p className="hint">Marque o tipo de mudança (pergunta 8) para ver os checklists.</p>
        )}
      </section>

      {CHECKLIST_KEYS.filter((k) => anexos[k]).map((k) => (
        <section className="card" key={k}>
          <h2>{CHECKLISTS[k].title}</h2>
          <p className="card-sub">Verificar se a mudança…</p>
          <div className="checklist">
            {CHECKLISTS[k].items.map((item) => (
              <Fragment key={item.n}>
                <LinhaSimNao
                  numero={item.n}
                  texto={item.text}
                  nome={`${k}-${item.n}`}
                  valor={form.respostas[k]?.[item.n]}
                  onChange={(v) => setResposta(k, item.n, v)}
                />
                {item.outros && form.respostas[k]?.[item.n] === "sim" && (
                  <div className="field" style={{ padding: "0 0 12px 46px" }}>
                    <input
                      className="input"
                      placeholder="Descreva o item"
                      aria-label={`Descrição do item ${item.n}`}
                      value={form.outros[k] ?? ""}
                      onChange={(e) => setOutros(k, e.target.value)}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>
      ))}

      {grupos.map((g) => (
        <section className="card" key={g.titulo}>
          <h2>{g.titulo}</h2>
          <div className="checklist">
            {g.itens.map((item, n) => (
              <LinhaSimNao
                key={item.id}
                numero={n + 1}
                texto={item.texto}
                nome={`comp-${item.id}`}
                valor={form.complementares[item.id]}
                onChange={(v) => setComplementar(item.id, v)}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="page-actions">
        <button type="submit" className="btn btn-primary">
          <Send size={16} /> Enviar ao SGI
        </button>
      </div>
    </form>
  );
}

export default AberturaForm;