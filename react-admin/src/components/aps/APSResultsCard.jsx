import React from 'react';
import { Card, CardContent, Typography, useTheme } from '@mui/material';
import { tokens } from '../../theme';
const APSResultsCard = ({ title, score }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Card sx={{ mt: 2, backgroundColor: colors.primary[400], color: colors.grey[100] }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: colors.greenAccent[400] }}>
          {title}
        </Typography>
        <Typography variant="body1">APS Score: {score}</Typography>
      </CardContent>
    </Card>
  );
};

export default APSResultsCard;
