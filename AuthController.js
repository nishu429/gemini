const { Validator } = require("node-input-validator");
const helper = require("../../../helper/helper");
const db = require("../../../models");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
module.exports = {
  signup: async (req, res) => {
    try {
      const {
        country_code,
        phone,
        name,
        email,
        password,
        device_token,
        device_type,
        role,
      } = req.body;

      let v = new Validator(req.body, {
        name: "required",
        email: "required|email",
        password: "required",
        device_token: "required",
        device_type: "required",
      });

      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      let concatenatedValue =
        country_code && phone ? country_code + phone : null;

      let existingUser = await db.users.findOne({
        where: { email },
        raw: true,
      });

      if (existingUser) {
        return helper.error400(res, "Email already exists");
      }

      const ciphertext = CryptoJS.AES.encrypt(
        password,
        process.env.secret_key
      ).toString();

      let image = "";
      let folder = "admin";
      if (req.files && req.files.image) {
      image = await helper.fileupload(req.files.image, folder);   
      }
      let newUser = await db.users.create({
        name,
        email,
        password: ciphertext,
        image,
        country_code,
        phone,
        phone_number: concatenatedValue,
        status: 1,
        role,
        login_time: helper.unixTimestamp(),
        otp: 1111,
        device_type,
        device_token,
        deletedAt: null,
      });

      const userData = await db.users.findOne({
        where: { id: newUser.id },
        raw: true,
      });

      const secret = process.env.secret_key;
      if (!secret) {
        throw new Error("Secret key is not defined");
      }

      const token = jwt.sign(
        {
          id: userData.id,
          email: userData.email,
          login_time: helper.unixTimestamp(),
        },
        secret
      );

      userData.token = token;

      return helper.success(res, "Signup successful", userData);
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },

  signin: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        email: "required",
        password: "required",
        device_type: "required",
        device_token: "required",
        role: "required",
      });

      let validationerror = await helper.checkValidation(v);
      if (validationerror) {
        return helper.error400(res, validationerror);
      }

      const { email, role } = req.body;
      const LoginTime = helper.unixTimestamp();

      const views = await db.users.findOne({
        where: {
          email: email,
          role: role,
        },
        raw: true,
      });
      if (!views) {
        return helper.error400(res, "User not register with us");
      } else {
        var bytes = CryptoJS.AES.decrypt(
          views.password,
          process.env.secret_key
        );
        var originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (originalText == req.body.password) {
          await db.users.update(
            {
              login_time: LoginTime,
              device_token: req.body.device_token,
              device_type: req.body.device_type,
            },
            {
              where: {
                id: views.id,
              },
            }
          );

          const userdata = await db.users.findOne({
            where: {
              id: views.id,
            },
            raw: true,
          });

          const secret = process.env.secret_key;

          const token = jwt.sign(
            {
              id: userdata.id,
              email: userdata.email,
              login_time: LoginTime,
            },
            secret
          );

          userdata.token = token;
          return helper.success(res, "Signin successfully", userdata);
        } else {
          return helper.error400(res, "Password is Incorrect");
        }
      }
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },
  verifyotp: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        email: "required",
        otp: "required",
      });

      let validationerror = await helper.checkValidation(v);
      if (validationerror) {
        return helper.error400({ res, validationerror });
      }

      let getuser = await db.users.findOne({
        where: {
          email: req.body.email,
        },
        raw: true,
      });
      console.log(getuser, "jjjjjj");

      if (!getuser) {
        return helper.error400(res, "invalid email");
      }

      if (getuser.otp.toString() === req.body.otp) {
        let verify = await db.users.update(
          {
            otp: 0,
            is_verify: 1,
          },
          {
            where: {
              email: req.body.email,
            },
          }
        );

        return helper.success(res, "OTP Verified Successfully", getuser);
      } else {
        return helper.error400(res, "Invalid OTP");
      }
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },
  otpresend: async (req, res) => {
    try {
      let v = new Validator(req.body, {
        email: "required",
      });

      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400({ res: validationError });
      }

      let User = await db.users.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (!User) {
        return helper.error400(res, "User not found");
      } else {
        await db.users.update(
          {
            is_verify: 0,
            otp: 1111,
          },
          {
            where: {
              email: req.body.email,
            },
          }
        );
        let updateuser = await db.users.findOne({
          where: {
            email: req.body.email,
          },
        });

        return helper.success(res, "OTP sent successfully");
      }
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },
  notificationStatus: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        is_notification: "required",
      });

      const value = JSON.parse(JSON.stringify(v));
      const errorResponse = await helper.checkValidation(v);

      if (errorResponse) {
        return helper.error400(res, errorResponse);
      }
      await db.users.update(
        { is_notification: req.body.is_notification },
        { where: { id: req.user.id } }
      );

      let detail_user = await db.users.findOne({
        attributes: ["is_notification"],
        where: { id: req.user.id },
      });
      return helper.success(
        res,
        "Notification Status Updated Successfully",
        detail_user
      );
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },
  logout: async (req, res) => {
    try {
      const updatedRows = await db.users.update(
        {
          login_time: 0,
          device_token: "",
          device_type: 0,
        },
        {
          where: {
            id: req.user.id,
          },
        }
      );

      return helper.success(res, "Logout Successfully", {});
    } catch (error) {
      const errorMessage = error.message || "Internal server error";
      return helper.error500(res, errorMessage);
    }
  },
};
