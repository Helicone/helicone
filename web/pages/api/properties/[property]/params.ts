// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import {
  PropertyParam,
  getPropertyParams,
} from "../../../../lib/api/properties/propertyParams";
import { Result } from "../../../../lib/result";

async function handler(
  options: HandlerWrapperOptions<Result<PropertyParam[], string>>
) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const {
    query: { property, search },
  } = req;

  const properties = await getPropertyParams(
    orgId,
    property as string,
    search as string
  );

  res.status(properties.error === null ? 200 : 500).json(properties);
}

export default withAuth(handler);
