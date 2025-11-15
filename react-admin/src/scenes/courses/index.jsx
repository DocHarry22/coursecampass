import { Box, Typography, useTheme, Chip, Rating, Grid, FormControl, Select, MenuItem, InputLabel, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import Header from "../../components/Header";
import CourseFilters from "../../components/CourseFilters";
import CourseCard from "../../components/CourseCard";

const Courses = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('courseViewMode') || 'grid';
    });

    useEffect(() => {
        fetchCourses();
    }, [filters, sortBy]);

    useEffect(() => {
        localStorage.setItem('courseViewMode', viewMode);
    }, [viewMode]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('limit', '100');
            
            // Add filters
            if (filters.universities?.length > 0) {
                params.append('university', filters.universities.join(','));
            }
            if (filters.region) {
                params.append('region', filters.region);
            }
            if (filters.deliveryModes?.length > 0) {
                params.append('deliveryMode', filters.deliveryModes.join(','));
            }
            if (filters.categories?.length > 0) {
                params.append('category', filters.categories.join(','));
            }
            if (filters.pricingType) {
                params.append('pricingType', filters.pricingType);
            }
            if (filters.priceMin !== undefined) {
                params.append('priceMin', filters.priceMin);
            }
            if (filters.priceMax !== undefined) {
                params.append('priceMax', filters.priceMax);
            }
            if (filters.levels?.length > 0) {
                params.append('level', filters.levels.join(','));
            }
            if (filters.language) {
                params.append('language', filters.language);
            }
            if (filters.minRating) {
                params.append('minRating', filters.minRating);
            }
            
            // Add sorting
            const sortMapping = {
                'newest': '-createdAt',
                'oldest': 'createdAt',
                'price-low': 'pricing.amount',
                'price-high': '-pricing.amount',
                'rating': '-ratings.average',
                'popularity': '-stats.totalEnrollments',
                'start-date': 'schedule.startDate',
                'duration': 'duration.value',
                'title-az': 'title',
                'title-za': '-title'
            };
            params.append('sort', sortMapping[sortBy] || '-createdAt');
            
            const response = await fetch(`http://localhost:5000/api/courses?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                // Transform data for DataGrid and Grid view
                const formattedCourses = data.data.map(course => ({
                    id: course._id,
                    ...course, // Keep full course data for grid view
                    title: course.title,
                    university: course.university?.name || 'Unknown',
                    universityObj: course.university,
                    price: course.pricing?.type === 'free' ? 'Free' : 
                           `${course.pricing?.currency || 'USD'} ${course.pricing?.amount || 0}`,
                    priceRaw: course.pricing?.type === 'free' ? 0 : course.pricing?.amount || 0,
                    level: course.level,
                    deliveryMode: course.deliveryMode,
                    rating: course.ratings?.average || 0,
                    ratingCount: course.ratings?.count || 0,
                    duration: course.duration?.value ? 
                             `${course.duration.value} ${course.duration.unit}` : 'N/A',
                    startDate: course.schedule?.startDate ? 
                              new Date(course.schedule.startDate).toLocaleDateString() : 'N/A',
                    enrollmentStatus: course.enrollment?.status || 'open',
                    verificationStatus: course.verificationStatus
                }));
                setCourses(formattedCourses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const handleCourseClick = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    const columns = [
        {
            field: "title", 
            headerName: "Course Title", 
            flex: 2,
            cellClassName: "name-column--cell",
        },
        {
            field: "university",
            headerName: "University",
            flex: 1.5,
            renderCell: ({ row }) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <SchoolOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography>{row.university}</Typography>
                </Box>
            )
        },
        {
            field: "price",
            headerName: "Price",
            flex: 0.8,
            renderCell: ({ row }) => (
                <Chip 
                    label={row.price}
                    color={row.priceRaw === 0 ? "success" : "primary"}
                    variant="outlined"
                    size="small"
                />
            )
        },
        {
            field: "rating",
            headerName: "Rating",
            flex: 1,
            renderCell: ({ row }) => (
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Rating value={row.rating} readOnly size="small" precision={0.1} />
                    <Typography variant="body2" color="text.secondary">
                        ({row.ratingCount})
                    </Typography>
                </Box>
            )
        },
        {
            field: "level",
            headerName: "Level",
            flex: 1,
            renderCell: ({ row }) => {
                const levelColors = {
                    undergraduate: colors.blueAccent[600],
                    graduate: colors.greenAccent[600],
                    professional: colors.redAccent[600],
                    certificate: colors.primary[600],
                };
                return (
                    <Chip 
                        label={row.level}
                        sx={{ 
                            backgroundColor: levelColors[row.level] || colors.grey[600],
                            textTransform: 'capitalize'
                        }}
                        size="small"
                    />
                );
            }
        },
        {
            field: "deliveryMode",
            headerName: "Delivery",
            flex: 0.8,
            renderCell: ({ row }) => (
                <Box display="flex" alignItems="center" gap={0.5}>
                    {row.deliveryMode === 'online' && <ComputerOutlinedIcon sx={{ fontSize: 16 }} />}
                    {row.deliveryMode === 'in-person' && <PersonOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
                    <Typography variant="body2" textTransform="capitalize">
                        {row.deliveryMode}
                    </Typography>
                </Box>
            )
        },
        {
            field: "duration",
            headerName: "Duration",
            flex: 0.8,
        },
        {
            field: "startDate",
            headerName: "Start Date",
            flex: 1,
        },
        {
            field: "enrollmentStatus",
            headerName: "Status",
            flex: 0.8,
            renderCell: ({ row }) => {
                const statusColors = {
                    open: colors.greenAccent[600],
                    waitlist: colors.orangeAccent[600],
                    closed: colors.redAccent[600],
                    full: colors.redAccent[700],
                };
                return (
                    <Chip 
                        label={row.enrollmentStatus}
                        sx={{ 
                            backgroundColor: statusColors[row.enrollmentStatus] || colors.grey[600],
                            textTransform: 'capitalize'
                        }}
                        size="small"
                    />
                );
            }
        },
    ];

    return (
        <Box m="20px">
            <Header 
                title="COURSES" 
                subtitle="Browse and discover courses from top universities worldwide" 
            />
            
            <Grid container spacing={2} mt={2}>
                {/* Filters Sidebar */}
                <Grid item xs={12} md={3}>
                    <Box 
                        sx={{
                            backgroundColor: colors.primary[400],
                            p: 2,
                            borderRadius: 2,
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                    >
                        <CourseFilters onFilterChange={handleFilterChange} />
                    </Box>
                </Grid>

                {/* Courses Grid */}
                <Grid item xs={12} md={9}>
                    {/* Sort Controls */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            {courses.length} courses found
                        </Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            {/* View Mode Toggle */}
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={handleViewModeChange}
                                size="small"
                            >
                                <ToggleButton value="grid" aria-label="grid view">
                                    <ViewModuleIcon />
                                </ToggleButton>
                                <ToggleButton value="list" aria-label="list view">
                                    <ViewListIcon />
                                </ToggleButton>
                            </ToggleButtonGroup>

                            {/* Sort Dropdown */}
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Sort By</InputLabel>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    label="Sort By"
                                >
                                    <MenuItem value="newest">Newest First</MenuItem>
                                    <MenuItem value="oldest">Oldest First</MenuItem>
                                    <MenuItem value="price-low">Price: Low to High</MenuItem>
                                    <MenuItem value="price-high">Price: High to Low</MenuItem>
                                    <MenuItem value="rating">Highest Rated</MenuItem>
                                    <MenuItem value="popularity">Most Popular</MenuItem>
                                    <MenuItem value="start-date">Start Date</MenuItem>
                                    <MenuItem value="duration">Duration</MenuItem>
                                    <MenuItem value="title-az">Title: A-Z</MenuItem>
                                    <MenuItem value="title-za">Title: Z-A</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Grid or List View */}
                    {viewMode === 'grid' ? (
                        <Grid container spacing={3}>
                            {courses.map(course => (
                                <Grid item xs={12} sm={6} md={4} key={course.id}>
                                    <Box onClick={() => handleCourseClick(course.id)}>
                                        <CourseCard course={course} />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box 
                            height="70vh"
                            sx={{
                                "& .MuiDataGrid-root": {
                                    border: "none",
                                },
                                "& .MuiDataGrid-cell": {
                                    borderBottom: "none",
                                },
                                "& .name-column--cell": {
                                    color: colors.greenAccent[300],
                                },
                                "& .MuiDataGrid-columnHeaders": {
                                    backgroundColor: colors.blueAccent[700],
                                    borderBottom: "none",
                                },
                                "& .MuiDataGrid-virtualScroller": {
                                    backgroundColor: colors.primary[400],
                                },
                                "& .MuiDataGrid-footerContainer": {
                                    borderTop: "none",
                                    backgroundColor: colors.blueAccent[700],
                                },
                            }}
                        >
                            <DataGrid 
                                rows={courses}
                                columns={columns}
                                loading={loading}
                                pageSize={20}
                                rowsPerPageOptions={[10, 20, 50, 100]}
                                disableSelectionOnClick
                                onRowClick={(params) => handleCourseClick(params.id)}
                                sx={{ cursor: 'pointer' }}
                            />
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Courses;
