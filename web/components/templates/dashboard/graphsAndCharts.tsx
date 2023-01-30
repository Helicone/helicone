import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { RequestTable } from "./requestTable";
import TimeGraphWHeader from "./timeGraphWHeader";
import { UserTable } from "./userTable";

const GraphAndCharts = () => {
  type View = "Graph" | "Requests" | "Users";

  const [currentView, setCurrentView] = useState<View>("Graph");
  const client = useSupabaseClient();

  const differentViews: {
    name: View;
    component: JSX.Element;
  }[] = [
    {
      name: "Graph",
      component: <TimeGraphWHeader client={client} />,
    },
    {
      name: "Requests",
      component: <RequestTable client={client} />,
    },
    {
      name: "Users",
      component: <UserTable client={client} />,
    },
  ];

  return (
    <>
      <div className="h-[10%] w-full flex flex-col gap-3">
        <div className="flex flex-row gap-5 items-center overflow-auto">
          <div className="border-2 dark:border-none rounded-full grid grid-cols-2 sm:grid-cols-3 gap-2">
            {differentViews.map((view) => (
              <div
                className={
                  "items-center px-8 text-center rounded-full py-1 cursor-pointer " +
                  (view.name === currentView ? "bg-black" : "bg-gray-300")
                }
                onClick={() => setCurrentView(view.name)}
                key={view.name}
              >
                <p
                  className={
                    view.name === currentView ? "text-white" : "text-black"
                  }
                >
                  {view.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-[90%] py-5">
        {differentViews.find((view) => view.name === currentView)?.component}
      </div>
    </>
  );
};

export default GraphAndCharts;
