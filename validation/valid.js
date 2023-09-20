const Joi = require("joi");

module.exports = {
  createUserValidation: Joi.object({
    name: Joi.string().required().min(2),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  createSignInValidation: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  createCommunityValidation: Joi.object({
    name: Joi.string().required().min(2),
  }),

  createMemberValidation: Joi.object({
    community: Joi.string().required(),
    user: Joi.string().required(),
    role: Joi.string().required(),
  }),

  createRoleValidation: Joi.object({
    name: Joi.string().required().min(2),
  }),
};
