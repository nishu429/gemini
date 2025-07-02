const { Validator } = require("node-input-validator");
const helper = require("../../../helper/helper");
const db = require("../../../models");
const path = require("path");
const { Sequelize, Op, where } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
db.packages.hasMany(db.specialhandling, { foreignKey: "package_id" });
db.packages.hasMany(db.package_images, { foreignKey: "package_id" });
db.notifications.belongsTo(db.packages, { foreignKey: "package_id" });

module.exports = {
  logpackage: (io) => async (req, res) => {
    try {
      const v = new Validator({});
      const validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const addPackage = await db.packages.create({
        user_id: req.user.id,
        recipt_id: parseInt(req.body.recipt_id, 10),
        tracking_number: req.body.tracking_number,
        carrier_id: req.body.carrier_id,
        weight: req.body.weight,
        sender: req.body.sender,
        self_location: req.body.self_location,
        current_lat: req.body.current_lat,
        current_long: req.body.current_long,
        message: req.body.message,
        price: req.body.price,
      });
      const packageId = addPackage.id;
      if (req.files && req.files.image) {
        const myImages = Array.isArray(req.files.image)
          ? req.files.image
          : [req.files.image];

        for (const imageData of myImages) {
          if (imageData.name) {
            const imageName = `${uuidv4()}${path.extname(imageData.name)}`;
            const imagePath = path.join(
              __dirname,
              "../../../public/images",
              imageName
            );
            await imageData.mv(imagePath);

            await db.package_images.create({
              package_id: packageId,
              image: `/images/${imageName}`,
            });
          }
        }
      }
      if (req.body.handlingname) {
        const handlingnamesArray = req.body.handlingname
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "");

        for (const handlingname of handlingnamesArray) {
          await db.specialhandling.create({
            package_id: packageId,
            hadlingname: handlingname,
          });
        }
      }

      /////////////////////////// Push Notification Start///////////////////////////////////////////

      const findSender = await db.users.findOne({
        where: { id: req.user.id },
        raw: true,
      });

      const findReceiver = await db.users.findOne({
        where: { id: req.body.recipt_id },
        raw: true,
      });

      const msg = `${findSender.name} Hey? Your package Added sucessfully and will shipped soon`;
      const notificationType = 2;

      const notificationCreate = {
        sender_id: req.user.id,
        receiver_id: req.body.recipt_id,
        message: msg,
        type: notificationType,
      };

      await db.notifications.create(notificationCreate);

      if (findReceiver && findReceiver.is_notification === 1) {
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
      if (io && findReceiver.socket_id) {
        io.to(findReceiver.socket_id).emit("statusUpdated", {
          message: "A new package added successfully!",
          value: 0,
        });
      }
      ///////////////////////////////////////////Push Notification End////////////////////////////////////
      return helper.success(
        res,
        "Package logged added successfully",
        addPackage
      );
    } catch (error) {
      console.log(error);

      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  logpackagedetail: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let package = await db.packages.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT name FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "receipt_name",
            ],

            [
              Sequelize.literal(
                `(SELECT redeem_point FROM notifications WHERE notifications.package_id = packages.id LIMIT 1)`
              ),
              "user_redeempoint",
            ],
            [
              Sequelize.literal(
                `(SELECT final_price FROM notifications WHERE notifications.package_id = packages.id LIMIT 1)`
              ),
              "user_finalprice",
            ],
            [
              Sequelize.literal(
                `(SELECT image FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "receipt_image",
            ],
            [
              Sequelize.literal(
                `(SELECT wallet FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "userwallet",
            ],
            [
              Sequelize.literal(
                `(SELECT redeem_point FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "usertotalredeempoint",
            ],
            [
              Sequelize.literal(
                `(SELECT rating FROM rating WHERE rating.package_id = packages.id LIMIT 1)`
              ),
              "totalrating",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM package_images WHERE package_images.package_id = packages.id LIMIT 1 )`
              ),
              "image_count",
            ],
            [
              Sequelize.literal(
                `(CASE 
                  WHEN (SELECT rating FROM rating WHERE rating.package_id = packages.id LIMIT 1) IS NOT NULL 
                  THEN 1 
                  ELSE 0 
                END)`
              ),
              "israting",
            ],
          ],
        },
        include: [
          {
            model: db.specialhandling,
          },
          {
            model: db.package_images,
          },
        ],
        where: {
          id: req.query.id.split(","),
        },
      });

      return helper.success(res, "package detail get sucessfully", package);
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  user_logpackagedetail: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let user_package = await db.packages.findOne({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT name FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "receipt_name",
            ],
            [
              Sequelize.literal(
                `(SELECT image FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "receipt_image",
            ],
            [
              Sequelize.literal(
                `(SELECT wallet FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "userwallet",
            ],
            [
              Sequelize.literal(
                `(SELECT redeem_point FROM users WHERE users.id = packages.recipt_id LIMIT 1)`
              ),
              "usertotalredeempoint",
            ],
            [
              Sequelize.literal(
                `(SELECT rating FROM rating WHERE rating.package_id = packages.id LIMIT 1)`
              ),
              "totalrating",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM package_images WHERE package_images.package_id = packages.id LIMIT 1 )`
              ),
              "image_count",
            ],
            [
              Sequelize.literal(
                `(SELECT redeem_point FROM notifications WHERE notifications.package_id = packages.id  LIMIT 1)`
              ),
              "user_redeempoint",
            ],
            [
              Sequelize.literal(
                `(SELECT final_price FROM notifications WHERE notifications.package_id = packages.id LIMIT 1)`
              ),
              "user_finalprice",
            ],

            [
              Sequelize.literal(
                `(CASE 
                  WHEN (SELECT rating FROM rating WHERE rating.package_id = packages.id LIMIT 1) IS NOT NULL 
                  THEN 1 
                  ELSE 0 
                END)`
              ),
              "israting",
            ],
          ],
        },
        include: [
          {
            model: db.specialhandling,
          },
          {
            model: db.package_images,
          },
        ],
        where: {
          id: req.query.id,
          recipt_id: req.user.id,
        },
      });
      return helper.success(
        res,
        "package detail get sucessfully",
        user_package || {}
      );
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  logpackageout: async (req, res) => {
    try {
      let v = new Validator({
        page: "required",
        pageSize: "required",
      });
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const { page = 1, pageSize = 10 } = req.query;
      const { limit, offset } = await helper.paginate(page, pageSize);

      let where = {};
      if (req.query.date) {
        where.createdAt = {
          [Op.gte]: new Date(`${req.query.date}T00:00:00`),
          [Op.lte]: new Date(`${req.query.date}T23:59:59`),
        };
      }

      let { rows, count } = await db.packages.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT name FROM users WHERE users.id = packages.recipt_id)`
              ),
              "receipt_name",
            ],
          ],
        },
        where,
        order: [["id", "DESC"]],
        raw: true,
        limit,
        offset,
      });

      return helper.success(res, "Packages retrieved successfully", {
        data: rows,
        totalpackage: count,
        totalPages: Math.ceil(count / pageSize),
        currentPage: page,
      });
    } catch (error) {
      console.error("Error retrieving packages:", error);
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
  getcarrier: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      let carrier_listing = await db.carrier.findAll({
        order: [["id", "DESC"]],
        raw: true,
      });

      return helper.success(res, "carriers get Successfully", carrier_listing);
    } catch (error) {
      console.log("error", error);
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },

  deliver_package: (io) => async (req, res) => {
    try {
      let find_price = await db.redeem_points.findOne({
        where: {
          package_id: req.body.package_id,
        },
      });
      let findprice = await db.packages.findOne({
        where: {
          id: req.body.package_id,
        },
      });
      const currentTimestamp = new Date().toISOString();
      let pointsEarned = find_price ? find_price.sub_total * 0.1 : findprice.price * 0.1;
    
      let deliver_package = await db.packages.update(
        {
          deliver_date: currentTimestamp,
          value: 4,
          wallet: db.sequelize.literal(`wallet + ${pointsEarned}`),
        },
        {
          where: { id: req.body.package_id },
        }
      );

      let user_wallet = await db.users.update(
        {
          wallet: db.sequelize.literal(`wallet + ${pointsEarned}`),
        },
        {
          where: { id: req.body.recipt_id },
        }
      );
      let deliver_packages = await db.packages.findOne({
        where: {
          id: req.body.package_id,
        },
      });
      /////////////////////////// Push Notification Start///////////////////////////////////////////

      const findSender = await db.users.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      const findReceiver = await db.users.findOne({
        where: { id: req.body.recipt_id },
        raw: true,
      });

      const msg = `${findSender.name}Hey? Your package delivered sucessfully`;
      const notificationType = 6;

      const notificationCreate = {
        sender_id: req.user.id,
        receiver_id: req.body.recipt_id,
        message: msg,
        type: notificationType,
      };

      await db.notifications.create(notificationCreate);

      if (findReceiver && findReceiver.is_notification === 1) {
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
      if (io && findReceiver.socket_id) {
        io.to(findReceiver.socket_id).emit("statusUpdated", {
          message: "your package delivered successfully!",
          value: 3,
        });
      }
      return helper.success( 
        res,
        "Price and wallet updated successfully",
        deliver_packages
      );
    } catch (error) {
      console.error("Error updating package and wallet: ", error);
      return helper.error500(res, "Failed to update price and wallet");
    }
  },

  homedetail: async (req, res) => {
    try {
      let user = await db.users.findOne({
        where: {
          id: req.user.id,
        },
        attributes: ["wallet", "redeem_point"],
      });
      return helper.success(res, "Homedetail get successfully", user);
    } catch (error) {
      console.error("Error in getting detail: ", error);
      return helper.error500(res, "Failed to update price and wallet");
    }
  },

  pointredemrequst: (io) => async (req, res) => {
    try {
      let package = await db.packages.update(
        {
          price: req.body.price,
        },
        {
          where: { id: req.body.package_id },
        }
      );
      let deliver_packages = await db.packages.findOne({
        where: { id: req.body.package_id },
      });

      if (deliver_packages) {
        var redeem_point = (deliver_packages.price * 10) / 100;
        var final_price = deliver_packages.price - redeem_point;
      }

      /////////////////////////// Push Notification Start///////////////////////////////////////////

      const findSender = await db.users.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      const findReceiver = await db.users.findOne({
        where: { id: req.body.recipt_id },
        raw: true,
      });

      const msg = `${findSender.name} You have a request to redeem points for your arriving order!Please confirm or either cancel it `;
      const notificationType = 7;

      const notificationCreate = {
        sender_id: req.user.id,
        receiver_id: req.body.recipt_id,
        message: msg,
        type: notificationType,
        package_id: req.body.package_id,
        redeem_point,
        final_price,
      };

      await db.notifications.create(notificationCreate);

      if (findReceiver && findReceiver.is_notification === 1) {
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
          package_id: req.body.package_id,
        };
        await helper.sendNotification_android(
          findReceiver.device_token,
          notiData
        );
      }
      if (io && findReceiver.socket_id) {
        io.to(findReceiver.socket_id).emit("statusUpdated", {
          message:
            "You have a request to redeem points for your arriving order!Please confirm or either cancel it",
        });
      }
      let packages = await db.packages.findOne({
        where: { id: req.body.package_id },
      });
      return helper.success(res, "requst send successfully", deliver_packages);
    } catch (error) {
      console.error("Error in getting detail: ", error);
      return helper.error500(res, "Failed to update ");
    }
  },

  redeem_points: async (req, res) => {
    try {
      const { userId, status, redeem_point, package_id } = req.body;
      const currentTimestamp = new Date().toISOString();
      let find_user = await db.users.findOne({ where: { id: userId } });

      let deliver_packages = await db.packages.findOne({
        where: { id: req.body.package_id },
      });
      var final_price = deliver_packages.price - redeem_point;
      if (status == 1) {
        if (find_user.wallet < redeem_point) {
          return helper.error400(res, "Insufficent wallet balance");
        }
        const uniqueId = Date.now();

        await db.redeem_points.create({
          user_id: userId,
          amount: deliver_packages.price,
          redeem_points: redeem_point,
          discount: redeem_point,
          unique_id: uniqueId,
          date_time: currentTimestamp,
          sub_total: final_price,
          status: 1,
          user_id: req.user.id,
          package_id:deliver_packages.id
        });
        await db.users.update(
          {
            wallet: Number(find_user.wallet) - Number(redeem_point),
            redeem_point: Number(find_user.redeem_point) + Number(redeem_point),
            is_redeem: 1,
          },
          { where: { id: userId } }
        );

        await db.packages.update(
          {
            is_redeem: 1,
            
          },
          { where: { id: package_id } }
        );

        ////////////////////////////////////////////////////pushnotification///////////////////////////////////////
        const findSender = await db.users.findOne({
          where: { id: req.user.id },
          raw: true,
        });
        const findReceiver = await db.users.findOne({
          where: { id: 1 },
          raw: true,
        });

        const msg = `${findSender.name} have sucessfully redeem the point `;
        const notificationType = 9;

        const notificationCreate = {
          sender_id: req.user.id,
          receiver_id: 1,
          message: msg,
          type: notificationType,
          package_id: req.body.package_id,
          redeem_point: 0,
          final_price: 0,
        };

        await db.notifications.create(notificationCreate);

        if (findReceiver && findReceiver.is_notification === 1) {
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
            package_id: req.body.package_id,
          };
          await helper.sendNotification_android(
            findReceiver.device_token,
            notiData
          );
        }
        ////////////////////////////////////////////////////pushnotification////////////////////////////////////////
        return helper.success(res, "Points redeemed successfully");
      } else {
        await db.users.update(
          {
            is_redeem: 2,
          },
          { where: { id: userId } }
        );

        await db.packages.update(
          {
            is_redeem: 2,
          },
          { where: { id: package_id } }
        );
        ////////////////////////////////////////////////////pushnotification/////////////////////////////////
        const findSender = await db.users.findOne({
          where: { id: req.user.id },
          raw: true,
        });
        const findReceiver = await db.users.findOne({
          where: { id: 1 },
          raw: true,
        });

        const msg = `${findSender.name} have cancel the redeem  point requst `;
        const notificationType = 10;

        const notificationCreate = {
          sender_id: req.user.id,
          receiver_id: 1,
          message: msg,
          type: notificationType,
          package_id: req.body.package_id,
          redeem_point: 0,
          final_price: 0,
        };

        await db.notifications.create(notificationCreate);

        if (findReceiver && findReceiver.is_notification === 1) {
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
            package_id: req.body.package_id,
          };
          console.log("Notification Data:", notiData);
          await helper.sendNotification_android(
            findReceiver.device_token,
            notiData
          );
        }
        ////////////////////////////////////////////////////pushnotification/////////////////////////////////
        return helper.success(
          res,
          "You have canceled the request for point redemption"
        );
      }
    } catch (error) {
      console.error("Error in redeeming points: ", error);
      return helper.error500(res, "Failed to update");
    }
  },

  requstlist: async (req, res) => {
    try {
      let request_list = await db.notifications.findAll({
        attributes: [
          "id",
          "package_id",
          "sender_id",
          "receiver_id",
          "type",
          "message",
          "redeem_point",
          "final_price",
          [
            Sequelize.literal(
              `(SELECT redeem_point FROM users WHERE users.id = notifications.receiver_id LIMIT 1)`
            ),
            "redeempoint",
          ],
          [
            Sequelize.literal(
              `(SELECT wallet FROM users WHERE users.id = notifications.receiver_id LIMIT 1)`
            ),
            "walletamount",
          ],
          [
            Sequelize.literal(
              `(SELECT is_redeem FROM packages WHERE packages.id = notifications.package_id LIMIT 1)`
            ),
            "is_redeem",
          ],
        ],
        include: [
          {
            model: db.packages,
          },
        ],
        where: {
          receiver_id: req.user.id,
          type: 7,
        },
        order: [["id", "DESC"]],
      });

      return helper.success(
        res,
        "Request list retrieved successfully",
        request_list
      );
    } catch (error) {
      console.error("Error in fetching request list: ", error);
      return helper.error500(res, "Failed to get list");
    }
  },
};
