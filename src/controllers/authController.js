const authService = require("../services/authService");
const User = require("../models/User");

async function register(req, res) {
  try {
    const result = await authService.registerUser(req.body || {});

    return res.status(201).json({
      message: "Register berhasil",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Gagal register",
    });
  }
}

async function login(req, res) {
  try {
    const result = await authService.loginUser(req.body || {});

    return res.status(200).json({
      message: "Login berhasil",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Gagal login",
    });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: "Akun tidak ditemukan" });
    }
    return res.status(200).json({
      message: "Profil user aktif",
      user: user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil profil user", error: error.message });
  }
}

async function adminOnly(_req, res) {
  return res.status(200).json({
    message: "Akses admin berhasil",
  });
}

async function deleteAccount(req, res) {
  try {
    const userId = req.user.sub;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID tidak ditemukan" });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "Akun tidak ditemukan" });
    }

    return res.status(200).json({ message: "Akun berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ message: "Gagal menghapus akun", error: error.message });
  }
}

module.exports = {
  register,
  login,
  me,
  adminOnly,
  deleteAccount,
};