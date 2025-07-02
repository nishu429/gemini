const db = require("../models");
const helper = require("../helper/helper");
const { Validator } = require("node-input-validator");
const { Sequelize, or } = require("sequelize");
const {
  chat_constants,
  messages,
  users,
  socket_users,
  blocked_users,
} = require("../models");
const { Op } = Sequelize;
const database = require("../config/config.json");
const { SELECT } = require("sequelize/lib/query-types");
db.blocked_users.belongsTo(db.users, {
  foreignKey: "block_by_id",
  as: "BlockedByUser",
});
db.blocked_users.belongsTo(db.users, {
  foreignKey: "block_to_id",
  as: "BlockedToUser",
});
module.exports = function (io) {
  io.on("connection", function (socket) {
    socket.on("connect_user", async (connect_listener) => {
      try {
        const user = await db.users.findOne({
          where: { id: connect_listener.user_id },
          // raw: true,
        });
        let response_message;
        if (user) {
          await db.users.update(
            { socket_id: socket.id },
            { where: { id: connect_listener.user_id } }
          );
          response_message = { message: "Connected successfully" };
        } else {
          response_message = { message: "User not found" };
        }
        socket.emit("connect_user", response_message);
      } catch (error) {
        console.error("Error in connect_user:", error);
        socket.emit("connect_user", { message: "An error occurred" });
      }
    });

    socket.on("disconnect_user", async (connect_listener) => {
      try {
        let socket_id = socket.id;
        console.log(socket_id, "rdddddddddddddddddddddddddddddddddddddddd");

        let check_user = await db.users.findOne({
          where: {
            id: connect_listener.user_id,
          },
        });
        console.log(check_user, "ddddddd");

        if (check_user) {
          create_socket_user = await db.users.update(
            {
              onlinestatus: 0,
            },
            {
              where: {
                id: connect_listener.user_id,
              },
            }
          );
        }
        success_message = {
          success_message: "Disconnect successfully",
        };
        socket.emit("disconnect_user", success_message);
      } catch (error) {
        throw error;
      }
    });

    // Handle location update event
    socket.on("update_location", async (update_listener) => {
      try {
        const user = await db.users.findOne({
          where: { id: update_listener.user_id },
          raw: true,
        });

        let response_message;
        if (user) {
          await db.users.update(
            {
              location: update_listener.location,
              latitude: update_listener.latitude,
              longitude: update_listener.longitude,
            },
            { where: { id: update_listener.user_id } }
          );
          response_message = { message: "Location updated successfully" };
        } else {
          response_message = { message: "User not found" };
        }

        socket.emit("update_location", response_message);
      } catch (error) {
        console.error("Error in update_location:", error);
        socket.emit("update_location", { message: "An error occurred" });
      }
    });

    socket.on("send_message", async function (get_data) {
      try {
        if (get_data.userid && get_data.user2id) {
          var user_data = await chat_constants.findOne({
            where: {
              [Op.or]: [
                { userid: get_data.userid, user2id: get_data.user2id },
                { user2id: get_data.userid, userid: get_data.user2id },
              ],
            },
            raw: true,
          });
          if (user_data) {
            create_message = await db.messages.create(
              {
                userid: get_data.userid,
                user2id: get_data.user2id,
                msg_type: get_data.msg_type,
                message: get_data.message,
                constant_id: user_data.id,
              },
              { raw: true }
            );
            update_last_message = await chat_constants.update(
              {
                last_msg_id: create_message.id,
                deleted_id: 0,
              },
              {
                where: {
                  id: user_data.id,
                },
              }
            );

            // *************************Push Notification**********************start**************

            const find_sender = await db.users.findOne({
              where: {
                id: get_data.userid,
              },
              raw: true,
            });
            const find_receiver = await db.users.findOne({
              where: {
                id: get_data.user2id,
              },
              raw: true,
            });
            const msg = `${find_sender.name} sent a messge`;
            const notification_type = 3;
            if (find_receiver.is_notification == 1) {
              const noti_data = {
                title: "Gemini",
                message: msg,
                deviceToken: find_receiver.device_token,
                deviceType: find_receiver.device_type,
                Receiver_name: find_receiver.name,
                Receiver_image: find_receiver.image,
                type: notification_type,
                senderId: find_sender.id,
                user2_Id: find_receiver.id,
                sender_name: find_sender.name,
                sender_image: find_sender.image,
              };
              await helper.sendNotification_android(
                find_receiver.device_token,
                noti_data
              );
            } else {
              console.log("Notifications are disabled for user ID:");
            }
            // *************************Push Notification***************************end*********

            const getData = await messages.findOne({
              attributes: {
                include: [
                  [
                    Sequelize.literal(
                      "(SELECT name FROM users WHERE users.id  = messages.userid)"
                    ),
                    "User_Name",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT image FROM users WHERE users.id  = messages.userid)"
                    ),
                    "User_Image",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT name FROM users WHERE users.id  = messages.user2id)"
                    ),
                    "Receiver_Name",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT image FROM users WHERE users.id  = messages.user2id)"
                    ),
                    "Receiver_Image",
                  ],
                  // [sequelize.literal(`IFNULL((SELECT is_block FROM block_user WHERE block_user.block_to  = ${get_data.user2id} OR block_user.block_by = ${get_data.userid}),0)`), 'block_status'],
                ],
              },
              where: {
                id: create_message.id,
              },
              raw: true,
            });

            var get_id = await users.findOne({
              where: {
                id: get_data.user2id,
              },
              raw: true,
            });
            if (get_id) {
              io.to(get_id.socket_id).emit("send_message_listner", getData);
            }
            socket.emit("send_message_listner", getData);
          } else {
            let create_last_message = await chat_constants.create({
              userid: get_data.userid,
              user2id: get_data.user2id,
              last_msg_id: 0,
            });
            var create_message = await messages.create(
              {
                userid: get_data.userid,
                user2id: get_data.user2id,
                msg_type: get_data.msg_type,
                message: get_data.message,
                constant_id: create_last_message.dataValues.id,
              },
              { raw: true }
            );

            // *************************Push Notification**********************start**************

            const find_sender = await db.users.findOne({
              where: {
                id: get_data.userid,
              },
              raw: true,
            });

            const find_receiver = await db.users.findOne({
              where: {
                id: get_data.user2id,
              },

              raw: true,
            });

            const msg = `${find_sender.name} sent a messge`;
            const notification_type = 3;

            // Send push notification if receiver has notifications enabled
            // if (find_receiver.is_notification == 1) {
            //   const noti_data = {
            //     title: "Gemini",
            //     message: msg,
            //     deviceToken: find_receiver.device_token,
            //     deviceType: find_receiver.device_type,
            //     Receiver_name: find_receiver.name,
            //     Receiver_image: find_receiver.image,
            //     type: notification_type,
            //     senderId: find_sender.id,
            //     user2_Id: find_receiver.id,
            //     sender_name: find_sender.name,
            //     sender_image: find_sender.image,
            //   };

              await helper.sendNotification_android(
                find_receiver.device_token,
                noti_data
              );
            // } else {
            //   console.log("Notifications are disabled for user ID:");
            // }
            // *************************Push Notification***************************end*********

            const getData = await messages.findOne({
              attributes: {
                include: [
                  [
                    Sequelize.literal(
                      "(SELECT name FROM users WHERE users.id  = messages.userid)"
                    ),
                    "User_Name",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT image FROM users WHERE users.id  = messages.userid)"
                    ),
                    "User_Image",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT name FROM users WHERE users.id  = messages.user2id)"
                    ),
                    "Receiver_Name",
                  ],
                  [
                    Sequelize.literal(
                      "(SELECT image FROM users WHERE users.id  = messages.user2id)"
                    ),
                    "Receiver_Image",
                  ],
                  // [sequelize.literal(`IFNULL((SELECT is_block FROM block_user WHERE block_user.block_to  = ${get_data.user2id} and block_user.block_by = ${get_data.userid}),0)`), 'block_status'],
                ],
              },
              where: {
                id: create_message.id,
              },
              raw: true,
            });

            var get_id = await users.findOne({
              where: {
                id: get_data.user2id,
              },
              raw: true,
            });
            if (get_id) {
              io.to(get_id.socket_id).emit("send_message_listner", getData);
            }
            socket.emit("send_message_listner", getData);
          }
        }
      } catch (error) {
        socket.emit("error", { message: "An Error occurred" });
      }
    });

    //=============get_message============//
    socket.on("get_message", async (data) => {
      try {
        await messages.update(
          { read_status: 1 },
          {
            where: {
              [Op.or]: [{ user2id: data.userid }],
              read_status: 0,
            },
          }
        );
        const findMessages = await messages.findAll({
          attributes: {
            include: [
              [
                Sequelize.literal(
                  "(SELECT name FROM users WHERE users.id = messages.userid)"
                ),
                "User_Name",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = messages.userid)"
                ),
                "User_Image",
              ],

              [
                Sequelize.literal(
                  "(SELECT name FROM users WHERE users.id = messages.user2id)"
                ),
                "Receiver_Name",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = messages.user2id)"
                ),
                "Receiver_Image",
              ],
              [
                Sequelize.literal(
                  "(SELECT value FROM packages WHERE packages.user_id = messages.user2id LIMIT 1)"
                ),
                "value",
              ],

              [
                Sequelize.literal(
                  "(SELECT status  FROM blocked_users WHERE blocked_users.block_by_id = messages.userid AND blocked_users.block_to_id = messages.user2id)"
                ),
                "is_block",
              ],
            ],
          },
          where: {
            [Op.or]: [
              { userid: data.userid, user2id: data.user2id },
              { userid: data.user2id, user2id: data.userid },
            ],
            [Op.not]: [{ deleted_id: data.userid }],
          },
          raw: true,
        });
        const get_block_status = await db.blocked_users.findOne({
          where: {
            [Op.or]: [
              {
                [Op.and]: [
                  { block_by_id: data.userid },
                  { block_to_id: data.user2id },
                ],
              },
              {
                [Op.and]: [
                  { block_by_id: data.user2id },
                  { block_to_id: data.userid },
                ],
              },
            ],
          },
          include: [
            {
              model: db.users,
              as: "BlockedByUser",
              attributes: [["name", "blocked_by"]],
            },
            {
              model: db.users,
              as: "BlockedToUser",
              attributes: [["name", "blocked_to"]],
            },
          ],
        });

        socket.emit("get_message_listner", {
          messages: findMessages,
          blockStatus: get_block_status,
        });
      } catch (error) {
        return helper.error400(res, "Error in fetching messages");
      }
    });
    //=============get_chat_list==========//

    socket.on("get_chat_list", async (get_data) => {
      try {
        let whereCondition = {
          deleted_id: 0,
          [Op.or]: [{ userid: get_data.userid }, { user2id: get_data.userid }],
        };

        // Subqueries modified to return a single row with LIMIT 1
        var quer1 = [
          Sequelize.literal(
            `(SELECT name FROM users WHERE users.id=receiver_user_id AND users.id !=${get_data.userid} OR users.id=userid AND  users.id !=${get_data.userid} LIMIT 1)`
          ),
          "receivername",
        ];
        var image = [
          Sequelize.literal(
            "(SELECT image FROM users WHERE users.id=receiver_user_id LIMIT 1)"
          ),
          "receiverimage",
        ];
        var sendername = [
          Sequelize.literal(
            "(SELECT name FROM users WHERE users.id=chat_constants.userid LIMIT 1)"
          ),
          "sendername",
        ];
        var senderimage = [
          Sequelize.literal(
            "(SELECT image FROM users WHERE users.id=chat_constants.userid LIMIT 1)"
          ),
          "senderimage",
        ];
        var msg = [
          Sequelize.literal(
            "(SELECT msg_type FROM messages WHERE messages.userid=chat_constants.userid ORDER BY id DESC LIMIT 1)"
          ),
          "msgtype",
        ];

        // Fetch chat list with additional attributes (name, image, unread_msg)
        let constantList = await db.chat_constants.findAll({
          attributes: {
            include: [
              [
                Sequelize.literal(`
                    CASE 
                        WHEN chat_constants.user2id = ${get_data.userid} 
                        THEN chat_constants.userid 
                        ELSE chat_constants.user2id 
                    END
                  `),
                "receiver_user_id",
              ],
              [
                Sequelize.literal(`
                    (SELECT COUNT(*) 
                     FROM messages 
                     WHERE messages.user2id = ${get_data.userid} 
                       AND messages.read_status = 0
                    )
                  `),
                "unread_msg",
              ],
              [
                Sequelize.literal(`
                    (SELECT message 
                     FROM messages 
                     WHERE messages.id = chat_constants.last_msg_id 
                     LIMIT 1
                    )
                  `),
                "last_msg",
              ],
              quer1,
              image,
              sendername,
              senderimage,
              msg,
            ],
          },
          where: whereCondition,
          order: [["updatedAt", "DESC"]],
          raw: true,
        });

        // Emit success message
        const success_message = {
          success_message: "User Constant Chats List",
          code: 200,
          getdata: constantList,
        };
        socket.emit("get_chat_list", success_message);
      } catch (error) {
        console.log("Error fetching chat list:", error);
        const error_message = {
          error_message: "Failed to get chat list",
          code: 500,
          error: error.message,
        };

        socket.emit("get_chat_list", error_message);
      }
    });

    socket.on("blocked_users", async (data) => {
      try {
        const { block_to_id, block_by_id, status } = data;

        const findblockuser = await db.blocked_users.findOne({
          where: { block_to_id, block_by_id },
        });

        let success_message;
        if (findblockuser) {
          if (status == 1) {
            success_message = { success_message: "Already Blocked by You" };
          } else {
            await db.blocked_users.destroy({
              where: { block_to_id, block_by_id },
            });
            success_message = { success_message: "Unblock user successfully" };
          }
        } else if (status == 1) {
          await db.blocked_users.create({ block_to_id, block_by_id, status });
          success_message = { success_message: "Block user successfully" };
        } else {
          console.log("User not blocked");
          return;
        }

        const data1 = {
          blockByMe: status == 1 ? 1 : 0,
          blockByOther: 0,
        };

        socket.emit("blocked_users", { ...success_message, data: data1 });

        const socketUser = await db.users.findOne({
          where: { id: block_to_id },
        });
        if (socketUser) {
          const data2 = {
            blockByMe: 0,
            blockByOther: status == 1 ? 1 : 0,
          };

          io.to(socketUser.socket_id).emit("blocked_users", {
            ...success_message,
            data: data2,
          });
        }
      } catch (error) {
        console.error(error, ">>>>>>>>>>");
      }
    });
    
    socket.on("notification_readstatus", async (data) => {
      try {
        const userId = data.userid;

        if (!userId) {
          return socket.emit("error", { message: "User not authenticated" });
        }
        await db.notifications.update(
          { is_read: 1 },
          {
            where: {
              receiver_id: userId,
            },
          }
        );
        const notifications = await db.notifications.findAll({
          where: {
            receiver_id: userId,
          },
          order: [["id", "DESC"]],
        });
        socket.emit("notification_readstatus", {
          success_message: "Read status changed successfully",
          data: notifications,
        });
      } catch (error) {
        console.error("Error processing notification read status:", error);
        socket.emit("notification_readstatus_error", {
          message: "Error processing request",
        });
      }
    });

    socket.on("aprovalstatus", async (data) => {
      try {
        let v = new Validator(data, {
          
        });
    
        let validationError = await helper.checkValidation(v);
        if (validationError) {
          return socket.emit("statusUpdated", { message: validationError });
        }
    
        const { value, id, date } = data;
    
        const reciptdata = await db.packages.findOne({
          where: { id },
          raw: true,
        });
    
        if (!reciptdata) {
          return socket.emit("statusUpdated", { message: "Package not found." });
        }
    
        const updateStatus = await db.packages.update(
          { value, date },
          { where: { id } }
        );
    
        if (updateStatus[0] > 0) {
          let aprovalstatus = "";
          switch (value) {
            case 0:
              aprovalstatus = "both pending and completed";
              break;
            case 1:
              aprovalstatus = "pending";
              break;
            case 2:
              aprovalstatus = "ongoing";
              break;
            case 3:
              aprovalstatus = "Arrived";
              break;
            case 4:
              aprovalstatus = "Completed";
              break;
            default:
              aprovalstatus = "unknown"; 
          }
    
          const findSender = await db.users.findOne({
            where: { id: reciptdata.user_id },
            raw: true,
          });
    
          const recipt_id = reciptdata.recipt_id || null;
    
          if (!recipt_id) {
            return socket.emit("statusUpdated", { message: "Receiver not found." });
          }
    
          const findReceiver = await db.users.findOne({
            where: { id: recipt_id },
            raw: true,
          });
    
          if (findReceiver && findReceiver.is_notification === 1) {
            let msg = "";
            let notificationType = 0;
    
            switch (value) {
              case 2:
                msg = `${findSender.name},Hey? your package has been shipped successfully to Bahamas.`;
                notificationType = 4;
                break;
              case 3:
                msg = `${findSender.name},Hey? your package has arrived successfully at Bahamas.`;
                notificationType = 5;
                break;
              case 4:
                msg = `${findSender.name},Hey? your package has been delivered successfully.`;
                notificationType = 6;
                break;
              default:
                msg = `${findSender.name}, your package status has been updated.`;
                notificationType = 8; 
            }
    
            if (msg && notificationType) {
              await db.notifications.create({
                sender_id: reciptdata.user_id,
                receiver_id: recipt_id,
                message: msg,
                type: notificationType,
              });
    
              if (findReceiver.device_token) {
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
            }
          } else if (findReceiver) {
            console.log("Notifications are disabled for user ID:", findReceiver.id);
          }
    
          if (findReceiver) {
            io.to(findReceiver.socket_id).emit("statusUpdated", {
              message: "Status updated successfully",
              aprovalstatus,
            });
          }
    
          socket.emit("statusUpdated", {
            message: "Status updated successfully",
            aprovalstatus,
          });
        } else {
          socket.emit("statusUpdated", {
            message: "No rows were updated, possibly due to incorrect ID or date.",
          });
        }
      } catch (error) {
        console.error("Error updating status:", error);
        socket.emit("statusUpdated", {
          message: error?.message || "An unexpected error occurred.",
        });
      }
    });
    
  });
};
