const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config()
const fileController = require('./controller/files.controller')
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "localhost";
app.use(bodyParser.json());
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
const uploadFile = require("./middleware/upload");
const multer = require("multer")
const path = require('path');
app.use('/uploads', express.static('uploads'));

app.post("/api/upload", async (req, res) => {
    try {
       
        await uploadFile(req, res);
        if (req.file != undefined) {
            fileController.fileUpload(req.file.originalname, req.body).then(data => {
                if (data.status == 200) {
                    res.status(200).json(data)
                }
                else {
                    res.status(500).json(data)
                }
            });
        } else {
            let response = {
                message: "no file found",
                status: 404
            }
            res.status(404).json(response)
        }


    } catch (err) {
        let response = {
            message: "bad request",
            error: err,
            status: 400
        }
        res.status(400).json(response)
    }
});

app.post("/api/query", async (req, res) =>{
    try{
        if(req.body != undefined){
           if(req.body.query != undefined  && req.body.fileName != undefined ){
            
            fileController.fileQuery(req.body).then(data => {
                if (data.status == 200) {
                    res.status(200).json(data)
                }
                else {
                    res.status(500).json(data)
                }
            });
           }else{
            let response = {
                message: "invalid input",
                status: 404
            }
            res.status(404).json(response)  
           }
        }
        else{
            let response = {
                message: "empty body",
                status: 404
            }
            res.status(404).json(response)  
        }

    }catch(err){
        let response = {
            message: "bad request",
            error: err,
            status: 400
        }
        res.status(400).json(response)
    }
})

app.post("/api/queueCheck", async (req, res) =>{
    fileController.queueCheck(req.body).then(data => {
        res.json(data)
    })
})

app.get('/', (req, res) => {
    res.send(`<h1>API Works !!!</h1>`)
});

app.listen(port, host, () => {
    console.log(`Server listening on the port  ${port}`);
})



