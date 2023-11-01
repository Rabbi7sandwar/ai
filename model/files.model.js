const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes, Model) => {

    class Files extends Model {}

    Files.init({
        // Model attributes are defined here
          filetype: {
            type: DataTypes.STRING
            //allowNull defaults to true
          },
          fileName: {
            type: DataTypes.STRING
            // allowNull defaults to true
          },
          about: {
            type: DataTypes.STRING
            // allowNull defaults to true
          },
          path: {
              type: DataTypes.STRING,
              // allowNull: false
          },
          isDeleted:{
            type: DataTypes.BOOLEAN
            // allowNull defaults to true
          }
      }, {
        // Other model options go here
        sequelize, // We need to pass the connection instance
        modelName: 'file' // We need to choose the model name
      });
      
      return Files;
}