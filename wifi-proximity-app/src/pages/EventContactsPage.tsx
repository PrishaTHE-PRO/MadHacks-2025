import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
} from "@mui/material";

export function EventContactsPage() {
  const { eventCode } = useParams<{ eventCode: string }>();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 8,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>
            Event Contacts
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Event Code: {eventCode}
          </Typography>
          <Typography variant="body2">
            People you&apos;ve met at this event will appear here.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
