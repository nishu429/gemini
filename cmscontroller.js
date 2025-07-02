const db = require('../../models');
const bcrypt = require('bcrypt');
const helper = require("../../helper/helper");

module.exports = {
    privacy: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
            
            const privacy = await db.cms.findOne({
                where: { type: '1' },     
                   });
    
            res.render("cms/privacy", {
                title: "Privacy Policy",
                session: req.session.admin,
              privacy,
            });
        } catch (error) {
            console.log(error);
            res.redirect("/error"); 
        }
    },
    privacy_update: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
           let data = await db.cms.update(req.body,{
            where:{
                type:'1',
            },raw:true
           })           
           
           req.flash("success","Privacy Policy updated successfully");
           res.redirect(`back`);
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    aboutus: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
    
          
            const privacy = await db.cms.findOne({
                where: { type: "2" },     
                   });
    
            res.render("cms/aboutus", {
                title: "About Us",
                session: req.session.admin,
              privacy,
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    aboutusupdate: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
           let data = await db.cms.update(req.body,{
            where:{
                type:"2",
            },raw:true,
           })           
           req.flash("success","About us updated successfully");
           res.redirect(`back`);
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    term: async (req, res) => { 
        try {
            if (!req.session.admin) return res.redirect("/login");
            const privacy = await db.cms.findOne({
                where: { type: '3' },     
                 });
            res.render("cms/terms", {
                title: "Terms&Conditions",
                session: req.session.admin,
              privacy,
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    terms: async (req, res) => {
        try {
            if (!req.session.admin) return res.redirect("/login");
           let data = await db.cms.update(req.body,{
            where:{
                type:'3',
            },raw:true
           })           
           req.flash("success","Terms and Conditions updated successfully");
           res.redirect(`back`);
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
}

            

            
    
    

