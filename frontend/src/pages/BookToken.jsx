import {
  Box,
  Button,
  Typography,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Customer() {
  const navigate = useNavigate();

  const [service, setService] = useState("");
  const [token, setToken] = useState(null);

  const handleGenerateToken = () => {
    setToken({
      number: "A-173",
      waiting: 4,
      time: "12 mins",
      service,
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
        position: "relative",
      }}
    >
      {/* Navigation (dev-only) */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <Button size="small" onClick={() => navigate("/")}>
          Customer
        </Button>
        <Button size="small" onClick={() => navigate("/staff")}>
          Staff
        </Button>
        <Button size="small" onClick={() => navigate("/admin")}>
          Admin
        </Button>
      </Box>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        SwiftPost
      </Typography>

      {/* SERVICE SELECTION */}
      {!token && (
        <Box sx={{ width: 280 }}>
          <FormControl fullWidth>
            <InputLabel>Select Service</InputLabel>
            <Select
              value={service}
              label="Select Service"
              onChange={(e) => setService(e.target.value)}
            >
              <MenuItem value="Parcel Drop-off">Parcel Drop-off</MenuItem>
              <MenuItem value="Banking Services">Banking Services</MenuItem>
              <MenuItem value="General Inquiry">General Inquiry</MenuItem>
              <MenuItem value="Document Verification">
                Document Verification
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            color="warning"
            size="large"
            sx={{ mt: 3 }}
            disabled={!service}
            onClick={handleGenerateToken}
          >
            Generate Token
          </Button>
        </Box>
      )}
          
      {/* TOKEN CARD */}
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
        </Card>
      )}
    </Box>
  );
}
