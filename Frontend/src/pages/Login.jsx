import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleLogin(event) {
    event.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      navigate('/portal');
    } else {
      setError('Incorrect username or password.');
    }
  }

  return <section>
    <h1>Admin Login</h1>
    <form onSubmit={handleLogin}>
      <label>Username</label>
      <input aria-label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <label>Password</label>
      <input aria-label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
    </form>
    <p role="alert">{error}</p>
    <p>Demo login: admin / admin123</p>
  </section>;
}
