import { describe, it, expect, beforeEach } from "@jest/globals";
import { act } from "react";
import { useFilterStore, type FilterState } from "../filterStore";

// Helper to access state outside React
const getState = () => useFilterStore.getState();
const setState = (partial: Partial<FilterState>) => useFilterStore.setState(partial as any);

describe("useFilterStore", () => {
  beforeEach(() => {
    // Clear persisted state between tests
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
    // Reset store between tests
    act(() => {
      (useFilterStore as any).setState({
        filter: { type: "and", expressions: [] },
        activeFilterId: null,
        initialFilterId: null,
        hasUnsavedChanges: false,
        activeFilterName: null,
        alreadyLoadedOnce: false,
      });
    });
  });

  it("initializes with default values", () => {
    const state = getState();
    expect(state.filter).toEqual({ type: "and", expressions: [] });
    expect(state.activeFilterId).toBeNull();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.activeFilterName).toBeNull();
  });

  it("sets filter and tracks unsaved changes when activeFilterId set", () => {
    act(() => {
      getState().setActiveFilterId("123");
      getState().setFilter({ type: "or", expressions: [] } as any);
    });
    const state = getState();
    expect(state.filter).toEqual({ type: "or", expressions: [] });
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it("add/update/remove expressions works", () => {
    // Add a leaf expression under root AND
    act(() => {
      getState().addFilterExpression([], {
        type: "request" as any,
        field: "model",
        operator: "equals",
        value: "gpt-4",
      } as any);
    });
    expect(getState().getFilterNodeCount()).toBe(1);

    // Wrap existing in OR at root
    act(() => {
      const current = getState().filter! as any;
      const childExpressions = Array.isArray(current?.expressions)
        ? current.expressions
        : [];
      getState().updateFilterExpression([], {
        type: "or",
        expressions: [
          { type: "and", expressions: childExpressions },
        ],
      } as any);
    });
    expect(getState().getFilterExpression([0])?.type).toBe("and");

    // Remove the child expression
    act(() => {
      getState().removeFilterExpression([0]);
    });
    const f = getState().filter!;
    expect((f as any).expressions.length).toBe(0);
  });

  it("loadFilterContents sets id, name, and loaded flag", () => {
    act(() => {
      getState().loadFilterContents({
        filter: { type: "and", expressions: [] } as any,
        filterId: "abc",
        filterName: "My Filter",
      });
    });
    const state = getState();
    expect(state.activeFilterId).toBe("abc");
    expect(state.activeFilterName).toBe("My Filter");
    expect((state as any).alreadyLoadedOnce).toBe(true);
  });

  it("clearActiveFilter resets state", () => {
    act(() => {
      getState().setActiveFilterId("1");
      getState().setActiveFilterName("X");
      getState().setFilter({ type: "or", expressions: [] } as any);
      getState().clearActiveFilter();
    });
    const state = getState();
    expect(state.activeFilterId).toBeNull();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.filter).toBeNull();
    expect(state.activeFilterName).toBe("Untitled Filter");
  });
});


