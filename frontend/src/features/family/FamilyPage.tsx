import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyFamily,
  createFamily,
  joinFamily,
  regenerateInviteCode,
  removeMember,
  promoteMember,
  leaveFamily,
} from "../../api/familyApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";

type View = "loading" | "noFamily" | "create" | "join" | "members";

const MEMBER_COLOURS = [
  "linear-gradient(135deg, oklch(0.55 0.12 145), oklch(0.45 0.13 145))",
  "linear-gradient(135deg, oklch(0.6 0.13 35), oklch(0.5 0.14 30))",
  "linear-gradient(135deg, oklch(0.58 0.12 250), oklch(0.45 0.13 245))",
  "linear-gradient(135deg, oklch(0.6 0.12 60), oklch(0.5 0.13 55))",
  "linear-gradient(135deg, oklch(0.55 0.13 320), oklch(0.45 0.14 315))",
  "linear-gradient(135deg, oklch(0.58 0.1 195), oklch(0.45 0.11 190))",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FamilyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  const { data: familyData, isLoading } = useQuery({
    queryKey: ["family", "my"],
    queryFn: getMyFamily,
  });

  const currentView: View = isLoading
    ? "loading"
    : familyData
      ? "members"
      : view === "create" || view === "join"
        ? view
        : "noFamily";

  const createMutation = useMutation({
    mutationFn: () => createFamily(name, user!.displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => joinFamily(inviteCode, user!.displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateInviteCode(familyData!.family.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      removeMember(familyData!.family.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      setMemberToRemove(null);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: string) =>
      promoteMember(familyData!.family.id, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family"] }),
  });

  const leaveMutation = useMutation({
    mutationFn: leaveFamily,
    onSuccess: () => {
      setLeaveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });

  const buildInviteLink = (code: string) =>
    `${window.location.origin}/join?code=${code}`;

  const handleCopyLink = async (code: string) => {
    await navigator.clipboard.writeText(buildInviteLink(code));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (currentView === "loading") return <Spinner />;

  if (currentView === "noFamily") {
    return (
      <div className="fp-main-narrow">
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.Users />
          </div>
          <div className="fp-emptystate-title">{t("family.noFamily")}</div>
          <div className="fp-emptystate-sub" style={{ marginTop: 14, gap: 8 }}>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              onClick={() => setView("create")}
            >
              <Icon.Plus />
              {t("family.create")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setView("join")}
            >
              {t("family.join")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "create") {
    return (
      <div className="fp-main-narrow">
        <div className="fp-page-head">
          <div>
            <div className="fp-page-eyebrow">{t("family.noFamily")}</div>
            <h1>
              {t("family.create").split(" ")[0]}{" "}
              <em>{t("family.create").split(" ").slice(1).join(" ")}</em>
            </h1>
          </div>
        </div>
        {error && <div className="fp-alert fp-alert-error">{error}</div>}
        <form
          className="fp-form"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="fp-field">
            <label className="fp-field-label">
              {t("family.name")} <span className="fp-field-req">{t("recipes.required")}</span>
            </label>
            <input
              className="fp-input fp-input-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="fp-form-foot">
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setView("noFamily")}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="fp-btn fp-btn-primary"
              disabled={createMutation.isPending || !name.trim()}
            >
              <Icon.Check />
              {t("family.create")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (currentView === "join") {
    return (
      <div className="fp-main-narrow">
        <div className="fp-page-head">
          <div>
            <div className="fp-page-eyebrow">{t("family.noFamily")}</div>
            <h1>
              {t("family.join").split(" ")[0]}{" "}
              <em>{t("family.join").split(" ").slice(1).join(" ")}</em>
            </h1>
          </div>
        </div>
        {error && <div className="fp-alert fp-alert-error">{error}</div>}
        <form
          className="fp-form"
          onSubmit={(e) => {
            e.preventDefault();
            joinMutation.mutate();
          }}
        >
          <div className="fp-field">
            <label className="fp-field-label">
              {t("family.inviteCode")} <span className="fp-field-req">{t("recipes.required")}</span>
            </label>
            <input
              className="fp-input fp-input-lg"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="fp-form-foot">
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setView("noFamily")}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="fp-btn fp-btn-primary"
              disabled={joinMutation.isPending || !inviteCode.trim()}
            >
              <Icon.Check />
              {t("family.join")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Members view
  const family = familyData!.family;
  const members = familyData!.members;
  const isOwner = family.createdBy === user?.sub;

  return (
    <div className="fp-main-wide">
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">
            {t("family.eyebrow", { count: members.length })}
          </div>
          <h1>
            {t("family.title").split(" ").slice(0, -1).join(" ")}{" "}
            <em>{t("family.title").split(" ").slice(-1)[0]}</em>
          </h1>
          <div className="fp-page-sub">{t("family.subtitle")}</div>
        </div>
      </div>

      <div className="fp-invite-card">
        <div className="fp-invite-card-body">
          <div className="fp-invite-label">{t("family.inviteCode")}</div>
          <span className="fp-invite-code">{family.inviteCode}</span>
        </div>
        <div className="fp-invite-actions">
          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={() => handleCopyLink(family.inviteCode)}
          >
            <Icon.Copy />
            {codeCopied ? t("family.codeCopied") : t("family.copyLink")}
          </button>
          {isOwner && (
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              <Icon.Refresh />
              {t("family.regenerateCode")}
            </button>
          )}
        </div>
      </div>

      <div className="fp-family-grid">
        {members.map((m, idx) => {
          const bg = MEMBER_COLOURS[idx % MEMBER_COLOURS.length];
          const canManage = isOwner && m.role !== "owner";
          return (
            <div className="fp-family-card" key={m.id}>
              {canManage && (
                <div className="fp-family-actions no-print">
                  <button
                    type="button"
                    className="fp-icon-btn"
                    onClick={() => promoteMutation.mutate(m.userId)}
                    title={t("family.promote")}
                    disabled={promoteMutation.isPending}
                  >
                    <Icon.Chevron dir="up" />
                  </button>
                  <button
                    type="button"
                    className="fp-icon-btn"
                    onClick={() =>
                      setMemberToRemove({
                        userId: m.userId,
                        displayName: m.displayName,
                      })
                    }
                    title={t("family.removeMember")}
                  >
                    <Icon.X />
                  </button>
                </div>
              )}
              <div className="fp-family-avatar" style={{ background: bg }}>
                {initials(m.displayName)}
              </div>
              <div className="fp-family-name">{m.displayName}</div>
              <div className="fp-family-role">
                {m.role === "owner" ? t("family.owner") : t("family.member")}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="fp-btn fp-btn-danger"
        onClick={() => setLeaveOpen(true)}
      >
        <Icon.Logout />
        {t("family.leave")}
      </button>

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t("family.leaveConfirmTitle")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setLeaveOpen(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-danger"
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
            >
              <Icon.Logout />
              {t("family.leave")}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("family.leaveConfirmMessage")}
        </p>
      </Modal>

      <Modal
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title={t("family.removeConfirmTitle")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setMemberToRemove(null)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-danger"
              disabled={removeMutation.isPending}
              onClick={() =>
                memberToRemove && removeMutation.mutate(memberToRemove.userId)
              }
            >
              <Icon.Trash />
              {t("family.removeMember")}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("family.removeConfirmMessage", {
            name: memberToRemove?.displayName,
          })}
        </p>
      </Modal>
    </div>
  );
}
