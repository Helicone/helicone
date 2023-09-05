import React, { memo } from "react";
import { useStoreApi, useReactFlow, Panel } from "reactflow";

const panelStyle = {
  color: "#777",
  fontSize: 12,
};

const buttonStyle = {
  fontSize: 12,
  marginRight: 5,
  marginTop: 5,
};

const FlowButton = () => {
  const store = useStoreApi();
  const { zoomIn, zoomOut, setCenter, fitView } = useReactFlow();

  const focusNode = () => {
    const { nodeInternals } = store.getState();
    const nodes = Array.from(nodeInternals).map(([, node]) => node);

    if (nodes.length > 0) {
      const node = nodes[0];

      const x = node.position.x + node.width / 2;
      const y = node.position.y + node.height / 2;
      const zoom = 1.85;

      setCenter(x, y, { zoom, duration: 1000 });
    }
  };

  return (
    <>
      <div className="description">
        This is an example of how you can use the zoom pan helper hook
      </div>
      <div>
        <button onClick={focusNode} style={buttonStyle}>
          focus node
        </button>
        <button onClick={zoomIn} style={buttonStyle}>
          zoom in
        </button>
        <button onClick={zoomOut} style={buttonStyle}>
          zoom out
        </button>
      </div>
    </>
  );
};

export default memo(FlowButton);
