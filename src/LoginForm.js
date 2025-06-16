import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

export default function LoginForm({ setIsAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const authorizedAdmins = [
    "work.sakshamtalwar@gmail.com",
    "salesabshappypaws@gmail.com"
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInEmail = userCredential.user.email;

      if (authorizedAdmins.includes(loggedInEmail)) {
        setIsAdmin(true);
      } else {
        setError("Access denied: You are not an authorized admin.");
        await signOut(auth);
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        required
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
