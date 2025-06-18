const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CourseCompass backend running...');
});

// in backend/server.js or index.js
const calculateRoute = require('./routes/apcalculator');
app.use('/api', calculateRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
