import { useState } from "react";
import {
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
} from "@mui/material";
import { ContentCopy, PersonRemove, Refresh, ExitToApp } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  getMyFamily,
  createFamily,
  joinFamily,
  regenerateInviteCode,
  removeMember,
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
        <Paper sx={{ p: 3 }}>
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
        </Paper>
      </Box>
    );
  }

  if (currentView === "join") {
    return (
      <Box maxWidth={400} mx="auto" mt={4}>
        <Paper sx={{ p: 3 }}>
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
        </Paper>
      </Box>
    );
  }

  // Members view.
  const family = familyData!.family;
  const members = familyData!.members;

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h4" gutterBottom>
        {family.name}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            {t("family.inviteCode")}:
          </Typography>
          <Chip label={family.inviteCode} variant="outlined" />
          <Tooltip title={codeCopied ? t("family.codeCopied") : t("family.copyLink")}>
            <IconButton
              size="small"
              onClick={() => handleCopyLink(family.inviteCode)}
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
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
      </Paper>

      <Typography variant="h6" gutterBottom>
        {t("family.members")} ({members.length})
      </Typography>
      <Paper>
        <List>
          {members.map((member, index) => (
            <Box key={member.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={member.displayName}
                  secondary={
                    member.role === "owner" ? t("family.owner") : t("family.member")
                  }
                />
                {isOwner && member.role !== "owner" && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeMutation.mutate(member.userId)}
                      disabled={removeMutation.isPending}
                    >
                      <PersonRemove />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </Box>
          ))}
        </List>
      </Paper>

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
    </Box>
  );
}
