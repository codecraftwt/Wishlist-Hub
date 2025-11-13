import { json } from "@remix-run/node";
import db from "../db.server";

export async function loader({ request }) {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    return json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV,
      version: process.version
    });
  } catch (error) {
    console.error("[health] Database connection failed:", error);
    return json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
      environment: process.env.NODE_ENV,
      version: process.version
    }, { status: 500 });
  }
}
