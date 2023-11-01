const fileService = require('../services/files.service');
const logger = require('../logger/api.logger');

class FileController{

    async fileUpload(files,data) {
        logger.info("Controller: fileUpload", {files,data});
        return await fileService.fileUpload(files,data);
    }
    
    async fileQuery(data){
        logger.info("Controller: fileQuery",data);
        return await fileService.fileQuery(data);
    }

    async queueCheck(data){
        logger.info("Controller: queueCheck",data);
        return await fileService.queueCheck(data);
    }
}
module.exports = new FileController();