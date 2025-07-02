const helper = require('../../helper/helper');
const db = require('../../models');
const { Validator } = require('node-input-validator');

module.exports = {

    carrier_add: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
            const session = req.session.admin;

            res.render("admin/carrier/add", {
                title: "Add Carrier",
                session
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    carrier_add_post: async (req, res) => {
        try {
          
            let data = await db.carrier.create({
                name:req.body.name,
                raw: true
            });

            req.flash("success", "Data added successfully");
            res.redirect("/carrierlist");
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');

        }
    },
    carrier_list: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
            const session = req.session.admin;

            let data = await db.carrier.findAll({
                raw: true
            });

            
            res.render("admin/carrier/list", {
                session, data,
                title: "Carrier"
            })
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');

        }
    },
    carrier_view: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
            const session = req.session.admin;

            const data = await db.carrier.findOne({
                where: { id: req.params.id }
            });

            res.render("admin/carrier/view", {
                title: "Carrier Detail",
                data,
                session
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    carrier_delete: async (req, res) => {
        try {
            if (!req.params.id) {
                return res.status(400).json({ success: false, message: "carrier ID is required" });
            }
            const service = await db.carrier.findByPk(req.params.id);
            if (!service) {
                return res.status(404).json({ success: false, message: "carrier not found" });
            }
            await db.carrier.destroy({ where: { id: req.params.id } });

            return res.json({ success: true, message: "carrier deleted successfully" });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    carrier_edit_get: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");

            const data = await db.carrier.findOne({
                where: { id: req.params.id }
            });

            res.render('admin/carrier/edit', {
                session: req.session.admin,
                title: "Edit Carrier",
                data,

            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    carrier_edit_post: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");

            const carrier = await db.carrier.findOne({ where: { id: req.params.id } });
            if (!carrier) {
                return res.status(404).json({ success: false, message: "Carrier not found" });
            }

            const data = await db.carrier.update({
                name: req.body.name,
            }, {
                where: { id: req.params.id }
            });
            req.flash("success", "Carrier updated successfully");
            res.redirect("/carrierlist");

        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    carrier_status: async (req, res) => {
        try {
            const result = await db.carrier.update(
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
            return res.redirect('/dashboard');
        }
    },
}