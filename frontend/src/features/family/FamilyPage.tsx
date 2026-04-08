import { useState } from "react";
import {
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Alert,
  Chip,
  Tooltip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  alpha,
} from "@mui/material";
import { ContentCopy, PersonRemove, Refresh, ExitToApp, ArrowUpward } from "@mui/icons-material";
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

type View = "loading" | "noFamily" | "create" | "join" | "members";

export default function FamilyPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("loading");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; displayName: string } | null>(null);

  const { data: familyData, isLoading } = useQuery({
    queryKey: ["family", "my"],
    queryFn: getMyFamily,
  });

  const currentView = isLoading
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      removeMember(familyData!.family.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (userId: string) =>
      promoteMember(familyData!.family.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveFamily,
    onSuccess: () => {
      setIsLeaveDialogOpen(false);
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

  const isOwner = familyData?.family.createdBy === user?.sub;

  if (currentView === "loading") {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (currentView === "noFamily") {
    return (
      <Box maxWidth={400} mx="auto" mt={4}>
        <Typography variant="h5" gutterBottom>
          {t("family.noFamily")}
        </Typography>
        <Box display="flex" flexDirection="column" gap={2} mt={3}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setView("create")}
          >
            {t("family.create")}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setView("join")}
          >
            {t("family.join")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (currentView === "create") {
    return (
      <Box maxWidth={400} mx="auto" mt={4}>
        <Card><CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t("family.create")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <TextField
              fullWidth
              label={t("family.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
            />

            <Box display="flex" gap={1} mt={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                fullWidth
              >
                {t("family.create")}
              </Button>
              <Button variant="outlined" onClick={() => setView("noFamily")} fullWidth>
                {t("common.cancel")}
              </Button>
            </Box>
          </Box>
        </CardContent></Card>
      </Box>
    );
  }

  if (currentView === "join") {
    return (
      <Box maxWidth={400} mx="auto" mt={4}>
        <Card><CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t("family.join")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              joinMutation.mutate();
            }}
          >
            <TextField
              fullWidth
              label={t("family.inviteCode")}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              margin="normal"
              required
            />

            <Box display="flex" gap={1} mt={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={joinMutation.isPending}
                fullWidth
              >
                {t("family.join")}
              </Button>
              <Button variant="outlined" onClick={() => setView("noFamily")} fullWidth>
                {t("common.cancel")}
              </Button>
            </Box>
          </Box>
        </CardContent></Card>
      </Box>
    );
  }

  // Members view.
  const family = familyData!.family;
  const members = familyData!.members;

  const memberColours = [
    "#2e7d32", "#1565c0", "#c62828", "#6a1b9a",
    "#e65100", "#00838f", "#4e342e", "#37474f",
  ];

  const getMemberColour = (index: number) =>
    memberColours[index % memberColours.length];

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {family.name}
      </Typography>

      <Card sx={{ mb: 3, bgcolor: (t) => alpha(t.palette.primary.main, 0.04) }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("family.inviteCode")}
          </Typography>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Chip
              label={family.inviteCode}
              color="primary"
              variant="outlined"
              sx={{ fontFamily: "monospace", fontSize: "1rem", letterSpacing: "0.1em", py: 0.5 }}
            />
            <Button
              size="small"
              variant="contained"
              startIcon={<ContentCopy />}
              onClick={() => handleCopyLink(family.inviteCode)}
            >
              {codeCopied ? t("family.codeCopied") : t("family.copyLink")}
            </Button>
            {isOwner && (
              <Tooltip title={t("family.regenerateCode")}>
                <IconButton
                  size="small"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t("family.members")} ({members.length})
      </Typography>
      <Card>
        <List disablePadding>
          {members.map((member, index) => (
            <Box key={member.id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getMemberColour(index), width: 36, height: 36, fontSize: "0.85rem" }}>
                    {getInitials(member.displayName)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={500}>{member.displayName}</Typography>
                      {member.role === "owner" && (
                        <Chip label={t("family.owner")} size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                  }
                />
                {isOwner && member.role !== "owner" && (
                  <ListItemSecondaryAction>
                    <Tooltip title={t("family.promote")}>
                      <IconButton
                        size="small"
                        onClick={() => promoteMutation.mutate(member.userId)}
                        disabled={promoteMutation.isPending}
                      >
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => setMemberToRemove({ userId: member.userId, displayName: member.displayName })}
                    >
                      <PersonRemove fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </Box>
          ))}
        </List>
      </Card>

      <Button
        variant="outlined"
        color="error"
        startIcon={<ExitToApp />}
        onClick={() => setIsLeaveDialogOpen(true)}
        sx={{ mt: 3 }}
      >
        {t("family.leave")}
      </Button>

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
      >
        <DialogTitle>{t("family.leaveConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("family.leaveConfirmMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLeaveDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
          >
            {t("family.leave")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
      >
        <DialogTitle>{t("family.removeConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("family.removeConfirmMessage", { name: memberToRemove?.displayName })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberToRemove(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (memberToRemove) {
                removeMutation.mutate(memberToRemove.userId, {
                  onSuccess: () => setMemberToRemove(null),
                });
              }
            }}
            disabled={removeMutation.isPending}
          >
            {t("family.removeMember")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
