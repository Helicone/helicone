export type Project = {
	name: string;
	subdomain: string;
	domains: Array<string>;
	source?: {
		type: string;
	};
	latest_deployment?: {
		modified_on: string;
	};
	created_on: string;
	production_branch: string;
};
export type Deployment = {
	id: string;
	created_on: string;
	environment: string;
	deployment_trigger: {
		metadata: {
			commit_hash: string;
			branch: string;
		};
	};
	url: string;
	latest_stage: {
		status: string;
		ended_on: string;
	};
	project_name: string;
};
export type UploadPayloadFile = {
	key: string;
	value: string;
	metadata: { contentType: string };
	base64: boolean;
};

export interface PagesConfigCache {
	account_id?: string;
	project_name?: string;
}
