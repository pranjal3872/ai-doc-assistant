const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./database');

const clientID = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;
const callbackURL = process.env.GOOGLE_CALLBACK_URL ? process.env.GOOGLE_CALLBACK_URL.trim() : '/api/auth/google/callback';

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const name = profile.displayName;
          const profilePic = profile.photos?.[0]?.value || null;
          const googleId = profile.id;

          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [{ googleId }, { email }],
            },
          });

          let user;
          if (existingUser) {
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: name || existingUser.name,
                profilePic: profilePic || existingUser.profilePic,
                googleId,
                provider: 'GOOGLE',
              },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email,
                name,
                profilePic,
                googleId,
                provider: 'GOOGLE',
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
