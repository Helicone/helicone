import { Client } from "pg";

// const auroraCreds = process.env.AURORA_CREDS || "";
// const auroraHost = process.env.AURORA_HOST;
// const auroraPort = process.env.AURORA_PORT;
// const auroraDb = process.env.AURORA_DATABASE;

// if (!auroraCreds) {
//   res.json({ status: "healthy :)", dataBase: "no creds :(" });
//   return;
// }

// if (!auroraHost) {
//   res.json({ status: "healthy :)", dataBase: "no host :(" });
//   return;
// }

// if (!auroraPort) {
//   res.json({ status: "healthy :)", dataBase: "no port :(" });
//   return;
// }

// const client = new Client({
//   host: auroraHost,
//   port: parseInt(auroraPort),
//   user: username,
//   password: password,
//   database: auroraDb,
//   ssl: {
//     rejectUnauthorized: true, // This should be set to true for better security
//   },
// });
