// test-resend.js
const { Resend } = require("resend");
const key = "re_EFSt2ZtU_P9Tanq6RXhBTNYZMAikGfyLt"; // zameni test ključem
const resend = new Resend(key);

(async () => {
  try {
    const resp = await resend.emails.send({
      from: "Autoškola Šampion <noreply@autoskolasampion.com>",
      to: "webdevelopment492@gmail.com", // koristi test email koji možeš da proveriš
      subject: "Test Resend",
      html: "<p>Ovo je test poruka iz lokalnog skripta</p>",
    });
    console.log("OK resp:", resp);
  } catch (e) {
    console.error("ERR:", e);
  }
})();