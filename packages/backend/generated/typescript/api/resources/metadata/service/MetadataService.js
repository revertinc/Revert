"use strict";
/**
 * This file was auto-generated by Fern from our API Definition.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
const express_1 = __importDefault(require("express"));
const serializers = __importStar(require("../../../../serialization"));
const errors = __importStar(require("../../../../errors"));
class MetadataService {
    methods;
    router;
    constructor(methods, middleware = []) {
        this.methods = methods;
        this.router = express_1.default.Router({ mergeParams: true }).use(express_1.default.json(), ...middleware);
    }
    addMiddleware(handler) {
        this.router.use(handler);
        return this;
    }
    toRouter() {
        this.router.get("/metadata/crms", async (req, res, next) => {
            try {
                await this.methods.getCrms(req, {
                    send: async (responseBody) => {
                        res.json(await serializers.CrmMetadataResponse.jsonOrThrow(responseBody, {
                            unrecognizedObjectKeys: "strip",
                        }));
                    },
                    cookie: res.cookie.bind(res),
                    locals: res.locals,
                });
                next();
            }
            catch (error) {
                console.error(error);
                if (error instanceof errors.RevertApiError) {
                    switch (error.errorName) {
                        case "UnAuthorizedError":
                        case "InternalServerError":
                            break;
                        default:
                            console.warn(`Endpoint 'getCrms' unexpectedly threw ${error.constructor.name}.` +
                                ` If this was intentional, please add ${error.constructor.name} to` +
                                " the endpoint's errors list in your Fern Definition.");
                    }
                    await error.send(res);
                }
                else {
                    res.status(500).json("Internal Server Error");
                }
                next(error);
            }
        });
        return this.router;
    }
}
exports.MetadataService = MetadataService;
