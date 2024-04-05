export interface BannerConfig {
  /**
   * Main banner message
   */
  text?: string;
  /**
   * If present, a call to action link will be rendered after the message.
   */
  cta?: {
    text?: string;
    url?: string;
    /**
     * Whether to open the link in a new tab
     */
    external?: boolean;
  };
  /**
   * If set to true, the close button will not be rendered.
   */
  permanent?: boolean;
}

export function getBannerConfig({
  pathname,
}: {
  pathname: string;
}): BannerConfig {
  if (pathname === "/") {
    return {
      text: "Congratulations, you've successfully configured a banner using Lekko! 🎉",
      cta: {
        text: "Learn more",
        url: "https://www.lekko.com/",
        external: true,
      },
    };
  }
  return {};
}
