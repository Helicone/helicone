import { RequestViews } from "@/components/shared/themed/table/RequestViews";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { createContext, ReactNode, useContext } from "react";

interface RequestViewContextType {
  view: RequestViews;
  setView: (view: RequestViews) => void;
}

const RequestViewContext = createContext<RequestViewContextType | undefined>(
  undefined
);

export function RequestViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useLocalStorage<RequestViews>("view", "table");

  return (
    <RequestViewContext.Provider value={{ view, setView }}>
      {children}
    </RequestViewContext.Provider>
  );
}

export function useRequestView() {
  const context = useContext(RequestViewContext);
  
  if (context === undefined) {
    throw new Error("useRequestView must be used within a RequestViewProvider");
  }
  
  return context;
}