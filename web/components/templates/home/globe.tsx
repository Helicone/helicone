// import "./styles.css";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) {
      return;
    }

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 850 * 2,
      height: 850 * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 24000,
      mapBrightness: 6,
      baseColor: [0.1, 0.8, 1],
      markerColor: [1, 1, 1],
      glowColor: [0.1, 0.8, 1],
      opacity: 0.8,
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.05 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.001;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 850, height: 850, maxWidth: "100%", aspectRatio: 1 }}
    />
  );
}
