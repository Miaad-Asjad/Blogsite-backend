import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js"; // 🔁 Adjust the path if needed
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js"; // 🔁 Adjust if you store elsewhere

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback", 
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value.toLowerCase();

        
        let user = await User.findOne({ email });

        if (!user) {
          user = new User({
            username: profile.displayName.replace(/\s+/g, "_").toLowerCase(),
            name: profile.displayName,
            email,
            profilePicture: profile.photos?.[0]?.value || "",
            googleId: profile.id,
            isVerified: true, 
          });
          await user.save();
        }

        
        return done(null, user);
      } catch (err) {
        console.error("❌ Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

