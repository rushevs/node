import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
// import { typeDefs, resolvers } from './schema';
import { resolvers } from "./resolvers/resolvers";
import { typeDefs } from "./typedefs/typedefs";

const main = async () => {
  interface MyContext {
    token?: String;
  }

  const { json } = bodyParser;

  // express server
  const app = express();
  const httpServer = http.createServer(app);

  // apollo server
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // start apollo server
  await server.start();

  // apply express middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
};

main();
