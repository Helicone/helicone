// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import {
  PropertyParam,
  getPropertyParamsV2,
} from "../../../../lib/api/properties/propertyParamsV2";
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

  const properties = await getPropertyParamsV2(
    orgId,
    property as string,
    search as string
  );

  console.log(properties);

  res.status(properties.error === null ? 200 : 500).json(properties);
}

export default withAuth(handler);
