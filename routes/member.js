const { verifyAccessToken, signAccessToken } = require("../helpers/jwt_helper");
const asyncHandler = require("express-async-handler");
const { connectDB, getDB } = require("../config/mongoConnect");
const { errorData } = require("../helpers/outputModel");
const { createMemberValidation } = require("../validation/valid");
const { Snowflake } = require("@theinternetfolks/snowflake");
const express = require("express");
const { ValidationError } = require("joi");
const createError = require("http-errors");
const router = express.Router();

let db;
connectDB((err) => {
  if (!err) db = getDB();
  else console.log(err);
});

router.post(
  "/",
  verifyAccessToken,
  asyncHandler(async (req, res, next) => {
    try {
      await createMemberValidation.validateAsync(req.body);
      const userId = req.userId;
      const { community, user, role } = req.body;
      const communityData = await db
        .collection("community")
        .findOne({ _id: community });
      const userData = await db.collection("users").findOne({ _id: user });
      const roleData = await db.collection("roles").findOne({ _id: role });

      const doesPreExist = await db
        .collection("members")
        .findOne({ "user.id": user, community: community });
      if (doesPreExist)
        return res
          .status(400)
          .json(
            errorData(
              null,
              "User is already added in the community.",
              "RESOURCE_EXISTS"
            )
          );
      if (!communityData)
        return res
          .status(400)
          .json(
            errorData("community", "Community not found.", "RESOURCE_NOT_FOUND")
          );
      if (!roleData)
        return res
          .status(400)
          .json(errorData("role", "Role not found.", "RESOURCE_NOT_FOUND"));
      if (!userData)
        return res
          .status(400)
          .json(errorData("user", "User not found.", "RESOURCE_NOT_FOUND"));
      if (communityData.owner.id !== userId)
        return res
          .status(400)
          .json(
            errorData(
              null,
              "You are not authorized to perform this action.",
              "NOT_ALLOWED_ACCESS"
            )
          );

      const memberData = {
        _id: Snowflake.generate(),
        community: community,
        user: {
          id: user,
          name: userData.name,
        },
        role: {
          id: role,
          name: roleData.name,
        },
        created_at: new Date().toISOString(),
      };

      await db.collection("members").insertOne(memberData);

      res.status(200).json({
        status: true,
        content: {
          data: {
            id: memberData.id,
            community: memberData.community,
            user: memberData.user.id,
            role: memberData.role.id,
            created_at: memberData.created_at,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  })
);

router.delete(
  "/:id",
  verifyAccessToken,
  asyncHandler(async (req, res, next) => {
    try {
      const userId = req.userId;
      const memberId = req.params.id;
      const allowedRoles = ["Community Admin", "Community Moderator"];
      let communityId = await db
        .collection("members")
        .findOne({ _id: memberId });
      if (!communityId)
        return res
          .status(400)
          .json(errorData(null, "Member not found.", "RESOURCE_NOT_FOUND"));
      communityId = communityId.community;
      let rolesID = await db
        .collection("roles")
        .find({ name: { $in: allowedRoles } })
        .toArray();
      rolesID = rolesID.map((role) => role._id);
      const isAllowed = await db
        .collection("members")
        .find({
          "user.id": userId,
          community: communityId,
          "role.id": { $in: rolesID },
        })
        .toArray();
      if (isAllowed.length === 0) {
        return res.status(400).json({
          status: false,
          errors: [
            {
              param: "community",
              message: "No Authority to Delete",
              code: "UNAUTHORIZED",
            },
          ],
        });
      }

      const deletedId = await db
        .collection("members")
        .deleteOne({ _id: memberId });
      res.status(200).json({
        status: true,
      });
    } catch (err) {
      next(err);
    }
  })
);

module.exports = router;
