// Подключение необходимых модулей
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Подключение к базе данных MongoDB
mongoose
  .connect("mongodb://localhost/oauth", { useNewUrlParser: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Создание модели пользователя
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    googleId: String,
    name: String,
  })
);

// Настройка паспорта
passport.use(
  new GoogleStrategy(
    {
      clientID: "yourClientId",
      clientSecret: "yourClientSecret",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Проверка, есть ли пользователь в базе данных
      let existingUser = await User.findOne({ googleId: profile.id });
      if (existingUser) {
        // Если пользователь уже существует, вернуть его
        done(null, existingUser);
      } else {
        // Если пользователь новый, создать его и вернуть
        let newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
        });
        await newUser.save();
        done(null, newUser);
      }
    }
  )
);

// Настройка сериализации и десериализации пользователя
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err));
});

// Создание экземпляра Express-приложения
const app = express();

// Подключение middleware
app.use(express.urlencoded({ extended: false }));
app.use(
  require("express-session")({
    secret: "yourSecretKey",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Маршруты
app.get("/", (req, res) => {
  res.send("Home page");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Успешная аутентификация
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  res.send(`Welcome ${req.user.name}`);
});

// Запуск сервера
app.listen(3000, () => console.log("Server started"));

// Замените `'yourClientId'`, `'yourClientSecret'` и `'yourSecretKey'` на свои учетные данные OAuth в коде выше.
