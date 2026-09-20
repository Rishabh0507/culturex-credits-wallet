import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="nav">
      <span className="nav-brand">CultureX</span>
      {user ? (
        <>
          <Link to="/wallet">Wallet</Link>
          <Link to="/campaigns">Campaigns</Link>
          <span className="nav-spacer" />
          <span className="nav-email">{user.email}</span>
          <button type="button" className="link-button" onClick={handleSignOut}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}
