const { DataTypes } = require('sequelize')
const sequelize = require('../../util/db_connect')

const guidVideoModel=sequelize.define('GuideVideo',{
    id:{
        type:DataTypes.STRING,
        primaryKey: true,     

    },
    url:{
        type:DataTypes.STRING(255),
        allowNull:false
    },
    status:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue:false


    }

})
module.exports=guidVideoModel