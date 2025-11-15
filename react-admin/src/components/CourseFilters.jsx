import { 
    Box, 
    Accordion, 
    AccordionSummary, 
    AccordionDetails,
    Typography,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Slider,
    TextField,
    Autocomplete,
    Radio,
    RadioGroup,
    Rating,
    Button,
    Chip,
    Divider,
    useTheme
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { tokens } from "../../theme";
import { useState, useEffect } from "react";

const CourseFilters = ({ onFilterChange }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Filter states
    const [universities, setUniversities] = useState([]);
    const [selectedUniversities, setSelectedUniversities] = useState([]);
    
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    
    const [deliveryModes, setDeliveryModes] = useState({
        online: false,
        'in-person': false,
        hybrid: false,
        blended: false
    });

    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [pricingType, setPricingType] = useState('all');

    const [durationRange, setDurationRange] = useState([0, 52]); // weeks

    const [levels, setLevels] = useState({
        undergraduate: false,
        graduate: false,
        professional: false,
        certificate: false,
        'short-course': false,
        bootcamp: false
    });

    const [languages, setLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');

    const [minRating, setMinRating] = useState(0);

    const [startDateFrom, setStartDateFrom] = useState('');
    const [startDateTo, setStartDateTo] = useState('');

    // Fetch filter options
    useEffect(() => {
        fetchUniversities();
        fetchRegions();
        fetchCategories();
        fetchLanguages();
    }, []);

    const fetchUniversities = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/universities');
            const data = await response.json();
            if (data.success) {
                setUniversities(data.data.map(u => ({ id: u._id, label: u.name })));
            }
        } catch (error) {
            console.error('Error fetching universities:', error);
        }
    };

    const fetchRegions = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/regions');
            const data = await response.json();
            if (data.success) {
                setRegions(data.data);
            }
        } catch (error) {
            console.error('Error fetching regions:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchLanguages = async () => {
        // Common languages - could be fetched from API
        setLanguages([
            'English', 'Spanish', 'French', 'German', 'Chinese', 
            'Japanese', 'Portuguese', 'Arabic', 'Russian', 'Italian'
        ]);
    };

    // Build filter object and notify parent
    useEffect(() => {
        const filters = {
            universities: selectedUniversities.map(u => u.id),
            region: selectedRegion,
            deliveryModes: Object.keys(deliveryModes).filter(k => deliveryModes[k]),
            categories: selectedCategories.map(c => c._id),
            priceMin: priceRange[0],
            priceMax: priceRange[1],
            pricingType: pricingType !== 'all' ? pricingType : undefined,
            durationMin: durationRange[0],
            durationMax: durationRange[1],
            levels: Object.keys(levels).filter(k => levels[k]),
            language: selectedLanguage,
            minRating,
            startDateFrom,
            startDateTo
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === '' || 
                filters[key] === undefined || 
                filters[key] === 0 ||
                (Array.isArray(filters[key]) && filters[key].length === 0)) {
                delete filters[key];
            }
        });

        onFilterChange(filters);
    }, [
        selectedUniversities, selectedRegion, deliveryModes, selectedCategories,
        priceRange, pricingType, durationRange, levels, selectedLanguage,
        minRating, startDateFrom, startDateTo
    ]);

    const handleClearFilters = () => {
        setSelectedUniversities([]);
        setSelectedRegion('');
        setDeliveryModes({ online: false, 'in-person': false, hybrid: false, blended: false });
        setSelectedCategories([]);
        setPriceRange([0, 10000]);
        setPricingType('all');
        setDurationRange([0, 52]);
        setLevels({ undergraduate: false, graduate: false, professional: false, certificate: false, 'short-course': false, bootcamp: false });
        setSelectedLanguage('');
        setMinRating(0);
        setStartDateFrom('');
        setStartDateTo('');
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                    <FilterListIcon />
                    <Typography variant="h5" fontWeight="600">Filters</Typography>
                </Box>
                <Button 
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    size="small"
                    sx={{ color: colors.redAccent[400] }}
                >
                    Clear All
                </Button>
            </Box>

            {/* Universities */}
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Universities</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Autocomplete
                        multiple
                        options={universities}
                        value={selectedUniversities}
                        onChange={(e, newValue) => setSelectedUniversities(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} variant="outlined" placeholder="Select universities" />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip 
                                    label={option.label} 
                                    {...getTagProps({ index })} 
                                    size="small"
                                />
                            ))
                        }
                    />
                </AccordionDetails>
            </Accordion>

            {/* Region */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Region</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControl fullWidth>
                        <RadioGroup
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                            <FormControlLabel value="" control={<Radio />} label="All Regions" />
                            {regions.map(region => (
                                <FormControlLabel 
                                    key={region._id} 
                                    value={region._id} 
                                    control={<Radio />} 
                                    label={region.name}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </AccordionDetails>
            </Accordion>

            {/* Delivery Mode */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Delivery Mode</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormGroup>
                        {Object.keys(deliveryModes).map(mode => (
                            <FormControlLabel
                                key={mode}
                                control={
                                    <Checkbox
                                        checked={deliveryModes[mode]}
                                        onChange={(e) => setDeliveryModes({
                                            ...deliveryModes,
                                            [mode]: e.target.checked
                                        })}
                                    />
                                }
                                label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                            />
                        ))}
                    </FormGroup>
                </AccordionDetails>
            </Accordion>

            {/* Field of Study */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Field of Study</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Autocomplete
                        multiple
                        options={categories}
                        getOptionLabel={(option) => option.name}
                        value={selectedCategories}
                        onChange={(e, newValue) => setSelectedCategories(newValue)}
                        renderInput={(params) => (
                            <TextField {...params} variant="outlined" placeholder="Select fields" />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip 
                                    label={option.name} 
                                    {...getTagProps({ index })} 
                                    size="small"
                                />
                            ))
                        }
                    />
                </AccordionDetails>
            </Accordion>

            {/* Price Range */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Price</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControl fullWidth>
                        <RadioGroup
                            value={pricingType}
                            onChange={(e) => setPricingType(e.target.value)}
                        >
                            <FormControlLabel value="all" control={<Radio />} label="All" />
                            <FormControlLabel value="free" control={<Radio />} label="Free Only" />
                            <FormControlLabel value="paid" control={<Radio />} label="Paid Only" />
                        </RadioGroup>
                        
                        {pricingType !== 'free' && (
                            <>
                                <Typography variant="body2" mt={2} mb={1}>
                                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                                </Typography>
                                <Slider
                                    value={priceRange}
                                    onChange={(e, newValue) => setPriceRange(newValue)}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={10000}
                                    step={100}
                                />
                            </>
                        )}
                    </FormControl>
                </AccordionDetails>
            </Accordion>

            {/* Duration */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Duration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body2" mb={1}>
                        Duration: {durationRange[0]} - {durationRange[1]} weeks
                    </Typography>
                    <Slider
                        value={durationRange}
                        onChange={(e, newValue) => setDurationRange(newValue)}
                        valueLabelDisplay="auto"
                        min={0}
                        max={52}
                        step={1}
                    />
                </AccordionDetails>
            </Accordion>

            {/* Level */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Level</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormGroup>
                        {Object.keys(levels).map(level => (
                            <FormControlLabel
                                key={level}
                                control={
                                    <Checkbox
                                        checked={levels[level]}
                                        onChange={(e) => setLevels({
                                            ...levels,
                                            [level]: e.target.checked
                                        })}
                                    />
                                }
                                label={level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            />
                        ))}
                    </FormGroup>
                </AccordionDetails>
            </Accordion>

            {/* Language */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Language</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Autocomplete
                        options={languages}
                        value={selectedLanguage}
                        onChange={(e, newValue) => setSelectedLanguage(newValue || '')}
                        renderInput={(params) => (
                            <TextField {...params} variant="outlined" placeholder="Select language" />
                        )}
                    />
                </AccordionDetails>
            </Accordion>

            {/* Rating */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Minimum Rating</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Rating
                            value={minRating}
                            onChange={(e, newValue) => setMinRating(newValue || 0)}
                            precision={0.5}
                        />
                        <Typography variant="body2">& Up</Typography>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Start Date */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Start Date</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="From"
                            type="date"
                            value={startDateFrom}
                            onChange={(e) => setStartDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="To"
                            type="date"
                            value={startDateTo}
                            onChange={(e) => setStartDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default CourseFilters;
