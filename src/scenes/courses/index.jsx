import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataCoursesUni } from "../../data/mockDataCourse";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import Header from "../../components/Header";
import RangeSlider from "../../components/RangeSlider"

const Courses = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const columns = [
        {
            field: "id", 
            headerName: "ID"
        }, 
        { 
            field: "course", 
            headerName: "Course", 
            flex: 1, 
            cellClassName: "name-column--cell",
        },
        { 
            field: "school", 
            headerName: "School/Faculty", 
            flex: 1, 
        },
        {
            field: "aps", 
            headerName: "APS", 
            type: "number", 
            headerAlign: "left", 
            align: "left",
        },
        {
            field: "qualification",
            headerName: "Qualification Level",
            flex: 1,
        },
        {
            field: "tuitionCost",
            headerName: "Tution Cost",
            flex: 1,
        },
        {
            field: "industry",
            headerName: "Field",
            flex: 1,
        },
        {
            field: "aboutCourse",
            headerName: "About Course",
            flex: 1,
        },
        {
            field: "applyLink",
            headerName: "Apply",
            flex: 1,
            renderCell: ({ row: {applyLink}}) => {
                return (
                    <Box 
                        width="60%"
                        m="0 auto"
                        p="5px"
                        display="flex"
                        justifyContent="center"
                        backgroundColor={
                            colors.greenAccent[700]
                        }
                        borderRadius="4px"
                    >
                        {<LockOpenOutlinedIcon />}
                        <a href={applyLink}>

                            <Typography color={colors.blueAccent[800]} sx={{ml: "5px"}} >
                                Apply
                            </Typography>
                        </a>
                    </Box>
                )
            }
        },
    ]


    return (
        <Box m="20px">
            <Header title="Courses" subtitle="Search for the courses you're interested in..." />
            <Box display="flex" justifyContent="center" maxWidth="75vw">
                <Typography gutterBottom variant="h5" >APS Slider to filter Courses</Typography>
                <RangeSlider />
            </Box>
            <Box 
                m="40px 0 0 0" 
                height="75vh"
                sx={{
                    "& .MuiDataGrid-root": {
                        border: "none",
                    },
                    "& .MuiDataGrid-cell": {
                        borderBottom: "none",
                    },
                    "& .name-column-cell": {
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
                    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                        color: `${colors.grey[100]} !important`,
                    }
                }}
                >
                <DataGrid 
                    rows={mockDataCoursesUni}
                    columns={columns}
                    components={{ Toolbar: GridToolbar }}
                    checkboxSelection
                />

            </Box>
        
        
        </Box>
    );
};

export default Courses;
