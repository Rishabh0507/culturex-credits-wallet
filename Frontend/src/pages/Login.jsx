import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import { apiError } from '../api/error';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (email, password) => {
    try {
      signIn(await login(email, password));
      navigate('/wallet', { replace: true });
    } catch (err) {
      throw apiError(err);
    }
  };

  return (
    <AuthForm
      title="Login"
      submitLabel="Login"
      onSubmit={handleSubmit}
      footer={<>No account? <Link to="/signup">Sign up</Link></>}
    />
  );
}
