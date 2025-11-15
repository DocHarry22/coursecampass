import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  RateReview as ReviewIcon,
  Flag as FlagIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch users
      const usersRes = await fetch('http://localhost:5000/api/admin/users?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data);
      }

      // Fetch pending reviews
      const reviewsRes = await fetch('http://localhost:5000/api/reviews/moderation/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setPendingReviews(reviewsData.data.filter(r => r.status === 'pending'));
        setFlaggedReviews(reviewsData.data.filter(r => r.status === 'flagged'));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data');
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('User role updated successfully');
        fetchAdminData();
        setUserDialogOpen(false);
      } else {
        setError(data.message || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user role');
    }
  };

  const toggleUserStatus = async (userId, suspend) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/${suspend ? 'suspend' : 'activate'}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`User ${suspend ? 'suspended' : 'activated'} successfully`);
        fetchAdminData();
      } else {
        setError(data.message || `Failed to ${suspend ? 'suspend' : 'activate'} user`);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const moderateReview = async (reviewId, action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          moderationNotes
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Review ${action} successfully`);
        fetchAdminData();
        setReviewDialogOpen(false);
        setModerationNotes('');
      } else {
        setError(data.message || 'Failed to moderate review');
      }
    } catch (err) {
      console.error('Error moderating review:', err);
      setError('Failed to moderate review');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box m="20px">
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Box>
    );
  }

  if (loading) {
    return <Box m="20px"><LinearProgress /></Box>;
  }

  return (
    <Box m="20px">
      <Typography variant="h2" fontWeight="700" mb={3}>
        Admin Dashboard
      </Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Statistics Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalUsers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Users</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.totalCourses || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Courses</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.pendingReviews || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Reviews</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ReviewIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">{stats.flaggedReviews || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Flagged Reviews</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <FlagIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="User Management" />
          <Tab label={`Pending Reviews (${pendingReviews.length})`} />
          <Tab label={`Flagged Reviews (${flaggedReviews.length})`} />
        </Tabs>
      </Box>

      {/* User Management Tab */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar>{user.firstName?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2">{user.firstName} {user.lastName}</Typography>
                        {user.emailVerified && <VerifiedIcon color="primary" fontSize="small" />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={user.role === 'admin' ? 'error' : user.role === 'instructor' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.accountStatus || 'active'} 
                      color={user.accountStatus === 'suspended' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setSelectedUser(user); setUserDialogOpen(true); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleUserStatus(user._id, user.accountStatus !== 'suspended')}
                      disabled={user.role === 'admin'}
                    >
                      {user.accountStatus === 'suspended' ? <CheckIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pending Reviews Tab */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingReviews.map((review) => (
                <TableRow key={review._id}>
                  <TableCell>{review.course?.title || 'Unknown Course'}</TableCell>
                  <TableCell>{review.user?.firstName} {review.user?.lastName}</TableCell>
                  <TableCell>{review.rating} ★</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {review.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => { setSelectedReview(review); setReviewDialogOpen(true); }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => { setSelectedReview(review); moderateReview(review._id, 'reject'); }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {pendingReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No pending reviews
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Flagged Reviews Tab */}
      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flaggedReviews.map((review) => (
                <TableRow key={review._id}>
                  <TableCell>{review.course?.title || 'Unknown Course'}</TableCell>
                  <TableCell>{review.user?.firstName} {review.user?.lastName}</TableCell>
                  <TableCell>{review.rating} ★</TableCell>
                  <TableCell>
                    <Chip label={review.flags?.length || 0} color="error" size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {review.content}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => { setSelectedReview(review); moderateReview(review._id, 'approve'); }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => { setSelectedReview(review); setReviewDialogOpen(true); }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {flaggedReviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No flagged reviews
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* User Edit Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box pt={2}>
              <Typography variant="body1" mb={2}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <TextField
                select
                fullWidth
                label="Role"
                defaultValue={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => updateUserRole(selectedUser._id, selectedUser.role)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Moderation Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Moderate Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box pt={2}>
              <Typography variant="h6" mb={1}>{selectedReview.title}</Typography>
              <Typography variant="body2" mb={2}>{selectedReview.content}</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Moderation Notes"
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Optional notes about this moderation decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            color="success" 
            variant="contained"
            onClick={() => moderateReview(selectedReview._id, 'approve')}
          >
            Approve
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => moderateReview(selectedReview._id, 'reject')}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
