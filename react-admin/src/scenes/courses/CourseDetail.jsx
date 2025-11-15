import {
    Box,
    Typography,
    Grid,
    Chip,
    Rating,
    Button,
    Divider,
    Tab,
    Tabs,
    Avatar,
    Card,
    CardContent,
    LinearProgress,
    Breadcrumbs,
    Link
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReviewList from "../../components/ReviewList";
import ReviewSubmission from "../../components/ReviewSubmission";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SchoolIcon from "@mui/icons-material/School";
import LanguageIcon from "@mui/icons-material/Language";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedIcon from "@mui/icons-material/Verified";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LaunchIcon from "@mui/icons-material/Launch";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

    const fetchRelatedCourses = useCallback(async (categoryId, currentCourseId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/courses?category=${categoryId}&limit=4`);
            const data = await response.json();
            
            if (data.success) {
                // Filter out current course
                const filtered = data.data.filter(c => c._id !== currentCourseId);
                setRelatedCourses(filtered.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching related courses:', error);
        }
    }, []);

    const fetchCourseDetail = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/courses/${id}`);
            const data = await response.json();
            
            if (data.success) {
                setCourse(data.data);
                // Fetch related courses based on category
                if (data.data.category) {
                    fetchRelatedCourses(data.data.category._id, data.data._id);
                }
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    }, [id, fetchRelatedCourses]);

    useEffect(() => {
        if (id) {
            fetchCourseDetail();
        }
    }, [id, fetchCourseDetail]);

    if (loading) {
        return <Box m="20px"><LinearProgress /></Box>;
    }

    if (!course) {
        return <Box m="20px"><Typography>Course not found</Typography></Box>;
    }

    const getPriceDisplay = () => {
        if (course.pricing?.type === 'free') return 'FREE';
        return `${course.pricing?.currency || 'USD'} ${course.pricing?.amount || 0}`;
    };

    return (
        <Box m="20px">
            {/* Breadcrumbs */}
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
                <Link underline="hover" color="inherit" onClick={() => navigate('/courses')} sx={{ cursor: 'pointer' }}>
                    Courses
                </Link>
                <Typography color="text.primary">{course.title}</Typography>
            </Breadcrumbs>

            <Grid container spacing={3}>
                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    {/* Course Header */}
                    <Box mb={3}>
                        <Typography variant="h2" fontWeight="700" mb={2}>
                            {course.title}
                        </Typography>
                        
                        <Typography variant="h6" color="text.secondary" mb={2}>
                            {course.shortDescription}
                        </Typography>

                        {/* Meta Info */}
                        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <SchoolIcon fontSize="small" />
                                <Typography>{course.university?.name}</Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <Rating value={course.ratings?.average || 0} precision={0.1} size="small" readOnly />
                                <Typography variant="body2">
                                    {course.ratings?.average?.toFixed(1)} ({course.ratings?.count} reviews)
                                </Typography>
                            </Box>

                            <Box display="flex" alignItems="center" gap={0.5}>
                                <PeopleIcon fontSize="small" />
                                <Typography variant="body2">
                                    {course.stats?.totalEnrollments || 0} enrolled
                                </Typography>
                            </Box>
                        </Box>

                        {/* Chips */}
                        <Box display="flex" gap={1} flexWrap="wrap">
                            <Chip label={course.level} sx={{ textTransform: 'capitalize' }} />
                            <Chip label={course.deliveryMode} sx={{ textTransform: 'capitalize' }} />
                            <Chip label={course.language} icon={<LanguageIcon />} />
                            {course.certification?.isAccredited && (
                                <Chip label="Accredited" icon={<VerifiedIcon />} color="success" />
                            )}
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                            <Tab label="Overview" />
                            <Tab label="Syllabus" />
                            <Tab label="Instructors" />
                            <Tab label="Reviews" />
                        </Tabs>
                    </Box>

                    {/* Tab Panels */}
                    <Box mt={3}>
                        {/* Overview Tab */}
                        {tabValue === 0 && (
                            <Box>
                                <Typography variant="h4" mb={2}>About This Course</Typography>
                                <Typography paragraph>
                                    {course.fullDescription || course.shortDescription}
                                </Typography>

                                {course.learningOutcomes?.length > 0 && (
                                    <>
                                        <Typography variant="h5" mt={3} mb={2}>What You'll Learn</Typography>
                                        <ul>
                                            {course.learningOutcomes.map((outcome, idx) => (
                                                <li key={idx}>
                                                    <Typography paragraph>{outcome}</Typography>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {course.prerequisites && (
                                    <>
                                        <Typography variant="h5" mt={3} mb={2}>Prerequisites</Typography>
                                        <Typography paragraph>{course.prerequisites}</Typography>
                                    </>
                                )}

                                {course.assessmentMethods?.length > 0 && (
                                    <>
                                        <Typography variant="h5" mt={3} mb={2}>Assessment Methods</Typography>
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            {course.assessmentMethods.map((method, idx) => (
                                                <Chip key={idx} label={method} />
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}

                        {/* Syllabus Tab */}
                        {tabValue === 1 && (
                            <Box>
                                <Typography variant="h4" mb={2}>Course Syllabus</Typography>
                                {course.syllabus ? (
                                    <Typography paragraph>{course.syllabus}</Typography>
                                ) : (
                                    <Typography color="text.secondary">
                                        Syllabus not available. Visit course website for details.
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Instructors Tab */}
                        {tabValue === 2 && (
                            <Box>
                                <Typography variant="h4" mb={2}>Instructors</Typography>
                                {course.instructors?.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {course.instructors.map((item, idx) => (
                                            <Grid item xs={12} sm={6} key={idx}>
                                                <Card>
                                                    <CardContent>
                                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                            <Avatar sx={{ width: 60, height: 60 }}>
                                                                {item.instructor?.firstName?.[0]}{item.instructor?.lastName?.[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="h6">
                                                                    {item.instructor?.firstName} {item.instructor?.lastName}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {item.role}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        {item.instructor?.bio && (
                                                            <Typography variant="body2">{item.instructor.bio}</Typography>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Typography color="text.secondary">No instructor information available.</Typography>
                                )}
                            </Box>
                        )}

                        {/* Reviews Tab */}
                        {tabValue === 3 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h4">Student Reviews</Typography>
                                    {token && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<RateReviewIcon />}
                                            onClick={() => setReviewDialogOpen(true)}
                                        >
                                            Write a Review
                                        </Button>
                                    )}
                                </Box>
                                <ReviewList 
                                    courseId={course._id} 
                                    courseName={course.title}
                                    onReviewUpdate={fetchCourseDetail}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Review Submission Dialog */}
                    <ReviewSubmission
                        open={reviewDialogOpen}
                        onClose={() => setReviewDialogOpen(false)}
                        courseId={course._id}
                        courseName={course.title}
                        onSubmitSuccess={fetchCourseDetail}
                    />

                    {/* Related Courses */}
                    {relatedCourses.length > 0 && (
                        <Box mt={5}>
                            <Typography variant="h4" mb={2}>Related Courses</Typography>
                            <Grid container spacing={2}>
                                {relatedCourses.map(related => (
                                    <Grid item xs={12} sm={4} key={related._id}>
                                        <Card 
                                            onClick={() => navigate(`/courses/${related._id}`)}
                                            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                                        >
                                            <CardContent>
                                                <Typography variant="h6" mb={1}>{related.title}</Typography>
                                                <Typography variant="body2" color="text.secondary" mb={1}>
                                                    {related.university?.name}
                                                </Typography>
                                                <Typography variant="h6" color="primary">
                                                    {related.pricing?.type === 'free' ? 'FREE' : 
                                                     `${related.pricing?.currency} ${related.pricing?.amount}`}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ position: 'sticky', top: 20 }}>
                        <CardContent>
                            {/* Course Image */}
                            <Box
                                component="img"
                                src={course.media?.thumbnailUrl || 'https://via.placeholder.com/400x200'}
                                alt={course.title}
                                sx={{ width: '100%', borderRadius: 2, mb: 2 }}
                            />

                            {/* Price */}
                            <Typography variant="h3" fontWeight="700" mb={2}>
                                {getPriceDisplay()}
                            </Typography>

                            {/* Enroll Button */}
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                endIcon={<LaunchIcon />}
                                sx={{ mb: 2 }}
                                href={course.links?.courseUrl}
                                target="_blank"
                            >
                                Visit Course
                            </Button>

                            {/* Action Buttons */}
                            <Grid container spacing={1} mb={3}>
                                <Grid item xs={6}>
                                    <Button variant="outlined" fullWidth startIcon={<FavoriteIcon />}>
                                        Save
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button variant="outlined" fullWidth startIcon={<ShareIcon />}>
                                        Share
                                    </Button>
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 2 }} />

                            {/* Course Details */}
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {course.duration?.value} {course.duration?.unit}
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Start Date</Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {course.schedule?.startDate ? 
                                         new Date(course.schedule.startDate).toLocaleDateString() : 'Flexible'}
                                    </Typography>
                                </Box>

                                {course.credits && (
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Credits</Typography>
                                        <Typography variant="body2" fontWeight="600">{course.credits}</Typography>
                                    </Box>
                                )}

                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Certificate</Typography>
                                    <Typography variant="body2" fontWeight="600">
                                        {course.certification?.type || 'None'}
                                    </Typography>
                                </Box>

                                {course.enrollment?.maxCapacity && (
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Availability</Typography>
                                        <Chip 
                                            label={course.enrollment.status} 
                                            size="small"
                                            color={course.enrollment.status === 'open' ? 'success' : 'warning'}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CourseDetail;
