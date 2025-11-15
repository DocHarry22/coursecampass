import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'courseCompass::profiles';
const ACTIVE_PROFILE_KEY = 'courseCompass::activeProfile';
const USER_STORAGE_KEY = 'courseCompass::user';

const defaultPreferences = {
	preferredUniversities: ['wits'],
	defaultUniversity: 'wits',
	unitSystem: 'metric',
	themeLock: 'system',
};

const defaultUser = {
	id: 'guest',
	name: 'Guest Learner',
	email: '',
};

const ProfileContext = createContext(null);

const randomId = () => {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const buildProfile = (overrides = {}) => ({
	id: overrides.id || randomId(),
	name: overrides.name || 'Starter Profile',
	subjects: overrides.subjects || [],
	university: overrides.university || overrides.preferences?.defaultUniversity || 'wits',
	scenarios: overrides.scenarios || [],
	history: overrides.history || [],
	preferences: { ...defaultPreferences, ...(overrides.preferences || {}) },
	createdAt: overrides.createdAt || Date.now(),
	updatedAt: Date.now(),
});

const loadProfiles = () => {
	if (typeof window === 'undefined') return [buildProfile()];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return [buildProfile()];
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			return parsed.map((profile) => buildProfile(profile));
		}
		return [buildProfile()];
	} catch (error) {
		console.warn('Failed to parse saved profiles', error);
		return [buildProfile()];
	}
};

const loadActiveProfileId = (profiles) => {
	if (typeof window === 'undefined') return profiles[0]?.id;
	const stored = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
	if (stored && profiles.some((p) => p.id === stored)) {
		return stored;
	}
	return profiles[0]?.id;
};

const loadUser = () => {
	if (typeof window === 'undefined') return defaultUser;
	try {
		const raw = window.localStorage.getItem(USER_STORAGE_KEY);
		if (!raw) return defaultUser;
		const parsed = JSON.parse(raw);
		return { ...defaultUser, ...parsed };
	} catch (error) {
		console.warn('Failed to parse stored user', error);
		return defaultUser;
	}
};

export const ProfileProvider = ({ children, onThemePreferenceChange }) => {
	const initialProfilesRef = useRef(loadProfiles());
	const [profiles, setProfiles] = useState(initialProfilesRef.current);
	const [activeProfileId, setActiveProfileId] = useState(() =>
		loadActiveProfileId(initialProfilesRef.current)
	);
	const [user, setUser] = useState(loadUser);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
	}, [profiles]);

	useEffect(() => {
		if (typeof window === 'undefined' || !activeProfileId) return;
		window.localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
	}, [activeProfileId]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
	}, [user]);

	const activeProfile = useMemo(
		() => profiles.find((profile) => profile.id === activeProfileId) || profiles[0] || null,
		[profiles, activeProfileId]
	);

	useEffect(() => {
		if (typeof onThemePreferenceChange !== 'function' || !activeProfile) return;
		const pref = activeProfile.preferences?.themeLock;
		if (pref && pref !== 'system') {
			onThemePreferenceChange(pref);
		}
	}, [activeProfile, onThemePreferenceChange]);

	const setActiveProfile = (profileId) => {
		if (!profiles.some((profile) => profile.id === profileId)) return;
		setActiveProfileId(profileId);
	};

	const persistProfiles = (nextProfiles) => {
		setProfiles(nextProfiles);
	};

	const createProfile = ({ name, subjects, university, preferences } = {}) => {
		const newProfile = buildProfile({
			name: name || `Profile ${profiles.length + 1}`,
			subjects: subjects || [],
			university: university || preferences?.defaultUniversity || 'wits',
			preferences,
		});
		const nextProfiles = [...profiles, newProfile];
		persistProfiles(nextProfiles);
		setActiveProfileId(newProfile.id);
		return newProfile;
	};

	const deleteProfile = (profileId) => {
		const remaining = profiles.filter((profile) => profile.id !== profileId);
		if (remaining.length === 0) {
			const fallback = buildProfile({ name: 'New Profile' });
			persistProfiles([fallback]);
			setActiveProfileId(fallback.id);
			return;
		}
		persistProfiles(remaining);
		if (activeProfileId === profileId) {
			setActiveProfileId(remaining[0].id);
		}
	};

	const modifyProfile = (profileId, updater) => {
		persistProfiles(
			profiles.map((profile) => {
				if (profile.id !== profileId) return profile;
				const next = typeof updater === 'function' ? updater(profile) : updater;
				const merged = {
					...profile,
					...next,
					preferences: { ...profile.preferences, ...(next?.preferences || {}) },
					subjects: next?.subjects !== undefined ? next.subjects : profile.subjects,
					university: next?.university !== undefined ? next.university : profile.university,
					scenarios: next?.scenarios !== undefined ? next.scenarios : profile.scenarios,
					history: next?.history !== undefined ? next.history : profile.history,
					updatedAt: Date.now(),
				};
				return merged;
			})
		);
	};

	const updateProfile = (profileId, updates) => {
		modifyProfile(profileId, updates);
	};

	const saveScenario = (profileId, scenario) => {
		modifyProfile(profileId, (profile) => ({
			scenarios: [
				...profile.scenarios,
				{
					id: randomId(),
					name: scenario.name || `Scenario ${profile.scenarios.length + 1}`,
					subjects: scenario.subjects || profile.subjects,
					university: scenario.university || profile.university,
					createdAt: Date.now(),
				},
			],
		}));
	};

	const removeScenario = (profileId, scenarioId) => {
		modifyProfile(profileId, (profile) => ({
			scenarios: profile.scenarios.filter((scenario) => scenario.id !== scenarioId),
		}));
	};

	const recordResult = (profileId, record) => {
		modifyProfile(profileId, (profile) => {
			const entry = {
				id: randomId(),
				timestamp: record.timestamp || Date.now(),
				university: record.university,
				mode: record.university === 'all' ? 'multi' : 'single',
				payload: record.payload,
				subjectsSnapshot: record.subjects,
			};
			const history = [entry, ...profile.history];
			return {
				history: history.slice(0, 10),
			};
		});
	};

	const updateUser = (updates) => {
		setUser((prev) => ({ ...prev, ...updates }));
	};

	return (
		<ProfileContext.Provider
			value={{
				user,
				updateUser,
				profiles,
				activeProfileId,
				activeProfile,
				setActiveProfile,
				createProfile,
				deleteProfile,
				updateProfile,
				saveScenario,
				removeScenario,
				recordResult,
			}}
		>
			{children}
		</ProfileContext.Provider>
	);
};

export const useProfiles = () => {
	const context = useContext(ProfileContext);
	if (!context) {
		throw new Error('useProfiles must be used within a ProfileProvider');
	}
	return context;
};
