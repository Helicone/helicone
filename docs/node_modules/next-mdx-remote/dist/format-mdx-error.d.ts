/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */
/**
 * Prints a nicely formatted error message from an error caught during MDX compilation.
 *
 * @param error - Error caught from the mdx compiler
 * @param source - Raw MDX string
 * @returns Error
 */
export declare function createFormattedMDXError(error: any, source: string): Error;
