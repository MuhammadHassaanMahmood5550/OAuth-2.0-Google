const express = require("express");
const passport = require("passport");
const oauthGoogleStratagy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const app = express();

app.use(express.json());
app.use(
  session({
    secret: "my_secret_key", //to encrypt/decrypt session id when sent and receive
    resave: true,
    saveUninitialized: true,
  })
);

// Hardcoded user database
const users = [
  { id: "googleId1", displayName: "User One", email: "user1@example.com", photo: "my_photo" },
];

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new oauthGoogleStratagy(
    {
      clientID:
        "*******",
      clientSecret: "*******",
      callbackURL: "http://localhost:4000/callBackURL",
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Step 1 successfully authenticted.", "accessToken", accessToken, "refreshToken", refreshToken);

      console.log("from google, data=", profile);
      //check if user exist in database
      const user = users.find((cur) => cur.id === profile.id);

      if (user) {
        done(null, user);
      } else {
        const newUser = {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          photo: profile.photos[0].value
        };
        users.push(newUser);
        done(null, newUser);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Step 2 serialize", user);
  done(null, user.id); //this serialize will convet user.id in a format taht will be easily stored in express-session.
});

passport.deserializeUser((id, done) => {
  console.log("Step 4 deserializeUser");
  const user = users.find((cur) => cur.id === id);
  if (user) {
    done(null, user);
  } else {
    done(new Error("user not found"), null);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/callBackURL",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("Step 3 callBackURL called.", "req.isAuthenticated().",
    req.isAuthenticated(), "req.session", req.session);

    res.redirect("/");
  }
);

app.get("/", (req, res) => {
  console.log(
    "Step 5 because req.isAuthenticated().",
    req.isAuthenticated(),
    "req.session",
    req.session
  );

  if (req.isAuthenticated()) {
    res.send(`<img src="${req.user.photo}" width="100"> <h1>WELCOME ${req.user.displayName}</h1>`);
  } else {
    res.send(
      `<h1>Log in to My App</h1> <a href="/auth/google">Continue with Google</a>`
    );
  }
});

app.listen(4000, () => {
  console.log("Server is listening on port 4000");
});
