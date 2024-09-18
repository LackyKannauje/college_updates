const Post = require("../models/post");
const cloudinary = require("cloudinary").v2;

async function handlePostUploadFileReq(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    if (!req.body.title) {
      return res.status(400).json({ message: "Title required" });
    }
    const mediaArray = req.files.map((file) => {
      let type;
      if (file.mimetype.startsWith("image/")) {
        type = "image";
      } else if (file.mimetype.startsWith("video/")) {
        type = "video";
      } else if (file.mimetype === "application/pdf") {
        type = "pdf";
      } else {
        type = "other";
      }

      return {
        url: file.path,
        type: type,
      };
    });

    const newPost = new Post({
      user: req.user.id,
      title: req.body.title,
      description: req.body.description,
      media: mediaArray,
    });

    await newPost.save();
    res.json({ message: "Upload successful", post: newPost });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
}

async function handlePostEditUploadReq(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    for (const mediaItem of post.media) {
      const publicId = mediaItem.url.split("/").pop().split(".")[0];
      const mediaType = "post_" + mediaItem.type + "s/";
      await cloudinary.uploader.destroy(mediaType + publicId, {
        resource_type: mediaItem.type,
      });
    }

    if (req.body.title) {
      post.title = req.body.title;
    }
    if (req.body.description) {
      post.description = req.body.description;
    }

    if (req.files.length > 0) {
      post.media = req.files.map((file) => {
        let type;
        if (file.mimetype.startsWith("image/")) {
          type = "image";
        } else if (file.mimetype.startsWith("video/")) {
          type = "video";
        } else if (file.mimetype === "application/pdf") {
          type = "pdf";
        } else {
          type = "other";
        }

        return {
          url: file.path,
          type: type,
        };
      });
    }

    await post.save();
    res.json({ message: "Post updated successfully", post });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Failed to update post", error: err.message });
  }
}

async function handlePostDeleteReq(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    for (const mediaItem of post.media) {
      const publicId = mediaItem.url.split("/").pop().split(".")[0];
      const mediaType = "post_" + mediaItem.type + "s/";
      await cloudinary.uploader.destroy(mediaType + publicId, {
        resource_type: mediaItem.type,
      });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Failed to delete post", error: err.message });
  }
}

async function handleGetPostById(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to get post", error: err.message });
  }
}

async function handleGetAllPosts(req, res) {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username bio profilePicture");
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Failed to get posts", error: err.message });
  }
}

async function handleGetAllPostsByUserId(req, res) {
  try {
    const posts = await Post.find({ user: req.params.id })
      .sort({
        createdAt: -1,
      })
      .populate("user", "username bio profilePicture");
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Failed to get posts", error: err.message });
  }
}

async function handlePostLikeReq(req, res) {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ message: "Post already liked" });
    }
    const newLike = {
      user: req.user.id,
      createdAt: new Date(),
    };
    post.likes.push(newLike);
    await post.save();

    res.json({ message: "Post liked", likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
}

async function handlePostRemoveLikeReq(req, res) {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.likes.length === 0) {
      return res.status(400).json({ message: "Post has no likes" });
    }
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ message: "Post not liked yet" });
    }
    post.likes.remove({ user: req.user.id });
    await post.save();

    res.json({ message: "Post like deleted", likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
}

async function handlePostCommentReq(req, res) {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: userId,
      text: text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ message: "Comment added", comments: post.comments });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding comment", error: err.message });
  }
}

async function handleDeletePostComment(req, res) {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentDeleted = post.comments.every(
      (comment) => comment._id.toString() !== commentId
    );

    if (!commentDeleted) {
      return res
        .status(404)
        .json({ message: "Comment not found or already deleted" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting comment", error: err.message });
  }
}

async function handleGetCommentsByPostId(req, res) {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ comments: post.comments });
  } 
  catch (err) {
    res.status(500).json({ message: "Error getting comments", error: err.message });
  }
}

async function handleGetLikesByPostId(req, res) {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId).populate("likes.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ likes: post.likes });
  } 
  catch (err) {
    res.status(500).json({ message: "Error getting likes", error: err.message });
  }
}



async function handleGetCategoryPosts(req, res) {
  try {
    const categoriesType = req.params.type;
    const posts = await Post.find({ "media.type": categoriesType })
      .sort({ createdAt: -1 })
      .populate("user", "username bio profilePicture")
      .exec();

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  handlePostUploadFileReq,
  handlePostEditUploadReq,
  handlePostDeleteReq,
  handleGetPostById,
  handleGetAllPosts,
  handleGetAllPostsByUserId,
  handlePostLikeReq,
  handlePostRemoveLikeReq,
  handlePostCommentReq,
  handleGetCategoryPosts,
  handleDeletePostComment,
  handleGetCommentsByPostId,
  handleGetLikesByPostId
};
