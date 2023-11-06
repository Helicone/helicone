// // src/index.ts
// import express from "express";
// import morgan from "morgan";
// // import { Client } from "pg";

// async function testConnection() {
//   const client = new Client({
//     host: "YOUR_AURORA_ENDPOINT", // e.g., mydb-instance.123456789012.us-west-1.rds.amazonaws.com
//     port: 5432, // Default PostgreSQL port
//     user: "YOUR_DB_USERNAME",
//     password: "YOUR_DB_PASSWORD",
//     database: "YOUR_DATABASE_NAME",
//     ssl: {
//       // Depending on your Aurora PostgreSQL setup, you might need to configure SSL
//       rejectUnauthorized: false,
//     },
//   });

//   try {
//     await client.connect();

//     // Test the connection
//     const result = await client.query("SELECT NOW() as now");
//     console.log(result.rows[0].now);
//   } catch (err) {
//     console.error("Failed to connect to the database:", err);
//   } finally {
//     await client.end();
//   }
// }

// const app = express();

// // for logs
// app.use(morgan("combined"));

// app.use(express.json()); // for parsing application/json

// app.post("/v1/request", (req, res) => {
//   // Handle your logic here
//   res.json({ message: "Request received!" });
// });

// app.get("/healthcheck", (req, res) => {
//   const auroraCreds = process.env.AURORA_CREDS;
//   if (!auroraCreds) {
//     res.json({ status: "healthy :)", dataBase: "no creds :(" });
//     return;
//   }

//   const {
//     username,
//     password,
//   }: {
//     username: string;
//     password: string;
//   } = JSON.parse(auroraCreds);
//   testConnection();

//   res.json({ status: "healthy :)" });
// });

// app.listen(8586, "0.0.0.0", () => {
//   console.log(`Server is running on http://localhost:8586`);
// });

// console.log("Hello, world!");
