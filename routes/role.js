const { verifyAccessToken } = require("../helpers/jwt_helper");
const { connectDB, getDB } = require("../config/mongoConnect");
const express = require("express");
const { requestRoleData, errorData } = require("../helpers/outputModel");
const { createRoleValidation } = require("../validation/valid");
const { ValidationError } = require("joi");
const { Snowflake } = require("@theinternetfolks/snowflake");
const createError = require("http-errors");
const router = express.Router();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

router.post("/", verifyAccessToken, async (req, res, next) => {
  try {
    await createRoleValidation.validateAsync(req.body);
    const { name } = req.body;

    const newRole = {
      _id: Snowflake.generate(),
      name: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const insertedId = await db.collection("roles").insertOne(newRole);
    res.status(200).json(await requestRoleData(newRole, null));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res
        .status(400)
        .json(errorData("name", err.message, "INVALID_INPUT"));
    }
    next(err);
  }
});

router.get("/", verifyAccessToken, async (req, res, next) => {
  try {
    let validRole = await db.collection("roles").find({});
    const len = await db.collection("roles").count({});
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;

    validRole = await validRole.skip(skip).limit(limit);

    res
      .status(200)
      .json(await requestRoleData(validRole, { page, limit, skip, len }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
