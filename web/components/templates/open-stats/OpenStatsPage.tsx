import { FaXTwitter } from "react-icons/fa6";
import { Col, Row } from "../../layout/common";
import { Logo } from "./logo";
import { TopStats } from "./topStats";
import { useQueryParams } from "./useQueryParams";
import { OtherStats } from "./otherStats";

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
    <Col className="w-full justify-center items-center gap-y-[40px] max-w-5xl mx-auto">
      <Col className="mb-[8px] mt-[80px] justify-center items-center gap-[24px]">
        <Logo />
        <h1 className="text-[48px] font-bold text-center ">
          Helicone{"'"}s Open Stats
        </h1>
        <Row className="gap-[24px] items-center">
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
          <div className="text-[#6B7280] font-semibold text-[14px]">
            Updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </Row>
        <div>
          <Row className="gap-[16px] bg-[#F3F4F6] p-[4px] font-bold rounded-lg">
            {["Top Stats", "Other Stats"].map((x, i) => (
              <button
                className={`py-[8px] px-[16px] rounded-lg ${
                  tab === i ? "bg-white text-[#0CA5E9] shadow-lg" : ""
                }`}
                key={`${x}-${i}`}
                onClick={() => setQueryParams({ ...queryParams, tab: i })}
              >
                {x}
              </button>
            ))}
          </Row>
        </div>
      </Col>
      {tab === 0 ? (
        <TopStats />
      ) : (
        <OtherStats queryParamsState={{ queryParams, setQueryParams }} />
      )}
    </Col>
  );
};
