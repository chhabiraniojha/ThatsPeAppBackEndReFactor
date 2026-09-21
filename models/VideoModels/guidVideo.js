const { DataTypes } = require("sequelize");
const sequelize = require("../../util/db_connect");

const GuideVideo = sequelize.define(
  "GuideVideo",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    videoType: {
      type: DataTypes.ENUM(
        "HOW_TO_RECHARGE",
        "HOW_TO_CREATE_TICKET"
      ),
      allowNull: false,
    },

    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },

    createdBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "GuideVideos",
    timestamps: true,

    indexes: [
      {
        fields: ["videoType"],
        name: "idx_guide_video_type",
      },
      {
        fields: ["status"],
        name: "idx_guide_video_status",
      },
    ],
  }
);

module.exports = GuideVideo;