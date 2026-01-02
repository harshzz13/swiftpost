import {
  Box,
  Button,
  Card,
  Typography,
  Grid,
} from "@mui/material";
import { useState } from "react";

export default function Staff() {
  const [queue, setQueue] = useState([
    { number: "A-172", service: "Parcel Drop-off" },
    { number: "A-173", service: "Banking" },
    { number: "B-045", service: "General Inquiry" },
    { number: "A-174", service: "Parcel Drop-off" },
  ]);

  const [current, setCurrent] = useState(null);

  const nextToken = () => {
    if (queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        p: 4,
      }}
    >
      {/* HEADER CARD */}
      <Card
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          textAlign: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          maxWidth: 500,
          width: "100%",
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          SwiftPost
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Staff Interface
        </Typography>

        <Button
          variant="contained"
          color="warning"
          size="large"
          sx={{ px: 6, py: 1.5 }}
          onClick={nextToken}
          disabled={current !== null}
        >
          Next Token
        </Button>
      </Card>

      <Grid container spacing={3} sx={{ maxWidth: 500, width: "100%" }}>
        {/* CURRENT TOKEN CARD */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Current Token
            </Typography>
            {current ? (
              <>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {current.number}
                </Typography>
                <Typography color="text.secondary">
                  {current.service}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => setCurrent(null)}
                >
                  Complete
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">No token serving</Typography>
            )}
          </Card>
        </Grid>

        {/* UPCOMING TOKENS CARD */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Upcoming
            </Typography>
            {queue.length > 0 ? (
              queue.map((token) => (
                <Typography key={token.number} sx={{ mb: 1 }}>
                  <strong>{token.number}</strong> ({token.service})
                </Typography>
              ))
            ) : (
              <Typography color="text.secondary">No upcoming tokens</Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


