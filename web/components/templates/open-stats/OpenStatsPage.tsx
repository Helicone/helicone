import { FaXTwitter } from "react-icons/fa6";
import { Col, Row } from "../../layout/common";
import { OtherStats } from "./otherStats";
import { TopStats } from "./topStats";
import { useQueryParams } from "./useQueryParams";

export const OpenStatsPage = () => {
  const { queryParams, setQueryParams } = useQueryParams();

  const tab = queryParams.tab || 0;

  return (
    <div
      className="bg-[#000004] text-white"
      style={{
        backgroundImage: "url(/assets/open-stats/planet.webp)",
        backgroundSize: "1000px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundPositionY: "-20px",
      }}
    >
      <Col className="w-full max-w-5xl items-center justify-center gap-y-[40px] px-[24px] pb-[80px] lg:mx-auto">
        <Col className="mb-[8px] mt-[180px] w-full items-center justify-center gap-[24px]">
          <div className="text-[14px] font-semibold text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <h1 className="text-center text-[48px] font-bold tracking-[30px]">
            OPEN STATS
          </h1>
          <h1 className="text-center text-[18px] font-semibold tracking-[12px] opacity-80">
            THE FUTURE IS OPEN
          </h1>

          <Col className="block w-full items-center justify-between gap-[12px] lg:hidden">
            <button
              className="flex items-center gap-[8px] rounded-lg border-2 px-[24px] py-[8px] text-[18px] font-semibold"
              onClick={() => {
                const tweetText = `Check out Helicone's Open Stats: ${window.location.href}`;
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  tweetText,
                )}`;
                window.open(tweetUrl, "_blank");
              }}
            >
              <FaXTwitter />
              <div>Share</div>
            </button>
            <Row className="gap-[16px] rounded-lg border border-[#63758933] border-opacity-20 bg-black p-[4px] font-bold">
              {["Top Stats", "Other Stats"].map((x, i) => (
                <button
                  className={`rounded-lg px-[16px] py-[8px] ${
                    tab === i ? "bg-sky-800 shadow-lg" : "bg-black"
                  }`}
                  key={`${x}-${i}`}
                  onClick={() => setQueryParams({ ...queryParams, tab: i })}
                >
                  {x}
                </button>
              ))}
            </Row>
          </Col>

          <Row className="hidden w-full justify-between lg:flex">
            <Row className="gap-[16px] rounded-lg border border-[#63758933] border-opacity-20 bg-black p-[4px] font-bold">
              {["Top Stats", "Other Stats"].map((x, i) => (
                <button
                  className={`rounded-lg px-[16px] py-[8px] ${
                    tab === i ? "bg-sky-800 shadow-lg" : "bg-black"
                  }`}
                  key={`${x}-${i}`}
                  onClick={() => setQueryParams({ ...queryParams, tab: i })}
                >
                  {x}
                </button>
              ))}
            </Row>
            <button
              className="flex items-center gap-[8px] rounded-lg border-2 px-[24px] py-[8px] text-[18px] font-semibold"
              onClick={() => {
                const tweetText = `Check out Helicone's Open Stats: ${window.location.href}`;
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  tweetText,
                )}`;
                window.open(tweetUrl, "_blank");
              }}
            >
              <FaXTwitter />
              <div>Share</div>
            </button>
          </Row>
        </Col>
        {tab === 0 ? (
          <TopStats />
        ) : (
          <OtherStats queryParamsState={{ queryParams, setQueryParams }} />
        )}
      </Col>
    </div>
  );
};
