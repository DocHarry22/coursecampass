import { Box, IconButton, Tooltip, Typography, useTheme, Menu, MenuItem, Avatar } from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import { Link, useNavigate } from "react-router-dom";
import { useProfiles } from "../../context/ProfileContext";
import { useAuth } from "../../context/AuthContext";


const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const { activeProfile } = useProfiles();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box display="flex" justifyContent="space-between" p={2}>
            {/* SEARCH BAR */}
            <Box 
                display="flex" 
                backgroundColor={colors.primary[400]} 
                borderRadius="3px"
            >
                <InputBase sx={{ ml:2, flex: 1 }} placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {/* ICONS */}
            <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color={colors.grey[300]}>
                    {user?.firstName} {user?.lastName} • {activeProfile?.name || "No profile selected"}
                </Typography>
                <IconButton onClick={colorMode.toggleColorMode}>
                    {theme.palette.mode === 'dark' ? (
                        <DarkModeOutlinedIcon />
                    ) : ( 
                        <LightModeOutlinedIcon /> 
                    )}
                </IconButton>
                <IconButton>
                    < NotificationsOutlinedIcon />
                </IconButton>
                <IconButton>
                    < SettingsOutlinedIcon />
                </IconButton>
                <Tooltip title="Account">
                    <IconButton onClick={handleClick}>
                        {user?.avatar ? (
                            <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
                        ) : (
                            <PersonOutlinedIcon />
                        )}
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem component={Link} to="/profile" onClick={handleClose}>
                        <PersonOutlinedIcon sx={{ mr: 1 }} />
                        Profile Settings
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                        <LogoutIcon sx={{ mr: 1 }} />
                        Logout
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    )
                    }
export default Topbar;
