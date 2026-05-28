const Joi = require("joi");

// Define the rules for adding/updating a result
const resultSchema = Joi.object({
  student_id: Joi.number().integer().required(),
  subject: Joi.string().min(2).max(50).required(),
  score: Joi.number().min(0).max(100).required(),
  term: Joi.string().valid("Term 1", "Term 2", "Term 3").required() 
});

module.exports = { resultSchema };