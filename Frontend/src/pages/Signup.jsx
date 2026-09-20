import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { signup } from '../api/auth';
import { apiError } from '../api/error';

export default function Signup() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (email, password) => {
    try {
      signIn(await signup(email, password));
      navigate('/wallet', { replace: true });
    } catch (err) {
      throw apiError(err);
    }
  };

  return (
    <AuthForm
      title="Sign up"
      submitLabel="Create account"
      onSubmit={handleSubmit}
      footer={<>Already registered? <Link to="/login">Login</Link></>}
    />
  );
}
