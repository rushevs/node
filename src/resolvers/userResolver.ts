import { prisma } from "../prisma";
import * as argon2 from "argon2";

const UserResolver = {
  Query: {
    getAllUsers: async () => {
      const allUsers = await prisma.users.findMany({
        include: {
          blogs: true,
          followers: true,
          following: true,
        },
      });
      return allUsers;
    },
    getUser: async (parent: any, args: any, context: any, info: any) => {
      try {
        const user = await prisma.users.findUnique({
          where: {
            id: args.id,
          },
          include: {
            blogs: true,
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

        return {
          user,
        };
      } catch (error) {
        return {
          error: {
            field: "id",
            message: error.message,
          },
        };
      }
    },

    getCommentsOfUser: async (_: any, args: any) => {
      try {
        const { userId }: { userId: string } = args;

        const comments = await prisma.comment.findMany({
          where: {
            userId,
          },
          include: {
            blog: true,
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
    register: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { username, email, password } = args.input;
        if (password.length < 6) {
          return {
            error: {
              field: "password",
              message: "Password must be at least 6 characters long",
            },
          };
        }

        if (username.length < 3) {
          return {
            error: {
              field: "username",
              message: "Username must be at least 3 characters long",
            },
          };
        }

        let regex = new RegExp(
          "([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([!#-'*+/-9=?A-Z^-~-]+(.[!#-'*+/-9=?A-Z^-~-]+)*|[[\t -Z^-~]*])"
        );

        if (!regex.test(email)) {
          return {
            error: {
              field: "email",
              message: "Invalid Email",
            },
          };
        }

        const hash = await argon2.hash(password);

        const user = await prisma.users.create({
          data: {
            username,
            email,
            password: hash,
          },
        });

        return { user };
      } catch (error) {
        return {
          error: {
            field: error.message.includes(`username`) ? "username" : "email",
            message: error.message.split(`create(\n`)[1],
          },
        };
      }
    },

    login: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { text, password }: { text: string; password: string } = args;

        const user = await prisma.users.findUnique({
          where: {
            ...(text.includes("@") ? { email: text } : { username: text }),
          },
        });

        if (!user) {
          return {
            error: {
              field: text.includes("@") ? "email" : "username",
              message: "User not found",
            },
          };
        }

        if (!(await argon2.verify(user.password, password))) {
          return {
            error: {
              field: "password",
              message: "Incorrect password",
            },
          };
        }

        return { user };
      } catch (error) {
        return {
          error: {
            field: "text",
            message: error.message,
          },
        };
      }
    },

    changePassword: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { text, newPassword }: { text: string; newPassword: string } =
          args;

        const user = await prisma.users.findUnique({
          where: {
            ...(text.includes("@") ? { email: text } : { username: text }),
          },
        });

        if (!user) {
          return {
            error: {
              field: text.includes("@") ? "email" : "username",
              message: "User not found",
            },
          };
        }

        if (newPassword.length < 6) {
          return {
            error: {
              field: "newPassword",
              message: "Password must be at least 6 characters long",
            },
          };
        }

        await prisma.users.update({
          where: {
            id: user.id,
          },
          data: {
            password: newPassword,
          },
        });

        return { user };
      } catch (error) {
        return {
          error: {
            field: "text",
            message: error.message,
          },
        };
      }
    },

    followUser: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { userId, followerId }: { userId: string; followerId: string } =
          args;

        const user = await prisma.users.findUnique({
          where: {
            id: userId,
          },
        });

        if (!user) {
          return {
            error: {
              field: "userId",
              message: "User not found",
            },
          };
        }

        const follower = await prisma.users.findUnique({
          where: {
            id: followerId,
          },
        });

        if (!follower) {
          return {
            error: {
              field: "followerId",
              message: "Follower not found",
            },
          };
        }

        const updatedFollower = await prisma.users.update({
          where: {
            id: followerId,
          },
          data: {
            following: {
              connect: {
                id: userId,
              },
            },
          },
          include: {
            followers: true,
            following: true,
            blogs: true,
          },
        });

        return { user: updatedFollower };
      } catch (error) {
        return {
          error: {
            field: "userId",
            message: error.message,
          },
        };
      }
    },

    unfollowUser: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { userId, followerId }: { userId: string; followerId: string } =
          args;

        const user = await prisma.users.findUnique({
          where: {
            id: userId,
          },
        });

        if (!user) {
          return {
            error: {
              field: "userId",
              message: "User not found",
            },
          };
        }

        const follower = await prisma.users.findUnique({
          where: {
            id: followerId,
          },
        });

        if (!follower) {
          return {
            error: {
              field: "followerId",
              message: "Follower not found",
            },
          };
        }

        const updatedFollower = await prisma.users.update({
          where: {
            id: followerId,
          },
          data: {
            following: {
              disconnect: {
                id: userId,
              },
            },
          },
          include: {
            followers: true,
            following: true,
            blogs: true,
          },
        });

        return { user: updatedFollower };
      } catch (error) {
        return {
          error: {
            field: "userId",
            message: error.message,
          },
        };
      }
    },

    deleteUser: async (parent: any, args: any, context: any, info: any) => {
      try {
        const { id }: { id: string } = args;

        const user = await prisma.users.findUnique({
          where: {
            id,
          },
        });

        if (!user) {
          return {
            error: {
              field: "userId",
              message: "User not found",
            },
            deleted: false,
          };
        }

        await prisma.users.delete({
          where: {
            id,
          },
        });

        return { deleted: true };
      } catch (error) {
        return {
          error: {
            field: "userId",
            message: error.message,
          },
          deleted: false,
        };
      }
    },
  },
};

export { UserResolver };
