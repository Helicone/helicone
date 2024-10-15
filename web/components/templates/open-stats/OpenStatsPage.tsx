import { FaXTwitter } from "react-icons/fa6";
import { Col, Row } from "../../layout/common";
import { OtherStats } from "./otherStats";
import { TopStats } from "./topStats";
import { useQueryParams } from "./useQueryParams";

export const colors = [
  "blue",
  "red",
  "orange",
  "amber",
  "yellow",
  "violet",
  "fuchsia",
  "rose",
  "lime",
  "cyan",
  "indigo",
  "green",
  "emerald",
  "teal",
];

export function humanReadableNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${Math.ceil(num / 1_000_000_00) / 10}B+`;
  } else if (num >= 1_000_000) {
    return `${Math.ceil(num / 1_000_00) / 10}M+`;
  } else if (num >= 1_000) {
    return `${Math.ceil(num / 100) / 10}k+`;
  }
  return num.toLocaleString();
}

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
      <Col className="pb-[80px] w-full justify-center items-center gap-y-[40px] max-w-5xl px-[24px] lg:mx-auto">
        <Col className="mb-[8px] mt-[180px] justify-center items-center gap-[24px] w-full">
          <div className="text-gray-500  font-semibold text-[14px]">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <h1 className="text-[48px] font-bold text-center tracking-[30px]">
            OPEN STATS
          </h1>
          <h1 className="text-[18px] font-semibold opacity-80 text-center tracking-[12px]">
            THE FUTURE IS OPEN
          </h1>

          <Col className="block lg:hidden items-center  gap-[12px] justify-between w-full">
            <button
              className="text-[18px] flex items-center gap-[8px] font-semibold py-[8px] px-[24px] rounded-lg border-2"
              onClick={() => {
                const tweetText = `Check out Helicone's Open Stats: ${window.location.href}`;
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  tweetText
                )}`;
                window.open(tweetUrl, "_blank");
              }}
            >
              <FaXTwitter />
              <div>Share</div>
            </button>
            <Row className="gap-[16px] bg-black p-[4px] font-bold rounded-lg border-[#63758933] border-opacity-20 border">
              {["Top Stats", "Other Stats"].map((x, i) => (
                <button
                  className={`py-[8px] px-[16px] rounded-lg ${
                    tab === i ? "bg-sky-800 shadow-lg" : " bg-black"
                  }`}
                  key={`${x}-${i}`}
                  onClick={() => setQueryParams({ ...queryParams, tab: i })}
                >
                  {x}
                </button>
              ))}
            </Row>
          </Col>

          <Row className="hidden lg:flex justify-between w-full ">
            <Row className="gap-[16px] bg-black p-[4px] font-bold rounded-lg border-[#63758933] border-opacity-20 border">
              {["Top Stats", "Other Stats"].map((x, i) => (
                <button
                  className={`py-[8px] px-[16px] rounded-lg ${
                    tab === i ? "bg-sky-800 shadow-lg" : " bg-black"
                  }`}
                  key={`${x}-${i}`}
                  onClick={() => setQueryParams({ ...queryParams, tab: i })}
                >
                  {x}
                </button>
              ))}
            </Row>
            <button
              className="text-[18px] flex items-center gap-[8px] font-semibold py-[8px] px-[24px] rounded-lg border-2"
              onClick={() => {
                const tweetText = `Check out Helicone's Open Stats: ${window.location.href}`;
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  tweetText
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
