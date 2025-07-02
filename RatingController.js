const { Validator } = require("node-input-validator");
const db = require("../../../models");
const helper = require("../../../helper/helper");
module.exports = {
  addrating: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const packageId = parseInt(req.body.package_id);
      const rating = parseInt(req.body.rating);

      let image = "";
      let folder = "admin";

      if (req.files && req.files.image) {
        image = await helper.fileupload(req.files.image, folder);
      }

      const add_rating = await db.rating.create({
        user_id: req.user.id,
        package_id: packageId,
        rating: rating,
        message: req.body.message,
        image: image,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });

      return helper.success(res, "Rating added Successfully", add_rating);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
 ratingdetail: async (req, res) => {
     try {
       let v = new Validator({});
       let validationError = await helper.checkValidation(v);
       if (validationError) {
         return helper.error400(res, validationError);
       }
       let rating_detail = await db.rating.findAll({
         where: {
           user_id: req.user.id,
         },
         order: [["id", "DESC"]],
         raw: true,
       });
 
       if (rating_detail) {
         return helper.success(
           res,
           "Rating get Successfully",
           rating_detail
         );
       } else {
         return helper.error400(res, "Rating detail not found");
       }
     } catch (error) {
       const errorMessage = error.message || "An Error occur .";
       return helper.error500(res, errorMessage);
     }
   },

  fileUpload: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const imgdata = {};
      if (req.files && req.files.image) {
        if (Array.isArray(req.files.image)) {
          await Promise.all(
            req.files.image.map(async (image, index) => {
              imgdata[`image${index}`] = await helper.fileUpload(image);
            })
          );
        } else {
          imgdata["image"] = await helper.fileUpload(req.files.image);
        }
        return helper.success(res, "File Upload Successfully", imgdata);
      }
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
