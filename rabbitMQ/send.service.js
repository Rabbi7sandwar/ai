const amqp = require('amqplib');
const { receive } = require('./receive.service');
const { HNSWLib } = require("langchain/vectorstores/hnswlib")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
const { PDFLoader } = require("langchain/document_loaders/fs/pdf")
const { CharacterTextSplitter, RecursiveCharacterTextSplitter } = require("langchain/text_splitter")
const fs = require('fs');
const path_ = require('path');
const { Document } = require("langchain/document");
const pdfParse = require('pdf-parse')


class SendService {

  async  send(path,numberOfPages) {
    try{
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
  
    const queue = 'pdf_queue';
    const arrayOfPath = []
    for(let i=1;i<=numberOfPages;i++){
      arrayOfPath.push(path+i+'.pdf')
    }
    // console.log("-------^^^^^^^^^^^^^^^^______________", arrayOfPath)
    await channel.assertQueue(queue, { durable: false
     });
  
    for (const filePath of arrayOfPath) {
     try{
      var docName = path_.basename(filePath, '.pdf')
      let readFileSync = fs.readFileSync(filePath)
      let pdfExtract = await pdfParse(readFileSync)
      var rawDocs = pdfExtract.text
     }catch(err){
      console.log("---------------------->>>>>>>>>>>>>Derr",err)
     }
     
      const message = Buffer.from(rawDocs);

      channel.sendToQueue(queue,message);
      const queueInfo = await channel.checkQueue(queue);
      const messageCount = queueInfo.messageCount;
      // console.log(`Number of messages in the queue: ${messageCount}`);
    await  receive(docName);
    }
  
    // setTimeout(() => {
    //   connection.close();
    //   process.exit(0);
    // }, 500);
  }catch(err){
    console.log("err::",err)
  }
  }

  async  sendRemainingFiles(arrayOfPath) {
    try{
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
  
    const queue = 'pdf_queue';
    // for(let i=1;i<=numberOfPages;i++){
    //   arrayOfPath.push(path+i+'.pdf')
    // }
    // console.log("-------^^^^^^^^^^^^^^^^______________", arrayOfPath)
    await channel.assertQueue(queue, { durable: false
     });
  
    for (const filePath of arrayOfPath) {
     try{
      var docName = path_.basename(filePath, '.pdf')
      let readFileSync = fs.readFileSync(filePath)
      let pdfExtract = await pdfParse(readFileSync)
      var rawDocs = pdfExtract.text
     }catch(err){
      console.log("---------------------->>>>>>>>>>>>>Derr",err)
     }
     
      const message = Buffer.from(rawDocs);

      channel.sendToQueue(queue,message);
      const queueInfo = await channel.checkQueue(queue);
      const messageCount = queueInfo.messageCount;
      // console.log(`Number of messages in the queue: ${messageCount}`);
    await  receive(docName);
    }
  
    // setTimeout(() => {
    //   connection.close();
    //   process.exit(0);
    // }, 500);
  }catch(err){
    console.log("err::",err)
  }
  }
  
}

module.exports = new SendService()

