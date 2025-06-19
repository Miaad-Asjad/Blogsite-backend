import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});


const handlebarOptions = {
  viewEngine: {
    extname: ".hbs",
    partialsDir: path.resolve(__dirname, "../views/emails/"),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, "../views/emails/"),
  extName: ".hbs",
};


transporter.use("compile", hbs(handlebarOptions));


// const sendEmail = async ({ to, subject, template, context }) => {
//   try {
//     await transporter.sendMail({
//       from: `"WordSphere Support" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       template,
//       context,
//     });
//     console.log(`Email sent to ${to}`);
//   } catch (err) {
//     console.error("Error sending email:", err);
//     throw new Error("Email sending failed");
//   }
// };



const sendEmail = async ({ to, subject, template, context }) => {
  try {
    const info = transporter.sendMail({
      from: `"WordSphere Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      template,
      context,
    });

    console.log(`Email sent to ${to}, Message ID: ${info.messageId}`);
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Email sending failed");
  }
};



export default sendEmail;

