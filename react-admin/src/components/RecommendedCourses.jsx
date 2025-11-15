import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Rating,
  CircularProgress
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, School as SchoolIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RecommendedCourses = ({ title = "Recommended for You", endpoint = "/api/recommendations", limit = 6 }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`http://localhost:5000${endpoint}?limit=${limit}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [token, endpoint, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h4" fontWeight="600">
          {title}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {courses.map((item) => {
          const course = item.course || item;
          return (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                {course.thumbnail && (
                  <CardMedia
                    component="img"
                    height="160"
                    image={course.thumbnail}
                    alt={course.title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* University */}
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <SchoolIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {course.university?.name || 'Unknown University'}
                    </Typography>
                  </Box>

                  {/* Title */}
                  <Typography 
                    variant="h6" 
                    fontWeight="600" 
                    mb={1}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3em'
                    }}
                  >
                    {course.title}
                  </Typography>

                  {/* Rating */}
                  {course.ratings?.average > 0 && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <Rating value={course.ratings.average} precision={0.1} size="small" readOnly />
                      <Typography variant="caption" color="text.secondary">
                        ({course.ratings.count})
                      </Typography>
                    </Box>
                  )}

                  {/* Recommendation Reason */}
                  {item.reason && (
                    <Typography variant="caption" color="primary" mb={1} sx={{ fontStyle: 'italic' }}>
                      {item.reason}
                    </Typography>
                  )}

                  {/* Tags */}
                  <Box display="flex" gap={0.5} flexWrap="wrap" mb={2} mt="auto">
                    <Chip label={course.level} size="small" />
                    {course.pricing?.type === 'free' && (
                      <Chip label="FREE" size="small" color="success" />
                    )}
                    {course.language && (
                      <Chip label={course.language} size="small" variant="outlined" />
                    )}
                  </Box>

                  {/* Price */}
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {course.pricing?.type === 'free' 
                      ? 'FREE' 
                      : `${course.pricing?.currency || 'USD'} ${course.pricing?.amount || 0}`
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default RecommendedCourses;
