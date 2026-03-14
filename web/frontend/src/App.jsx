import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import Intro from './pages/intro';
import Auth from './pages/auth';
import Accounts from './pages/accounts';
import Dashboard from './pages/dashboard';
import Expenses from './pages/expenses';
import Goals from './pages/goals';
import ManualEntry from './pages/manual-entry';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/manual-entry" element={<ManualEntry />} />
      </Routes>
    </Router>
  );
}

export default App;
