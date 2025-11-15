import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  useTheme
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tokens } from '../../theme';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Favorites = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState(['default']);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newCollectionDialog, setNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [editNoteDialog, setEditNoteDialog] = useState(false);
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await fetchFavorites();
      await fetchCollections();
    };
    if (token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFavorites(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/favorites/collections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCollections(['all', ...data.data]);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleRemoveFavorite = async (courseId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFavorites(favorites.filter(f => f.course._id !== courseId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleMoveToCollection = async (courseId, collection) => {
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ collection })
      });
      const data = await response.json();
      if (data.success) {
        fetchFavorites();
        fetchCollections();
      }
    } catch (error) {
      console.error('Error moving to collection:', error);
    }
    setAnchorEl(null);
  };

  const handleUpdateNote = async () => {
    if (!selectedFavorite) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/favorites/${selectedFavorite.course._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: editNote })
      });
      const data = await response.json();
      if (data.success) {
        fetchFavorites();
        setEditNoteDialog(false);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const filteredFavorites = selectedCollection === 'all' 
    ? favorites 
    : favorites.filter(f => f.collection === selectedCollection);

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h2" fontWeight="700" mb={1}>
            My Favorites
          </Typography>
          <Typography variant="h5" color="textSecondary">
            {filteredFavorites.length} saved courses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewCollectionDialog(true)}
        >
          New Collection
        </Button>
      </Box>

      {/* Collections Chips */}
      <Box mb={3} display="flex" gap={1} flexWrap="wrap">
        {collections.map(collection => (
          <Chip
            key={collection}
            label={collection === 'all' ? 'All' : collection}
            icon={<FolderIcon />}
            onClick={() => setSelectedCollection(collection)}
            color={selectedCollection === collection ? 'primary' : 'default'}
            variant={selectedCollection === collection ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Favorites Grid */}
      {loading ? (
        <Typography>Loading...</Typography>
      ) : filteredFavorites.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 64, color: colors.grey[500], mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No favorites yet
          </Typography>
          <Typography color="textSecondary" mb={3}>
            Start saving courses you're interested in
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/courses')}
          >
            Browse Courses
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredFavorites.map((favorite) => (
            <Grid item xs={12} sm={6} md={4} key={favorite._id}>
              <Card>
                <CardMedia
                  component="img"
                  height="180"
                  image={favorite.course.thumbnail || '/assets/course-placeholder.jpg'}
                  alt={favorite.course.title}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/courses/${favorite.course._id}`)}
                />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ 
                        cursor: 'pointer',
                        flex: 1,
                        '&:hover': { color: colors.primary[400] }
                      }}
                      onClick={() => navigate(`/courses/${favorite.course._id}`)}
                    >
                      {favorite.course.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedFavorite(favorite);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    {favorite.course.university?.name}
                  </Typography>
                  
                  <Chip 
                    label={favorite.collection} 
                    size="small" 
                    icon={<FolderIcon />}
                    sx={{ mb: 1 }}
                  />
                  
                  {favorite.notes && (
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      "{favorite.notes}"
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/courses/${favorite.course._id}`)}
                  >
                    View Course
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setEditNote(selectedFavorite?.notes || '');
          setEditNoteDialog(true);
          setAnchorEl(null);
        }}>
          <EditIcon sx={{ mr: 1 }} /> Edit Note
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedFavorite && collections.length > 0) {
            // Move to first collection as example - could show a submenu
            handleMoveToCollection(selectedFavorite.course._id, collections[0]);
          }
          setAnchorEl(null);
        }}>
          <FolderIcon sx={{ mr: 1 }} /> Move to Collection
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedFavorite) {
            handleRemoveFavorite(selectedFavorite.course._id);
          }
          setAnchorEl(null);
        }}>
          <DeleteIcon sx={{ mr: 1 }} /> Remove from Favorites
        </MenuItem>
        <MenuItem disabled>
          <ShareIcon sx={{ mr: 1 }} /> Share (Coming Soon)
        </MenuItem>
      </Menu>

      {/* New Collection Dialog */}
      <Dialog open={newCollectionDialog} onClose={() => setNewCollectionDialog(false)}>
        <DialogTitle>Create New Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCollectionDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (newCollectionName.trim()) {
                setCollections([...collections, newCollectionName]);
                setNewCollectionDialog(false);
                setNewCollectionName('');
              }
            }}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editNoteDialog} onClose={() => setEditNoteDialog(false)}>
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={3}
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNoteDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateNote} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Favorites;
