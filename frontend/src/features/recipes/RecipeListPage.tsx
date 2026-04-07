import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function RecipeListPage() {
  const { t } = useTranslation();

  return <Typography variant="h4">{t("recipes.title")}</Typography>;
}
