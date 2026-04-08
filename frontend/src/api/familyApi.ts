import apiClient from "./client";

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  displayName: string;
  role: string;
  joinedAt: string;
}

export interface FamilyWithMembers {
  family: Family;
  members: FamilyMember[];
}

export async function getMyFamily(): Promise<FamilyWithMembers | null> {
  try {
    const { data } = await apiClient.get<FamilyWithMembers>("/v1/families/my");
    return data;
  } catch (err: unknown) {
    if (isAxios404(err)) return null;
    throw err;
  }
}

export async function createFamily(
  name: string,
  displayName: string,
): Promise<Family> {
  const { data } = await apiClient.post<Family>("/v1/families", {
    name,
    displayName,
  });
  return data;
}

export async function joinFamily(
  inviteCode: string,
  displayName: string,
): Promise<FamilyMember> {
  const { data } = await apiClient.post<FamilyMember>("/v1/families/join", {
    inviteCode,
    displayName,
  });
  return data;
}

export async function regenerateInviteCode(
  familyId: string,
): Promise<string> {
  const { data } = await apiClient.post<{ inviteCode: string }>(
    `/v1/families/${familyId}/regenerate-code`,
  );
  return data.inviteCode;
}

export async function removeMember(
  familyId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/v1/families/${familyId}/members/${userId}`);
}

function isAxios404(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    (err as { response: { status: number } }).response?.status === 404
  );
}
