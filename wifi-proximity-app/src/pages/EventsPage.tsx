import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";

export function EventsPage() {
  const events = [
    { code: "DEMO123", name: "Demo Event 1" },
    { code: "DEMO456", name: "Demo Event 2" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom align="center">
          Events
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {events.map((event) => (
            <Box key={event.code} sx={{ flex: "1 1 300px", maxWidth: 400 }}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6">{event.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Code: {event.code}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={Link}
                    to={`/events/${event.code}`}
                  >
                    View Contacts
                  </Button>
                  <Button
                    size="small"
                    component={Link}
                    to={`/nearby/${event.code}`}
                  >
                    Find Nearby
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
