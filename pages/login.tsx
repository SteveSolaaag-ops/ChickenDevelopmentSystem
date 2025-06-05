import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import chickenBackground from '../assets/images/brand-logos/chicken.png'; // Import the image

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Admin credentials
    const adminUsername = "admin";
    const adminPassword = "password123";

    if (username === adminUsername && password === adminPassword) {
      // Save auth state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/sales'); // <-- Redirect to sales page after login
    } else {
      setErrorMessage('Invalid username or password');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: `url(${chickenBackground})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Login Form - Fully Transparent Background */}
      <div
        className="relative p-10 rounded-lg w-full max-w-lg z-10"
        style={{ backgroundColor: 'transparent' }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-black">Admin Login</h2>
        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}
        <form onSubmit={handleLogin}>
          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-black font-bold mb-2">Username</label>
            <input
              type="text"
              className="form-input w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className="block text-black font-bold mb-2">Password</label>
            <input
              type="password"
              className="form-input w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow transition duration-200 ease-in-out"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-black mt-4">
          © This private only for Triple E Company.
        </p>
      </div>
    </div>
  );
}

export default Login;