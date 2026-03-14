import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card" onClick={() => navigate('/expenses')}>
          <h3>Expenses</h3>
        </div>
        <div className="card" onClick={() => navigate('/goals')}>
          <h3>Goals</h3>
        </div>
        <div className="card" onClick={() => navigate('/manual-entry')}>
          <h3>Manual Entry</h3>
        </div>
      </div>
    </div>
  );
}
