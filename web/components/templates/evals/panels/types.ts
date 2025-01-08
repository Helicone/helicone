export type PanelType =
  | {
      _type: "main";
    }
  | {
      _type: "edit";
      selectedEvaluatorId: string | null;
    }
  | {
      _type: "create";
    }
  | {
      _type: "test";
    };
