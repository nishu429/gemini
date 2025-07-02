const db = require("../../../models");
const helper = require("../../../helper/helper");
const { Validator } = require("node-input-validator");
module.exports = {
  cms: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let cmsData = await db.cms.findOne({
        where: { type: req.query.type },
        raw: true,
      });
      return helper.success(res, "CMS fetched successfully", cmsData);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
