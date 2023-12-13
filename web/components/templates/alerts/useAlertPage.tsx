import { useAlert, useAlertHistory } from "../../../services/hooks/alert";

const useAlertPage = (orgId: string) => {
  const {
    alert,
    alertIsLoading: isHeliconeAlertLoading,
    refetchAlert: refreshAlert,
  } = useAlert(orgId);

  const alertIsLoading = isHeliconeAlertLoading;
  alert?.data?.sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at) : null;
    const bDate = b.created_at ? new Date(b.created_at) : null;

    if (aDate && bDate) {
      if (aDate > bDate) {
        return 1;
      } else if (bDate > aDate) {
        return -1;
      }
    }

    return 0;
  });

  return {
    alertIsLoading,
    alert,
    refreshAlert,
    orgId,
  };
};

const useAlertHistoryPage = (orgId: string) => {
  const {
    alertHistory,
    alertHistoryIsLoading: isAlertHistoryLoading,
    refetchAlertHistory: refreshAlertHistory,
  } = useAlertHistory(orgId);

  const alertHistoryIsLoading = isAlertHistoryLoading;
  alertHistory?.data?.sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at) : null;
    const bDate = b.created_at ? new Date(b.created_at) : null;

    if (aDate && bDate) {
      if (a.status === "triggered" && b.status !== "triggered") {
        return -1; // a is triggered, b is not triggered, so a should come before b
      } else if (a.status !== "triggered" && b.status === "triggered") {
        return 1; // b is triggered, a is not triggered, so b should come before a
      } else if (aDate > bDate) {
        return 1; // aDate is greater than bDate, so a should come after b
      } else if (bDate > aDate) {
        return -1; // bDate is greater than aDate, so b should come after a
      }
    }
    return 0;
  });

  return {
    alertHistoryIsLoading,
    alertHistory,
    refreshAlertHistory,
  };
};

export { useAlertPage, useAlertHistoryPage };
