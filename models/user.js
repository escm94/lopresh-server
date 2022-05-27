import mongoose from "mongoose";
const { Schema } = mongoose;

// instead of tables like in SQL, we can refer to these entities as documents
const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    secret: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    about: {},
    image: {
      url: String /* will be uploading our images to cloudinary so that we don't have to manage images in our db */,
      public_id: String,
    },
    role: {
      type: String,
      default: "Subscriber",
    },
    following: [{ type: Schema.ObjectId, ref: "User" }], // ObjectId - something that will be unique. created whenever you save anything in mongodb by default
    followers: [{ type: Schema.ObjectId, ref: "User" }], // ref - specifies which model the ObjectId will refer to
  },
  { timestamps: true } // each time you create/update a user, the timestamps will always be there
);

export default mongoose.model("User", userSchema);
