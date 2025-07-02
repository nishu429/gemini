const db = require("../../../models");
const helper = require("../../../helper/helper");
const { Validator } = require("node-input-validator");
const CryptoJS = require("crypto-js");
const nodemailer = require("nodemailer");

module.exports = {
  changePassword: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        oldPassword: "required",
        newPassword: "required",
        confirmPassword: "required",
      });

      const errorResponse = await v.check();
      if (!errorResponse) {
        return helper.error400({ res: validationError });
      }

      const users = await db.users.findOne({ where: { id: req.user.id } });
      if (!users) {
        return helper.error400(res, "An Error ocuured");;
      }

      let Encrypt_data = users.password;

      var bytes = CryptoJS.AES.decrypt(Encrypt_data, "secret key 443");
      var Decrypt_data = bytes.toString(CryptoJS.enc.Utf8);

      let check_old = Decrypt_data === req.body.oldPassword;

      if (check_old) {
        var ciphertext = CryptoJS.AES.encrypt(
          req.body.newPassword,
          "secret key 443"
        ).toString();

        await db.users.update(
          { password: ciphertext },
          {
            where: { id: req.user.id },
          }
        );

        return helper.success(res, "Password changed successfully");
      } else {
        return helper.error400(res, "Old password is incorrect");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.message || "An error ocuured in comfirm password or new password";
    return helper.error500(res, errorMessage);
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        email: "required|email",
      });

      const errorResponse = await helper.checkValidation(v);
      if (errorResponse) {
        return helper.error400(res, errorResponse);
      }

      const checkEmail = await db.users.findOne({
        where: { email: req.body.email },
      });

      if (!checkEmail) {
        return helper.error400(res, "User Not Register With Us.");
      }

      const ran_token = Math.random().toString(36).substring(2, 25);

      const save_data = await db.users.update(
        {
          forgotPasswordToken: ran_token,
          created_at: helper.unixTimestamp(),
        },
        {
          where: { id: checkEmail.id },
        }
      );

      const baseUrl = `${req.protocol}://${req.get("host")}/api/resetPassword/${
        checkEmail.id
      }/${ran_token}`;

      const forgotpassword = `
                Hello ${checkEmail.name},<br> 
                Your Forgot Password Link is: <a href="${baseUrl}"><u>CLICK HERE TO RESET PASSWORD </u></a>. 
                <br><br><br> 
                Regards,<br> 
                Gemini`; 6;

      const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "2f4ff81f2403d3",
          pass: "2f683d033a710e",
        },
      });

      const info = await transporter.sendMail({
        from: '"Gemini" <raman@example.com>',
        to: req.body.email,
        subject: "Forget Password Link",
        text: "Hello User?",
        html: forgotpassword,
      });

      return helper.success(
        res,
        "Please follow the reset password link sent to your email.",
        baseUrl
      );
    } catch (error) {
      const errorMessage = error.message || "An error occurred while processing your request.";
      return helper.error500(res, errorMessage);
    }
  },
  resetPassword: async (req, res) => {
    try {
      let token = req.params.ran_token;
      let user_id = req.params.id;

      let checkToken = await db.users.findOne({
        where: {
          forgotPasswordToken: token,
        },
        raw: true,
      });

      console.log(checkToken, "Token verification");

      if (!checkToken?.forgotPasswordToken) {
        res.redirect("/api/linkExpired");
      } else {
        res.render("admin/forgotpasword", {
          token: token,
          id: user_id,
          tokenFound: true,
          layout: false,
        });
      }
    } catch (error) {
      const errorMessage = error.message || "An Error occur in Resetpassword.";
      return helper.error500(res, errorMessage);
    }
  },
  updateForgotPassword: async (req, res) => {
    try {
      let check_token = await db.users.findOne({
        where: {
          forgotPasswordToken: req.body.token,
        },
        raw: true,
      });
      if (check_token?.forgotPasswordToken) {
        const v = new Validator(req.body, {
          password: "required",
          confirm_password: "required|same:password",
        });
        let errorsResponse = await helper.checkValidation(v);
        if (errorsResponse) {
          
          return helper.error400(res, errorsResponse);
        }
        let password = v.inputs.password;
        let cipherpassword = CryptoJS.AES.encrypt(
          req.body.password,
          "secret key 443"
        ).toString();
        // var ciphertext = CryptoJS.AES.encrypt(req.body.password, 'secret key 443').toString();

        await db.users.update(
          {
            password: cipherpassword,
            forgotPasswordToken: "",
            updated_at: helper.unixTimestamp(),
          },
          {
            where: { forgotPasswordToken: req.body.token },
          }
        );
        res.render("admin/sucessmsg");
      } else {
        res.redirect("/api/resetPassword/:id/:ran_token", {
          token: 0,
          id: 0,
          tokenFound: 0,
        });
      }
    } catch (error) {
     
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  linkExpired: async (req, res) => {
    try {
      res.render("admin/expire");
    } catch (error) {
      const errorMessage = error.message || "An Error occur ";
      return helper.error500(res, errorMessage);
    }
  },
  sucessmsg: async (req, res) => {
    try {
      res.render("admin/sucessmsg", { layout: false });
    } catch (error) {
      const errorMessage = error.message || "An Error occur ";
      return helper.error500(res, errorMessage);
    }
  },
};
