export const HELICONE_RATE_LIMITED_API_KEY_REGEX = [
    /^sk-helicone-rl-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^pk-helicone-rl-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^pk-helicone-eu-rl-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^sk-helicone-eu-rl-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
];
export const HELICONE_API_KEY_REGEX = [
    /^sk-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^sk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^pk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^pk-helicone-eu-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^sk-helicone-eu-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
    /^[sp]k(-helicone)?(-eu)?(-cp)?-\w{7}-\w{7}-\w{7}-\w{7}$/,
    ...HELICONE_RATE_LIMITED_API_KEY_REGEX,
];
