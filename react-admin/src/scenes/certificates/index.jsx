import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Verified as VerifiedIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, certificate: null });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/certificates/my-certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (err) {
      setError('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (certificateNumber) => {
    window.open(`/api/certificates/${certificateNumber}/download`, '_blank');
  };

  const shareToLinkedIn = async (certificateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/${certificateId}/linkedin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        window.open(data.data.linkedInUrl, '_blank');
      } else {
        setError('Failed to generate LinkedIn share link');
      }
    } catch (err) {
      setError('Failed to share to LinkedIn');
    }
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A', 'Distinction'].includes(grade)) return 'success';
    if (['A-', 'B+', 'Merit'].includes(grade)) return 'primary';
    if (['B', 'B-'].includes(grade)) return 'info';
    return 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          My Certificates
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TrophyIcon color="primary" sx={{ fontSize: 30 }} />
          <Typography variant="h6" color="primary">
            {certificates.length} Certificate{certificates.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {certificates.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <TrophyIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Certificates Yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete courses to earn certificates that you can share with employers
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((certificate) => (
            <Grid item xs={12} md={6} key={certificate._id}>
              <Card sx={{ position: 'relative', overflow: 'visible' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    zIndex: 1
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
                
                <CardContent>
                  <Box mb={2}>
                    <Typography variant="h6" gutterBottom>
                      {certificate.course?.title}
                    </Typography>
                    <Chip
                      label={`Grade: ${certificate.grade}`}
                      color={getGradeColor(certificate.grade)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label="Verified"
                      color="success"
                      size="small"
                      icon={<VerifiedIcon />}
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Certificate Number: <strong>{certificate.certificateNumber}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed: {new Date(certificate.completionDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadCertificate(certificate.certificateNumber)}
                      size="small"
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={() => shareToLinkedIn(certificate._id)}
                      size="small"
                    >
                      Share on LinkedIn
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => setPreviewDialog({ open: true, certificate })}
                      size="small"
                    >
                      Preview
                    </Button>
                  </Box>

                  <Box mt={2} p={1} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="caption" color="textSecondary">
                      Verification Code: {certificate.verificationCode}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, certificate: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Certificate Preview</DialogTitle>
        <DialogContent>
          {previewDialog.certificate && (
            <Box>
              <iframe
                src={`/api/certificates/${previewDialog.certificate.certificateNumber}/download`}
                width="100%"
                height="600px"
                title="Certificate Preview"
                style={{ border: 'none' }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Certificates;
