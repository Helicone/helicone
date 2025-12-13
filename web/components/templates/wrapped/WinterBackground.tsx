import React from "react";

export const WinterBackground: React.FC = () => {
  // Background image should be placed at /web/public/assets/wrapped/winter-background.jpg
  const backgroundImage = "/assets/wrapped/winter-background.jpg";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        }}
      />

      {/* Background image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Snowfall animation - more snowflakes! */}
      <div className="snowfall">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 15}s`,
              opacity: 0.4 + Math.random() * 0.6,
              fontSize: `${6 + Math.random() * 12}px`,
            }}
          />
        ))}
      </div>

      {/* Subtle stars/sparkles */}
      <div className="stars">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        .snowfall {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .snowflake {
          position: absolute;
          top: -20px;
          color: white;
          animation: fall linear infinite;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }

        .snowflake::before {
          content: "*";
          display: block;
        }

        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0);
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(10px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-10px);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(10px);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(0);
          }
        }

        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 2s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};
