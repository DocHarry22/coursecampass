import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refundDialog, setRefundDialog] = useState({ open: false, payment: null });
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (err) {
      setError('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/${refundDialog.payment._id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: refundReason })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Refund processed successfully');
        setRefundDialog({ open: false, payment: null });
        setRefundReason('');
        fetchPayments();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (paymentId) => {
    const token = localStorage.getItem('token');
    window.open(`/api/payments/${paymentId}/receipt?token=${token}`, '_blank');
  };

  const downloadInvoice = (paymentId) => {
    const token = localStorage.getItem('token');
    window.open(`/api/payments/${paymentId}/invoice?token=${token}`, '_blank');
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Payment History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPayments}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {loading && payments.length === 0 ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{payment.course?.title || 'N/A'}</TableCell>
                  <TableCell>
                    ${payment.amount.toFixed(2)} {payment.currency}
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.paymentMethod.toUpperCase()} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={
                        payment.status === 'completed' ? 'success' :
                        payment.status === 'refunded' ? 'warning' :
                        payment.status === 'failed' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<ReceiptIcon />}
                        onClick={() => downloadReceipt(payment._id)}
                      >
                        Receipt
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadInvoice(payment._id)}
                      >
                        Invoice
                      </Button>
                      {payment.status === 'completed' && (
                        <Button
                          size="small"
                          color="warning"
                          onClick={() => setRefundDialog({ open: true, payment })}
                        >
                          Refund
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No payment history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Refund Dialog */}
      <Dialog
        open={refundDialog.open}
        onClose={() => setRefundDialog({ open: false, payment: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            You can request a refund within 30 days of purchase. Please provide a reason for the refund.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Refund Reason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Please explain why you're requesting a refund..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog({ open: false, payment: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRefundRequest}
            disabled={!refundReason.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Request Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;
