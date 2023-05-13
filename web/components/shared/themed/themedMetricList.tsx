import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { middleTruncString } from "../../../lib/stringHelpers";
import { clsx } from "../clsx";
import { ThemedMiniTable } from "./themedMiniTable";
import { Col } from "../layout/col";
import { Row } from "../layout/row";

interface ThemedMetricsList {
  header: string;
  values: {
    title: string;
    value: string;
  }[];
  isLoading?: boolean;
}

export function ThemedMetricList(props: ThemedMetricsList) {
  const values = props.isLoading
    ? Array(5).fill({ title: "Loading...", value: "" }, 0, 3)
    : props.values;

  return (
    <Col className="w-full items-center gap-2 bg-white p-5 rounded-md">
      <h1 className="text-2xl font-semibold border-b-2 w-full text-center pb-2">
        {props.header}
      </h1>
      <Col className="w-full">
        {values.map((value, i) => (
          <Row
            className="w-full items-center justify-between"
            key={`${value.title}-${value.value}-${i}`}
          >
            <div className="text-md h-10 text-center w-full">
              {middleTruncString(value.title ?? "NULL", 20)}
            </div>
            <div className="text-md h-10 text-center w-full">
              {middleTruncString(value.value, 20)}
            </div>
          </Row>
        ))}
      </Col>
    </Col>
  );
}
