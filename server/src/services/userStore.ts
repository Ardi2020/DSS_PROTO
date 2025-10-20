import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_DIR = path.resolve(__dirname, "../../users");
const USERS_FILE = path.join(USERS_DIR, "users.json");

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  permissions?: string[];
  active: boolean;
};

type UsersDoc = { users: User[] };

async function ensureUsersFile() {
  await fs.mkdir(USERS_DIR, { recursive: true });
  try { await fs.access(USERS_FILE); }
  catch {
    const adminPass = "admin123"; // ganti setelah login
    const hash = await bcrypt.hash(adminPass, 10);
    const doc: UsersDoc = {
      users: [
        {
          id: "u_admin",
          username: "admin",
          passwordHash: hash,
          role: "admin",
          permissions: ["*"],
          active: true,
        },
      ],
    };
    await fs.writeFile(USERS_FILE, JSON.stringify(doc, null, 2), "utf8");
    // Log aman tanpa tampilkan hash
    // eslint-disable-next-line no-console
    console.log("[userStore] Seed admin dibuat: username=admin password=admin123 (ganti segera)");
  }
}

export async function loadUsers(): Promise<UsersDoc> {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  return JSON.parse(raw) as UsersDoc;
}

export async function saveUsers(doc: UsersDoc) {
  await fs.writeFile(USERS_FILE, JSON.stringify(doc, null, 2), "utf8");
}

export async function findUser(username: string): Promise<User | null> {
  const { users } = await loadUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function verifyPassword(user: User, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function changePassword(username: string, newPassword: string) {
  const doc = await loadUsers();
  const user = doc.users.find(u => u.username === username);
  if (!user) throw new Error("User not found");
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await saveUsers(doc);
}

export async function createUser(data: { username: string; password: string; role?: User["role"]; permissions?: string[] }) {
  const doc = await loadUsers();
  if (doc.users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  const user: User = {
    id: `u_${Date.now()}`,
    username: data.username,
    passwordHash: await bcrypt.hash(data.password, 10),
    role: data.role ?? "user",
    permissions: data.permissions ?? [],
    active: true,
  };
  doc.users.push(user);
  await saveUsers(doc);
  return user;
}
