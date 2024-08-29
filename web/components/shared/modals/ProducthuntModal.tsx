import ThemedModal from "../themed/themedModal";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import Cookies from "js-cookie";

interface ProducthuntModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  upgradeOpen: (open: boolean) => void;
}

const ProducthuntSupportModal: React.FC<ProducthuntModalProps> = ({
  open,
  setOpen,
  upgradeOpen,
}) => {
  const handleProductHuntClick = () => {
    Cookies.set("visitedProductHunt", "true", { expires: 1 });
    window.open(
      "https://www.producthunt.com/leaderboard/daily/2024/8/22",
      "_blank"
    );
    setOpen(false);
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col items-start space-y-6 w-[374px] text-left">
        <div className="flex justify-between items-center w-full">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            We need your help! 🫶
          </div>
          <XMarkIcon
            className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setOpen(false)}
          />
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          We just launched on Product Hunt today and would love your support!
        </p>

        <p className="text-gray-600 dark:text-gray-300">
          We are giving away $500 in credit to all new Growth users.
          <span className="font-semibold text-[#FF6154] dark:text-white">
            {" "}
            To see the code, please give us an upvote!
          </span>
        </p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleProductHuntClick();
          }}
          tabIndex={-1}
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=475050&theme=light"
            alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
            width="190"
            height="60"
          />
        </a>
      </div>
    </ThemedModal>
  );
};

const UpgradeOfferModal: React.FC<ProducthuntModalProps> = ({
  open,
  setOpen,
  upgradeOpen,
}) => {
  const handleUpgradeClick = () => {
    // Implement your upgrade logic here
    console.log("Upgrade clicked");
    Cookies.set("closedProductHuntPromo", "true", { expires: 365 });
    setOpen(false);
    upgradeOpen(true);
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col items-start space-y-6 w-[374px] text-left">
        <div className="flex justify-between items-center w-full">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            Launch Promo 🎉
          </div>
          <XMarkIcon
            className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setOpen(false)}
          />
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          Get $500 in credit when you upgrade to Growth today. Use code{" "}
          <span className="font-semibold text-[#FF6154] dark:text-white">
            PHUNT500
          </span>{" "}
          at checkout.
        </p>

        <p className="text-sm italic text-gray-500 dark:text-gray-400">
          *The credit expires in 6 months.
        </p>

        <button
          onClick={handleUpgradeClick}
          tabIndex={-1}
          className="bg-[#FF6154] text-white px-6 py-3 rounded-md hover:bg-[#E55A4D] transition-colors"
        >
          Upgrade
        </button>
      </div>
    </ThemedModal>
  );
};

export const ProducthuntLaunchCard: React.FC = () => {
  return (
    <div>
      <h2 className="text-sm font-medium mb-4">Product Hunt Launch! 🎉</h2>
      <p className="text-gray-600 mb-4 text-xs">
        We just launched today and would love your support! 🙏
      </p>
      <a
        href="https://www.producthunt.com/leaderboard/daily/2024/8/22"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=475050&theme=light"
          alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
          width="180"
          height="54"
        />
      </a>
    </div>
  );
};

export const ProducthuntLaunchPromoCard: React.FC<{
  setOpen: (open: boolean) => void;
}> = ({ setOpen }) => {
  return (
    <div>
      <div className="flex justify-between items-center w-full">
        <h2 className="text-sm font-medium mb-4">Launch Promo 🎉</h2>
        <ArrowUpRightIcon
          className="h-4 w-4 mb-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setOpen(true)}
        />
      </div>

      <p className="text-gray-600  mb-4 text-xs">
        Get $500 in credit when you upgrade to Growth today. Use code{" "}
        <span className="font-semibold text-[#FF6154] dark:text-white">
          PHUNT500
        </span>{" "}
      </p>
      <a
        href="https://www.producthunt.com/leaderboard/daily/2024/8/22"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=475050&theme=light"
          alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
          width="180"
          height="54"
        />
      </a>
    </div>
  );
};

const ProducthuntModal: React.FC<{
  setUpgradeOpen: (open: boolean) => void;
}> = ({ setUpgradeOpen }) => {
  const [open, setOpen] = useState(false);
  const [visitedProductHunt, setVisitedProductHunt] = useState(false);
  const [closedPromo, setClosedPromo] = useState(false);

  useEffect(() => {
    setVisitedProductHunt(Cookies.get("visitedProductHunt") === "true");
    setClosedPromo(Cookies.get("closedProductHuntPromo") === "true");
  }, []);

  useEffect(() => {
    // Show the modal only if the user hasn't visited Product Hunt and hasn't closed the promo
    if (!visitedProductHunt && !closedPromo) {
      setOpen(true);
    }
  }, [visitedProductHunt, closedPromo]);

  const handleSupportModalClose = () => {
    Cookies.set("visitedProductHunt", "true", { expires: 1 });
    setVisitedProductHunt(true);
    setOpen(true); // Immediately open the second modal
  };

  const handlePromoModalClose = () => {
    Cookies.set("closedProductHuntPromo", "true", { expires: 1 });
    setClosedPromo(true);
    setOpen(false);
  };

  if (closedPromo) {
    return null; // Don't render anything if the user has closed the promo
  }

  return (
    <>
      {!visitedProductHunt ? (
        <ProducthuntSupportModal
          open={open}
          setOpen={handleSupportModalClose}
          upgradeOpen={setUpgradeOpen}
        />
      ) : (
        <UpgradeOfferModal
          open={open}
          setOpen={handlePromoModalClose}
          upgradeOpen={setUpgradeOpen}
        />
      )}
    </>
  );
};

export default ProducthuntModal;
