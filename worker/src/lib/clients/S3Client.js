import { AwsClient } from "aws4fetch";
import { compress } from "../util/helpers";
export class S3Client {
    endpoint;
    bucketName;
    region;
    awsClient;
    constructor(accessKey, secretKey, endpoint, bucketName, region) {
        this.endpoint = endpoint;
        this.bucketName = bucketName;
        this.region = region;
        this.awsClient = new AwsClient({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
            service: "s3",
            region,
        });
    }
    getRequestResponseRawUrl = (requestId, orgId) => {
        return this.getBaseUrl(`organizations/${orgId}/requests/${requestId}/raw_request_response_body`);
    };
    getRequestResponseUrl = (requestId, orgId) => {
        return this.getBaseUrl(`organizations/${orgId}/requests/${requestId}/request_response_body`);
    };
    getRequestResponseImageUrl = (requestId, orgId, assetId) => {
        return this.getBaseUrl(`organizations/${orgId}/requests/${requestId}/assets/${assetId}`);
    };
    getBaseUrl = (key) => {
        return this.endpoint
            ? `${this.endpoint}/${this.bucketName}/${key}`
            : `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    };
    async store(url, value, tags) {
        try {
            const compressedValue = await compress(value);
            const headers = {
                "Content-Type": "application/json",
                "Content-Encoding": "gzip",
            };
            if (tags && Object.keys(tags).length > 0) {
                const tagsString = Object.entries(tags)
                    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
                    .join("&");
                headers["x-amz-tagging"] = tagsString;
            }
            const signedRequest = await this.awsClient.sign(url, {
                method: "PUT",
                body: compressedValue,
                headers,
            });
            const response = await fetch(signedRequest.url, signedRequest);
            if (!response.ok) {
                return {
                    data: null,
                    error: `Failed to store data: ${response.statusText}, ${response.url}, ${signedRequest.url}`,
                };
            }
            return { data: url, error: null };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            return { data: null, error: error?.message };
        }
    }
    async uploadBase64ToS3(buffer, assetType, requestId, orgId, assetId) {
        const uploadUrl = this.getRequestResponseImageUrl(requestId, orgId, assetId);
        return await this.uploadToS3(uploadUrl, buffer, assetType);
    }
    async uploadImageToS3(image, requestId, orgId, assetId) {
        const uploadUrl = this.getRequestResponseImageUrl(requestId, orgId, assetId);
        return await this.uploadToS3(uploadUrl, await image.arrayBuffer(), image.type);
    }
    async uploadToS3(url, body, contentType) {
        try {
            const signedRequest = await this.awsClient.sign(url, {
                method: "PUT",
                body: body,
                headers: {
                    "Content-Type": contentType,
                },
            });
            const response = await fetch(signedRequest.url, signedRequest);
            if (!response.ok) {
                return {
                    data: null,
                    error: `Failed to store data: ${response.statusText}`,
                };
            }
            return { data: url, error: null };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            return { data: null, error: error?.message };
        }
    }
}
