const admin = require("../config/firebase");


const sendNotification = async (token, title, body, imageUrl,data = {}) => {
  const message = {
    token,
    notification: { title, body, imageUrl },
    data: data, // optional custom data
  };

  return admin.messaging().send(message);
};

module.exports = sendNotification;
