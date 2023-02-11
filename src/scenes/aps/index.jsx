import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import InputAdornment from '@mui/material/InputAdornment';
// import { DataGrid } from "@mui/x-data-grid";


const initialValues = {
    mathematics: "",
    english: "",
    lifeOrientation: "",
    subject4: "",
    subject5: "",
    subject6: "",
    subject7: "",
}

const userSchema = yup.object().shape({
    mathematics: yup.number().integer().required("required"),
    english: yup.number().integer().required("required"),
    lifeOrientation: yup.number().integer().required("required"),
    subject4: yup.number().integer().required("required"),
    subject5: yup.number().integer().required("required"),
    subject6: yup.number().integer().required("required"),
    subject7: yup.number().integer().required("required"),
})



const APS = () => {
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [result, setResult] = useState(null);

    // const columns = [
    //     {
    //         field: "id", headerName: "ID",
    //     },
    //     {
    //         field: "subject", headerName: "Subjects"
    //     },
    //     {
    //         field: "values", headerName: "Mark %"
    //     },
    //     {
    //         field: "aps", headerName: "WITS APS"
    //     }
    // ];

    //   // Declare the values outside of the function
    // let mathValue, engValue, loValue, s4Value, s5Value, s6Value, s7Value;
    
    // const rows = [
    //     {
    //         id: 1,
    //         subject: "Mathematics",
    //         values: `${values.mathematics}%`,
    //         aps: {mathValue}
    //     },
    //     {
    //         id: 2,
    //         subject: "English",
    //         values: `${values.english}%`,
    //         aps: {engValue}
    //     },
    //     {
    //         id: 3,
    //         subject: "Life Orientation",
    //         values: `${values.lifeOrientation} %`,
    //         aps: {loValue}
    //     },
    //     {
    //         id: 4,
    //         subject: "Subject4",
    //         values: `${values.subject4}%`,
    //         aps: {s4Value}
    //     },
    //     {
    //         id: 5,
    //         subject: "Mathematics",
    //         values: `${values.subject5}%`,
    //         aps: {s5Value}
    //     },
    //     {
    //         id: 6,
    //         subject: "Subject7",
    //         values: `${values.subject7}%`,
    //         aps: {s6Value}
    //     },
    //     {
    //         id: 7,
    //         subject: "Subject7",
    //         values: `${values.subject7}%`,
    //         aps: {s7Value}
    //     },
    // ];

    // return (rows, columns);
    // return columns;

    const handleFormSubmit = (values) => {
        const { mathematics, english, lifeOrientation, subject4, subject5, subject6, subject7 } = values;
        const rangeMapMathEng = {
          '0-29': 0,
          '30-39': 0,
          '40-49': 3,
          '50-59': 4,
          '60-69': 5,
          '70-79': 6,
          '80-89': 7,
          '90-100': 8,
        };
        const rangeMapLO = {
          '0-29': 0,
          '30-39': 0,
          '40-49': 0,
          '50-59': 0,
          '60-69': 1,
          '70-79': 2,
          '80-89': 3,
          '90-100': 4,
        };
        const rangeMapOther = {
          '0-29': 0,
          '30-39': 0,
          '40-49': 3,
          '50-59': 4,
          '60-69': 5,
          '70-79': 6,
          '80-89': 7,
          '90-100': 8,
        };
      
        const checkRange = (value) => {
          if (value >= 0 && value <= 29) {
            return '0-29';
          } else if (value >= 30 && value <= 39) {
            return '30-39';
          } else if (value >= 40 && value <= 49) {
            return '40-49';
          } else if (value >= 50 && value <= 59) {
            return '50-59';
          } else if (value >= 60 && value <= 69) {
            return '60-69';
          } else if (value >= 70 && value <= 79) {
            return '70-79';
          } else if (value >= 80 && value <= 89) {
            return '80-89';
          } else {
            return '90-100';
          }
        };
      
        const mathValue = rangeMapMathEng[checkRange(parseInt(mathematics))];
        const engValue = rangeMapMathEng[checkRange(parseInt(english))];
        const loValue = rangeMapLO[checkRange(parseInt(lifeOrientation))];
        const s4Value = rangeMapOther[checkRange(parseInt(subject4))];
        const s5Value = rangeMapOther[checkRange(parseInt(subject5))];
        const s6Value = rangeMapOther[checkRange(parseInt(subject6))];
        const s7Value = rangeMapOther[checkRange(parseInt(subject7))];
      
        // const newRows = rows.map((row) => {
        //     switch (row.subject) {
        //       case 'Mathematics':
        //         return { ...row, values: `${mathematics}%`, aps: { mathValue } };
        //       case 'English':
        //         return { ...row, values: `${english}%`, aps: { engValue } };
        //       case 'Life Orientation':
        //         return { ...row, values: `${lifeOrientation}%`, aps: { loValue } };
        //       case 'Subject4':
        //         return { ...row, values: `${subject4}%`, aps: { s4Value } };
        //       case 'Subject5':
        //         return { ...row, values: `${subject5}%`, aps: { s5Value } };
        //       case 'Subject6':
        //         return { ...row, values: `${subject6}%`, aps: { s6Value } };
        //       case 'Subject7':
        //         return { ...row, values: `${subject7}%`, aps: { s7Value } };
        //       default:
        //         return row;
        //     }
        //   });

        // setRows(newRows);
        const total = mathValue + engValue + loValue + s4Value + s5Value + s6Value + s7Value;
        setResult(total)
        //console.log(`Your WITS APS score is ${total}`);
        

    };



        
      

    return (
        <Box m="20px">
            <Header title="ADMISSION POINT SCORE" subtitle="Calculate your APS score below"/>

            <Formik 
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={userSchema}
            >
                {({values, errors, touched, handleBlur, handleChange, handleSubmit}) => (
                    <form onSubmit={handleSubmit}>
                        <Box 
                            display="grid" 
                            gap="30px" 
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                "& > div": { gridColumn: isNonMobile ? undefined : "span 4"}
                            }}    
                        >
                            <TextField 
                                fullWidth
                                variant="outlined"
                                type="text"
                                label="Mathematics"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.mathematics}
                                name="mathematics"
                                helperText={touched.mathematics && errors.mathematics}
                                error={!!touched.mathematics && !!errors.mathematics}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="English"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.english}
                                name="english"
                                error={!!touched.english && !!errors.english}
                                helperText={touched.english && errors.english}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Life Orientation"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.lifeOrientation}
                                name="lifeOrientation"
                                error={!!touched.lifeOrientation && !!errors.lifeOrientation}
                                helperText={touched.lifeOrientation && errors.lifeOrientation}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Subject4"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.subject4}
                                name="subject4"
                                error={!!touched.subject4 && !!errors.subject4}
                                helperText={touched.subject4 && errors.subject4}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Subject5"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.subject5}
                                name="subject5"
                                error={!!touched.subject5 && !!errors.subject5}
                                helperText={touched.subject5 && errors.subject5}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Subject6"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.subject6}
                                name="subject6"
                                error={!!touched.subject6 && !!errors.subject6}
                                helperText={touched.subject6 && errors.subject6}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                            <TextField 
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Subject7"
                                onBlue={handleBlur}
                                onChange={handleChange}
                                value={values.subject7}
                                name="subject7"
                                error={!!touched.subject7 && !!errors.subject7}
                                helperText={touched.subject7 && errors.subject7}
                                sx={{ gridColumn: "span 2"}}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                        </Box>
                        <Box display="flex" justifyContent="center" mt="20px">
                            <Button type="submit" color="secondary" variant="contained">
                                Calculate
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
            <Box display="flex" justifyContent="center" m="20px">
                {
                    result && 
                    <Typography variant="h3" color="secondary">Your APS score is {result}</Typography>
                    // <DataGrid
                    //     rows={rows}
                    //     columns={columns}
                    //     pageSize={10}
                    //     rowsPerPageOptions={[10]}
                    //     checkboxSelection
                    //     disableSelectionOnClick
                    //     experimentalFeatures={{ newEditingApi: true }}
                    // />
                }
            </Box>
        </Box>
    )
}

export default APS;