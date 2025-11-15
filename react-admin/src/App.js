import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider } from 'notistack';
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Courses from "./scenes/courses";
import CourseDetail from "./scenes/courses/CourseDetail";
import APCalculator from './scenes/apcalculator/APCalculator';
import ProfileSettings from "./scenes/profile/ProfileSettings";
import Favorites from "./scenes/favorites";
import EnrollmentProgress from "./scenes/enrollments";
import AdminDashboard from "./scenes/admin";
import PartnerPortal from "./scenes/partner";
import Analytics from "./scenes/analytics";
import PaymentHistory from "./scenes/payments";
import Certificates from "./scenes/certificates";
import Login from "./scenes/auth/Login";
import Register from "./scenes/auth/Register";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import Team from "./scenes/Team";
// import Invoices from "./scenes/invoices";
// import Contacts from "./scenes/contacts";
// import Bar from "./scenes/bar";
// import Form from "./scenes/form";
// import Line from "./scenes/line";
// import Pie from "./scenes/pie";
// import FAQ from "./scenes/faq";
// import Geography from "./scenes/geography";
// import Calendar from "./scenes/calendar";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {

  const [ theme, colorMode ] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ProfileProvider onThemePreferenceChange={colorMode.setColorMode}>
            <CssBaseline />
            <SnackbarProvider maxSnack={3}>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } 
                />
                
                {/* Protected Routes with Layout */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="app">
                        <Sidebar />
                        <main className="content">
                          <Topbar />
                          <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/courses" element={<Courses />} />
                            <Route path="/courses/:id" element={<CourseDetail />} />
                            <Route path="/apcalculator" element={<APCalculator />} />
                            <Route path="/profile" element={<ProfileSettings />} />
                            <Route path="/favorites" element={<Favorites />} />
                            <Route path="/enrollments" element={<EnrollmentProgress />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/partner" element={<PartnerPortal />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/payments" element={<PaymentHistory />} />
                            <Route path="/certificates" element={<Certificates />} />
                            {/* <Route path="/team" element={<Team />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/contacts" element={<Contacts />} />
                            <Route path="/bar" element={<Bar />} />
                            <Route path="/form" element={<Form />} />
                            <Route path="/line" element={<Line />} />
                            <Route path="/pie" element={<Pie />} />
                            <Route path="/faq" element={<FAQ />} />
                            <Route path="/geography" element={<Geography />} />
                            <Route path="/calender" element={<Calendar />} /> */}
                          </Routes>
                        </main>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SnackbarProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
