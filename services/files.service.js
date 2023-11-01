const fileRepo  = require('../respository/files.repository');
const { connect } = require('../config/db.config');
const logger = require('../logger/api.logger');

class FileService {

    constructor() {}

    async fileUpload (files,data){
        return await fileRepo.fileUpload(files,data);
    }

    async fileQuery (data){
        return await fileRepo.fileQuery(data)
    }

    async queueCheck(data){
        return await fileRepo.queueCheck(data)
    }
}

module.exports = new FileService();
