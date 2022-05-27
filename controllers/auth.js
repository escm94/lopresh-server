import User from "../models/user";
import { hashPassword, comparePassword } from "../helpers/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import user from "../models/user";
import e from "express";

export const register = async (req, res) => {
  // console.log("REGISTER ENDPOINT => ", req.body);
  const { name, email, password, secret } = req.body;

  // validations
  if (!name) {
    return res.json({ error: "Name is required." });
  }

  if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and should be at least 6 characters long.",
    });
  }

  if (!secret) {
    return res.json({ error: "Answer is required." });
  }

  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({ error: "Email is taken." });
  }
  // hash password
  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: nanoid(6),
  });
  try {
    await user.save();
    // console.log("REGISTERED USER => ", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log("REGISTER FAILED => ", err);
    return res.status(400).send("Error. Try again.");
  }
};

export const login = async (req, res) => {
  // upon successful login, let's generate a JSON web token, and send that token to the client side (stored maybe in react state or local storage)
  // then, that token will be sent back to our server via API each time that user requires certain protected routes
  console.log(req.body);
  try {
    const { email, password } = req.body;

    // check if our db has user with that email using User model
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "No user found." });
    }

    // check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({ error: "Wrong password." });
    }

    // create signed token
    // first param - used to grab user data in this token to extract for reuse later. once we verify the token, we can easily use that later to do more stuff.
    // 2nd param - the secret used to generate the token. then later it's used to verify the token. 3rd param - expiry date for token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    user.password = undefined;
    user.secret = undefined;
    // we don't want to include the password/secret in the call to client. just send the necessary user data and token also for later use
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

export const currentUser = async (req, res) => {
  // send token in headers using POSTMAN (later will send from client)
  // verify token using expressJWT (create a middleware)
  // if verified you will get user id from that token (used during login to create signed token)
  // based on that user id, find the user from the db
  // if found, send successful response

  try {
    const user = await User.findById(req.user._id);
    // res.json(user);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

export const forgotPassword = async (req, res) => {
  // console.log(req.body);
  const { email, newPassword, secret } = req.body;
  // validation - in case people are requesting through something like Postman or some other means outside our application
  // writing these errors out like this (res.json()) helps show the error message in client a little better than res.status(400).send()
  if (!newPassword || newPassword < 6) {
    return res.json({
      error: "New password is required and must be at least 6 characters long.",
    });
  }

  if (!secret) {
    return res.json({
      error: "Secret is required.",
    });
  }

  const user = await User.findOne({ email, secret });
  if (!user) {
    return res.json({
      error: "We cannot verify you with those details.",
    });
  }

  try {
    const hashed = await hashPassword(newPassword);
    await User.findOneAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "All set! You may now log in with your new password.",
    });
  } catch (err) {
    console.log(err);
    return res.json({ error: "Something wrong. Try again." });
  }
};

export const profileUpdate = async (req, res) => {
  try {
    // console.log("profile update req body => ", req.body);
    const data = {};

    if (req.body.username) {
      data.username = req.body.username;
    }

    if (req.body.about) {
      data.about = req.body.about;
    }

    if (req.body.name) {
      data.name = req.body.name;
    }

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error:
            "Password is required and should be a minimum of 6 characters.",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }

    if (req.body.secret) {
      data.secret = req.body.secret;
    }

    if (req.body.image) {
      data.image = req.body.image;
    }

    let user = await User.findByIdAndUpdate(req.user._id, data, { new: true }); // {new: true} tells server to send client side updated content
    // console.log("updated user", user);
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.json({ error: "Duplicate username" });
    }
    console.log(err);
  }
};

export const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // user.following
    let following = user.following;
    following.push(user._id);
    const people = await User.find({ _id: { $nin: following } }).limit(10);
    res.json(people);
  } catch (err) {
    console.log(err);
  }
};

// remember, since this is technically a MIDDLEWARE function we will also use next callback
export const addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id }, // use addToSet instead of push because push does not check for duplicates
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

export const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true } // remember, this sends updated info to client
    ).select("-password -secret"); // don't show password/secret in response
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

export const userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = await User.find({ _id: user.following }).limit(100);
    res.json(following);
  } catch (err) {
    console.log(err);
  }
};

// middleware
export const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

export const userUnfollow = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

export const searchUser = async (req, res) => {
  const { query } = req.params;
  if (!query) return;
  try {
    // $regex is special method from mongodb
    // the i modifier is used to perform case-insensitive matching
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password -secret"
    );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};
