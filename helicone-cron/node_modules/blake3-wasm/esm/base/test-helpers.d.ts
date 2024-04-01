/// <reference types="node" />
export declare const hello48: Buffer;
export declare const inputs: {
    large: {
        input: string;
        hash: Buffer;
    };
    hello: {
        input: string;
        hash: Buffer;
    };
    goodbye: {
        input: string;
        hash: Buffer;
    };
};
/**
 * Test vectors from the BLAKE3 repo.
 *
 * > Each test is an input length and three outputs, one for each of the hash,
 * > keyedHash, and deriveKey modes. The input in each case is filled with a
 * > 251-byte-long repeating pattern: 0, 1, 2, ..., 249, 250, 0, 1, ... The
 * > key used with keyedHash is the 32-byte ASCII string given in the 'key'
 * > field below. For deriveKey, the test input is used as the input key, and
 * > the context string is 'BLAKE3 2019-12-27 6:29:52 example context'.
 * > (As good practice for following the security requirements of deriveKey,
 * > test runners should make that context string a hardcoded constant, and we
 * > do not provided it in machine-readable form.) Outputs are encoded as
 * > hexadecimal. Each case is an extended output, and implementations should
 * > also check that the first 32 bytes match their default-length output.
 */
export declare const ogTestVectors: {
    key: string;
    context: string;
    cases: {
        inputLen: number;
        expectedHash: string;
        expectedKeyed: string;
        expectedDerive: string;
    }[];
};
