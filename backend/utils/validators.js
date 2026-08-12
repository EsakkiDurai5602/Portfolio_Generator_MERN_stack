const Joi = require("joi");

// Validation schemas
const schemas = {
  // Register validation
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Portfolio validation
  portfolio: Joi.object({
    email: Joi.string().email(),
    fullName: Joi.string().min(2).max(50),
    title: Joi.string().max(100),
    profileImage: Joi.string().allow(""),
    about: Joi.string().max(1000),
    skills: Joi.array().items(Joi.string()),
    education: Joi.array().items(
      Joi.object({
        college: Joi.string(),
        degree: Joi.string(),
        year: Joi.string(),
      })
    ),
    projects: Joi.array().items(
      Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        github: Joi.string().uri().allow(""),
        liveLink: Joi.string().uri().allow(""),
      })
    ),
    experience: Joi.array().items(
      Joi.object({
        company: Joi.string(),
        role: Joi.string(),
        years: Joi.string(),
      })
    ),
    socialLinks: Joi.object({
      github: Joi.string().uri().allow(""),
      linkedin: Joi.string().uri().allow(""),
      instagram: Joi.string().uri().allow(""),
    }),
  }),

  // Contact validation
  contact: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    message: Joi.string().min(10).max(2000).required(),
  }),
};

// Validate data against schema
const validate = (data, schemaName) => {
  const schema = schemas[schemaName];
  if (!schema) {
    return { error: { details: [{ message: "Invalid schema name" }] } };
  }
  return schema.validate(data, { abortEarly: false });
};

module.exports = { validate, schemas };
