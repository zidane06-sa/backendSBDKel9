const authService = require("../services/authService");

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
  return res.status(200).json({
    message: "Profil user aktif",
    user: req.user,
  });
}

async function adminOnly(_req, res) {
  return res.status(200).json({
    message: "Akses admin berhasil",
  });
}

module.exports = {
  register,
  login,
  me,
  adminOnly,
};