import { prisma } from "../prisma";

const BlogResolver = {
  Query: {
    getAllBlogs: async () => {
      const allBlogs = await prisma.blog.findMany({
        include: {
          user: true,
          comments: true,
        },
      });
      return allBlogs;
    },

    getBlog: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { id }: { id: string } = args;

        const blog = await prisma.blog.findUnique({
          where: {
            id,
          },
          include: {
            user: true,
            comments: true,
            likes: true
          },
        });

        if (!blog) {
          return {
            error: {
              field: "id",
              message: "Blog not found",
            },
          };
        }

        return { blog };
      } catch (error) {
        return {
          error: {
            field: "id",
            message: error.message,
          },
        };
      }
    },

    getCommentsOnBlog: async (parent: any, args: any) => {
      try {
        const { blogId }: { blogId: string } = args;

        const comments = await prisma.comment.findMany({
          where: {
            blogId,
          },
          include: {
            user: true,
            Children: {
              include: {
                Children: true,
              },
            },
          },
        });

        return { comments };
      } catch (error) {
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },
  },

  Mutation: {
    createBlog: async (parent: any, args: any, context: any, info: any) => {
      try {
        const {
          title,
          description,
          body,
          tags,
          userId,
        }: {
          title: string;
          description: string;
          body: string;
          tags: string[];
          userId: string;
        } = args.input;

        const blog = await prisma.blog.create({
          data: {
            title,
            description,
            body,
            tags,
            userId,
          },
        });

        return { blog };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message.split("(\n")[1],
          },
        };
      }
    },

    updateBlog: async (parent: any, args: any, context: any, info: any) => {
      try {
        const {
          title,
          description,
          body,
          tags,
          userId,
        }: {
          title: string;
          description: string;
          body: string;
          tags: string[];
          userId: string;
        } = args.input;

        const { id }: { id: string } = args;

        const blog = await prisma.blog.findUnique({
          where: {
            id,
          },
        });

        if (!blog) {
          return {
            error: {
              field: "id",
              message: "Blog not found",
            },
          };
        } else if (blog.userId !== userId) {
          return {
            error: {
              field: "userId",
              message: "User not authorized",
            },
          };
        }

        const updatedBlog = await prisma.blog.update({
          where: {
            id,
          },
          data: {
            title,
            description,
            body,
            tags,
            userId,
          },
        });

        return { blog: updatedBlog };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },

    toggleLike: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { blogId, userId }: { blogId: string; userId: string } = args;

        const blog = await prisma.blog.findUnique({
          where: {
            id: blogId,
          },
        });

        if (!blog) {
          return {
            error: {
              field: "id",
              message: "Blog not found",
            },
          };
        }

        const user = await prisma.users.findUnique({
          where: {
            id: userId,
          },
        });

        if (!user) {
          return {
            error: {
              field: "id",
              message: "User not found",
            },
          };
        }

        const existingLike = await prisma.like.findUnique({
          where: {
            userId_blogId: {
              userId,
              blogId,
            },
          },
        });

        if (existingLike) {
          await prisma.like.delete({
            where: {
              userId_blogId: {
                userId,
                blogId,
              },
            },
          });
          return false;
        } else {
          await prisma.like.create({
            data: {
              userId,
              blogId,
            },
          });
          return true;
        }
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },

    deleteBlog: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { id, userId }: { id: string; userId: string } = args;

        const blog = await prisma.blog.findUnique({
          where: {
            id,
          },
        });

        if (!blog) {
          return {
            error: {
              field: "id",
              message: "Blog not found",
            },
          };
        }

        if (blog.userId !== userId) {
          return {
            error: {
              field: "userId",
              message: "User not authorized",
            },
            deleted: false,
          };
        }

        await prisma.blog.delete({
          where: {
            id,
          },
        });

        return { deleted: true };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },

    createComment: async (parent: any, args: any, context: any, info: any) => {
      try {
        const {
          blogId,
          userId,
          comment,
          parent_id,
        }: {
          blogId: string;
          userId: string;
          comment: string;
          parent_id: string | null;
        } = args;

        const blog = await prisma.blog.findUnique({
          where: {
            id: blogId,
          },
        });
        const user = await prisma.users.findUnique({
          where: {
            id: userId,
          },
        });

        if (!blog || !user) {
          return {
            error: {
              field: "id",
              message:
                "Comment cannnot be added. Error in finding blog or user",
            },
          };
        }

        let newComment = await prisma.comment.create({
          data: {
            commentBody: comment,
            userId,
            blogId,
            parent_id,
          },
          include: {
            Children: {
              include: {
                Children: true,
              },
            },
          },
        });

        return { comment: newComment };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },

    updateComment: async (parent: any, args: any, context: any, info: any) => {
      try {
        const {
          comment,
          userId,
          commentId,
        }: {
          comment: string;
          userId: string;
          commentId: string;
        } = args;

        const existingComment = await prisma.comment.findUnique({
          where: {
            id: commentId,
          },
        });

        if (!existingComment) {
          return {
            error: {
              field: "id",
              message: "Comment not found",
            },
          };
        }

        if (existingComment.userId !== userId) {
          return {
            error: {
              field: "userId",
              message: "User not authorized",
            },
          };
        }

        const updatedComment = await prisma.comment.update({
          where: {
            id: commentId,
          },
          data: {
            commentBody: comment,
          },
        });

        return { comment: updatedComment };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },

    deleteComment: async (parent: any, args: any, context: any, info: any) => {
      try {
        const {
          userId,
          commentId,
        }: {
          userId: string;
          commentId: string;
        } = args;

        const existingComment = await prisma.comment.findUnique({
          where: {
            id: commentId,
          },
        });

        if (!existingComment) {
          return {
            error: {
              field: "id",
              message: "Comment not found",
            },
          };
        }

        if (existingComment.userId !== userId) {
          return {
            error: {
              field: "userId",
              message: "User not authorized",
            },
            deleted: false,
          };
        }

        await prisma.comment.delete({
          where: {
            id: commentId,
          },
        });

        return { deleted: true };
      } catch (error) {
        console.log(error);
        return {
          error: {
            field: error.meta.field_name,
            message: error.message,
          },
        };
      }
    },
  },
};

export { BlogResolver };
