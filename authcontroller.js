const db = require("../../models");
const bcrypt = require("bcrypt");
const helper = require("../../helper/helper");
const CryptoJS = require("crypto-js");

module.exports = {
  
  dashboard: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const users = await db.users.count({ where: { role: "1" } });
      const carrier = await db.carrier.count({});
      const reward = await db.rewards.count({});
      const contact = await db.contacts.count({});
      const package = await db.packages.count({});
      const usersByMonth = await db.users.findAll({
        where: { role: "1" },
        attributes: [
          [db.Sequelize.fn("MONTH", db.Sequelize.col("createdAt")), "month"],
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
        ],
        group: ["month"],
        order: [
          [db.Sequelize.fn("MONTH", db.Sequelize.col("createdAt")), "ASC"],
        ],
        raw: true,
      });
      const chartData = Array(12).fill(0);
      usersByMonth.forEach((item) => {
        chartData[item.month - 1] = parseInt(item.count, 10);
      });

      res.render("dashboard", {
        session: req.session.admin,
        title: "Dashboard",
        users,
        chartData,
        carrier,
        reward,
        contact,
        package,
      });
    } catch (error) {
      console.error("Error rendering dashboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  login: async (req, res) => {
    try {
      res.render("login");
    } catch (error) {
      console.error("Error rendering login page:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  loginpost: async (req, res) => {
    try {

      const { email, password } = req.body;

      const find_user = await db.users.findOne({ where: { email, role: "0" } });
      if (!find_user) {
        req.flash("error", "Invalid Email");
        return res.redirect("/login");
      }

      const bytes = CryptoJS.AES.decrypt(find_user.password, process.env.secret_key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);

      if (originalText !== password) {
        req.flash("error", "Invalid Password");
        return res.redirect("/login");
      }
      req.session.admin = find_user;
      req.flash("success", "You are logged in successfully");
      return res.redirect("/dashboard");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/login");
    }
  },
  profile: async (req, res) => {
    try {
      if (!req.session.admin) {
        return res.redirect("/login");
      }
      const profile = await db.users.findOne({
        where: { email: req.session.admin.email },
      });
      res.render("admin/profile.ejs", {
        session: req.session.admin,
        profile,
        title: "Profile",
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  edit_profile: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      let updatedata = { ...req.body };
      let folder = "admin";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        updatedata.image = images;
      }
      const profile = await db.users.update(updatedata, {
        where: {
          id: req.session.admin.id,
        },
      });

      const find_data = await db.users.findOne({
        where: {
          id: req.session.admin.id,
        },
      });

      req.session.admin = find_data;
      req.flash("success", " Update Profile succesfully ");
      res.redirect("/profile");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  password: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      res.render("admin/changepassword", {
        session: req.session.admin,
        title: "Change Password",
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  updatepassword: async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    try {
      // Check if admin is logged in
      if (!req.session.admin) return res.redirect("/login");

      // Validate input fields
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if newPassword and confirmPassword match
      if (newPassword !== confirmPassword) {
        req.flash("error", "New password and confirm password do not match");
        return res
          .status(400)
          .json({ message: "New password and confirm password do not match" });
      }

      // Fetch the user from the database
      const user = await db.users.findOne({
        where: { id: req.session.admin.id },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Decrypt the stored password
      const bytes = CryptoJS.AES.decrypt(user.password, process.env.secret_key);
      const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

      // Check if the old password matches
      if (oldPassword !== decryptedPassword) {
        req.flash("error", "Old password is incorrect");
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      // Update session password (optional)
      req.session.admin.password = hashedPassword;

      // Flash success message and redirect to login
      req.flash("success", "Password updated successfully");
      res.redirect("/login");
    } catch (error) {
      console.error("Error updating password:", error);
      req.flash("error", "Something went wrong, please try again");
      res.redirect("/dashboard");
    }
  },
  logout: async (req, res) => {
    try {
      req.session.destroy();
      res.redirect("/login");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/login");
    }
  },
  user_list: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const data = await db.users.findAll({
        where: {
          role: "1",
        },
        raw: true,
      });
      res.render("admin/userlist", {
        title: "Customers",
        data,
        session: req.session.admin,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  view: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");

      let view = await db.users.findOne({
        where: {
          id: req.params.id,
        },
      });
      res.render("admin/view.ejs", {
        session: req.session.admin,
        view,
        title: "Customer Detail",
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  user_delete: async (req, res) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" });
      }
      const user = await db.users.findByPk(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      await db.users.destroy({ where: { id: userId } });

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  user_status: async (req, res) => {
    try {
      const result = await db.users.update(
        { status: req.body.status },
        { where: { id: req.body.id } }
      );
      if (result[0] === 1) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: "Status change failed" });
      }
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  customer_add_get: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const session = req.session.admin;

      res.render("admin/addcustomer.ejs", {
        title: "Add Customer",
        session,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  customer_add_post: async (req, res) => {
    try {
      let updatedata = { ...req.body };
      let folder = "admin";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        req.body.image = images;
      }

      const data = await db.users.create({
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        country_code: req.body.country_code,
        phone_number: req.body.phone_number,
        image: req.body.image,
      });
      req.flash("success", "Customer added successfully");
      res.redirect("/customerlist");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  customer_edit_get: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const session = req.session.admin;
      const view = await db.users.findOne({
        where: { id: req.params.id },
      });

      res.render("admin/editcustomer.ejs", {
        title: "Edit Customer",
        session,
        view,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  customer_edit_post: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      let updatedata = { ...req.body };
      const data = await db.users.findOne({ where: { id: req.params.id } });
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }
      let folder = "admin";
      if (req.files && req.files.image) {
        let images = await helper.fileUpload(req.files.image, folder);
        updatedata.image = images;
      }
      const update = await db.users.update(updatedata, {
        where: { id: req.params.id },
      });
      req.flash("success", "Customer updated successfully");
      res.redirect("/customerlist");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },

};
