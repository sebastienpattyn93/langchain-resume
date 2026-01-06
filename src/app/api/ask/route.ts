import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from '@langchain/openai';
import fs from 'fs';
import path from 'path';
import rateLimiter from '../rate-limiter';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createStuffDocumentsChain } from '@langchain/classic/chains/combine_documents';
import { createRetrievalChain } from '@langchain/classic/chains/retrieval';

// Initialize OpenAI client with API key from environment variables
let vectorStore: MemoryVectorStore | null = null;
let chain: unknown | null = null;

async function initializeChain() {
  try {
    // Check if we already initialized the chain
    if (chain) {
      return chain;
    }
    
    // Read resume markdown file
    const resumePath = path.join(process.cwd(), 'src/data/resume.md');
    const resumeContent = fs.readFileSync(resumePath, 'utf8');
    
    // Split text into chunks with smaller size for more precise retrieval
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,  // Smaller chunks for more precise retrieval
      chunkOverlap: 150, // Good overlap to maintain context between chunks
      separators: ["\n\n", "\n", " ", ""], // Custom separators to better handle markdown
    });
    const docs = await textSplitter.createDocuments([resumeContent]);
    
    // Create vector store from documents
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    
    // Create retrieval chain with improved configuration
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4.1-mini',
      temperature: 0.2,
    });
    
    // Configure retriever with search options for better results
    const retriever = vectorStore.asRetriever({
      searchType: "similarity",
      k: 8, // Retrieve more documents for better context
    });
    
    // Create a prompt template to guide the model's responses
    const promptTemplate = ChatPromptTemplate.fromTemplate(
      `You are Sébastien Pattyn's personal resume assistant. Answer questions about Sébastien's experience, skills, education, and career based on the provided context.
      
Context: {context}
      
IMPORTANT FACTS ABOUT SÉBASTIEN'S CAREER:
- Sébastien has worked at: Nuclivision (2025-Present), BioLizard (2023-2025), Excelra (2022-2023), Lighthouse (2020-2021), and Tengu (2016-2020).
- His core skills include: Full Stack Development, Cloud Architecture, DevOps, and Data Engineering.
      
When responding to questions:
- Keep responses SHORT and CONCISE (2-3 sentences maximum)
- When asked about companies or work history, ALWAYS list ALL companies Sébastien has worked for
- For job experiences, first give a brief overview of key achievements rather than listing all details
- If asked about a specific job, mention only 1-2 key responsibilities and invite the user to ask for more details
- For skills questions, focus on the most relevant skills and 1 project example
- Be professional but conversational in tone
- For questions about availability or contact information, briefly suggest reaching out via LinkedIn or email
- If you don't know the answer, say so briefly and suggest contacting Sébastien directly
      
Question: {input}
      
Answer:`
    );
    
    // Create document chain and retrieval chain using new API
    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt: promptTemplate,
    });
    
    chain = await createRetrievalChain({
      retriever,
      combineDocsChain: documentChain,
    });
    
    return chain;
  } catch (error) {
    console.error('Error initializing chain:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      '127.0.0.1';
    
    // Check rate limit
    const rateLimitResult = rateLimiter.checkLimit(ip.split(',')[0]);
    
    if (!rateLimitResult.allowed) {
      // Format time until reset in a user-friendly way
      const resetTime = new Date(rateLimitResult.resetTime || 0);
      const formattedTime = resetTime.toLocaleTimeString();
      
      let message = rateLimitResult.message || 'Rate limit exceeded';
      
      // For hourly limits, add a more personalized message
      if (rateLimitResult.limitType === 'hour') {
        message = `You've reached the hourly question limit. Please wait until ${formattedTime} or contact Sébastien directly at sebastien.pattyn@gmail.com with your questions.`;
      }
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    
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
    const response = await qaChain.invoke({
      input: question,
    });
    
    return NextResponse.json({ answer: response.answer });
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Error processing your question' },
      { status: 500 }
    );
  }
}
