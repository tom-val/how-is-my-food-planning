import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function FamilyPage() {
  const { t } = useTranslation();

  return <Typography variant="h4">{t("family.members")}</Typography>;
}
