import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
} from "@mui/material";

export default function Admin() {
  const stats = [
    { label: "Total Tokens Today", value: "1,245" },
    { label: "Tokens In Queue", value: "85" },
    { label: "Average Wait Time", value: "14 min" },
  ];

  const counters = [
    { id: 1, status: "Active" },
    { id: 2, status: "Active" },
    { id: 3, status: "Active" },
    { id: 4, status: "Active" },
    { id: 5, status: "Inactive" },
    { id: 6, status: "Inactive" },
    { id: 7, status: "Inactive" },
  ];

  const activeCount = counters.filter(c => c.status === "Active").length;
  const inactiveCount = counters.length - activeCount;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: 4 }}>
      {/* HEADER */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          SwiftPost
        </Typography>
        <Typography color="text.secondary">
          Admin Dashboard
        </Typography>
      </Box>

      {/* TOP METRICS */}
      <Grid container spacing={3} mb={4}>
        {stats.map((item, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              }}
            >
              <Typography color="text.secondary">
                {item.label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color="warning.main"
              >
                {item.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* LOWER SECTION */}
      <Grid container spacing={3}>
        {/* COUNTER OVERVIEW */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <Typography fontWeight="bold" mb={1}>
              Counter Overview
            </Typography>

            <Typography color="text.secondary">
              Active Counters: {activeCount}
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Inactive Counters: {inactiveCount}
            </Typography>

            {counters.map(counter => (
              <Box
                key={counter.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor:
                      counter.status === "Active"
                        ? "green"
                        : "grey",
                    mr: 1,
                  }}
                />
                <Typography variant="body2">
                  Counter {counter.id} ({counter.status})
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        {/* MANAGE COUNTERS */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <Typography fontWeight="bold" mb={2}>
              Manage Counters
            </Typography>

            <Button
              variant="contained"
              color="warning"
              fullWidth
              sx={{ mb: 2 }}
            >
              + Add New Counter
            </Button>

            <Button variant="outlined" fullWidth>
              View All / Edit
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={2}
            >
              Last updated: 5 minutes ago
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


