const { Validator } = require("node-input-validator");
const db = require("../../../models");
const helper = require("../../../helper/helper");
const { Op } = require("sequelize");
const CryptoJS = require("crypto-js");
module.exports = {
  getprofile: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let users_list = await db.users.findOne({
        where: {
          id: req.user.id,
        },
        raw: true,
      });

      return helper.success(res, "Profile Get successfully", users_list);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  userupdate: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const idToUpdate = req.user.id;
      let imagePath = "";
      if (req.files && req.files.image) {
        const folder = "admin";
        imagePath = await helper.fileupload(req.files.image, folder);
        req.body.image = imagePath;
      }
      req.body.phone_number = `${req.body.country_code}${req.body.phone}`;

      const [updatedRowsCount] = await db.users.update(req.body, {
        where: { id: idToUpdate },
      });
      if (updatedRowsCount === 0) {
        return helper.error400(res, "User not found");
      }
      const user = await db.users.findOne({
        where: { id: idToUpdate },
        raw: true,
      });

      return helper.success(res, "User Updated Successfully", user);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  aprovalstatus: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        // value: "required",
        // id: "required",
        // date: "required|",
      });

      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError); 
      }

      const { value, id, date } = req.body;
      const reciptdata = await db.packages.findOne({
        where: {
          id: id,
        },
        raw: true,
      });
      const updateStatus = await db.packages.update(
        { value: value, date: date },
        {
          where: { id: id },
        }
      );

      if (updateStatus[0] > 0) {
        let aprovalstatus = "";

        if (value == 0) {
          aprovalstatus = "both pending and completed";
        } else if (value == 1) {
          aprovalstatus = "pending";
        } else if (value == 2) {
          aprovalstatus = "completed";
        } else {
          aprovalstatus = "unknown";
        }
        //////////////////////////////// Push Notification Start ///////////////////////////////////////////
        const findSender = await db.users.findOne({
          where: { id: req.user.id },
          raw: true,
        });
        let recipt_id = reciptdata ? reciptdata.recipt_id : 0;
        const findReceiver = await db.users.findOne({
          where: { id: recipt_id },
          raw: true,
        });

        if (findReceiver && findReceiver.is_notification === 1) {
          let msg = "";
          let notificationType = 0;

          if (value == 1) {
            msg = `${findSender.name}, your package has been shipped successfully.`;
            notificationType = 4;
          } else if (value == 2) {
            msg = `${findSender.name}, your package has been delivered successfully.`;
            notificationType = 5;
          }

          if (msg && notificationType) {
            const notificationCreate = {
              sender_id: req.user.id,
              receiver_id: recipt_id,
              message: msg,
              type: notificationType,
            };

            await db.notifications.create(notificationCreate);

            const notiData = {
              title: "Gemini",
              message: msg,
              deviceToken: findReceiver.device_token,
              deviceType: findReceiver.device_type,
              Receiver_name: findReceiver.name,
              Receiver_image: findReceiver.image,
              type: notificationType,
              senderId: findSender.id,
              user2_Id: findReceiver.id,
              sender_name: findSender.name,
              sender_image: findSender.image,
            };

            await helper.sendNotification_android(
              findReceiver.device_token,
              notiData
            );
          }
        } else if (findReceiver) {
          console.log(
            "Notifications are disabled for user ID:",
            findReceiver.id
          );
        }
        /////////////////////////// Push Notification End ////////////////////////////////////////

        return helper.success(res, "Status updated successfully", {
          aprovalstatus,
        });
      } else {
        return helper.error400(
          res,
          "No rows were updated, possibly due to incorrect ID or Date."
        );
      }
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  my_status: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let where = {};

      if (req.body.type == 0) {
        where = {
          recipt_id: req.user.id,
          value: [0, 1, 2, 3,4],
        };
      } else if (req.body.type == 1) {
        where = {
          recipt_id: req.user.id,
          value: [1],
        };
      } else if (req.body.type == 2) {
        where = {
          recipt_id: req.user.id,
          value: [2],
        };
      }
      else if (req.body.type == 3) {
        where = {
          recipt_id: req.user.id,
          value: [3],
        };
      }
      else if (req.body.type == 4) {
        where = {
          recipt_id: req.user.id,
          value: [4],
        };
      }
      const package_status = await db.packages.findAll({
        where: where,

        order: [["id", "DESC"]],
      });

      return helper.success(res, "Package status", { package_status });
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  userlisting: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let user_listing = await db.users.findAll({
        where: {
          role: 1,
        },
        order: [["id", "DESC"]],
        raw: true,
      });
      return helper.success(res, "Users get Successfully", user_listing);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
 adduser: async (req, res) => {
    try {
        let v = new Validator(req.body, {
          
        });

        let validationError = await helper.checkValidation(v);
        if (validationError) {
            return helper.error400(res, validationError);
        }

        const secret = process.env.secret_key;

        const ciphertext = CryptoJS.AES.encrypt(
            req.body.user_password,
            secret
        ).toString();

        const fullphonenumber = `${req.body.country_code}${req.body.phone}`;

        const user = await db.users.create({
            name: req.body.name,
            email: req.body.email,
            country_code: req.body.country_code,
            phone:req.body.phone,
            phone_number: fullphonenumber,
            location: req.body.location,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            otp: 1111,
            password: ciphertext,
        });

        return helper.success(res, "User added successfully", user);
    } catch (error) {
        const errorMessage = error.message || "An error occurred.";
        return helper.error500(res, errorMessage);
    }
},

  user_delete: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const userId = req.query.id;

      if (!userId) {
        return helper.error400(res, "User ID is required");
      }

      const deleted = await db.users.destroy({ where: { id: userId } });

      if (!deleted) {
        return helper.error400(res, "User not found");
      }

      return helper.success(res, "User deleted successfully");
    } catch (error) {
      const errorMessage = error.message || "An Error occur while delete user.";
      return helper.error500(res, errorMessage);
    }
  },
  getadminprofile: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let users_list = await db.users.findOne({
        where: {
          id: req.user.id,
          role: 0,
        },
        raw: true,
      });
      return helper.success(res, "AdminProfile Get successfully", users_list);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  adminupdate: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const idToUpdate = req.user.id;
      const { name, email, phone, country_code } = req.body;

      const fullPhoneNumber = country_code + phone;

      const updatedRowsCount = await db.users.update(
        {
          name,
          email,
          phone,
          phone_number: fullPhoneNumber,
        },
        {
          where: { id: idToUpdate },
        }
      );
      if (updatedRowsCount === 0) {
        return helper.error400(res, "Admin not found");
      }
      let users_list = await db.users.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      return helper.success(res, "Admin Updated Successfully", users_list);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  adminhistory: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let whereCondition;

      if (req.query.value === "0") {
        whereCondition = {
          value: {
            [Op.in]: [1,2,3,4],
          },
        };
      } else if (req.query.value === "1") {
        whereCondition = { value: 1 };
      } else if (req.query.value === "2") {
        whereCondition = { value: 2 };
      } else if (req.query.value === "3") {
        whereCondition = { value: 3 };
      } else if (req.query.value === "4") {
        whereCondition = { value: 4 };
      }
      else {
        return helper.error400(res, "Invalid query parameter value");
      }

      const findHistory = await db.packages.findAll({
        where: whereCondition,
        order: [['id', 'DESC']], 
      });

      return helper.success(res, "Package status",  findHistory );
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  contactupdate: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const idToUpdate = req.body.id;
      req.body.phone_number = `${req.body.country_code}${req.body.phone}`;

      const [updatedRowsCount] = await db.users.update(req.body, {
        where: { id: idToUpdate },
      });

      if (updatedRowsCount === 0) {
        return helper.error400(res, "User not found");
      }
      const user = await db.users.findOne({
        where: { id: idToUpdate },
        raw: true,
      });
      return helper.success(res, "contact Updated Successfully", user);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
