import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { joinFamily } from "../../api/familyApi";
import { Spinner } from "../../components/sage/Spinner";
import { Icon } from "../../components/sage/Icon";

export default function JoinByLinkPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [attempted, setAttempted] = useState(false);

  const joinMutation = useMutation({
    mutationFn: () => joinFamily(code, user!.displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      navigate("/family");
    },
  });

  useEffect(() => {
    if (code && user && !attempted) {
      setAttempted(true);
      joinMutation.mutate();
    }
  }, [code, user, attempted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!code) {
    return (
      <div className="fp-main-narrow">
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.X />
          </div>
          <div className="fp-emptystate-title">{t("family.invalidLink")}</div>
          <div className="fp-emptystate-sub" style={{ marginTop: 14 }}>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              onClick={() => navigate("/family")}
            >
              {t("family.goToFamily")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (joinMutation.isPending) {
    return (
      <div className="fp-main-narrow" style={{ textAlign: "center", paddingTop: 60 }}>
        <Spinner />
        <p style={{ color: "var(--muted)", marginTop: 12 }}>
          {t("family.joining")}
        </p>
      </div>
    );
  }

  if (joinMutation.isError) {
    return (
      <div className="fp-main-narrow">
        <div className="fp-alert fp-alert-error">
          {joinMutation.error.message}
        </div>
        <button
          type="button"
          className="fp-btn fp-btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => navigate("/family")}
        >
          {t("family.goToFamily")}
        </button>
      </div>
    );
  }

  return null;
}
