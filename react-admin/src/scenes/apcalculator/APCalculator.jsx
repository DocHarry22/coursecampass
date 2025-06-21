// src/scenes/apcalculator/APCalculator.jsx
import React, { useState } from 'react';
import { Box, Typography, TextField, MenuItem, Button, IconButton, Autocomplete, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, useTheme } from '@mui/material';
import { tokens } from '../../theme';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

const subjects = [
  'Mathematics', 'Physical Sciences', 'Life Sciences', 'Geography', 'History',
  'Accounting', 'Business Studies', 'Economics', 'English Home Language', 'Afrikaans First Additional Language'
];

const universities = [
  { label: 'All Universities', value: 'all' },
  { label: 'WITS', value: 'wits' },
  { label: 'University of Pretoria (UP)', value: 'up' },
  { label: 'University of Johannesburg (UJ)', value: 'uj' },
  { label: 'University of Cape Town (UCT)', value: 'uct' },
  { label: 'Stellenbosch University (SUN)', value: 'sun' }
];

const APCalculator = () => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [subjectList, setSubjectList] = useState([
    { subject: '', examScore: '', grade: '' }
  ]);

  const [university, setUniversity] = useState('wits');
  const [results, setResults] = useState(null);

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleChange = (index, field, value) => {
    const updated = [...subjectList];
    updated[index][field] = value;
    setSubjectList(updated);
  };

  const handleAddSubject = () => {
    setSubjectList([...subjectList, { subject: '', examScore: '', grade: '' }]);
  };

  const handleRemoveSubject = (index) => {
    const updated = subjectList.filter((_, i) => i !== index);
    setSubjectList(updated);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/calculate', {
        subjects: subjectList,
        university
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error calculating APS:', error);
    }
  };

  const chartData = university === 'all' && results ? {
    labels: Object.keys(results),
    datasets: [
      {
        label: 'APS Points by University',
        data: Object.values(results),
        backgroundColor: Object.keys(results).map(() => colors.blueAccent[500])
      }
    ]
  } : {
    labels: ['APS Score'],
    datasets: [
      {
        label: `APS Points (${university.toUpperCase()})`,
        data: results ? [results.apsScore] : [0],
        backgroundColor: [colors.blueAccent[500]]
      }
    ]
  };

  return (
    <Box m={4} sx={{ color: colors.grey[100] }}>
      <Typography variant="h4" gutterBottom color={colors.greenAccent[400]}>
        South African APS Calculator
      </Typography>

      <TextField
        select
        label="Select University Policy"
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {universities.map((uni) => (
          <MenuItem key={uni.value} value={uni.value}>{uni.label}</MenuItem>
        ))}
      </TextField>

      <Box display="flex" flexDirection="column" gap={4} maxWidth={800}>
        {subjectList.map((entry, index) => (
          <Box key={index} display="flex" gap={2} alignItems="center">
            <Autocomplete
              freeSolo
              options={subjects}
              value={entry.subject}
              onInputChange={(e, value) => handleChange(index, 'subject', value)}
              renderInput={(params) => (
                <TextField {...params} label="Subject" fullWidth />
              )}
            />

            <TextField
              label="Score (%)"
              name="grade"
              type="number"
              value={entry.grade}
              onChange={(e) => handleChange(index, 'grade', e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: '25%' }}
            />

            <IconButton onClick={() => handleRemoveSubject(index)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Button
          variant="outlined"
          onClick={handleAddSubject}
          sx={{
            borderColor: colors.greenAccent[400],
            color: colors.greenAccent[400],
            '&:hover': {
              borderColor: colors.greenAccent[300],
              backgroundColor: colors.greenAccent[800],
              color: colors.grey[100]
            }
          }}
        >
          Add Another Subject
        </Button>

        <Button
          variant="text"
          onClick={() => setRequestDialogOpen(true)}
          sx={{
            color: colors.blueAccent[300],
            '&:hover': { backgroundColor: 'transparent', color: colors.blueAccent[200] }
          }}
        >
          Request to Add a Subject
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            backgroundColor: colors.greenAccent[600],
            color: colors.grey[900],
            '&:hover': {
              backgroundColor: colors.greenAccent[500]
            }
          }}
        >
          Calculate APS
        </Button>
      </Box>

      {results && (
        <Box mt={5}>
          <Typography variant="h6" color={colors.grey[100]}>Results:</Typography>
          <Bar data={chartData} />
          {university === 'all' ? (
            Object.entries(results).map(([uni, score]) => (
              <Typography key={uni} mt={2} color={colors.grey[100]}>
                {uni.toUpperCase()} APS Score: {score}
              </Typography>
            ))
          ) : (
            <Typography mt={2} color={colors.grey[100]}>
              {university.toUpperCase()} APS Score: {results.apsScore}
            </Typography>
          )}
        </Box>
      )}

      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Request New Subject</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.grey[100] }}>
            If your subject is not listed, you may request it to be added by contacting the administrator or submitting feedback.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRequestDialogOpen(false)}
            sx={{
              backgroundColor: colors.blueAccent[500],
              color: colors.grey[100],
              '&:hover': {
                backgroundColor: colors.blueAccent[400]
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APCalculator;
