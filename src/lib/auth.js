import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import User from "./models/User";

const COOKIE_NAME = "vecta_token";
const JWT_EXPIRY = "30d";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signToken(payload) {
  return jwt.sign(payload, requireSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, requireSecret());
  } catch {
    return null;
  }
}

export async function setAuthCookie(token) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function getAuthPayload() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// The one place route handlers and server components should call to find out
// who's asking. companyId always comes from here (the signed token), never
// from a request body or query param - the same invariant Smart Factories
// uses, so a client can never claim another company's data.
export async function getCurrentUser() {
  const payload = await getAuthPayload();
  if (!payload?.userId) return null;
  await connectDB();
  const user = await User.findById(payload.userId).select("-passwordHash").lean();
  if (!user) return null;
  return { ...user, _id: String(user._id), companyId: String(user.companyId) };
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;

// Admin-only actions: inviting/removing teammates, changing roles.
export function isAdmin(user) {
  return user?.role === "Admin";
}

// Hoshin plans are the strategic layer - who sets objectives and priorities
// is deliberately narrower than who executes against them. Projects and
// Dashboards stay open to every teammate; this is the one other place a
// role actually gates something server-side.
export function canEditHoshin(user) {
  return user?.role === "Admin" || user?.role === "Manager";
}

// Teams sit next to Hoshin in the strategic layer (their outcomes link back
// to Breakthrough Objectives) - same Admin/Manager gate, view stays open.
export const canManageTeams = canEditHoshin;
