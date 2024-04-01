/**
 * @param pathname A pathname string, such as `/foo` or `/foo/bar`
 * @param routingRule The routing rule, such as `/foo/*`
 * @returns True if pathname matches the routing rule
 *
 * /       ->  /
 * /*      ->  /*
 * /foo    ->  /foo
 * /foo*   ->  /foo, /foo-bar, /foo/*
 * /foo/*  ->  /foo, /foo/bar
 */
export function isRoutingRuleMatch(
	pathname: string,
	routingRule: string
): boolean {
	// sanity checks
	if (!pathname) {
		throw new Error("Pathname is undefined.");
	}
	if (!routingRule) {
		throw new Error("Routing rule is undefined.");
	}

	const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
	return pathname.match(ruleRegExp) !== null;
}

function transformRoutingRuleToRegExp(rule: string): RegExp {
	let transformedRule;

	if (rule === "/" || rule === "/*") {
		transformedRule = rule;
	} else if (rule.endsWith("/*")) {
		// make `/*` an optional group so we can match both /foo/* and /foo
		// /foo/* => /foo(/*)?
		transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
	} else if (rule.endsWith("/")) {
		// make `/` an optional group so we can match both /foo/ and /foo
		// /foo/ => /foo(/)?
		transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
	} else if (rule.endsWith("*")) {
		transformedRule = rule;
	} else {
		transformedRule = `${rule}(/)?`;
	}

	// /foo* => /foo.* => ^/foo.*$
	transformedRule = `^${transformedRule.replace("*", ".*")}$`;

	// ^/foo.*$ => /^\/foo.*$/
	return new RegExp(transformedRule);
}
