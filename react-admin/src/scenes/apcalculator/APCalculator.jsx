// src/scenes/apcalculator/APCalculator.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import {
	Box,
	Typography,
	TextField,
	MenuItem,
	Button,
	IconButton,
	Autocomplete,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	useTheme,
	Card,
	CardContent,
	Divider,
	Stack,
	Paper,
	Tooltip,
} from '@mui/material';
import { tokens } from '../../theme';
import { useProfiles } from '../../context/ProfileContext';
import universities from '../../data/universities';
import { percentToGpa } from './gpaFormulas';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const subjects = [
  'Mathematics', 'Physical Sciences', 'Life Sciences', 'Geography', 'History',
  'Accounting', 'Business Studies', 'Economics', 'English Home Language', 'Afrikaans First Additional Language'
];

const blankSubject = { subject: '', examScore: '', grade: '' };

const APCalculator = () => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [subjectList, setSubjectList] = useState([{ ...blankSubject }]);
  const [university, setUniversity] = useState('wits');
  const [results, setResults] = useState(null);

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfile,
    createProfile,
    updateProfile,
    saveScenario,
    removeScenario,
    recordResult,
  } = useProfiles();

  const duplicateSubjects = (list) =>
    list.map((entry) => ({
      subject: entry.subject || '',
      examScore: entry.examScore ?? '',
      grade: entry.grade ?? entry.score ?? '',
    }));

  useEffect(() => {
    if (!activeProfile) return;
    const preferredUniversity = activeProfile?.preferences?.defaultUniversity || activeProfile.university || 'wits';
    setUniversity(preferredUniversity);
    const hasSubjects = activeProfile.subjects?.length
      ? duplicateSubjects(activeProfile.subjects)
      : [{ ...blankSubject }];
    setSubjectList(hasSubjects);
  }, [activeProfile]);

  useEffect(() => {
    setProfileNameInput(activeProfile?.name || '');
  }, [activeProfile]);

  const prioritizedUniversities = useMemo(() => {
    const preferred = activeProfile?.preferences?.preferredUniversities || [];
    if (!preferred.length) return universities;
    const preferredSet = new Set(preferred);
    return [...universities].sort((a, b) => {
      if (preferredSet.has(a.value) && !preferredSet.has(b.value)) return -1;
      if (preferredSet.has(b.value) && !preferredSet.has(a.value)) return 1;
      return 0;
    });
  }, [activeProfile]);

  const handleChange = (index, field, value) => {
    const updated = [...subjectList];
    updated[index][field] = value;
    setSubjectList(updated);
  };

  const handleAddSubject = () => {
    setSubjectList([...subjectList, { ...blankSubject }]);
  };

  const handleRemoveSubject = (index) => {
    const updated = subjectList.filter((_, i) => i !== index);
    setSubjectList(updated.length ? updated : [{ ...blankSubject }]);
  };

  const handleUniversityChange = (value) => {
    setUniversity(value);
    setResults(null); // prevent stale results from previous selection
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        university: value,
        preferences: { defaultUniversity: value },
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/calculate', {
        subjects: subjectList,
        university
      });
      setResults(response.data);
      if (activeProfile) {
        const snapshot = duplicateSubjects(subjectList);
        updateProfile(activeProfile.id, { subjects: snapshot, university });
        recordResult(activeProfile.id, {
          university,
          payload: response.data,
          subjects: snapshot,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error calculating APS:', error);
    }
  };

  const handlePersistProfile = () => {
    if (!activeProfile) {
      setProfileDialogOpen(true);
      return;
    }
    updateProfile(activeProfile.id, {
      name: activeProfile.name,
      subjects: duplicateSubjects(subjectList),
      university,
    });
  };

  const handleProfileCreate = () => {
    const name = profileNameInput.trim() || `Profile ${profiles.length + 1}`;
    const newProfile = createProfile({
      name,
      subjects: duplicateSubjects(subjectList),
      university,
      preferences: {
        defaultUniversity: university,
      },
    });
    setProfileDialogOpen(false);
    setProfileNameInput('');
    setActiveProfile(newProfile.id);
  };

  const handleScenarioSave = () => {
    if (!activeProfile) {
      setProfileDialogOpen(true);
      return;
    }
    const label = scenarioNameInput.trim() || `Scenario ${activeProfile.scenarios?.length + 1 || 1}`;
    saveScenario(activeProfile.id, {
      name: label,
      subjects: duplicateSubjects(subjectList),
      university,
    });
    setScenarioDialogOpen(false);
    setScenarioNameInput('');
  };

  const handleApplyScenario = (scenario) => {
    const nextSubjects = scenario.subjects?.length ? duplicateSubjects(scenario.subjects) : [{ ...blankSubject }];
    setSubjectList(nextSubjects);
    setUniversity(scenario.university || university);
  };

  const handleDeleteScenario = (scenarioId) => {
    if (!activeProfile) return;
    removeScenario(activeProfile.id, scenarioId);
  };

  const handleHistoryLoad = (entry) => {
    if (!entry?.subjectsSnapshot) return;
    const nextSubjects = entry.subjectsSnapshot.length ? duplicateSubjects(entry.subjectsSnapshot) : [{ ...blankSubject }];
    setSubjectList(nextSubjects);
    setUniversity(entry.university || university);
  };

  const isAllUniversities = university === 'all';
  const allResults = useMemo(() => {
    if (!isAllUniversities || !results || typeof results !== 'object') return null;
    const numericEntries = Object.entries(results).filter(
      ([, value]) => typeof value === 'number' && Number.isFinite(value)
    );
    return numericEntries.length ? Object.fromEntries(numericEntries) : null;
  }, [isAllUniversities, results]);

  const gpaSnapshot = useMemo(() => {
    const numericGrades = subjectList
      .map((subject) => Number(subject.grade))
      .filter((value) => Number.isFinite(value));
    if (!numericGrades.length) return null;
    const total = numericGrades.reduce((sum, current) => sum + current, 0);
    const average = total / numericGrades.length;
    return {
      average: Math.round(average * 100) / 100,
      gpa: Math.round(percentToGpa(average) * 100) / 100,
      count: numericGrades.length,
    };
  }, [subjectList]);

  const chartData = isAllUniversities && allResults ? {
    labels: Object.keys(allResults),
    datasets: [
      {
        label: 'APS Points by University',
        data: Object.values(allResults),
        backgroundColor: Object.keys(allResults).map(() => colors.blueAccent[500])
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

      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3} mb={4}>
        <Box display="flex" flexWrap="wrap" gap={2} flex={1}>
          <TextField
            select
            label="Active Profile"
            value={activeProfileId || ''}
            onChange={(e) => setActiveProfile(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {!activeProfileId && (
              <MenuItem value="" disabled>
                No profile selected
              </MenuItem>
            )}
            {profiles.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}>
                {profile.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={() => setProfileDialogOpen(true)}>
            New Profile
          </Button>
          <Tooltip title="Save the current subject list and university to the active profile">
            <span>
              <Button
                variant="text"
                onClick={handlePersistProfile}
                disabled={!activeProfile}
              >
                Save Setup
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="outlined"
            onClick={() => setScenarioDialogOpen(true)}
            disabled={!activeProfile}
          >
            Save What-if Scenario
          </Button>
        </Box>
        {gpaSnapshot && (
          <Card sx={{ minWidth: 260, backgroundColor: colors.primary[400] }}>
            <CardContent>
              <Typography variant="h6" color={colors.greenAccent[400]}>
                GPA Snapshot
              </Typography>
              <Typography variant="body2" color={colors.grey[200]}>
                Average Score: {gpaSnapshot.average}%
              </Typography>
              <Typography variant="body2" color={colors.grey[200]}>
                Estimated GPA: {gpaSnapshot.gpa}
              </Typography>
              <Typography variant="caption" color={colors.grey[400]}>
                Based on {gpaSnapshot.count} subjects
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <TextField
        select
        label="Select University Policy"
        value={university}
        onChange={(e) => handleUniversityChange(e.target.value)}
        helperText={
          activeProfile?.preferences?.preferredUniversities?.length
            ? 'Prioritized from your preferred universities list'
            : undefined
        }
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {prioritizedUniversities.map((uni) => (
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
              sx={{ width: '75%' }}
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
          {isAllUniversities ? (
            allResults ? (
              Object.entries(allResults).map(([uni, score]) => (
                <Typography key={uni} mt={2} color={colors.grey[100]}>
                  {uni.toUpperCase()} APS Score: {score}
                </Typography>
              ))
            ) : (
              <Typography mt={2} color={colors.grey[100]}>
                Select "Calculate APS" to view combined university scores.
              </Typography>
            )
          ) : (
            <Typography mt={2} color={colors.grey[100]}>
              {university.toUpperCase()} APS Score: {results.apsScore}
            </Typography>
          )}
        </Box>
      )}

      {activeProfile?.scenarios?.length ? (
        <Box mt={5}>
          <Typography variant="h6" color={colors.greenAccent[400]}>
            Saved What-if Scenarios
          </Typography>
          <Stack gap={2} mt={2}>
            {activeProfile.scenarios.map((scenario) => (
              <Paper
                key={scenario.id}
                sx={{
                  p: 2,
                  backgroundColor: colors.primary[400],
                  border: `1px solid ${colors.primary[300]}`,
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="subtitle1">{scenario.name}</Typography>
                    <Typography variant="caption" color={colors.grey[300]}>
                      {scenario.subjects.length} subjects • {scenario.university.toUpperCase()}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={1}>
                    <Button size="small" variant="outlined" onClick={() => handleApplyScenario(scenario)}>
                      Load
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteScenario(scenario.id)}>
                      Remove
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box mt={4}>
          <Typography variant="body2" color={colors.grey[300]}>
            Save a what-if scenario to compare APS/GPA outputs for different subject mixes.
          </Typography>
        </Box>
      )}

      <Box mt={5}>
        <Typography variant="h6" color={colors.greenAccent[400]}>
          Recent History
        </Typography>
        <Stack divider={<Divider flexItem />} gap={2} mt={2}>
          {activeProfile?.history?.length ? (
            activeProfile.history.map((entry) => {
              let apsDisplay = entry.payload;
              if (typeof entry.payload === 'object' && entry.payload !== null) {
                if (entry.mode === 'multi') {
                  apsDisplay = Object.entries(entry.payload)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' | ');
                } else {
                  apsDisplay = entry.payload.apsScore ?? '-';
                }
              }
              return (
                <Box
                  key={entry.id}
                  display="flex"
                  flexDirection={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box>
                    <Typography variant="subtitle2" color={colors.grey[100]}>
                      {new Date(entry.timestamp).toLocaleString()} — {entry.university?.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color={colors.grey[300]}>
                      APS: {apsDisplay}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => handleHistoryLoad(entry)}>
                    Load Snapshot
                  </Button>
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color={colors.grey[300]}>
              Run calculations to start building your APS/GPA timeline.
            </Typography>
          )}
        </Stack>
      </Box>

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

      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Save New Learner Profile</DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <TextField
            label="Profile Name"
            value={profileNameInput}
            onChange={(e) => setProfileNameInput(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProfileCreate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scenarioDialogOpen} onClose={() => setScenarioDialogOpen(false)}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Save What-if Scenario</DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <TextField
            label="Scenario Name"
            value={scenarioNameInput}
            onChange={(e) => setScenarioNameInput(e.target.value)}
            fullWidth
            helperText="Store this subject mix and rerun it anytime."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScenarioDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScenarioSave} variant="contained" disabled={!activeProfile}>
            Save Scenario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APCalculator;




