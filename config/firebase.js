const admin = require("firebase-admin");
const serviceAccount = require("../thatspe-55c53-firebase-adminsdk-fbsvc-8bd63778ea.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
