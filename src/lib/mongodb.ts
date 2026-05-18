import { Db, MongoClient, type MongoClientOptions } from "mongodb";

import { AppError } from "@/lib/app-error";

const DEFAULT_MONGO_OPTIONS: MongoClientOptions = {
  appName: "statisyy",
  maxIdleTimeMS: 30_000,
  maxPoolSize: 20,
  minPoolSize: 0,
  retryWrites: true,
  serverSelectionTimeoutMS: 5_000,
};

declare global {
  var __statisyyMongoClientPromise: Promise<MongoClient> | undefined;
}

let mongoClientPromise = globalThis.__statisyyMongoClientPromise;

type MongoConfig = Readonly<{
  dbName: string;
  uri: string;
}>;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new AppError({
      code: "CONFIGURATION_ERROR",
      details: {
        env: name,
      },
      message: `Missing required environment variable: ${name}.`,
      statusCode: 500,
    });
  }

  return value;
}

function assertValidMongoUri(uri: string): void {
  let parsedUri: URL;

  try {
    parsedUri = new URL(uri);
  } catch (error) {
    throw new AppError({
      cause: error,
      code: "CONFIGURATION_ERROR",
      message: "MONGODB_URI must be a valid MongoDB connection string.",
      statusCode: 500,
    });
  }

  if (parsedUri.protocol !== "mongodb:" && parsedUri.protocol !== "mongodb+srv:") {
    throw new AppError({
      code: "CONFIGURATION_ERROR",
      message: "MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol.",
      statusCode: 500,
    });
  }
}

export function getMongoConfig(): MongoConfig {
  const uri = getRequiredEnv("MONGODB_URI");
  const dbName = getRequiredEnv("MONGODB_DB_NAME");

  assertValidMongoUri(uri);

  return {
    dbName,
    uri,
  };
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!mongoClientPromise) {
    const { uri } = getMongoConfig();
    mongoClientPromise = new MongoClient(uri, DEFAULT_MONGO_OPTIONS)
      .connect()
      .catch((error: unknown) => {
        mongoClientPromise = undefined;
        globalThis.__statisyyMongoClientPromise = undefined;

        throw new AppError({
          cause: error,
          code: "DATABASE_CONNECTION_ERROR",
          message: "Unable to connect to MongoDB.",
          statusCode: 500,
        });
      });
  }

  globalThis.__statisyyMongoClientPromise = mongoClientPromise;

  return mongoClientPromise;
}

export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName ?? getMongoConfig().dbName);
}

export function resetMongoClientForTests(): void {
  mongoClientPromise = undefined;
  globalThis.__statisyyMongoClientPromise = undefined;
}
