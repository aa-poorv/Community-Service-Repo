const { verifyAccessToken } = require("../helpers/jwt_helper");
const asyncHandler = require("express-async-handler");
const { connectDB, getDB } = require("../config/mongoConnect");
const express = require("express");
const slug = require("slug");
const { ValidationError } = require("joi");
const { requestCommunityData, errorData } = require("../helpers/outputModel");
const { createCommunityValidation } = require("../validation/valid");
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
    await createCommunityValidation.validateAsync(req.body);
    const { name } = req.body;
    const roleName = "Community Admin";
    const userId = req.userId;
    const presentUser = await db.collection("users").findOne({ _id: userId });
    const role = await db.collection("roles").findOne({ name: roleName });

    const newCommunity = {
      _id: Snowflake.generate(),
      name: name,
      slug: slug(name),
      owner: {
        id: presentUser._id,
        name: presentUser.name,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const insertedId = await db.collection("community").insertOne(newCommunity);
    const memberId = await db.collection("members").insertOne({
      _id: Snowflake.generate(),
      community: newCommunity._id,
      user: {
        id: presentUser._id,
        name: presentUser.name,
      },
      role: {
        id: role._id,
        name: role.name,
      },
      created_at: new Date().toISOString(),
    });

    res.status(200).json(await requestCommunityData(newCommunity, null));
  } catch (error) {
    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json(errorData("name", error.message, "INVALID_INPUT"));
    }
    next(error);
  }
});

router.get(
  "/",
  verifyAccessToken,
  asyncHandler(async (req, res) => {
    let validUser = await db.collection("community").find({});
    const len = await db.collection("community").count({});
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;

    validUser = await validUser.skip(skip).limit(limit);

    res
      .status(200)
      .json(await requestCommunityData(validUser, { page, limit, skip, len }));
  })
);

router.get(
  "/me/owner",
  verifyAccessToken,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.userId;
      let ownedCommunity = await db
        .collection("community")
        .find({ "owner.id": userId });

      const len = await db
        .collection("community")
        .count({ "owner.id": userId });
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 3;
      let skip = (page - 1) * limit;

      ownedCommunity = await ownedCommunity.skip(skip).limit(limit);
      res
        .status(200)
        .json(
          await requestCommunityData(ownedCommunity, { page, limit, skip, len })
        );
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/:id/members",
  verifyAccessToken,
  asyncHandler(async (req, res, next) => {
    try {
      const communityId = req.params.id;
      let allMembers = await db
        .collection("members")
        .find({ community: communityId });

      const len = await db
        .collection("members")
        .count({ community: communityId });
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 3;
      let skip = (page - 1) * limit;

      allMembers = await allMembers.skip(skip).limit(limit);
      res
        .status(200)
        .json(
          await requestCommunityData(allMembers, { page, limit, skip, len })
        );
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/me/member",
  verifyAccessToken,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.userId;
      const notAllowedRole = "Community Admin";
      let allowedRoles = await db
        .collection("roles")
        .find({ name: { $ne: notAllowedRole } })
        .toArray();
      allowedRoles = allowedRoles.map((role) => role._id);
      let membersData = await db
        .collection("members")
        .find({ "user.id": userId, "role.id": { $in: allowedRoles } })
        .toArray();
      membersData = membersData.map((member) => member.community);

      const communityId = [...new Set(membersData)];
      let communityData = await db
        .collection("community")
        .find({ _id: { $in: communityId } });
      const len = await db
        .collection("community")
        .count({ _id: { $in: communityId } });
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 3;
      let skip = (page - 1) * limit;

      communityData = await communityData.skip(skip).limit(limit);
      res
        .status(200)
        .json(
          await requestCommunityData(communityData, { page, limit, skip, len })
        );
    } catch (err) {
      next(err);
    }
  })
);

module.exports = router;
