import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { LLMResult } from "@langchain/core/outputs";
import { Serialized } from "@langchain/core/load/serializable";
import { encodingForModel, Tiktoken } from "js-tiktoken";
import axios from "axios";

export class UsageHandler extends BaseCallbackHandler {

    name = "usage_handler" as const
    customerId: string;
    encoding: Tiktoken;

    constructor(customerId: string, model: string) {
        super();
        this.customerId = customerId;
        //@ts-ignore
        this.encoding = encodingForModel(model);
    }

    handleLLMStart(_llm: Serialized, prompts: string[]) {
        try {
            const prompt = prompts[0];
            const tokens = this.encoding?.encode(prompt);
            if (tokens) {
                const url = `${process.env.USAGE_URL}/usage`;
                axios.post(url, {
                    customerId: this.customerId,
                    usage: {
                        input_tokens: tokens.length
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    handleLLMEnd(output: LLMResult) {
        try {
            const prompt = output?.generations[0][0].text;
            const tokens = this.encoding?.encode(prompt);

            if (tokens) {
                const url = `${process.env.USAGE_URL}/usage`;
                axios.post(url, {
                    customerId: this.customerId,
                    usage: {
                        output_tokens: tokens.length
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    }
}