"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeAsyncLogger = exports.Provider = void 0;
const axios_1 = __importDefault(require("axios"));
var Provider;
(function (Provider) {
    Provider["OPENAI"] = "openai";
    Provider["AZURE_OPENAI"] = "azure-openai";
    Provider["ANTHROPIC"] = "anthropic";
})(Provider || (exports.Provider = Provider = {}));
class HeliconeAsyncLogger {
    constructor(configurationManager) {
        this.configurationManager = configurationManager;
    }
    log(asyncLogModel, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!asyncLogModel)
                return;
            const options = {
                method: "POST",
                data: asyncLogModel,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${this.configurationManager.getHeliconeAuthHeader()}`,
                },
            };
            const basePath = this.configurationManager.getBasePath();
            if (!basePath)
                throw new Error("Base path not set");
            // Set Helicone URL
            if (provider == Provider.OPENAI) {
                options.url = `${basePath}/oai/v1/log`;
            }
            else if (provider == Provider.AZURE_OPENAI) {
                options.url = `${basePath}/oai/v1/log`;
            }
            else if (provider == Provider.ANTHROPIC) {
                options.url = `${basePath}/anthropic/v1/log`;
            }
            else {
                throw new Error("Invalid provider");
            }
            const result = yield (0, axios_1.default)(options);
            if (result.status != 200) {
                throw new Error(`Failed to log to ${basePath}. Status code ${result.status}`);
            }
        });
    }
    static createTiming(startTime, endTime) {
        return {
            startTime: {
                seconds: Math.floor(startTime / 1000),
                milliseconds: startTime % 1000,
            },
            endTime: {
                seconds: Math.floor(endTime / 1000),
                milliseconds: endTime % 1000,
            },
        };
    }
}
exports.HeliconeAsyncLogger = HeliconeAsyncLogger;
