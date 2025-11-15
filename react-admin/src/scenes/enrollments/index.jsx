import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Note as NoteIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EnrollmentProgress = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const fetchEnrollments = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/enrollments?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/enrollments/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchEnrollments();
    fetchStats();
  }, [fetchEnrollments, fetchStats]);

  const addNote = async () => {
    if (!selectedEnrollment || !newNote.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/enrollments/${selectedEnrollment._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote })
      });

      const data = await response.json();
      if (data.success) {
        fetchEnrollments();
        setNewNote('');
        setNoteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const markAsCompleted = async (enrollmentId) => {
    try {
      await fetch(`http://localhost:5000/api/enrollments/${enrollmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      fetchEnrollments();
      fetchStats();
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'enrolled': return 'info';
      case 'paused': return 'warning';
      case 'dropped': return 'error';
      default: return 'default';
    }
  };

  const filterEnrollments = (status) => {
    if (status === 'all') return enrollments;
    return enrollments.filter(e => e.status === status);
  };

  const getTabEnrollments = () => {
    switch (tabValue) {
      case 0: return filterEnrollments('all');
      case 1: return filterEnrollments('in-progress');
      case 2: return filterEnrollments('completed');
      default: return enrollments;
    }
  };

  if (loading) {
    return <Box m="20px"><LinearProgress /></Box>;
  }

  return (
    <Box m="20px">
      <Typography variant="h2" fontWeight="700" mb={3}>
        My Learning Progress
      </Typography>

      {/* Statistics Overview */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalEnrollments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Courses
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <TrendingUpIcon />
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
                    <Typography variant="h4" fontWeight="bold">
                      {stats.completedEnrollments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircleIcon />
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
                    <Typography variant="h4" fontWeight="bold">
                      {stats.inProgressEnrollments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <ScheduleIcon />
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
                    <Typography variant="h4" fontWeight="bold">
                      {Math.round(stats.totalTimeSpent / 60)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <CalendarIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${enrollments.length})`} />
          <Tab label={`In Progress (${filterEnrollments('in-progress').length})`} />
          <Tab label={`Completed (${filterEnrollments('completed').length})`} />
        </Tabs>
      </Box>

      {/* Enrollment Cards */}
      <Grid container spacing={3}>
        {getTabEnrollments().length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h5" color="text.secondary" mb={2}>
                  No enrollments found
                </Typography>
                <Button variant="contained" onClick={() => navigate('/courses')}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          getTabEnrollments().map((enrollment) => (
            <Grid item xs={12} md={6} key={enrollment._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography 
                        variant="h5" 
                        fontWeight="600" 
                        mb={1}
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => navigate(`/courses/${enrollment.course._id}`)}
                      >
                        {enrollment.course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {enrollment.course.university?.name}
                      </Typography>
                      <Chip 
                        label={enrollment.status.replace('-', ' ')} 
                        color={getStatusColor(enrollment.status)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Progress Bar */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {enrollment.progress?.percentage || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={enrollment.progress?.percentage || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Enrolled
                      </Typography>
                      <Typography variant="body2">
                        {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Time Spent
                      </Typography>
                      <Typography variant="body2">
                        {Math.round((enrollment.timeSpent?.total || 0) / 60)}h {(enrollment.timeSpent?.total || 0) % 60}m
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Notes Preview */}
                  {enrollment.notes && enrollment.notes.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Latest Note:
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {enrollment.notes[enrollment.notes.length - 1].content}
                      </Typography>
                    </Box>
                  )}

                  {/* Actions */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        setSelectedEnrollment(enrollment);
                        setNoteDialogOpen(true);
                      }}
                      startIcon={<NoteIcon />}
                    >
                      Add Note
                    </Button>
                    {enrollment.status !== 'completed' && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        color="success"
                        onClick={() => markAsCompleted(enrollment._id)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {enrollment.status === 'completed' && enrollment.certificate && (
                      <Button 
                        size="small" 
                        variant="contained"
                        startIcon={<DownloadIcon />}
                      >
                        Certificate
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {selectedEnrollment?.course.title}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            autoFocus
          />
          {selectedEnrollment?.notes && selectedEnrollment.notes.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" mb={1}>Previous Notes:</Typography>
              <List dense>
                {selectedEnrollment.notes.slice(-3).reverse().map((note, idx) => (
                  <ListItem key={idx} sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 1 }}>
                    <ListItemText 
                      primary={note.content}
                      secondary={new Date(note.createdAt).toLocaleDateString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={addNote} variant="contained" disabled={!newNote.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnrollmentProgress;
