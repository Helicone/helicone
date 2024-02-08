/**
 * remark plugin to implement SmartyPants.
 *
 * @type {import('unified').Plugin<[Options?] | void[], Root>}
 */

import { Options } from "retext-smartypants";
import { Transformer } from "unified";
import { Root } from "mdast";

export { Options };

export default function remarkSmartypants(
  options?: void | Options,
): void | Transformer<Root, Root>;
