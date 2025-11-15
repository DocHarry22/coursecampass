import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user and token from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Save to state and localStorage
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (firstName, lastName, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save to state and localStorage
      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Update failed');
      }

      // Update user in state and localStorage
      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: error.message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Password update failed');
      }

      // Update token
      setToken(data.data.token);
      localStorage.setItem('token', data.data.token);

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Request failed');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: error.message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Password reset failed');
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
