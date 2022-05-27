import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const postSchema = new mongoose.Schema(
  {
    content: {
      type: {}, // coulda been string, but we will use rich text which will come with other data
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    image: {
      url: String /* will be uploading our images to cloudinary so that we don't have to manage images in our db */,
      public_id: String,
    },
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [
      {
        text: String,
        created: { type: Date, default: Date.now },
        postedBy: {
          type: ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true } // each post, when saved in db, they will have createdAt and updatedAt auto-generated with this
);

export default mongoose.model("Post", postSchema);
