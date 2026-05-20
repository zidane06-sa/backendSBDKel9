const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const allowedRoles = ["guest", "admin"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

function normalizeRole(role) {
  if (!role) {
    return "guest";
  }

  const normalized = String(role).trim().toLowerCase();
  if (!allowedRoles.includes(normalized)) {
    const error = new Error("Role tidak valid");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function createToken(user) {
  const secret = process.env.JWT_SECRET || "dev-secret-key";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
}

function buildUserResponse(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function registerUser(payload) {
  const username = normalizeUsername(payload.username);
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const role = normalizeRole(payload.role);

  if (!username || !email || !password) {
    const error = new Error("username, email, dan password wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const error = new Error("Username atau email sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email,
    passwordHash,
    role,
  });

  return {
    user: buildUserResponse(user),
    token: createToken(user),
  };
}

async function loginUser(payload) {
  const email = payload.email ? normalizeEmail(payload.email) : "";
  const username = payload.username ? normalizeUsername(payload.username) : "";
  const password = String(payload.password || "");

  if ((!email && !username) || !password) {
    const error = new Error("email/username dan password wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const query = email ? { email } : { username };
  const user = await User.findOne(query).select("+passwordHash");

  if (!user) {
    const error = new Error("Email/username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    const error = new Error("Email/username atau password salah");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: buildUserResponse(user),
    token: createToken(user),
  };
}

module.exports = {
  registerUser,
  loginUser,
  buildUserResponse,
};