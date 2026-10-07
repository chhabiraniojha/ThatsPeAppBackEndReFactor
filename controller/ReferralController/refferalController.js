const { Op, fn, col, literal } = require("sequelize");

const Referral = require("../../models/ReferralModel/Referral");
const User = require("../../models/UserModels/UserSchema/user");

exports.getReferrals = async (req, res, next) => {
  const userId = req.user?.id;

  const {
    startingDate,
    endingDate,
    rewardStatus,
    pageNumber = 1,
  } = req.query;

  try {
    /* ---------------------------------
       1. Authentication
    --------------------------------- */

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
        success: false,
      });
    }

    /* ---------------------------------
       2. Page validation
    --------------------------------- */

    const page = Number(pageNumber);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Invalid page number",
        success: false,
      });
    }

    /* ---------------------------------
       3. Reward status validation
    --------------------------------- */

    const allowedRewardStatuses = [
      "PENDING",
      "SUCCESS",
      "FAILED",
    ];

    if (
      rewardStatus &&
      !allowedRewardStatuses.includes(rewardStatus)
    ) {
      return res.status(400).json({
        message: "Invalid reward status",
        success: false,
      });
    }

    /* ---------------------------------
       4. Build filter
    --------------------------------- */

    const whereCondition = {
      referrerUserId: userId,
    };

    if (startingDate && endingDate) {
      whereCondition.createdAt = {
        [Op.between]: [startingDate, endingDate],
      };
    } else if (startingDate) {
      whereCondition.createdAt = {
        [Op.gte]: startingDate,
      };
    } else if (endingDate) {
      whereCondition.createdAt = {
        [Op.lte]: endingDate,
      };
    }

    if (rewardStatus) {
      whereCondition.rewardStatus = rewardStatus;
    }

    /* ---------------------------------
       5. Pagination
    --------------------------------- */

    const limit = 10;
    const offset = (page - 1) * limit;

    /* ---------------------------------
       6. Fetch referrals
    --------------------------------- */

    const {
      rows: referralDetails,
      count: totalRecords,
    } = await Referral.findAndCountAll({
      where: whereCondition,

      attributes: [
        "id",
        "referredUserId",
        "rewardAmount",
        "couponDiscount",
        "minimumRechargeAmount",
        "rewardStatus",
        "rewardWalletTransactionId",
        "rewardedAt",
        "createdAt",
      ],

      include: [
        {
          model: User,
          as: "referredUser",
          attributes: [
            "id",
            "name",
            "mobileNo",
          ],
          required: true,
        },
      ],

      order: [["createdAt", "DESC"]],

      offset,
      limit,

      distinct: true,
    });

    /* ---------------------------------
       7. Format response
    --------------------------------- */

    const formattedReferrals = referralDetails.map(
      (referral) => {
        const data = referral.toJSON();

        if (data.referredUser?.mobileNo) {
          const mobileNo = String(
            data.referredUser.mobileNo
          );

          data.referredUser.mobileNo =
            mobileNo.length > 4
              ? `XXXXXX${mobileNo.slice(-4)}`
              : mobileNo;
        }

        return data;
      }
    );

    /* ---------------------------------
       8. Pagination calculation
    --------------------------------- */

    const totalPages = Math.ceil(
      totalRecords / limit
    );

    /* ---------------------------------
       9. Response
    --------------------------------- */

    return res.status(200).json({
      message: "Referral details fetched successfully",
      success: true,
      referralDetails: formattedReferrals,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};






exports.getReferralSummary = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    /* ---------------------------------
       1. Authentication
    --------------------------------- */

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
        success: false,
      });
    }

    /* ---------------------------------
       2. Get referral summary
    --------------------------------- */

    const summary = await Referral.findOne({
      where: {
        referrerUserId: userId,
      },

      attributes: [
        [
          fn("COUNT", col("id")),
          "totalReferrals",
        ],

        [
          fn(
            "SUM",
            literal(
              "CASE WHEN rewardStatus = 'SUCCESS' THEN 1 ELSE 0 END"
            )
          ),
          "successfulRewards",
        ],

        [
          fn(
            "SUM",
            literal(
              "CASE WHEN rewardStatus = 'PENDING' THEN 1 ELSE 0 END"
            )
          ),
          "pendingRewards",
        ],

        [
          fn(
            "SUM",
            literal(
              "CASE WHEN rewardStatus = 'FAILED' THEN 1 ELSE 0 END"
            )
          ),
          "failedRewards",
        ],

        [
          fn(
            "COALESCE",
            fn(
              "SUM",
              literal(
                "CASE WHEN rewardStatus = 'SUCCESS' THEN rewardAmount ELSE 0 END"
              )
            ),
            0
          ),
          "totalRewardAmount",
        ],

        [
          fn(
            "COALESCE",
            fn(
              "SUM",
              literal(
                "CASE WHEN rewardStatus = 'PENDING' THEN rewardAmount ELSE 0 END"
              )
            ),
            0
          ),
          "pendingRewardAmount",
        ],
      ],

      raw: true,
    });

    /* ---------------------------------
       3. Format summary
    --------------------------------- */

    const referralSummary = {
      totalReferrals: Number(
        summary?.totalReferrals || 0
      ),

      successfulRewards: Number(
        summary?.successfulRewards || 0
      ),

      pendingRewards: Number(
        summary?.pendingRewards || 0
      ),

      failedRewards: Number(
        summary?.failedRewards || 0
      ),

      totalRewardAmount: Number(
        summary?.totalRewardAmount || 0
      ).toFixed(2),

      pendingRewardAmount: Number(
        summary?.pendingRewardAmount || 0
      ).toFixed(2),
    };

    /* ---------------------------------
       4. Response
    --------------------------------- */

    return res.status(200).json({
      message: "Referral summary fetched successfully",
      success: true,
      summary: referralSummary,
    });
  } catch (error) {
    next(error);
  }
};