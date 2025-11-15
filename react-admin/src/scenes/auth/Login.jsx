import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setApiError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setApiError(result.message || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          maxWidth: 450,
          width: '100%',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h3" fontWeight="700" mb={1}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your CourseCompass account
          </Typography>
        </Box>

        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                underline="hover"
                fontWeight="600"
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
