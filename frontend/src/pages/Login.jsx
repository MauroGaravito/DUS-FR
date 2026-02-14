import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { setToken } from "../services/auth";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "engineer@example.com",
    password: "password123"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(form.email, form.password);
      setToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        bgcolor: "background.default"
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5">{t("fieldReport")} {t("login")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("signInToContinue")}
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label={t("email")}
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
                <TextField
                  label={t("password")}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
                <Button type="submit" variant="contained" disabled={loading} sx={{ minHeight: 52 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : t("login")}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
