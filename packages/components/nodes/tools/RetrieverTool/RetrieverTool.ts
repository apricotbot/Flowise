import { z } from 'zod'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { DynamicTool } from '@langchain/core/tools'
import { BaseRetriever } from '@langchain/core/retrievers'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { SOURCE_DOCUMENTS_PREFIX } from '../../../src/agents'
import { Document } from '@langchain/core/documents'
import axios from 'axios'

class Retriever_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Retriever Tool'
        this.name = 'retrieverTool'
        this.version = 2.0
        this.type = 'RetrieverTool'
        this.icon = 'retrievertool.svg'
        this.category = 'Tools'
        this.description = 'Use a retriever as allowed tool for agent'
        this.baseClasses = [this.type, 'DynamicTool', ...getBaseClasses(DynamicTool)]
        this.inputs = [
            {
                label: 'Retriever Name',
                name: 'name',
                type: 'string',
                placeholder: 'search_state_of_union'
            },
            {
                label: 'Retriever Description',
                name: 'description',
                type: 'string',
                description: 'When should agent uses to retrieve documents',
                rows: 3,
                placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Run Rerank',
                name: 'runRerank',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Rerank Top-N',
                name: 'rerankTopN',
                type: 'number',
                step: 1,
                default: 3,
                optional: true
            },
            {
                label: 'Rerank Minimal Score',
                name: 'rerankMinScore',
                type: 'number',
                step: 0.1,
                default: 0.3,
                optional: true
            }
        ]
    }

    async _rerank(queriedDocs: Document[], query: string, topN: number, minScore?: number): Promise<Document[]> {
        const results: [Document][] = []

        const documents = queriedDocs?.map((doc) => ({ pageContent: doc.pageContent, metadata: doc.metadata }))

        const { data: rerankResults } = await axios.post(
            'https://api.pinecone.io/rerank',
            {
                model: 'bge-reranker-v2-m3',
                query,
                return_documents: true,
                top_n: topN || 3,
                documents,
                rank_fields: ['pageContent']
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'x-pinecone-api-version': '2024-10',
                    'api-key': process.env.PINECONE_API_KEY
                }
            }
        )

        rerankResults?.data.forEach((res: any) => {
            if (!minScore || res.score >= minScore) {
                results.push([new Document({ pageContent: res.document.metadata.entity })])
            }
        })

        return results.map((result) => result[0])
    }

    async init(nodeData: INodeData): Promise<any> {
        const name = nodeData.inputs?.name as string
        const description = nodeData.inputs?.description as string
        const retriever = nodeData.inputs?.retriever as BaseRetriever
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean
        const runRerank = nodeData.inputs?.runRerank as boolean
        const rerankMinScore = nodeData.inputs?.rerankMinScore as number
        const rerankTopN = nodeData.inputs?.rerankTopN as number

        const input = {
            name,
            description
        }

        const func = async ({ input }: { input: string }, runManager?: CallbackManagerForToolRun) => {
            let docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))

            if (runRerank) {
                docs = await this._rerank(docs, input, rerankTopN, rerankMinScore)
            }

            const content = docs.map((doc) => doc.pageContent).join('\n\n')
            const sourceDocuments = JSON.stringify(docs)
            return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
        }

        const schema = z.object({
            input: z.string().describe('input to look up in retriever')
        }) as any

        const tool = new DynamicStructuredTool({ ...input, func, schema })
        return tool
    }
}

module.exports = { nodeClass: Retriever_Tools }
