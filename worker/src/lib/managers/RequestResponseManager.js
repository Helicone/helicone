import { ok } from "../util/results";
export class RequestResponseManager {
    s3Client;
    supabase;
    constructor(s3Client, supabase) {
        this.s3Client = s3Client;
        this.supabase = supabase;
    }
    async storeRequestResponseRaw(content) {
        const url = this.s3Client.getRequestResponseRawUrl(content.requestId, content.organizationId);
        const tags = {
            name: "raw-request-response-body",
        };
        return await this.s3Client.store(url, JSON.stringify({
            request: content.requestBody,
            response: content.responseBody,
        }), tags);
    }
    async storeRequestResponseData({ organizationId, requestId, requestBody, responseBody, model, assets, }) {
        // If assets, must be image model, store images in S3
        if (assets && assets?.size > 0) {
            await this.storeRequestResponseImage({
                organizationId,
                requestId,
                requestBody,
                responseBody,
                model,
                assets,
            });
        }
        const url = this.s3Client.getRequestResponseUrl(requestId, organizationId);
        return await this.s3Client.store(url, JSON.stringify({ request: requestBody, response: responseBody }));
    }
    async storeRequestResponseImage({ organizationId, requestId, assets, }) {
        const uploadPromises = Array.from(assets.entries()).map(([assetId, imageUrl]) => this.handleImageUpload(assetId, imageUrl, requestId, organizationId));
        await Promise.allSettled(uploadPromises);
        return ok("Images uploaded successfully");
    }
    async handleImageUpload(assetId, imageUrl, requestId, organizationId) {
        try {
            let assetUploadResult;
            if (imageUrl.startsWith("data:image/")) {
                const [assetType, base64Data] = this.extractBase64Data(imageUrl);
                const buffer = Buffer.from(base64Data, "base64");
                assetUploadResult = await this.s3Client.uploadBase64ToS3(buffer, assetType, requestId, organizationId, assetId);
            }
            else {
                const response = await fetch(imageUrl, {
                    headers: {
                        "User-Agent": "Helicone-Worker (https://helicone.ai)",
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to download image: ${response.statusText}`);
                }
                const blob = await response.blob();
                assetUploadResult = await this.s3Client.uploadImageToS3(blob, requestId, organizationId, assetId);
            }
            if (!assetUploadResult.error) {
                await this.saveRequestResponseAssets(assetId, requestId, organizationId);
            }
        }
        catch (error) {
            console.error("Error uploading image:", error);
            // If we fail to upload an image, we don't want to fail logging the request
        }
    }
    async saveRequestResponseAssets(assetId, requestId, organizationId) {
        const result = await this.supabase
            .from("asset")
            .insert([
            { id: assetId, request_id: requestId, organization_id: organizationId },
        ]);
        if (result.error) {
            throw new Error(`Error saving asset: ${result.error.message}`);
        }
    }
    extractBase64Data(dataUri) {
        const matches = dataUri.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.*)$/);
        if (!matches || matches.length !== 3) {
            console.error("Invalid base64 image data");
            return ["", ""];
        }
        return [matches[1], matches[2]];
    }
}
