import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ReviewSubmission = ({ open, onClose, courseId, courseName, onSubmitSuccess, existingReview }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    content: existingReview?.content || '',
    contentQuality: existingReview?.detailedRatings?.contentQuality || 0,
    instructorRating: existingReview?.detailedRatings?.instructor || 0,
    difficulty: existingReview?.detailedRatings?.difficulty || 0,
    valueForMoney: existingReview?.detailedRatings?.valueForMoney || 0,
    wouldRecommend: existingReview?.wouldRecommend || false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (formData.rating === 0) {
      setError('Please provide an overall rating');
      setLoading(false);
      return;
    }
    if (!formData.title.trim()) {
      setError('Please provide a review title');
      setLoading(false);
      return;
    }
    if (!formData.content.trim() || formData.content.trim().length < 20) {
      setError('Review content must be at least 20 characters');
      setLoading(false);
      return;
    }

    try {
      const url = existingReview 
        ? `http://localhost:5000/api/reviews/${existingReview._id}`
        : 'http://localhost:5000/api/reviews';
      
      const method = existingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course: courseId,
          rating: formData.rating,
          title: formData.title,
          content: formData.content,
          detailedRatings: {
            contentQuality: formData.contentQuality,
            instructor: formData.instructorRating,
            difficulty: formData.difficulty,
            valueForMoney: formData.valueForMoney
          },
          wouldRecommend: formData.wouldRecommend
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSubmitSuccess) onSubmitSuccess();
          onClose();
          // Reset form
          setFormData({
            rating: 0,
            title: '',
            content: '',
            contentQuality: 0,
            instructorRating: 0,
            difficulty: 0,
            valueForMoney: 0,
            wouldRecommend: false
          });
        }, 1500);
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {courseName}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Review {existingReview ? 'updated' : 'submitted'} successfully!
            </Alert>
          )}

          {/* Overall Rating */}
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              Overall Rating *
            </Typography>
            <Rating
              name="rating"
              value={formData.rating}
              onChange={(e, newValue) => setFormData({ ...formData, rating: newValue })}
              size="large"
              precision={0.5}
            />
          </Box>

          {/* Review Title */}
          <TextField
            fullWidth
            label="Review Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Summarize your experience"
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 100 }}
            helperText={`${formData.title.length}/100 characters`}
          />

          {/* Review Content */}
          <TextField
            fullWidth
            label="Your Review *"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Share your thoughts about this course. What did you like? What could be improved?"
            multiline
            rows={6}
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 2000 }}
            helperText={`${formData.content.length}/2000 characters (minimum 20)`}
          />

          {/* Detailed Ratings */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Detailed Ratings (Optional)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 0.5 }}>
              Content Quality
            </Typography>
            <Rating
              value={formData.contentQuality}
              onChange={(e, newValue) => setFormData({ ...formData, contentQuality: newValue })}
              precision={0.5}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 0.5 }}>
              Instructor
            </Typography>
            <Rating
              value={formData.instructorRating}
              onChange={(e, newValue) => setFormData({ ...formData, instructorRating: newValue })}
              precision={0.5}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 0.5 }}>
              Difficulty Level (1 = Very Easy, 5 = Very Hard)
            </Typography>
            <Rating
              value={formData.difficulty}
              onChange={(e, newValue) => setFormData({ ...formData, difficulty: newValue })}
              precision={0.5}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography component="legend" variant="body2" sx={{ mb: 0.5 }}>
              Value for Money
            </Typography>
            <Rating
              value={formData.valueForMoney}
              onChange={(e, newValue) => setFormData({ ...formData, valueForMoney: newValue })}
              precision={0.5}
            />
          </Box>

          {/* Would Recommend */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.wouldRecommend}
                onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.checked })}
              />
            }
            label="I would recommend this course to others"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReviewSubmission;
