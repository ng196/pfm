import { useNavigate } from 'react-router-dom';
import '../styles/accounts.css';

export default function Accounts() {
  const navigate = useNavigate();

  return (
    <div className="accounts-container">
      <h1>Link Your Accounts</h1>
      <p>Connect your bank accounts via Account Aggregator</p>
      <button onClick={() => navigate('/dashboard')} className="link-btn">
        Link Accounts
      </button>
    </div>
  );
}
