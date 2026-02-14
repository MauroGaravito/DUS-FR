import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <FormControl size="small" sx={{ minWidth: 110 }}>
      <InputLabel id="language-switcher-label">{t("language")}</InputLabel>
      <Select
        labelId="language-switcher-label"
        value={i18n.language || "en"}
        label={t("language")}
        onChange={(event) => {
          i18n.changeLanguage(event.target.value);
          localStorage.setItem("dus-fr-ui-lang", event.target.value);
        }}
      >
        <MenuItem value="en">EN</MenuItem>
        <MenuItem value="es">ES</MenuItem>
        <MenuItem value="pt">PT</MenuItem>
      </Select>
    </FormControl>
  );
}

export default LanguageSwitcher;
