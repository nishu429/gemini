const helper = require('../../helper/helper');
const db = require('../../models');
const { Validator } = require('node-input-validator');

module.exports = {
    createcontactus: async (req, res) => {
        try {
            const data = await db.contacts.create({
                name: req.body.name,
                email:req.body.email,
                phone_no:req.body.phone_no,
                location:req.body.location,
              
            });
            req.flash("success", "Contact added successfully");
          res.redirect('contacts');
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    getcontacts:async(req,res)=>{
        try {
            if (!req.session.admin) return res.redirect("/login");
            const data = await db.contacts.findAll({});
            res.render("contactus/contactus.ejs", {
                title: "Contacts",
                data,
                session: req.session.admin,
              });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    deletecontact: async (req, res) => {
        try {
            if (!req.params.id) {
                return res.status(400).json({ success: false, message: "contact ID is required" });
            }
            const contact = await db.contacts.findByPk(req.params.id);
            if (!contact) {
                return res.status(404).json({ success: false, message: "contact not found" });
            }
            await db.contacts.destroy({ where: { id: req.params.id } });
            console.log()

            return res.json({ success: true, message: "contact deleted successfully" });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    contactview: async(req,res)=>{
        try {
            if (!req.session.admin) return res.redirect("/login");
          const data = await db.contacts.findOne({
            where:{id:req.params.id}});
        
          res.render("contactus/contactview.ejs", {
            title: "Contact Detail",
            data,
            session: req.session.admin,
          });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
            return res.redirect('/dashboard');
        }
    },
    contactadd:async(req,res)=>{
        try {
            if (!req.session.admin) return res.redirect("/login");
            res.render("contactus/contactadd.ejs", {
                title: "Add Contact",
                session: req.session.admin,
              });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },


    chat:async(req,res)=>{
        try {
            if (!req.session.admin) return res.redirect("/login");
            res.render("chat", {
                title: "Chat",
                session: req.session.admin,
              });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
}