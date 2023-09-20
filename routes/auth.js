const express = require("express");
const { connectDB, getDB } = require("../config/mongoConnect");
const bcrypt = require("bcryptjs");
const { Snowflake } = require("@theinternetfolks/snowflake");
const {
  createUserValidation,
  createSignInValidation,
} = require("../validation/valid");
const createError = require("http-errors");
const { ValidationError } = require("joi");
const { requestSuccessData, errorData } = require("../helpers/outputModel");
require("dotenv").config();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

const {
  signAccessToken,
  verifyAccessToken,
  checkUser,
} = require("../helpers/jwt_helper");

const router = express.Router();

router.post("/signin", async (req, res, next) => {
  try {
    await createSignInValidation.validateAsync(req.body);
    const { email, password } = req.body;

    const validUser = await checkUser(email, password);
    if (validUser) {
      const accessToken = await signAccessToken(validUser._id);
      res.cookie("jwt", accessToken);
      res.status(200).json(requestSuccessData(validUser, accessToken));
    } else {
      return res
        .status(400)
        .json(
          errorData(
            "password",
            "The credentials you provided are invalid.",
            "INVALID_CREDENTIALS"
          )
        );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json(errorData("email/password", error.message, "INVALID_INPUT"));
    }
    next(error);
  }
});

router.post("/signup", async (req, res, next) => {
  try {
    await createUserValidation.validateAsync(req.body);
    let { name, email, password } = req.body;
    password = await bcrypt.hash(password, 10);
    const doesExist = await db.collection("users").findOne({ email: email });
    if (doesExist) {
      return res
        .status(400)
        .json(
          errorData(
            "email",
            "User with this email address already exists.",
            "RESOURCE_EXISTS"
          )
        );
    }

    const newUser = {
      _id: Snowflake.generate(),
      name,
      email,
      password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { insertedId } = await db.collection("users").insertOne(newUser);

    const accessToken = await signAccessToken(insertedId);

    res.cookie("jwt", accessToken);

    res.status(200).json(requestSuccessData(newUser, accessToken));
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json(errorData("name", error.message, "INVALID_INPUT"));
    }
    next(error);
  }
});

router.get("/me", verifyAccessToken, async (req, res, next) => {
  const userId = req.userId;
  const userData = await db.collection("users").findOne({ _id: userId });
  res.status(200).json(requestSuccessData(userData, null));
});

router.post("/logout", verifyAccessToken, async (req, res, next) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).send("Logout Successfully!");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
