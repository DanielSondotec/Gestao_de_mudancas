import "../styles/ui.css";

// "Aguardando eficácia" -> "aguardando-eficacia" (remove acentos para virar classe CSS)
const slug = (text) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replaceAll(" ", "-");

function StatusBadge({ status }) {
  return <span className={`badge ${slug(status)}`}>{status}</span>;
}

export default StatusBadge;
