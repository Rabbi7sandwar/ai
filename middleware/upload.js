const util = require("util");
const multer = require("multer");
const path = require("path");
const maxSize = 10 * 1024 * 1024;

let storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        process.cwd()
      const folderPath = path.join( __dirname + '../../user_folders/')

       cb(null, __dirname + '../../uploads', 'images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

let uploadFile = multer({
    storage: storage,
    limits: { fileSize: maxSize },
}).single("fileName");


let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;