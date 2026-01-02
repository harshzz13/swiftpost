
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TokenStatus() {
  const navigate = useNavigate();

  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(null);

  const checkStatus = () => {
    // mock response
    setToken({
      number: tokenInput,
      service: "Parcel Drop-off",
      waiting: 3,
      time: "9 mins",
      status: "Waiting",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Check Token Status
      </Typography>

      {!token && (
        <Box sx={{ width: 280 }}>
          <TextField
            label="Enter Token Number"
            fullWidth
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />

          <Button
            fullWidth
            variant="contained"
            color="warning"
            sx={{ mt: 3 }}
            disabled={!tokenInput}
            onClick={checkStatus}
          >
            Check Status
          </Button>
        </Box>
      )}

      {token && (
        <Card
          sx={{
            mt: 4,
            p: 3,
            width: 300,
            borderRadius: 4,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            color="warning.main"
          >
            {token.number}
          </Typography>

          <Typography color="text.secondary" mt={1}>
            {token.service}
          </Typography>

          <Typography mt={2}>
            Status: <b>{token.status}</b>
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 3,
            }}
          >
            <Box>
              <Typography fontWeight="bold">{token.waiting}</Typography>
              <Typography variant="body2" color="text.secondary">
                People Ahead
              </Typography>
            </Box>

            <Box>
              <Typography fontWeight="bold">{token.time}</Typography>
              <Typography variant="body2" color="text.secondary">
                Est. Wait
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            sx={{ mt: 3 }}
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </Card>
      )}
    </Box>
  );
}
