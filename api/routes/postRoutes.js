import express from "express";
import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

import Post from "../mongodb/models/post.js";

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//GET all posts
router.route("/").get(async (req, res) => {
  try {
    const posts = await Post.find({});
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Fetching posts failed, please try again",
    });
  }
});

//Create a new post in the Mongo DB and save it too in the cloud
router.route("/").post(async (req, res) => {
  try {
    const { name, prompt, photo } = req.body;
    const photoUrl = await cloudinary.uploader.upload(photo);

    //create a new post in the DB
    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl.url,
    });

    res.status(200).json({ success: true, data: newPost });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to create a post, please try again",
    });
  }
});

router.route("/delete").delete(async (req, res) => {
  try {
    const { idCloud, idDB } = req.body;

    const photoUrl = await cloudinary.uploader.destroy(`${idCloud}`);

    if (photoUrl.result === "ok") {
      const postToDelete = await Post.findOneAndDelete({ _id: idDB });

      if (!postToDelete) {
        return res.status(404).json({ error: "no order find with this id" });
      }

      res.status(200).json(postToDelete);
    } else {
      res.status(500).json({
        success: false,
        message: "Unable to delete a post from cloud, please try again",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to delete a post, please try again",
    });
  }
});

export default router;
