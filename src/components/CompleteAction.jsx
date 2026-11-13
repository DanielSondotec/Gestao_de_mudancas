import { useState } from "react";
import { Check, Download } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useChanges } from "../hooks/useChanges";
import { todayISO, formatDate } from "../utils/dates";
import { getAttachment, saveAttachments } from "../utils/attachments";
import "../styles/ui.css";

function ResolutionAttachments({ attachments = [] }) {
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  async function downloadAttachment(attachment) {
    let url;
    setDownloading(attachment.id);
    setError("");

    try {
      const blob = await getAttachment(attachment.id);
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      document.body.append(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Não foi possível baixar o arquivo.",
      );
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloading("");
    }
  }

  if (attachments.length === 0) return null;

  return (
    <div>
      <small>Arquivos anexados:</small>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
        {attachments.map((attachment) => (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            key={attachment.id}
            onClick={() => downloadAttachment(attachment)}
            disabled={Boolean(downloading)}
            aria-label={`Baixar ${attachment.name}`}
          >
            <Download size={14} />
            {downloading === attachment.id ? "Carregando..." : attachment.name}
          </button>
        ))}
      </div>
      {error && <p className="notice warn" role="alert">{error}</p>}
    </div>
  );
}

function CompleteAction({ changeId, action, readOnly = false }) {
  const { user } = useAuth();
  const { proposeResolution } = useChanges();
  const [resolucao, setResolucao] = useState(action.resolucao ?? "");
  const [date, setDate] = useState(action.resolucaoEm ?? todayISO());
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formAberto, setFormAberto] = useState(action.statusPlano === "correcao");

  if (readOnly) {
    return (
      <div className="inline-complete">
        <ResolutionAttachments attachments={action.resolucaoAnexos} />
        <span>{action.termino ? formatDate(action.termino) : "Registro arquivado."}</span>
      </div>
    );
  }

  if (action.statusPlano === "aguardando_aprovacao") {
    return (
      <div className="inline-complete">
        <ResolutionAttachments attachments={action.resolucaoAnexos} />
        <span>Solução enviada em {formatDate(action.resolucaoEm)}; aguardando avaliação.</span>
      </div>
    );
  }

  if (action.statusPlano === "aprovado") {
    return (
      <div className="inline-complete">
        <ResolutionAttachments attachments={action.resolucaoAnexos} />
        <span>Aprovada em {formatDate(action.avaliacao?.data ?? action.termino)}</span>
      </div>
    );
  }

  const responsavelDesignado = Boolean(user?.usuario && action.responsavelId === user.usuario);

  if (!responsavelDesignado) {
    return (
      <>
        <ResolutionAttachments attachments={action.resolucaoAnexos} />
        <span>{action.termino ? formatDate(action.termino) : "—"}</span>
      </>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const proposta = resolucao.trim();
    if (!proposta || !date || saving) return;

    setSaving(true);
    setError("");
    try {
      const attachments = await saveAttachments(files);
      proposeResolution(changeId, action.id, proposta, date, attachments);
      setFiles([]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar a solução.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ResolutionAttachments attachments={action.resolucaoAnexos} />
      {action.avaliacao?.status === "reprovado" && (
        <p className="hint">Correção solicitada: {action.avaliacao.observacao}</p>
      )}
      {!formAberto && (
        <button type="button" className="btn btn-ghost btn-sm no-print" onClick={() => setFormAberto(true)}>
          {action.statusPlano === "correcao" ? "Corrigir solução" : "Propor solução"}
        </button>
      )}
      {formAberto && (
        <form className="inline-complete no-print" style={{ flexWrap: "wrap" }} onSubmit={handleSubmit}>
          <textarea
            className="input"
            rows={2}
            style={{ width: 260 }}
            value={resolucao}
            onChange={(e) => setResolucao(e.target.value)}
            aria-label="Solução proposta"
            placeholder="Descreva a solução executada"
            required
          />
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Data da proposta"
            required
          />
          <label className="field" style={{ minWidth: 180 }}>
            <span className="label">Anexar arquivos</span>
            <input
              type="file"
              className="input"
              multiple
              aria-label="Anexar arquivos à solução"
              onChange={(event) => {
                setFiles(Array.from(event.target.files ?? []));
                setError("");
              }}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={!resolucao.trim() || !date || saving}>
            <Check size={14} /> {saving ? "Salvando..." : "Enviar para avaliação"}
          </button>
          {error && <p className="notice warn" role="alert">{error}</p>}
          <p className="hint" style={{ width: "100%" }}>
            Os arquivos ficam armazenados somente neste navegador.
          </p>
        </form>
      )}
    </>
  );
}

export default CompleteAction;
