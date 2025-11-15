import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PartnerPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [courseDialog, setCourseDialog] = useState({ open: false, mode: 'add', course: null });
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  
  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: '',
    price: 0,
    credits: 0,
    language: 'English'
  });

  useEffect(() => {
    // Check if user has partner/university access
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      navigate('/');
      return;
    }
    
    fetchCourses();
    fetchAnalytics();
    fetchApiKeys();
  }, [user, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/api-keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
  };

  const handleCreateCourse = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Course created successfully');
        setCourseDialog({ open: false, mode: 'add', course: null });
        setCourseForm({
          title: '',
          description: '',
          category: '',
          difficulty: 'beginner',
          duration: '',
          price: 0,
          credits: 0,
          language: 'English'
        });
        fetchCourses();
      } else {
        setError(data.message || 'Failed to create course');
      }
    } catch (err) {
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/partner/courses/${courseDialog.course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Course updated successfully');
        setCourseDialog({ open: false, mode: 'add', course: null });
        fetchCourses();
      } else {
        setError(data.message || 'Failed to update course');
      }
    } catch (err) {
      setError('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/partner/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Course deleted successfully');
        fetchCourses();
      } else {
        setError(data.message || 'Failed to delete course');
      }
    } catch (err) {
      setError('Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/api-keys/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('API key generated successfully');
        setApiKeyDialog(false);
        fetchApiKeys();
      } else {
        setError(data.message || 'Failed to generate API key');
      }
    } catch (err) {
      setError('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/partner/api-keys/${keyId}/revoke`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('API key revoked successfully');
        fetchApiKeys();
      }
    } catch (err) {
      setError('Failed to revoke API key');
    }
  };

  const openEditCourseDialog = (course) => {
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      duration: course.duration,
      price: course.price || 0,
      credits: course.credits || 0,
      language: course.language || 'English'
    });
    setCourseDialog({ open: true, mode: 'edit', course });
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Partner Portal
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchCourses();
            fetchAnalytics();
            fetchApiKeys();
          }}
        >
          Refresh Data
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Analytics Overview */}
      {analytics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="textSecondary">Total Courses</Typography>
                    <Typography variant="h4">{analytics.totalCourses || 0}</Typography>
                  </Box>
                  <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="textSecondary">Total Enrollments</Typography>
                    <Typography variant="h4">{analytics.totalEnrollments || 0}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="textSecondary">Avg Rating</Typography>
                    <Typography variant="h4">{analytics.averageRating?.toFixed(1) || '0.0'}</Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="textSecondary">Active Students</Typography>
                    <Typography variant="h4">{analytics.activeStudents || 0}</Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="My Courses" />
          <Tab label="Analytics" />
          <Tab label="API Keys" />
        </Tabs>
      </Box>

      {/* Tab 1: Course Management */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Course Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCourseForm({
                  title: '',
                  description: '',
                  category: '',
                  difficulty: 'beginner',
                  duration: '',
                  price: 0,
                  credits: 0,
                  language: 'English'
                });
                setCourseDialog({ open: true, mode: 'add', course: null });
              }}
            >
              Add Course
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Enrollments</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.category}</TableCell>
                    <TableCell>
                      <Chip label={course.difficulty} size="small" />
                    </TableCell>
                    <TableCell>{course.enrollmentCount || 0}</TableCell>
                    <TableCell>{course.averageRating?.toFixed(1) || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={course.status}
                        color={course.status === 'active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => navigate(`/courses/${course._id}`)}>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEditCourseDialog(course)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCourse(course._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 2: Detailed Analytics */}
      {activeTab === 1 && analytics && (
        <Box>
          <Typography variant="h6" mb={2}>Detailed Analytics</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Top Performing Courses</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Course</TableCell>
                          <TableCell>Enrollments</TableCell>
                          <TableCell>Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.topCourses?.slice(0, 5).map((course, index) => (
                          <TableRow key={index}>
                            <TableCell>{course.title}</TableCell>
                            <TableCell>{course.enrollments}</TableCell>
                            <TableCell>{course.rating?.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Enrollment Trends</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Last 30 days: {analytics.recentEnrollments || 0} new enrollments
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completion rate: {analytics.completionRate?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average progress: {analytics.averageProgress?.toFixed(1) || 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 3: API Key Management */}
      {activeTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6">API Key Management</Typography>
            <Button
              variant="contained"
              startIcon={<KeyIcon />}
              onClick={() => setApiKeyDialog(true)}
            >
              Generate New Key
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key Name</TableCell>
                  <TableCell>API Key</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key._id}>
                    <TableCell>{key.name || 'Default'}</TableCell>
                    <TableCell>
                      <code>{key.key?.substring(0, 20)}...</code>
                    </TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={key.isActive ? 'Active' : 'Revoked'}
                        color={key.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {key.isActive && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRevokeApiKey(key._id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Course Dialog */}
      <Dialog open={courseDialog.open} onClose={() => setCourseDialog({ open: false, mode: 'add', course: null })} maxWidth="md" fullWidth>
        <DialogTitle>
          {courseDialog.mode === 'add' ? 'Add New Course' : 'Edit Course'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Course Title"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={courseForm.difficulty}
                    label="Difficulty"
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Duration (hours)"
                  type="number"
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  type="number"
                  value={courseForm.price}
                  onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Credits"
                  type="number"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialog({ open: false, mode: 'add', course: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={courseDialog.mode === 'add' ? handleCreateCourse : handleUpdateCourse}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : courseDialog.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)}>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            This will generate a new API key for accessing the partner API.
            Store it securely as you won't be able to see it again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerateApiKey} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PartnerPortal;
