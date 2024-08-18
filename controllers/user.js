const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Post = require("../models/post");
const cloudinary = require("cloudinary").v2;
require('dotenv').config();

const secret = process.env.JWT_SECRET;

async function handleUserRegistration(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    user = new User({
      username,
      email,
      password,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, secret, { expiresIn: "3d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserLogin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(payload, secret, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserLogout(req, res) {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function handleUserViewById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}


async function handleUserDeleteAccount(req, res) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    await Post.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);

    res.json({ msg: "User account deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserEditProfileInfo(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (req.body.username) user.username = req.body.username;
    if (req.body.bio) user.bio = req.body.bio;

    if (req.file) {
      if (user.profilePicture) {
        const publicId = user.profilePicture.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy("profile_pictures/" + publicId);
      }
      user.profilePicture = req.file.path;
    }

    await user.save();
    res.json({ msg: "Profile updated successfully", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
}

async function handleUsersSearching(req, res) {
  try {
    const regex = new RegExp(req.params.username, "i");
    const users = await User.find({ username: regex }).select(
      "username profilePicture"
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserDoFollowing(req, res) {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ msg: "Already following this user" });
    }

    currentUser.following.push(userToFollow._id);
    await currentUser.save();

    userToFollow.followers.push(currentUser._id);
    await userToFollow.save();

    res.json({ msg: "Followed user successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserFollowerList(req, res) {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "username profilePicture"
    );
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user.followers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

async function handleUserUnFollow(req, res) {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ msg: "You are not following this user" });
    }

    currentUser.following = currentUser.following.filter(
      (user) => user.toString() !== userToUnfollow._id.toString()
    );
    await currentUser.save();

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (user) => user.toString() !== currentUser._id.toString()
    );
    await userToUnfollow.save();

    res.json({ msg: "Unfollowed user successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleUserViewById,
  handleUsersSearching,
  handleUserDoFollowing,
  handleUserEditProfileInfo,
  handleUserFollowerList,
  handleUserUnFollow,
  handleUserDeleteAccount,
};
