import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  LinearProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Flag as FlagIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ReviewSubmission from './ReviewSubmission';

const ReviewList = ({ courseId, courseName, onReviewUpdate }) => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/course/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleMenuOpen = (event, review) => {
    setAnchorEl(event.currentTarget);
    setSelectedReview(review);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleHelpful = async (reviewId, isHelpful) => {
    if (!token) {
      setError('Please login to vote');
      return;
    }

    try {
      const endpoint = isHelpful ? 'helpful' : 'not-helpful';
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews(); // Refresh reviews
      } else {
        setError(data.message || 'Failed to record vote');
      }
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to record vote');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${selectedReview._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchReviews();
        if (onReviewUpdate) onReviewUpdate();
        setDeleteDialogOpen(false);
      } else {
        setError(data.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review');
    }
    handleMenuClose();
  };

  const handleFlag = async (reason) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${selectedReview._id}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (data.success) {
        setFlagDialogOpen(false);
        setError('');
        // Show success message
        setTimeout(() => setError('Review flagged for moderation'), 100);
      } else {
        setError(data.message || 'Failed to flag review');
      }
    } catch (err) {
      console.error('Error flagging review:', err);
      setError('Failed to flag review');
    }
    handleMenuClose();
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {error && (
        <Alert severity={error.includes('success') || error.includes('flagged') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Review Statistics */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Rating value={stats.averageRating} precision={0.1} readOnly size="large" />
                <Typography variant="body2" color="text.secondary">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 250 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingDistribution[star] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ width: 40 }}>
                        {star} ★
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        sx={{ flex: 1, mx: 2, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" sx={{ width: 50, textAlign: 'right' }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Detailed Ratings */}
            {stats.detailedAverages && (
              <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {stats.detailedAverages.contentQuality > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Content Quality</Typography>
                    <Rating value={stats.detailedAverages.contentQuality} precision={0.1} readOnly size="small" />
                  </Box>
                )}
                {stats.detailedAverages.instructor > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Instructor</Typography>
                    <Rating value={stats.detailedAverages.instructor} precision={0.1} readOnly size="small" />
                  </Box>
                )}
                {stats.detailedAverages.difficulty > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Difficulty</Typography>
                    <Rating value={stats.detailedAverages.difficulty} precision={0.1} readOnly size="small" />
                  </Box>
                )}
                {stats.detailedAverages.valueForMoney > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Value for Money</Typography>
                    <Rating value={stats.detailedAverages.valueForMoney} precision={0.1} readOnly size="small" />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <Stack spacing={2}>
        {reviews.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No reviews yet. Be the first to review this course!
          </Typography>
        ) : (
          reviews.map((review) => (
            <Card key={review._id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar>
                      {review.user?.firstName?.[0] || 'U'}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {review.user?.firstName || 'Anonymous'} {review.user?.lastName || ''}
                        </Typography>
                        {review.verifiedPurchase && (
                          <Chip 
                            icon={<VerifiedIcon />} 
                            label="Verified Enrollment" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {user && (
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, review)}>
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="h6">{review.title}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {review.content}
                  </Typography>
                </Box>

                {review.wouldRecommend && (
                  <Chip label="Recommends this course" size="small" color="success" sx={{ mb: 2 }} />
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    size="small"
                    startIcon={review.helpful?.includes(user?._id) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                    onClick={() => handleHelpful(review._id, true)}
                    disabled={!token}
                  >
                    Helpful ({review.helpfulCount || 0})
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FlagIcon />}
                    onClick={() => { setSelectedReview(review); setFlagDialogOpen(true); }}
                    disabled={!token}
                  >
                    Report
                  </Button>
                </Box>

                {/* Instructor Response */}
                {review.instructorResponse && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Instructor Response
                    </Typography>
                    <Typography variant="body2">
                      {review.instructorResponse}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedReview?.user?._id === user?._id && (
          <MenuItem onClick={() => { setEditDialogOpen(true); handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" /> Edit Review
          </MenuItem>
        )}
        {selectedReview?.user?._id === user?._id && (
          <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Delete Review
          </MenuItem>
        )}
        <MenuItem onClick={() => { setFlagDialogOpen(true); handleMenuClose(); }}>
          <FlagIcon sx={{ mr: 1 }} fontSize="small" /> Flag for Moderation
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <ReviewSubmission
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        courseId={courseId}
        courseName={courseName}
        existingReview={selectedReview}
        onSubmitSuccess={() => {
          fetchReviews();
          if (onReviewUpdate) onReviewUpdate();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Review?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your review? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)}>
        <DialogTitle>Report Review</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Why are you reporting this review?
          </DialogContentText>
          <Stack spacing={1}>
            <Button onClick={() => handleFlag('spam')} variant="outlined" fullWidth>
              Spam or Fake
            </Button>
            <Button onClick={() => handleFlag('offensive')} variant="outlined" fullWidth>
              Offensive or Abusive
            </Button>
            <Button onClick={() => handleFlag('irrelevant')} variant="outlined" fullWidth>
              Irrelevant Content
            </Button>
            <Button onClick={() => handleFlag('inappropriate')} variant="outlined" fullWidth>
              Inappropriate
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewList;
