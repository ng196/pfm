import { useNavigate } from 'react-router-dom';
import '../styles/intro.css';

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="intro-container">
      <div className="intro-content">
        <h1>Connect Your Accounts</h1>
        <p>Securely link your bank accounts using Account Aggregator</p>
        <button onClick={() => navigate('/auth')} className="continue-btn">
          Continue
        </button>
      </div>
    </div>
  );
}
