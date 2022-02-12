import { gql, ApolloServer } from "apollo-server-micro";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

const typeDefs = gql`
  type Movie @exclude(operations: [CREATE, UPDATE, DELETE]) {
    title: String!
    actors: [Person] @relationship(type: "ACTED_IN", direction: IN)
  }
  type Person @exclude(operations: [CREATE, UPDATE, DELETE]) {
    name: String!
    actedIn: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
  }
`;

const dbUri = process.env.NEO4J_URI as string;
const dbUser = process.env.NEO4J_USER as string;
const dbPass = process.env.NEO4J_PASSWORD as string;

const driver = neo4j.driver(dbUri, neo4j.auth.basic(dbUser, dbPass));

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const apolloServer = new ApolloServer({
  schema: neoSchema.schema,
  introspection: true,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

const startServer = apolloServer.start();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://studio.apollographql.com"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  } as any)(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
