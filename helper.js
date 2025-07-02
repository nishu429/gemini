const path = require("path");
const uuid = require("uuid").v4;
const jwt = require("jsonwebtoken");
const db = require("../models");
const { v4: uuidv4 } = require("uuid");
const webPush = require("web-push");
const admin = require("firebase-admin");
const axios = require("axios");
const fs = require("fs");
const apn = require("apn");
const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];
const push_projectName = "gemini-import-service";
const serviceAccount = require("../helper/gemini-import-service-firebase-adminsdk-aa744-ebf916c4a2.json");
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  SCOPES,
  null
);
module.exports = {
  success: function (res, message = "", body = {}) {
    return res.status(200).json({
      success: true,
      status: 200,
      message: message,
      body: body,
    });
  },

  error400: function (res, err) {
    let code =
      typeof err === "object"
        ? err.statusCode
          ? err.statusCode
          : err.code
          ? err.code
          : 400
        : 400;
    let message = typeof err === "object" ? err.message : err;
    return res.status(code).json({
      success: false,
      message: message,
      code: code,
      body: {},
    });
  },
  error500: function (res, err) {
    let code =
      typeof err === "object"
        ? err.statusCode
          ? err.statusCode
          : err.code
          ? err.code
          : 500
        : 500;
    let message = typeof err === "object" ? err.message : err;
    return res.status(code).json({
      success: false,
      message: message,
      code: code,
      body: {},
    });
  },

  fileUpload: async (file) => {
    if (!file) return null;

    const extension = path.extname(file.name);
    const filename = uuid() + extension;
    const filePath = path.join(process.cwd(), "public", "images", filename);

    try {
      await new Promise((resolve, reject) => {
        file.mv(filePath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return `/images/${filename}`;
    } catch (error) {
      console.error("Error moving file:", error);
      throw new Error("Error uploading file");
    }
  },

  fileUploads: async (files) => {
    const filepaths = [];

    for (const file of files) {
      if (file && file.name) {
        const extension = path.extname(file.name);
        const filename = uuid() + extension;

        await file.mv(path.join(process.cwd(), "/public/images", filename));

        filepaths.push(`/images/${filename}`);
      }
    }

    return filepaths;
  },

  fileupload: async (file, folder) => {
    if (file) {
      const extension = path.extname(file.name);
      const filename = uuidv4() + extension;
      await file.mv(process.cwd() + `/public/images/` + filename);
      return `/images/` + filename;
    }
    return "";
  },
  paginate: async (page, pageSize) => {
    const validPage = Math.max(parseInt(page, 10) || 1, 1);
    const validPageSize = Math.max(parseInt(pageSize, 10) || 10, 1);
    const offset = (validPage - 1) * validPageSize;
    return { limit: validPageSize, offset };
  },
  checkValidation: async (v) => {
    let errorsResponse = null;
    await v.check().then(function (matched) {
      if (!matched) {
        const validationErrors = v.errors;
        const respErrors = [];
        Object.keys(validationErrors).forEach(function (key) {
          if (validationErrors[key] && validationErrors[key].message) {
            respErrors.push(validationErrors[key].message);
          }
        });
        errorsResponse = respErrors.join(", ");
      }
    });
    return errorsResponse;
  },
  unixTimestamp: function () {
    return Math.floor(Date.now() / 1000);
  },
  imageUploadArray: async (files, folder) => {
    let filepaths = [];

    if (Array.isArray(files)) {
      await Promise.all(
        files.map(async (file) => {
          const extension = path.extname(file.name);
          if (extension) {
            const filename = uuid.v4() + extension;
            await file.mv(process.cwd() + `/public/${folder}/` + filename);
            filepaths.push(`/images/${filename}`);
          }
        })
      );
    } else if (files && files.name) {
      const extension = path.extname(files.name);
      const filename = uuid.v4() + extension;
      await files.mv(process.cwd() + `/public/${folder}/` + filename);
      filepaths.push(`/images/${filename}`);
    }

    return filepaths;
  },
  sendNotification_android: async (token, noti_data) => {
    try {
      jwtClient.authorize(async (err, tokens) => {
        if (err) {
          console.log("Error during JWT authorization:", err);
          return;
        }
        const accessToken = tokens.access_token;
        const apiUrl = `https://fcm.googleapis.com/v1/projects/${push_projectName}/messages:send`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        };
        const data = {
          message: {
            token: token,

            notification: {
              title: "Gemini ",
              body: noti_data.message,
            },

            data: {
              title: "Gemini",
              body: noti_data.message,
              deviceToken: noti_data.deviceToken,
              deviceType: JSON.stringify(noti_data.deviceType),
              Receiver_name: noti_data.Receiver_name,
              Receiver_image: noti_data.Receiver_image,
              type: JSON.stringify(noti_data.type),
              senderId: JSON.stringify(noti_data.senderId),
              user2_Id: JSON.stringify(noti_data.user2_Id),
              sender_name: noti_data.sender_name,
              sender_image: noti_data.sender_image,
            },
          },
        };
        console.log(data,"kdkdkkddkdkkdk");
        
        try {
          const response = await axios.post(apiUrl, data, { headers });
          console.log(response.data,"push sent sucessfully");
          
          return true;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return false;
    }
  },
};
