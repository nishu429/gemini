const { Validator } = require("node-input-validator");
const db = require("../../../models");
const helper = require("../../../helper/helper");
module.exports = {
  rewardlisting: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let reward_listing = await db.rewards.findAll({
        order: [["id", "DESC"]],
        raw: true,
      });
      return helper.success(res, "Reward get sucessfully", reward_listing);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  addreward: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const points = parseInt(req.body.points);
      const views = await db.rewards.create({
        amount: req.body.amount,
        points: points,
      });

      return helper.success(res, "Rewards added Successfully", views);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
