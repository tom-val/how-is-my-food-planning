import { IconButton, Menu, MenuItem } from "@mui/material";
import { Language } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "lt", label: "Lietuvių" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Language />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={i18n.language === lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code);
              setAnchorEl(null);
            }}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
