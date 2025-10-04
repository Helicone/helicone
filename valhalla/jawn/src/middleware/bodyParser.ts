import bodyParser from "body-parser";
import { Express } from "express";

const rawBodySaver = function (req: any, res: any, buf: any, encoding: any) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

export function configureBodyParser(app: Express) {
  app.use(bodyParser.json({ verify: rawBodySaver, limit: "50mb" }));
  app.use(
    bodyParser.urlencoded({
      verify: rawBodySaver,
      extended: true,
      limit: "50mb",
      parameterLimit: 50000,
    }),
  );
  app.use(bodyParser.raw({ verify: rawBodySaver, type: "*/*", limit: "50mb" }));
}
