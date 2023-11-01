const { connect } = require('../config/db.config');
const logger = require('../logger/api.logger');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require("pdf-lib");
const { ChatOpenAI } = require("langchain/chat_models/openai")
const { RetrievalQAChain } = require('langchain/chains')
const { HNSWLib } = require("langchain/vectorstores/hnswlib")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
const { PDFLoader } = require("langchain/document_loaders/fs/pdf")
const { CharacterTextSplitter, RecursiveCharacterTextSplitter } = require("langchain/text_splitter")
const { send, sendRemainingFiles } = require("../rabbitMQ/send.service")
const amqp = require('amqplib');
const { receive } = require('../rabbitMQ/receive.service');
const pdfParse = require('pdf-parse')
const { Document } = require("langchain/document");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const Key = process.env.KEY || "myKey";
const CryptoJs = require("crypto-js")

async function vectorEmbedding(hash, pagecontent, metadata) {
try{
    var vector = await new OpenAIEmbeddings({ openAIApiKey: "key" }).embedQuery(pagecontent);
    // console.log("_--------------------------------", vector)
    const vectorStore =
    {
        "id": hash,
        "vector": JSON.stringify(vector),
        "metaData": metadata
    }
    return true;
    // await fs.promises.writeFile(`./vectorEmbeddedFiles/abc.json`, JSON.stringify(vectorStore))
}catch(err){
    return err;
}
}



class FilesRepository {
    // db = {};

    constructor() {
        this.db = connect();
        // // For Development
    }



    async queueCheck(data) {
        // const dirPath = `./vectorEmbeddedFiles/${data.fileName}`
        const uploadPdfPath = `./uploads/${data.fileName}.pdf`
        var noVector = []
        try {
            if (fs.existsSync(uploadPdfPath)) {
                const docmentAsBytes = await fs.promises.readFile(uploadPdfPath);
                const pdfDoc = await PDFDocument.load(docmentAsBytes)
                const numberOfPages = pdfDoc.getPages().length;
                for (let i = 1; i <= numberOfPages; i++) {
                    if (fs.existsSync(`./vectorEmbeddedFiles/${data.fileName}${i}`)) {
                        // console.log("hieeeeeeeeeeeeeeeyaaaaaaaaaaaaa i'm here")
                    } else {
                        noVector.push(`./docs/${data.fileName}${i}.pdf`)
                    }
                }
                // console.log("----------oopppsssss!!! do something", noVector)
                sendRemainingFiles(noVector)
            } else {
                console.log("oops!! not found")
            }

        } catch (err) {
            console.log(err)
        }
    }

    async fileQuery(data) {
        let response = {}
        const pageNumber = data.pageNumber;
        var index ="0"
        console.log("============================","filePath")
        // let vectorStore;
        const fileName = data.fileName
        const filePath = `./vectorEmbeddedFiles/${fileName}${pageNumber}${index}/hnswlib.index`
        const folderPath = `./vectorEmbeddedFiles/${fileName}${pageNumber}${index}`

        const model = new ChatOpenAI({
            openAIApiKey: "key",
        });
        try {
            if (fs.readFileSync(filePath)) {
                console.log("============================",filePath)
                var vectorStore = await HNSWLib.load(folderPath, new OpenAIEmbeddings({
                    openAIApiKey: "key",
                }))
                //   console.log(vectorStore)
                const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())

                const res = await chain.call({
                    query: data.query,
                })

                response.aaData = res
                response.message = "success"
                response.status = 200

            }
            else {
                response.message = "bad request"
                response.status = 400

            }

        } catch (err) {
            logger.error('Error::' + err);
            response.message = err.toString()
            response.status = 500
        }
        return response;
    }

    async fileUpload(file, data) {
        let response = {};
        const model = new ChatOpenAI({
            openAIApiKey: "key",
        });
        try {
            let uploadFilePath = './uploads/' + file
            var docName = path.basename(uploadFilePath, path.extname(uploadFilePath));
            var hash = CryptoJs.AES.encrypt(docName, Key).toString();
            //break each pages into separate file
            if (path.extname(uploadFilePath) == ".pdf") {
                // Load your PDFDocument
                const docmentAsBytes = await fs.promises.readFile(uploadFilePath);
                const pdfDoc = await PDFDocument.load(docmentAsBytes)
                var numberOfPages = pdfDoc.getPages().length;
                for (let i = 0; i < numberOfPages; i++) {
                    // Create a new "sub" document
                    const subDocument = await PDFDocument.create();
                    // copy the page at current index
                    const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
                    subDocument.addPage(copiedPage);
                    const pdfBytes = await subDocument.save()
                    await writePdfBytesToFile(`./docs/${docName}${i + 1}.pdf`, pdfBytes);
                    function writePdfBytesToFile(docName, pdfBytes) {

                        return fs.promises.writeFile(docName, pdfBytes);
                    }
                }
            } else {


            }

            //EACH FILE LOAD
            if (path.extname(uploadFilePath) == ".pdf") {
                for (let i = 0; i < numberOfPages; i++) {
                    const separatePdfPath = `./docs/${docName}${i + 1}.pdf`
                    var fileName = path.basename(separatePdfPath, path.extname(separatePdfPath));
                    let readFileSync = await fs.promises.readFile(`./docs/${docName}${i + 1}.pdf`)
                    let pdfExtract = await pdfParse(readFileSync)
                    var rawDocs = pdfExtract.text

                    const splitter = new RecursiveCharacterTextSplitter({
                        chunkSize: 400,
                        chunkOverlap: 10,
                    });

                    var docs = await splitter.splitDocuments([
                        new Document({ pageContent: rawDocs }),
                    ]);
                    console.log("-------vvvvvvvvvvvv-------------->>>>>>>>>>>>>>>>>>>>>>separatePdfPath",docs)
                    var vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({
                        openAIApiKey: "key",
                      }));
                      await vectorStore.save(`./vectorEmbeddedFiles/${fileName}${i}`)
                }
            } else {
                const filePath = uploadFilePath
                const rawDocs = fs.readFileSync(filePath, 'utf8')

                const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 400 })
                var docs = await textSplitter.createDocuments([rawDocs])
                // console.log("--------------------->>>>>>>>>>>>>>>>>>>>>>separatePdfPath",docs.length)
                for (let i = 0; i < docs.length; i++) {
                   
                    let index = hash + i
                     let abc = vectorEmbedding(index, docs[i].pageContent, docs[i].metadata)
                   console.log("================================>>>>>>>>>", abc)
                   
                   

                }
            }


            // if (data) {
            response.aaData = '/uploads/' + file
            response.docName = docName
            response.message = "file uploaded"
            response.status = 200
            // } else {
            //     response.message = "bad request"
            //     response.status = 400
            // }
        } catch (err) {
            logger.error('Error::' + err);
            response.message = err.toString()
            response.status = 500
            console.error(err)
        }
        return response;
    }

}





module.exports = new FilesRepository();
