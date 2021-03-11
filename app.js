
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Thisisthesecretforsecret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  ofString: [String]
});

const typeSchema = new mongoose.Schema({
  text: String
});

let dream = [];
let fantasy = [];
let guilt = [];
let lie = [];
let truth = [];
let experience = [];
let other = [];

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Dream = new mongoose.model("Dream", typeSchema);
const Fantasy = new mongoose.model("Fantasy", typeSchema);
const Guilt = new mongoose.model("Guilt", typeSchema);
const Lie = new mongoose.model("Lie", typeSchema);
const Truth = new mongoose.model("Truth", typeSchema);
const Experience = new mongoose.model("Experience", typeSchema);
const Other = new mongoose.model("Other", typeSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://blooming-inlet-57651.herokuapp.com/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {failureRedirect: '/login'}),
    function(req, res){
      res.redirect("/secrets");
    }
);
app.get("/privacy", function(req, res){
  res.render("privacy");
});
app.get("/about", function(req, res){
  res.render("about");
})

app.get("/login", function(req, res){
  res.render("login");
})
app.get("/register", function(req, res){
  res.render("register");
})

app.get("/dream", function(req, res){
  Dream.find({}, function(err, dreams){
    res.render("type", {
      message: dreams,
      type: "A Dream",
      typeword: "Dreams",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-dream.png"
    });
  });
});

app.get("/fantasy", function(req, res){
  Fantasy.find({}, function(err, fantasies){
    res.render("type", {
      message: fantasies,
      type: "A Fantasy",
      typeword: "Fantasies",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-fantasy.png"
    });
  });
});

app.get("/guilt", function(req, res){
  Guilt.find({}, function(err, guilts){
    res.render("type", {
      message: guilts,
      type: "A Guilt",
      typeword: "Guilts",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-guilt.png"
    });
  });
});

app.get("/lie", function(req, res){
  Lie.find({}, function(err, lies){
    res.render("type", {
      message: lies,
      type: "A Lie",
      typeword: "Lies",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-lie.png"
    });
  });
});

app.get("/truth", function(req, res){
  Truth.find({}, function(err, truths){
    res.render("type", {
      message: truths,
      type: "A Truth",
      typeword: "Truths",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-truth.png"
    });
  });
});

app.get("/experience", function(req, res){
  Experience.find({}, function(err, experiences){
    res.render("type", {
      message: experiences,
      type: "A Wild Experience",
      typeword: "Wild Experiences",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-wild-experience.png"
    });
  });
});

app.get("/other", function(req, res){
  Other.find({}, function(err, others){
    res.render("type", {
      message: others,
      type: "Other Emotions",
      typeword: "Priceless Emotions",
      image: "https://simplyconfess.com/wp-content/themes/list-mag-wp-child/img/icons/a-random-feeling.png"
    });
    console.log(others);
  });
});

app.get("/secrets", function(req, res){
  User.find({"ofString": {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else {
      if(foundUsers){
        res.render("secrets", {userWithSecrets: foundUsers});
      }
    }
  })
})

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  const type = req.body.type;
  console.log(req.user.id);
  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.ofString.push(submittedSecret);
        if(type === "dream"){
          const dream = new Dream({
            text: submittedSecret
          });
          dream.save(function(err){
            if(!err){
              console.log(Dream);
            }
          });

        } else if(type === "fantasy"){
          const fantasy = new Fantasy({
            text: submittedSecret
          });
          fantasy.save(function(err){
            if(!err){
              console.log(Fantasy);
            }
          });
        } else if(type === "guilt"){
          const guilt = new Guilt({
            text: submittedSecret
          });
          guilt.save(function(err){
            if(!err){
              console.log(Guilt);
            }
          });
        } else if(type === "lie"){
          const lie = new Lie({
            text: submittedSecret
          });
          lie.save(function(err){
            if(!err){
              console.log(Lie);
            }
          });
        } else if(type === "truth"){
          const truth = new Truth({
            text: submittedSecret
          });
          truth.save(function(err){
            if(!err){
              console.log(Truth);
            }
          });
        } else if(type === "experience"){
          const experience = new Experience({
            text: submittedSecret
          });
          experience.save(function(err){
            if(!err){
              console.log(Experience);
            }
          });
        } else {
          const other = new Other({
            text: submittedSecret
          });
          other.save(function(err){
            if(!err){
              console.log(Other);
            }
          });
        }
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

app.post("/register", function(req, res){
   User.register({username: req.body.username}, req.body.password, function(err, user){
     if(err){
       console.log(err);
       res.render("register");
     } else {
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secrets");
       })
     }
   })
});

app.post("/login", function(req, res){
   const user = new User({
     username: req.body.username,
     password: req.body.password
   });
   req.login(user, function(err){
     if(err){
       console.log(err);
     } else {
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secrets");
       });
     }
   });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server has started successfully");
});
