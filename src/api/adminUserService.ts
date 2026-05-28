import { MOCK_STORAGE_KEYS, nowIso, readStorage, writeStorage } from "./mockDb";

export type AdminUserSummary = {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  status?: string;
};

export type AdminUserDetail = AdminUserSummary & {
  createdAt?: string;
  updatedAt?: string;
};

type AdminUserState = AdminUserDetail[];

const KEY = MOCK_STORAGE_KEYS.adminUsers;

function seedUsers(): AdminUserState {
  return [
    {
      id: "USR-1084",
      email: "a.nguyen@skillsprint.vn",
      fullName: "Nguyễn Văn A",
      role: "LEARNER",
      status: "ACTIVE",
      createdAt: "2026-04-01T08:25:00.000Z",
      updatedAt: "2026-04-01T08:25:00.000Z",
    },
    {
      id: "USR-1130",
      email: "b.tran@skillsprint.vn",
      fullName: "Trần Thị B",
      role: "LEARNER",
      status: "REVIEW",
      createdAt: "2026-03-31T21:14:00.000Z",
      updatedAt: "2026-03-31T21:14:00.000Z",
    },
    {
      id: "USR-0912",
      email: "c.le@skillsprint.vn",
      fullName: "Lê Văn C",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "2026-04-01T07:42:00.000Z",
      updatedAt: "2026-04-01T07:42:00.000Z",
    },
  ];
}

function readState(): AdminUserState {
  return readStorage<AdminUserState>(KEY, []);
}

function writeState(state: AdminUserState): void {
  writeStorage(KEY, state);
}

function ensureSeeded(): AdminUserState {
  const current = readState();
  if (current.length > 0) {
    return current;
  }

  const seeded = seedUsers();
  writeState(seeded);
  return seeded;
}

export async function getAdminUsers(search?: string, page = 0, size = 10) {
  const current = ensureSeeded();
  const term = search?.trim().toLowerCase() ?? "";
  const filtered = term
    ? current.filter((item) => [item.email, item.fullName, item.role, item.status].some((value) => value?.toLowerCase().includes(term)))
    : current;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    totalElements: filtered.length,
  };
}

export async function getAdminUser(userId: string) {
  const user = ensureSeeded().find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUserStatus(userId: string, body: { status: string }) {
  const current = ensureSeeded();
  const index = current.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new Error("User not found");
  }

  current[index] = { ...current[index], status: body.status, updatedAt: nowIso() };
  writeState(current);
  return current[index];
}

export async function updateUserRole(userId: string, body: { role?: string; roles?: string[] }) {
  const current = ensureSeeded();
  const index = current.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new Error("User not found");
  }

  const nextRole = body.role || body.roles?.[0] || "LEARNER";
  current[index] = { ...current[index], role: nextRole, updatedAt: nowIso() };
  writeState(current);
  return current[index];
}

export default { getAdminUsers, getAdminUser, updateUserStatus, updateUserRole };