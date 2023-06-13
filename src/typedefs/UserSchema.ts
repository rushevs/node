export const UserSchema = `#graphql
type User {
  id: ID
  username: String
  email: String
  image: String
  blogs: [Blog]
  likes: [Like]
  comments: [Comment]
  followers: [User]
  following: [User]
  createdAt: String
  updatedAt: String
}

type Comment {
  id: ID
  commentBody: String
  userId: String
  blogId: String
  parent_id: String
  user: User
  createdAt: String
  updatedAt: String
}

type Like {
  blogId: String
  userId: String
}

type Blog {
  id: ID
  title: String
  description: String
  body: String
  tags: [String]
  userId: String
  likes: [Like]
  user: User
  comments: [Comment]
  createdAt: String
  updatedAt: String
}

type Error {
  field: String
  message: String
}

type UserResponse {
  error: Error
  user: User
}

type BlogCommentResponse {
  error: Error
  comments: [Comment]
  user: User
  blog: Blog
}

type Query {
  getAllUsers: [User]
  getUser(id: ID!): UserResponse

  getAllBlogs: [Blog]
  getBlog(id: ID!): BlogResponse
  getCommentsOnBlog(blogId: String!): BlogCommentResponse
  getCommentsOfUser(userId: String!): BlogCommentResponse
}

input UserInput {
  username: String!
  email: String!
  password: String!
}

input BlogInput {
  title: String!
  description: String!
  body: String!
  tags: [String]
  userId: String!
}

type BlogResponse {
  error: Error
  blog: Blog
}

type DeleteResponse {
  error: Error
  deleted: Boolean
}

type CommentResponse {
  error: Error
  comment: Comment
}
type Mutation {
  register(input: UserInput!): UserResponse
  login(text: String!, password: String!): UserResponse
  changePassword(text: String!, newPassword: String!): UserResponse
  followUser(userId: String!, followerId: String!): UserResponse
  unfollowUser(userId: String!, followerId: String!): UserResponse
  deleteUser(id: ID!): DeleteResponse

  createBlog(input: BlogInput!): BlogResponse
  updateBlog(id: ID!, input: BlogInput!): BlogResponse
  toggleLike(blogId: String!, userId: String!): Boolean
  deleteBlog(id: ID!, userId: String!): DeleteResponse

# comment nested in blog
  createComment(blogId: String!, comment: String!, userId: String!, parent_id: String): CommentResponse
  updateComment(commentId: ID!, comment: String!, userId: String!): CommentResponse
  deleteComment(commentId: ID!, userId: String!): DeleteResponse

  imageUpload(image: String!, userId: String!): UserResponse

}
`;
