import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 2,
      }}
    >
      <Typography variant="h4" fontWeight="bold">
        SwiftPost
      </Typography>
      <Typography color="text.secondary" mb={5}>
        Welcome Home
      </Typography>

      <Button
        variant="contained"
        color="warning"
        size="large"
        sx={{ width: 260, mb: 2 }}
        onClick={() => navigate("/book")}
      >
        Book Token
      </Button>

      <Button
        variant="outlined"
        color="warning"
        size="large"
        sx={{ width: 260 }}
        onClick={() => navigate("/status")}
      >
        Check Token Status
      </Button>
    </Box>
  );
}
