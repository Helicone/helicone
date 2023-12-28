import { NumberInput, Select, SelectItem } from "@tremor/react";
import FilterBadge from "../../../ui/filters/filterBadge";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface TokenFilterBadgeProps {}

export type TokenFilterOperators = "gt" | "lt" | "eq";

const TokenFilterBadge = (props: TokenFilterBadgeProps) => {
  const {} = props;

  const [operator, setOperator] = useState<TokenFilterOperators>("gt");
  const [tokenCount, setTokenCount] = useState<number>(0);

  const router = useRouter();

  const updateURL = (
    newOperator: TokenFilterOperators,
    newTokenCount: number
  ) => {
    const query = { ...router.query };
    if (newTokenCount > 0) {
      query.tokens = `${newOperator}${newTokenCount}`;
    } else {
      delete query.tokens;
    }

    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: false,
    });
  };

  const handleOperatorChange = (e: TokenFilterOperators) => {
    setOperator(e);
    updateURL(e, tokenCount);
  };

  const handleTokenCountChange = (e: number) => {
    setTokenCount(e);
    updateURL(operator, e);
  };

  useEffect(() => {
    const queryToken = router.query.tokens as string;
    if (queryToken) {
      const match = queryToken.match(/(gt|lt|eq)(\d+)/);
      if (
        match &&
        (match[1] === "gt" || match[1] === "lt" || match[1] === "eq")
      ) {
        setOperator(match[1] as "gt" | "lt" | "eq");
        setTokenCount(parseInt(match[2], 10));
      }
    }
  }, []);

  return (
    <FilterBadge
      title="Tokens"
      clearFilter={() => {
        updateURL("gt", 0);
        setTokenCount(0);
        setOperator("gt");
      }}
      label={
        tokenCount > 0
          ? `${
              operator === "gt"
                ? "greater than"
                : operator === "lt"
                ? "less than"
                : "equal to"
            } ${tokenCount}`
          : undefined
      }
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between w-full text-sm space-x-2">
          <p className="flex w-[6rem]">Tokens is</p>
          <Select
            value={operator}
            onValueChange={(e) => {
              handleOperatorChange(e as TokenFilterOperators);
            }}
          >
            <SelectItem value="gt">greater than</SelectItem>
            <SelectItem value="lt">less than</SelectItem>
            <SelectItem value="eq">equal to</SelectItem>
          </Select>
        </div>
        <div className="flex pl-8">
          <NumberInput
            placeholder="Token Count"
            value={tokenCount}
            onValueChange={(e) => {
              handleTokenCountChange(e);
            }}
          />
        </div>
      </div>
    </FilterBadge>
  );
};

export default TokenFilterBadge;
