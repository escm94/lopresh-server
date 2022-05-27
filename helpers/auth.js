import bcrypt from "bcrypt";

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    }); // md strength. higher power = higher processing / less performant
  });
};

export const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed); // compares the plain text password entered by user with the hashed version stored in the db
};
