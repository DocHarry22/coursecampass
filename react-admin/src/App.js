import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import { SnackbarProvider } from 'notistack';
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Courses from "./scenes/courses";
import APCalculator from './scenes/apcalculator/APCalculator';
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

function App() {

  const [ theme, colorMode ] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar />
          <main className="content">
            <Topbar />
            <SnackbarProvider maxSnack={3}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/apcalculator" element={<APCalculator />} />
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
            </SnackbarProvider>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
