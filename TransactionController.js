const { Validator } = require("node-input-validator");
const db = require("../../../models");
const helper = require("../../../helper/helper");
module.exports = {
  transactiondetail: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let transaction_detail = await db.transactions.findAll({
        where: {
          user_id: req.user.id,
        },
        order: [["id", "DESC"]],
        raw: true,
      });

      if (transaction_detail) {
        return helper.success(
          res,
          "Transactions get Successfully",
          transaction_detail
        );
      } else {
        return helper.error400(res, "Transactions detail not found");
      }
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  redeemhistory: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let redeem_history = await db.redeem_points.findAll({
        where: {
          user_id: req.user.id,
        },
        order: [["id", "DESC"]],
        raw: true,
      });
    return helper.success( res, "Redeem history get Successfully", redeem_history );
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
