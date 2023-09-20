const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const { connectDB, getDB } = require("../config/mongoConnect");
const { errorData } = require("../helpers/outputModel");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

module.exports = {
  signAccessToken: async (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "1d",
        issuer: "tif.com",
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) return reject(createError.InternalServerError());

        resolve(token);
      });
    });
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.cookies.jwt)
      return res
        .status(401)
        .json(
          errorData(null, "You need to sign in to proceed.", "NOT_SIGNEDIN")
        );
    const token = req.cookies.jwt;
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.userId = payload.aud;
      next();
    });
  },
  checkUser: async function (email, password) {
    const foundUser = await db.collection("users").findOne({ email: email });
    let isValid = false;
    if (foundUser) {
      isValid = await bcrypt.compare(password, foundUser.password);
    }

    if (isValid) return foundUser;
    else return false;
  },
};
