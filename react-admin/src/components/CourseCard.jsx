import {
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Typography,
    Box,
    Chip,
    Rating,
    IconButton,
    Tooltip,
    useTheme
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ShareIcon from "@mui/icons-material/Share";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ComputerIcon from "@mui/icons-material/Computer";
import { tokens } from "../theme";
import { useState } from "react";

const CourseCard = ({ course, onFavorite, onCompare, onShare }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited);
        if (onFavorite) onFavorite(course);
    };

    const handleCompareClick = () => {
        if (onCompare) onCompare(course);
    };

    const handleShareClick = () => {
        if (onShare) onShare(course);
    };

    const getPriceDisplay = () => {
        if (course.pricing?.type === 'free') return 'FREE';
        return `${course.pricing?.currency || 'USD'} ${course.pricing?.amount || 0}`;
    };

    const getDurationDisplay = () => {
        if (!course.duration?.value) return 'Self-paced';
        return `${course.duration.value} ${course.duration.unit}`;
    };

    const getStartDateDisplay = () => {
        if (!course.schedule?.startDate) return 'Flexible';
        return new Date(course.schedule.startDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Card
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: isHovered ? `0 8px 24px ${colors.primary[900]}` : 2,
                backgroundColor: colors.primary[400],
                cursor: 'pointer',
                '&:hover': {
                    '& .quick-actions': {
                        opacity: 1
                    }
                }
            }}
        >
            {/* Course Thumbnail */}
            <CardMedia
                component="img"
                height="180"
                image={course.media?.thumbnailUrl || 'https://via.placeholder.com/400x200?text=Course+Image'}
                alt={course.title}
                sx={{
                    objectFit: 'cover'
                }}
            />

            {/* Course Content */}
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* University */}
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <SchoolIcon sx={{ fontSize: 16, color: colors.blueAccent[400] }} />
                    <Typography variant="caption" color="text.secondary">
                        {course.university?.name || 'Unknown University'}
                    </Typography>
                </Box>

                {/* Title */}
                <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                        fontWeight: 600,
                        mb: 1,
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
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Rating
                        value={course.ratings?.average || 0}
                        precision={0.1}
                        size="small"
                        readOnly
                    />
                    <Typography variant="body2" color="text.secondary">
                        ({course.ratings?.count || 0})
                    </Typography>
                </Box>

                {/* Details Row 1 */}
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                    <Chip
                        icon={<AccessTimeIcon />}
                        label={getDurationDisplay()}
                        size="small"
                        variant="outlined"
                    />
                    <Chip
                        icon={<ComputerIcon />}
                        label={course.deliveryMode || 'Online'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>

                {/* Details Row 2 */}
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                    <Chip
                        label={course.level || 'All Levels'}
                        size="small"
                        sx={{
                            backgroundColor: colors.blueAccent[600],
                            textTransform: 'capitalize'
                        }}
                    />
                    <Chip
                        icon={<CalendarTodayIcon />}
                        label={getStartDateDisplay()}
                        size="small"
                        variant="outlined"
                    />
                </Box>

                {/* Price */}
                <Box mt={2}>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            fontWeight: 700,
                            color: course.pricing?.type === 'free' ? colors.greenAccent[400] : colors.blueAccent[400]
                        }}
                    >
                        {getPriceDisplay()}
                    </Typography>
                    {course.pricing?.originalAmount && course.pricing.originalAmount > course.pricing.amount && (
                        <Typography
                            variant="body2"
                            sx={{
                                textDecoration: 'line-through',
                                color: colors.grey[500]
                            }}
                        >
                            {course.pricing.currency} {course.pricing.originalAmount}
                        </Typography>
                    )}
                </Box>
            </CardContent>

            {/* Quick Actions */}
            <CardActions
                className="quick-actions"
                sx={{
                    justifyContent: 'space-between',
                    px: 2,
                    pb: 2,
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out'
                }}
            >
                <Box>
                    <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                        <IconButton
                            size="small"
                            onClick={handleFavoriteClick}
                            sx={{
                                color: isFavorited ? colors.redAccent[400] : colors.grey[400],
                                '&:hover': {
                                    color: colors.redAccent[400]
                                }
                            }}
                        >
                            {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Compare">
                        <IconButton
                            size="small"
                            onClick={handleCompareClick}
                            sx={{
                                color: colors.grey[400],
                                '&:hover': {
                                    color: colors.blueAccent[400]
                                }
                            }}
                        >
                            <CompareArrowsIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Share">
                        <IconButton
                            size="small"
                            onClick={handleShareClick}
                            sx={{
                                color: colors.grey[400],
                                '&:hover': {
                                    color: colors.greenAccent[400]
                                }
                            }}
                        >
                            <ShareIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Enrollment Status Badge */}
                {course.enrollment?.status && (
                    <Chip
                        label={course.enrollment.status}
                        size="small"
                        sx={{
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            backgroundColor:
                                course.enrollment.status === 'open' ? colors.greenAccent[600] :
                                course.enrollment.status === 'waitlist' ? colors.orangeAccent[600] :
                                colors.redAccent[600]
                        }}
                    />
                )}
            </CardActions>
        </Card>
    );
};

export default CourseCard;
