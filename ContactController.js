const db = require("../../../models");
const path = require("path");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { ifError } = require("assert");
const helper = require("../../../helper/helper");
const { where } = require("sequelize");

module.exports = {
  //     supportlisting: async (req, res) => {
  //   try {
  //             let support_listing = await db.contacts.findAll({
  //                 order: [['id', 'DESC']],
  //                 raw: true,
  //             });
  //  return helper.success(res, "Contacts get Successfully", support_listing);
  //         } catch (error) {
  //             console.log("error", error);
  //             res.status(500).send("Internal Server Error");
  //         }
  //     },
  //     addsupport: async (req, res) => {
  //         try {
  //             const phoneNumber = `${req.body.country_code}${req.body.phone_number}`;
  //             const views = await db.contacts.create({
  //                 name: req.body.name,
  //                 email: req.body.email,
  //                 country_code: req.body.country_code,
  //                 phone_number: phoneNumber,
  //                 location: req.body.location,
  //                 latitude: req.body.latitude,
  //                 longitude: req.body.longitude
  //             });
  //             return helper.success(res, "Contacts added Successfully", views);
  //         } catch (error) {
  //             console.log("error", error);
  //             res.status(500).send("Internal Server Error");
  //         }
  //     },
};
