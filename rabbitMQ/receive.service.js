const amqp = require('amqplib');
const { HNSWLib } = require("langchain/vectorstores/hnswlib")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
const { PDFLoader } = require("langchain/document_loaders/fs/pdf")
const { CharacterTextSplitter, RecursiveCharacterTextSplitter } = require("langchain/text_splitter")
const fs = require('fs');
const { Document } = require("langchain/document");
const { FaissStore } = require("langchain/vectorstores/faiss");
const path = require('path');

class ReceiveService {
  async receive(docName) {
    try {
      const connection = await amqp.connect('amqp://localhost');
      const channel = await connection.createChannel();

      const queue = 'pdf_queue';

      await channel.assertQueue(queue, { durable: false });
      channel.consume(queue, async (msg) => {
        const fileContent = msg.content.toString();
        console.log(typeof fileContent,"-----------------------")
         // const loader = new PDFLoader(filePath);
        // const rawDocs = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 10,
      });
      
      const docs = await splitter.splitDocuments([
        new Document({ pageContent: fileContent }),
      ]);
      // console.log("------------------>>>>>>>>>>>>>>>>44444444444-------", docs)
     try{
      for (let i = 0; i < docs.length; i++) {
        const vectorStore = await HNSWLib.fromDocuments([docs[i]], new OpenAIEmbeddings({
              openAIApiKey: "key"
            }));
            // console.log("-------dddddddddd----------->>>>>>>>>>>>>>>>44444444444-------",vectorStore)
        // Save the vector store to a file
        await vectorStore.save(`./vectorEmbeddedFiles/${docName}${i}`);
      }
    
     }catch(err){
      console.log("===========>>>>>>>",err)
     }
        channel.ack(msg);
        // return 
      });
    } catch (err) {

    }
  }
}

module.exports = new ReceiveService()

