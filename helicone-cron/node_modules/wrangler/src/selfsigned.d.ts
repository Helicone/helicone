declare module "selfsigned" {
	import type { pki } from "node-forge";

	export type Attributes = pki.CertificateField[];

	export interface Options {
		days?: number;
		keySize?: number;
		extensions?: unknown[];
		algorithm?: string;
		pkcs7?: boolean;
		clientCertificate?: boolean;
		clientCertificateCN?: string;
	}

	export interface Certificate {
		private: string;
		public: string;
		cert: string;
		fingerprint: string;
	}

	export function generate(attrs?: Attributes, options?: Options): Certificate;
	export function generate(
		attrs: Attributes,
		options: Options,
		callback: (err: Error, certificate: Certificate) => void
	): void;
}
