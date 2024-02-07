import { useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";
import { usePrompts } from "../../../services/hooks/prompts/prompts";

interface PromptsPageProps {
  request?: string;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { prompts } = usePrompts();
  return (
    <>
      <AuthHeader title={"Prompts"} />
      <div className="grid grid-cols-8 gap-8 h-full w-full pt-4">
        {prompts?.data?.map((p) => (
          <>{p.id}</>
        ))}
      </div>
    </>
  );
};

export default PromptsPage;
