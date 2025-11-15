import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Chip,
  Button,
  Avatar,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tokens } from '../../theme';
import RecommendedCourses from '../../components/RecommendedCourses';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';


const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    completedEnrollments: 0,
    inProgressEnrollments: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
    completionRate: 0
  });
  const [enrollments, setEnrollments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrollment stats
        const statsRes = await fetch('http://localhost:5000/api/enrollments/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
        
        // Fetch recent enrollments
        const enrollmentsRes = await fetch('http://localhost:5000/api/enrollments?limit=6', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const enrollmentsData = await enrollmentsRes.json();
        if (enrollmentsData.success) {
          setEnrollments(enrollmentsData.data);
        }
        
        // Fetch favorites
        const favoritesRes = await fetch('http://localhost:5000/api/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const favoritesData = await favoritesRes.json();
        if (favoritesData.success) {
          setFavorites(favoritesData.data.slice(0, 6));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
        borderLeft: `4px solid ${color}`
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="700" color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary" mt={1}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );

  const CourseCard = ({ enrollment, isFavorite = false }) => {
    const course = isFavorite ? enrollment.course : enrollment.course;
    const progress = isFavorite ? 0 : enrollment.progress.percentage;
    
    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
      >
        <CardMedia
          component="img"
          height="140"
          image={course.thumbnail || '/assets/course-placeholder.jpg'}
          alt={course.title}
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/courses/${course._id}`)}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              cursor: 'pointer',
              '&:hover': { color: colors.primary[400] }
            }}
            onClick={() => navigate(`/courses/${course._id}`)}
          >
            {course.title}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" mb={1}>
            {course.university?.name}
          </Typography>
          
          {!isFavorite && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Progress</Typography>
                <Typography variant="body2" fontWeight="600">
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
          
          <Box display="flex" gap={1} flexWrap="wrap" mt="auto">
            <Chip 
              label={course.level} 
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={course.deliveryMode} 
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Box mt={2}>
            {isFavorite ? (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                View Course
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                Continue Learning
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box m="20px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box m="20px">
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h2" fontWeight="700" mb={1}>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="h5" color="textSecondary">
          Track your learning progress and continue where you left off
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Enrolled Courses"
            value={stats.totalEnrollments}
            icon={<SchoolIcon />}
            color={colors.blueAccent[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedEnrollments}
            icon={<EmojiEventsIcon />}
            color={colors.greenAccent[500]}
            subtitle={`${stats.completionRate}% completion rate`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats.inProgressEnrollments}
            icon={<TrendingUpIcon />}
            color={colors.redAccent[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Learning Hours"
            value={Math.round(stats.totalTimeSpent / 60)}
            icon={<TimerIcon />}
            color={colors.primary[500]}
            subtitle={`${stats.totalTimeSpent} minutes total`}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab 
            label="Continue Learning" 
            icon={<PlayArrowIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Favorites" 
            icon={<FavoriteIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Course Grid */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" fontWeight="600">
              Your Courses
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/courses')}
            >
              Browse All Courses
            </Button>
          </Box>
          
          {enrollments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 64, color: colors.grey[500], mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No courses enrolled yet
              </Typography>
              <Typography color="textSecondary" mb={3}>
                Start your learning journey by browsing our course catalog
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/courses')}
              >
                Explore Courses
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {enrollments.map((enrollment) => (
                <Grid item xs={12} sm={6} md={4} key={enrollment._id}>
                  <CourseCard enrollment={enrollment} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" fontWeight="600">
              Saved Courses
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/courses')}
            >
              Find More
            </Button>
          </Box>
          
          {favorites.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <FavoriteIcon sx={{ fontSize: 64, color: colors.grey[500], mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No favorite courses yet
              </Typography>
              <Typography color="textSecondary" mb={3}>
                Save courses you're interested in to access them quickly later
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/courses')}
              >
                Browse Courses
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {favorites.map((favorite) => (
                <Grid item xs={12} sm={6} md={4} key={favorite._id}>
                  <CourseCard enrollment={favorite} isFavorite={true} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Recommendations Section */}
      <Box mt={6}>
        <RecommendedCourses 
          title="Recommended for You" 
          endpoint="/api/recommendations"
          limit={6}
        />
      </Box>

      {/* Trending Courses */}
      <Box mt={4}>
        <RecommendedCourses 
          title="Trending Courses" 
          endpoint="/api/recommendations/trending"
          limit={6}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;