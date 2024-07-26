import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { Run } from '@langchain/core/tracers/base';
import axios from "axios";
import { BaseMessage } from "@langchain/core/messages";
import { LLMResult, Generation } from "@langchain/core/outputs";
import { AIMessageChunk } from "@langchain/core/messages";
type Message = BaseMessage | Generation | string;


export class UsageHandler extends BaseCallbackHandler {

    name = "usage_handler" as const
    customerId: string;

    constructor(customerId: string) {
        super();
        this.customerId = customerId;
    }

    handleLLMEnd(output: LLMResult, runId: string) {
        try {
            //@ts-ignore
            const message: AIMessageChunk = output?.generations[0][0].message;
            const { usage_metadata } = message?.lc_kwargs || {};
            if (usage_metadata && this.customerId) {
                const url = `${process.env.USAGE_URL}/usage`;
                console.log('calling usage: ', url);
                if (url) {
                    axios.post(url, {
                        customerId: this.customerId,
                        usage: usage_metadata
                    });
                }
            }
        } catch (err) {
            console.log("usage handler error:" + err);
        }
    }
}