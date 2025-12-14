import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUtilisateur } from '../Redux/store';

const LoginPage = () => {
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const result = await dispatch(loginUtilisateur({ Fullname: fullname, password })).unwrap();
        console.log('Login successful:', result);
        
        // Check if user is active (additional safety check)
        if (result.user && result.user.status === 'inactive') {
          setError('Your account is inactive. Please contact administrator.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          return;
        }
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
    } catch (error) {
        console.error('Login failed:', error);
        
        // Handle specific error messages
        if (error.includes('inactive')) {
          setError('Your account is inactive. Please contact administrator.');
        } else if (error.includes('Invalid credentials')) {
          setError('Invalid username or password.');
        } else {
          setError(error || 'Login failed. Please check your credentials.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-body {
          font-family: 'Inter', 'Arial', sans-serif;
          background: #ffffff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          height: 600px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e5e5;
        }

        .login-image-section {
          flex: 1;
          background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), 
                      url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          color: white;
          position: relative;
        }

        .image-content {
          text-align: center;
          z-index: 2;
        }

        .image-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .image-content p {
          font-size: 1.1rem;
          opacity: 0.95;
          line-height: 1.6;
          max-width: 400px;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          font-weight: 300;
        }

        .brand-logo {
          position: absolute;
          top: 40px;
          left: 40px;
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
          letter-spacing: 1px;
        }

        .login-form-section {
          flex: 1;
          padding: 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #ffffff;
        }

        .login-header {
          margin-bottom: 40px;
        }

        .login-header h1 {
          color: #000000;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }

        .login-header p {
          color: #666666;
          font-size: 1.1rem;
          font-weight: 400;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          color: #000000;
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 0.95rem;
        }

        .form-group input {
          padding: 16px 18px;
          border: 2px solid #e5e5e5;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: #fafafa;
          color: #000000;
          font-weight: 400;
        }

        .form-group input:focus {
          outline: none;
          border-color: #dc2626;
          background-color: white;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-group input::placeholder {
          color: #999999;
          font-weight: 400;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 15px 0;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          color: #666666;
          font-size: 0.9rem;
          position: relative;
          font-weight: 500;
        }

        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          background-color: #fafafa;
          border: 2px solid #e5e5e5;
          border-radius: 5px;
          margin-right: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .checkbox-container input:checked + .checkmark {
          background-color: #dc2626;
          border-color: #dc2626;
        }

        .checkbox-container input:checked + .checkmark::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .forgot-password {
          color: #dc2626;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .forgot-password:hover {
          color: #b91c1c;
          text-decoration: underline;
        }

        .login-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-button:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
        }

        .login-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .loading-spinner-1 {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid #fecaca;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1rem;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Features Section */
        .features {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 25px;
          border-top: 1px solid #f0f0f0;
        }

        .feature {
          text-align: center;
          flex: 1;
          padding: 0 15px;
        }

        .feature-icon {
          font-size: 1.8rem;
          margin-bottom: 10px;
          display: block;
        }

        .feature-text {
          font-size: 0.85rem;
          color: #666666;
          font-weight: 600;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
            border: none;
          }

          .login-image-section {
            padding: 30px 20px;
            min-height: 250px;
          }

          .image-content h2 {
            font-size: 2rem;
          }

          .image-content p {
            font-size: 1rem;
          }

          .login-form-section {
            padding: 40px 30px;
            flex: 1;
          }

          .login-header h1 {
            font-size: 2.2rem;
          }

          .features {
            flex-direction: column;
            gap: 20px;
            margin-top: 30px;
          }
        }

        @media (max-width: 480px) {
          .login-image-section {
            min-height: 200px;
            padding: 25px 15px;
          }

          .image-content h2 {
            font-size: 1.8rem;
          }

          .image-content p {
            font-size: 0.95rem;
          }

          .login-form-section {
            padding: 30px 20px;
          }

          .login-header h1 {
            font-size: 2rem;
          }

          .form-options {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .feature {
            padding: 0 10px;
          }
        }
      `}</style>

      <div className="login-body">
        <div className="login-container">
          {/* Left Side - Image Section */}
          <div className="login-image-section">
            <div className="brand-logo">OULFA DRIVE</div>
            <div className="image-content">
              <h2>Admin Portal</h2>
              <p>
                Access the admin dashboard to manage cars, clients, reservations, and more.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-form-section">
            <div className="login-header">
              <h1>Admin Login</h1>
              <p>Sign in to access the admin dashboard</p>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="fullname">Full Name</label>
                <input
                  type="text"
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#forgot" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-1"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;