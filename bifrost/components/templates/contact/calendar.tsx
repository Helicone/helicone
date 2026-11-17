"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

function Calendar() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);
  return (
    <Cal
      calLink="silen/experiential-intro"
      calOrigin="https://experiential-labs.cal.com"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}

export default Calendar;
