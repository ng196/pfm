import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-content">
        <h1>Sign In</h1>
        <form onSubmit={(e) => { e.preventDefault(); navigate('/accounts'); }}>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  );
}
