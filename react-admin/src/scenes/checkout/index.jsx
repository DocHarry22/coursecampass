import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ course, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Step 1: Create payment intent
      const intentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course._id,
          amount: course.price
        })
      });

      const intentData = await intentResponse.json();

      if (!intentData.success) {
        throw new Error(intentData.message);
      }

      // Step 2: Simulate payment processing (in production, use Stripe Elements)
      // Wait 2 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Confirm payment
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentId: intentData.data.paymentId,
          paymentIntentId: intentData.data.paymentIntentId
        })
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        setSuccess('Payment successful! Redirecting to course...');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(confirmData.data.enrollment);
          }
          navigate(`/courses/${course._id}`);
        }, 2000);
      } else {
        throw new Error(confirmData.message);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Checkout
      </Typography>

      <Grid container spacing={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {course && (
                <>
                  <Box mb={2}>
                    <img 
                      src={course.thumbnail || '/placeholder-course.jpg'} 
                      alt={course.title}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {course.title}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {course.description?.substring(0, 100)}...
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Course Price:</Typography>
                    <Typography>${course.price?.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>Tax:</Typography>
                    <Typography>$0.00</Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${course.price?.toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <CreditCardIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Payment Information
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Card Number"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  required
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 19 }}
                />

                <TextField
                  fullWidth
                  label="Cardholder Name"
                  name="cardName"
                  value={cardDetails.cardName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Expiry Date"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      required
                      inputProps={{ maxLength: 5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="CVV"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      required
                      inputProps={{ maxLength: 4 }}
                      type="password"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" alignItems="center" mt={3} mb={2}>
                  <LockIcon sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">
                    Your payment information is secure and encrypted
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    `Pay $${course?.price?.toFixed(2)}`
                  )}
                </Button>

                <Typography variant="caption" color="textSecondary" display="block" textAlign="center" mt={2}>
                  By completing this purchase, you agree to our Terms of Service
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Methods Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                We accept the following payment methods:
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Typography variant="caption">Visa</Typography>
                <Typography variant="caption">•</Typography>
                <Typography variant="caption">Mastercard</Typography>
                <Typography variant="caption">•</Typography>
                <Typography variant="caption">American Express</Typography>
                <Typography variant="caption">•</Typography>
                <Typography variant="caption">Discover</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Checkout;
