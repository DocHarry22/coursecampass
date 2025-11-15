import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Chip,
    Rating,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { tokens } from "../theme";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import DeleteIcon from "@mui/icons-material/Delete";

const CourseComparisonTool = ({ open, onClose, comparisonList, onRemove }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch details for all courses in comparison list
            const coursePromises = comparisonList.map(id =>
                fetch(`http://localhost:5000/api/courses/${id}`).then(res => res.json())
            );
            const results = await Promise.all(coursePromises);
            const validCourses = results
                .filter(r => r.success)
                .map(r => r.data);
            setCourses(validCourses);
        } catch (error) {
            console.error('Error fetching courses for comparison:', error);
        } finally {
            setLoading(false);
        }
    }, [comparisonList]);

    useEffect(() => {
        if (open && comparisonList.length > 0) {
            fetchCourses();
        }
    }, [open, comparisonList, fetchCourses]);

    const getPriceDisplay = (course) => {
        if (course.pricing?.type === 'free') return 'FREE';
        return `${course.pricing?.currency || 'USD'} ${course.pricing?.amount || 0}`;
    };

    const getDurationDisplay = (course) => {
        if (!course.duration?.value) return 'N/A';
        return `${course.duration.value} ${course.duration.unit}`;
    };

    const getStartDateDisplay = (course) => {
        if (!course.schedule?.startDate) return 'Flexible';
        return new Date(course.schedule.startDate).toLocaleDateString();
    };

    const comparisonRows = [
        {
            label: 'Course Title',
            getValue: (course) => course.title
        },
        {
            label: 'University',
            getValue: (course) => course.university?.name || 'Unknown'
        },
        {
            label: 'Price',
            getValue: (course) => getPriceDisplay(course),
            isHighlight: true
        },
        {
            label: 'Rating',
            getValue: (course) => (
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Rating value={course.ratings?.average || 0} readOnly size="small" precision={0.1} />
                    <Typography variant="body2">({course.ratings?.count || 0})</Typography>
                </Box>
            )
        },
        {
            label: 'Duration',
            getValue: (course) => getDurationDisplay(course)
        },
        {
            label: 'Level',
            getValue: (course) => (
                <Chip 
                    label={course.level} 
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                />
            )
        },
        {
            label: 'Delivery Mode',
            getValue: (course) => (
                <Chip 
                    label={course.deliveryMode} 
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                />
            )
        },
        {
            label: 'Start Date',
            getValue: (course) => getStartDateDisplay(course)
        },
        {
            label: 'Credits',
            getValue: (course) => course.credits || 'N/A'
        },
        {
            label: 'Prerequisites',
            getValue: (course) => course.prerequisites || 'None'
        },
        {
            label: 'Language',
            getValue: (course) => course.language || 'English'
        },
        {
            label: 'Certificate',
            getValue: (course) => course.certification?.type || 'None'
        },
        {
            label: 'Accredited',
            getValue: (course) => course.certification?.isAccredited ? 
                <Chip label="Yes" color="success" size="small" /> :
                <Chip label="No" size="small" />
        },
        {
            label: 'Enrollment Status',
            getValue: (course) => (
                <Chip 
                    label={course.enrollment?.status || 'Open'} 
                    size="small"
                    color={course.enrollment?.status === 'open' ? 'success' : 'warning'}
                    sx={{ textTransform: 'capitalize' }}
                />
            )
        }
    ];

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: colors.primary[400],
                    minHeight: '80vh'
                }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight="600">
                        Course Comparison ({courses.length} courses)
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Typography>Loading courses...</Typography>
                ) : courses.length === 0 ? (
                    <Typography>No courses to compare. Add courses to comparison list.</Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                                    <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Feature</TableCell>
                                    {courses.map((course, idx) => (
                                        <TableCell key={course._id} align="center" sx={{ minWidth: 200 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="600">
                                                    Course {idx + 1}
                                                </Typography>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => onRemove(course._id)}
                                                    sx={{ color: colors.redAccent[400] }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {comparisonRows.map((row, idx) => (
                                    <TableRow 
                                        key={idx}
                                        sx={{
                                            backgroundColor: row.isHighlight ? colors.blueAccent[800] : 'inherit',
                                            '&:nth-of-type(even)': {
                                                backgroundColor: colors.primary[500]
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {row.label}
                                        </TableCell>
                                        {courses.map(course => (
                                            <TableCell key={course._id} align="center">
                                                {row.getValue(course)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                                {/* Action Row */}
                                <TableRow sx={{ backgroundColor: colors.blueAccent[700] }}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        Actions
                                    </TableCell>
                                    {courses.map(course => (
                                        <TableCell key={course._id} align="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                endIcon={<LaunchIcon />}
                                                href={course.links?.courseUrl}
                                                target="_blank"
                                            >
                                                View Course
                                            </Button>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CourseComparisonTool;
