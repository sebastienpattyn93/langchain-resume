import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from '@langchain/openai';
import { RetrievalQAChain } from "langchain/chains";
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client with API key from environment variables
let vectorStore: MemoryVectorStore | null = null;
let chain: RetrievalQAChain | null = null;

async function initializeChain() {
  try {
    // Check if we already initialized the chain
    if (chain) {
      return chain;
    }
    
    // Read resume markdown file
    const resumePath = path.join(process.cwd(), 'src/data/resume.md');
    const resumeContent = fs.readFileSync(resumePath, 'utf8');
    
    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.createDocuments([resumeContent]);
    
    // Create vector store from documents
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    
    // Create retrieval chain
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4.1-mini',
      temperature: 0.2,
    });
    
    chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
      returnSourceDocuments: true,
    });
    
    return chain;
  } catch (error) {
    console.error('Error initializing chain:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { question } = body;
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    // Initialize chain if not already done
    const qaChain = await initializeChain();
    
    // Get answer from chain
    const response = await qaChain.call({
      query: question,
    });
    
    return NextResponse.json({ answer: response.text });
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Error processing your question' },
      { status: 500 }
    );
  }
}
