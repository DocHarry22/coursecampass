import { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Chip,
	Divider,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	useTheme,
} from '@mui/material';
import { tokens } from '../../theme';
import universities from '../../data/universities';
import { useProfiles } from '../../context/ProfileContext';

const ProfileSettings = () => {
	const theme = useTheme();
	const colors = tokens(theme.palette.mode);
	const {
		user,
		updateUser,
		profiles,
		activeProfile,
		activeProfileId,
		setActiveProfile,
		createProfile,
		deleteProfile,
		updateProfile,
	} = useProfiles();

	const [userName, setUserName] = useState(user.name);
	const [userEmail, setUserEmail] = useState(user.email);
	const [profileName, setProfileName] = useState(activeProfile?.name || '');
	const [preferredUniversities, setPreferredUniversities] = useState(
		activeProfile?.preferences?.preferredUniversities || ['wits']
	);
	const [themeLock, setThemeLock] = useState(activeProfile?.preferences?.themeLock || 'system');
	const [unitSystem, setUnitSystem] = useState(activeProfile?.preferences?.unitSystem || 'metric');

	useEffect(() => {
		setUserName(user.name);
		setUserEmail(user.email);
	}, [user]);

	useEffect(() => {
		setProfileName(activeProfile?.name || '');
		setPreferredUniversities(activeProfile?.preferences?.preferredUniversities || ['wits']);
		setThemeLock(activeProfile?.preferences?.themeLock || 'system');
		setUnitSystem(activeProfile?.preferences?.unitSystem || 'metric');
	}, [activeProfile]);

	const prioritizedUniversities = useMemo(() => {
		const priority = new Set(preferredUniversities);
		return [...universities].sort((a, b) => {
			if (priority.has(a.value) && !priority.has(b.value)) return -1;
			if (priority.has(b.value) && !priority.has(a.value)) return 1;
			return 0;
		});
	}, [preferredUniversities]);

	const handleUserSave = () => {
		updateUser({ name: userName, email: userEmail });
	};

	const handleProfileSave = () => {
		if (!profileName?.trim()) return;
		if (!activeProfile) {
			createProfile({
				name: profileName.trim(),
				preferences: {
					preferredUniversities,
					themeLock,
					unitSystem,
					defaultUniversity: preferredUniversities[0] || 'wits',
				},
			});
			return;
		}

		updateProfile(activeProfile.id, {
			name: profileName.trim(),
			preferences: {
				preferredUniversities,
				themeLock,
				unitSystem,
				defaultUniversity: preferredUniversities[0] || activeProfile.preferences?.defaultUniversity,
			},
		});
	};

	const handleCreateProfile = () => {
		const newProfile = createProfile({
			name: `Profile ${profiles.length + 1}`,
			preferences: {
				preferredUniversities,
				themeLock,
				unitSystem,
				defaultUniversity: preferredUniversities[0] || 'wits',
			},
		});
		setProfileName(newProfile.name);
	};

	const handleDeleteProfile = () => {
		if (!activeProfile) return;
		deleteProfile(activeProfile.id);
	};

	return (
		<Box m={4} sx={{ color: colors.grey[100] }}>
			<Typography variant="h4" gutterBottom color={colors.greenAccent[400]}>
				Learner Profile & Preferences
			</Typography>
			<Typography variant="body1" color={colors.grey[300]} mb={3}>
				Manage your saved profiles, preferred universities, and personalization settings that power the APS/GPA
				tools.
			</Typography>

			<Grid container spacing={4}>
				<Grid item xs={12} md={6}>
					<Box
						p={3}
						borderRadius={2}
						bgcolor={colors.primary[400]}
						display="flex"
						flexDirection="column"
						gap={2}
					>
						<Typography variant="h5" color={colors.blueAccent[200]}>
							Account
						</Typography>
						<TextField
							label="Display Name"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							fullWidth
						/>
						<TextField
							label="Email (optional)"
							value={userEmail}
							onChange={(e) => setUserEmail(e.target.value)}
							fullWidth
							type="email"
						/>
						<Button variant="contained" onClick={handleUserSave}>
							Save Account Details
						</Button>
					</Box>
				</Grid>
				<Grid item xs={12} md={6}>
					<Box
						p={3}
						borderRadius={2}
						bgcolor={colors.primary[400]}
						display="flex"
						flexDirection="column"
						gap={2}
					>
						<Typography variant="h5" color={colors.blueAccent[200]}>
							Active Profile
						</Typography>
						<FormControl fullWidth>
							<InputLabel id="profile-select-label">Switch Profile</InputLabel>
							<Select
								labelId="profile-select-label"
								label="Switch Profile"
								value={activeProfileId || ''}
								onChange={(e) => setActiveProfile(e.target.value)}
							>
								{profiles.map((profile) => (
									<MenuItem key={profile.id} value={profile.id}>
										{profile.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<TextField
							label="Profile Name"
							value={profileName}
							onChange={(e) => setProfileName(e.target.value)}
							fullWidth
						/>

						<FormControl fullWidth>
							<InputLabel id="preferred-unis-label">Preferred Universities</InputLabel>
							<Select
								labelId="preferred-unis-label"
								multiple
								label="Preferred Universities"
								value={preferredUniversities}
								onChange={(e) =>
									setPreferredUniversities(
										typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
									)
								}
								renderValue={(selected) => (
									<Stack direction="row" gap={1} flexWrap="wrap">
										{selected.map((value) => (
											<Chip key={value} label={value.toUpperCase()} size="small" />
										))}
									</Stack>
								)}
							>
								{universities
									.filter((uni) => uni.value !== 'all')
									.map((uni) => (
										<MenuItem key={uni.value} value={uni.value}>
											{uni.label}
										</MenuItem>
									))}
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel id="unit-system-label">Unit System</InputLabel>
							<Select
								labelId="unit-system-label"
								label="Unit System"
								value={unitSystem}
								onChange={(e) => setUnitSystem(e.target.value)}
							>
								<MenuItem value="metric">Metric (%, kg)</MenuItem>
								<MenuItem value="imperial">Imperial (A-F, lbs)</MenuItem>
							</Select>
						</FormControl>

						<Box>
							<Typography variant="subtitle2" mb={1}>
								Theme Lock
							</Typography>
							<ToggleButtonGroup
								fullWidth
								color="primary"
								value={themeLock}
								exclusive
								onChange={(_, value) => value && setThemeLock(value)}
							>
								<ToggleButton value="system">System</ToggleButton>
								<ToggleButton value="light">Light</ToggleButton>
								<ToggleButton value="dark">Dark</ToggleButton>
							</ToggleButtonGroup>
						</Box>

						<Stack direction="row" gap={2} flexWrap="wrap">
							<Button variant="outlined" onClick={handleCreateProfile}>
								New Profile
							</Button>
							<Button variant="contained" onClick={handleProfileSave}>
								Save Profile Preferences
							</Button>
							<Button variant="text" color="error" onClick={handleDeleteProfile}>
								Delete Profile
							</Button>
						</Stack>
					</Box>
				</Grid>
			</Grid>

			<Box mt={4} display="flex" gap={4} flexDirection={{ xs: 'column', lg: 'row' }}>
				<Box flex={1} p={3} borderRadius={2} bgcolor={colors.primary[400]}>
					<Typography variant="h5" color={colors.blueAccent[200]} mb={2}>
						Preferred University Order
					</Typography>
					<Typography variant="body2" color={colors.grey[300]} mb={2}>
						The APS calculator prioritizes this order when suggesting universities for your saved profiles.
					</Typography>
					<Stack gap={1}>
						{prioritizedUniversities.map((uni) => (
							<Box
								key={uni.value}
								display="flex"
								justifyContent="space-between"
								alignItems="center"
								border={`1px solid ${colors.primary[300]}`}
								borderRadius={1}
								px={2}
								py={1}
							>
								<Typography color={colors.grey[100]}>{uni.label}</Typography>
								{preferredUniversities.includes(uni.value) && (
									<Chip label="Preferred" color="success" size="small" />
								)}
							</Box>
						))}
					</Stack>
				</Box>
				<Box flex={1} p={3} borderRadius={2} bgcolor={colors.primary[400]}>
					<Typography variant="h5" color={colors.blueAccent[200]} mb={2}>
						Recent APS & GPA History
					</Typography>
					<Typography variant="body2" color={colors.grey[300]} mb={2}>
						Switch profiles to view unique timelines. Each run keeps the last 10 attempts for quick review.
					</Typography>
					<Stack divider={<Divider flexItem />} gap={2}>
						{activeProfile?.history?.length ? (
							activeProfile.history.map((entry) => (
								<Box key={entry.id} display="flex" flexDirection="column">
									<Typography variant="subtitle2" color={colors.greenAccent[400]}>
										{new Date(entry.timestamp).toLocaleString()} —{' '}
										{entry.university?.toUpperCase()}
									</Typography>
									<Typography variant="body2" color={colors.grey[200]}>
										APS:{' '}
										{typeof entry.payload === 'object'
											? entry.payload.apsScore ?? JSON.stringify(entry.payload)
											: entry.payload}
									</Typography>
								</Box>
							))
						) : (
							<Typography variant="body2" color={colors.grey[300]}>
								Run your first calculation to see the history timeline.
							</Typography>
						)}
					</Stack>
				</Box>
			</Box>
		</Box>
	);
};

export default ProfileSettings;
