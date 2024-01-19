const heliconeDomainsRegEx = [/.*helicone.*/, /.*localhost.*/];

export function isCustomerDomain(domain: string) {
  return !heliconeDomainsRegEx.some((regex) => regex.test(domain));
}
