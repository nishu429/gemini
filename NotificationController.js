const { Validator } = require("node-input-validator");
const db = require("../../../models");
const helper = require("../../../helper/helper");
const { Sequelize } = require("sequelize");

db.notifications.belongsTo(db.users, {
  foreignKey: "receiver_id",
  as: "reciever_data",
});

db.notifications.belongsTo(db.users, {
  foreignKey: "sender_id",
  as: "sender_data",
});
module.exports = {
  notificationListing: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      const userId = req.user.id;

      const notificationListing = await db.notifications.findAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT COUNT(*) FROM notifications WHERE notifications.receiver_id = ${userId} AND is_read = 0)`
              ),
              "msg_count",
            ],
          ],
        },
        where: {
          receiver_id: userId,
        },
        include: [
          {
            model: db.users,
            as: "sender_data",
          },
          {
            model: db.users,
            as: "reciever_data",
          },
        ],
        order: [["id", "DESC"]],
      });

      return helper.success(
        res,
        "Notification fetched successfully",
        notificationListing
      );
    } catch (error) {
      const errorMessage =
        error.message || "An Error occur while getting notification .";
      return helper.error500(res, errorMessage);
    }
  },
  notification_readstatus: async (req, res) => {
    try {
      let v = new Validator({});
      let validationError = await helper.checkValidation(v);
      if (validationError) {
        return helper.error400(res, validationError);
      }
      await db.notifications.update(
        { is_read: 1 },
        {
          where: {
            receiver_id: req.user.id,
          },
        }
      );
      const notifications = await db.notifications.findAll({
        where: {
          receiver_id: req.user.id,
        },
        order: [["id", "DESC"]],
      });

      return helper.success({
        res,
        message: "Read status changed successfully",
        data: notifications,
      });
    } catch (error) {
      const errorMessage = error.message || "An Error occur .";
      return helper.error500(res, errorMessage);
    }
  },
};
