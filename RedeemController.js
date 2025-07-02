const { raw } = require("body-parser");
const helper = require("../../helper/helper");
const db = require("../../models");
const { logger } = require("sequelize/lib/utils/logger");
db.redeem_points.belongsTo(db.users, { foreignKey: "user_id" });
module.exports = {
  
  redeempointadd: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      res.render("redeem/redeempointadd.ejs", {
        title: "RedeemPoint",
        session: req.session.admin,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  createredeempoint: async (req, res) => {
    try {
      const data = await db.redeem_points.create({
        amount_limit: req.body.amount_limit,
        redeem_points: req.body.redeem_points,
        discount: req.body.discount,
      });
      req.flash("success", "Points added successfully");
      res.redirect("/redeempointlist");
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  redeempointlist: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");

      const data = await db.redeem_points.findAll({
        include: [{
          model:db.users
        }],
      });
      res.render("redeem/redeempointlist.ejs", {
        title: "RedeemPoint",
        data,
        session: req.session.admin,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  redeempointview: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const data = await db.redeem_points.findOne({
        include: [{
          model:db.users
        }],
        where: { id: req.params.id },
      });

      res.render("redeem/redeempointview", {
        title: "RedeemPoint Detail",
        data,
        session: req.session.admin,
      });
    } catch (error) {
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  deletepoint: async (req, res) => {
    try {
      const pointId = req.params.id;

      const deletedCount = await db.redeem_points.destroy({
        where: { id: pointId },
      });

      return res
        .status(200)
        .json({ success: true, message: "Points deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      req.flash("error", "Something went wrong, please try again");
      return res.redirect("/dashboard");
    }
  },
  editredeempoint: async (req, res) => {
    try {
      if (!req.session.admin) return res.redirect("/login");
      const data = await db.redeem_points.findOne({
        where: { id: req.params.id },
      });

      res.render("redeem/editredeempoint.ejs", {
        title: "Edit Redeem",
        data,
        session: req.session.admin,
      });
    } catch (error) {
      console.error("Error ", error);
      return res.redirect("/dashboard");
    }
  },
  updateredeempoint: async (req, res) => {
    try {
        const idToUpdate = req.params.id;

        const { amount_limit,  discount } = req.body;
        const updatedRowsCount = await db.redeem_points.update(
            {
                amount_limit,
                discount,
                
            },
            { where: { id: idToUpdate } }
        );

        req.flash("msg", "Points updated successfully")
        res.redirect('/redeempointlist');
    } catch (error) {
        console.error("Error:", error);
        return res.redirect("/dashboard");
    }
  },

};
