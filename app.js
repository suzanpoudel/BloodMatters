const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser")
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const MongoStore = require('connect-mongo');
dotenv.config();

const app = express();

//morgan middleware -  logs the request

// app.use(morgan("dev"));

app.use(
  morgan("dev", {
    skip: (req, res) => {
      return req.originalUrl.startsWith("/public");
    },
  })
);

app.use("/public/", express.static("./public"));

// Passport Config
require("./config/passport")(passport);

// DB Config
//const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Error connecting MongoDB"));
  
  app.use(cookieParser());
  // Express session
app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl:process.env.MONGO_URI })
}));
// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Express body parser
app.use(express.urlencoded({ extended: true }));


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", require("./routes/index.js"));
app.use("/users", require("./routes/users.js"));
app.use("/admin", require("./routes/admin/index.js"));
app.use("/admin", require("./routes/admin/admin.js"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on  ${PORT}`));
