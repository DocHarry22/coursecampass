const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('CourseCompass backend running...');
});

// Link APS calculator route
const calculateRoute = require('./routes/apcalculator');
app.use('/api/calculate', calculateRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
