import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1>Welcome to FinTrack</h1>
        <p>Your personal finance management solution</p>
        <button onClick={() => navigate('/intro')} className="get-started-btn">
          Get Started
        </button>
      </div>
    </div>
  );
}
