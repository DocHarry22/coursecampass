import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString()}.csv`;
        a.click();
      } else if (format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString()}.pdf`;
        a.click();
      }
    } catch (err) {
      setError('Failed to export data');
    }
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
          Analytics & Reporting
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => exportData('csv')}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {analytics && (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="textSecondary">Total Users</Typography>
                      <Typography variant="h4">{analytics.overview?.totalUsers || 0}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{analytics.overview?.newUsers || 0} new
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="textSecondary">Total Courses</Typography>
                      <Typography variant="h4">{analytics.overview?.totalCourses || 0}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{analytics.overview?.newCourses || 0} new
                      </Typography>
                    </Box>
                    <SchoolIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="textSecondary">Enrollments</Typography>
                      <Typography variant="h4">{analytics.overview?.totalEnrollments || 0}</Typography>
                      <Typography variant="caption" color="success.main">
                        +{analytics.overview?.newEnrollments || 0} new
                      </Typography>
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
                      <Typography variant="h6" color="textSecondary">Completion Rate</Typography>
                      <Typography variant="h4">
                        {analytics.overview?.completionRate?.toFixed(1) || 0}%
                      </Typography>
                      <Typography variant="caption" color="info.main">
                        {analytics.overview?.completedEnrollments || 0} completed
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} mb={3}>
            {/* User Growth Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Growth</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Enrollment Trends Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Enrollment Trends</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.enrollmentTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Enrollments" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Categories Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Popular Categories</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.topCategories || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Courses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* User Role Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Roles</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.roleDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ _id, count }) => `${_id}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analytics.roleDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Courses Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Performing Courses</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course Title</TableCell>
                      <TableCell align="right">Enrollments</TableCell>
                      <TableCell align="right">Completion Rate</TableCell>
                      <TableCell align="right">Avg Rating</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analytics.topCourses || []).slice(0, 10).map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>{course.courseDetails?.title || 'N/A'}</TableCell>
                        <TableCell align="right">{course.enrollments}</TableCell>
                        <TableCell align="right">
                          {course.courseDetails?.completionRate?.toFixed(1) || 0}%
                        </TableCell>
                        <TableCell align="right">
                          {course.courseDetails?.averageRating?.toFixed(1) || 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          ${((course.enrollments || 0) * (course.courseDetails?.price || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* User Behavior Insights */}
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Engagement Metrics</Typography>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Active Users (30d): <strong>{analytics.overview?.activeUsers || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Session Duration: <strong>{analytics.behavior?.avgSessionDuration || 'N/A'}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Pages/Session: <strong>{analytics.behavior?.avgPagesPerSession || 'N/A'}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Course Metrics</Typography>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Avg Course Rating: <strong>{analytics.overview?.avgRating?.toFixed(2) || 'N/A'}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Reviews: <strong>{analytics.overview?.totalReviews || 0}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Completion Time: <strong>{analytics.courseMetrics?.avgCompletionTime || 'N/A'}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Revenue Insights</Typography>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Revenue: <strong>${analytics.revenue?.total?.toFixed(2) || '0.00'}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Revenue/User: <strong>${analytics.revenue?.perUser?.toFixed(2) || '0.00'}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Course Price: <strong>${analytics.revenue?.avgCoursePrice?.toFixed(2) || '0.00'}</strong>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Analytics;
