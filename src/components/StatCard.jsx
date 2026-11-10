import "./StatCard.css";

function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>

      <div className="stat-info">
        <span>{title}</span>
        <h2>{value}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default StatCard;
