const { Buffer } = require("safe-buffer");

const Keygrip = require("keygrip");

const keys = require("../../config/keys.js");

// Generating a signatures session cookie

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  // Generating a stringified Session obj and then converting it to base64 string

  const sessionObject = {
    passport: {
      user: user._id,
    },
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  //   generating a signature with keygrip
  const sig = keygrip.sign("session=" + session);

  return {
    session,
    sig,
  };
};
