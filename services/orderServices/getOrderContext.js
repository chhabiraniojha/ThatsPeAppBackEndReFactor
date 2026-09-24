const User = require("../../models/UserModels/UserSchema/user");

const {
    getMobiKwikOperatorConfig,
} = require("../mobikwikServices/mobiKwikConfigResolver");


const getOrderContext = async ({
    userId,
    operatorId,
}) => {

    // =====================================================
    // 1. USER VALIDATION
    // =====================================================

    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error("User not found");

        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";

        throw error;
    }

    if (user.status !== "active") {
        const error = new Error(
            "User account is not active"
        );

        error.statusCode = 403;
        error.code = "USER_NOT_ACTIVE";

        throw error;
    }


    // =====================================================
    // 2. OPERATOR + SUBCATEGORY + MOBIKWIK CONFIG
    // =====================================================

    /*
     * getMobiKwikOperatorConfig internally:
     *
     * operatorId
     *      ↓
     * OperatorData
     *      ↓
     * SubCategory
     *      ↓
     * MobiKwik configuration
     */

    const operatorConfig =
        await getMobiKwikOperatorConfig({
            operatorId,
        });


    const {
        operator,
        subCategory,
        sourceType,
        config,
    } = operatorConfig;


    // =====================================================
    // 3. OPERATOR STATUS
    // =====================================================

    if (operator.status !== "active") {
        const error = new Error(
            "Operator is not active"
        );

        error.statusCode = 400;
        error.code = "OPERATOR_NOT_ACTIVE";

        throw error;
    }


    // =====================================================
    // 4. SUBCATEGORY STATUS
    // =====================================================

    if (subCategory.status !== "active") {
        const error = new Error(
            "Operator service is not active"
        );

        error.statusCode = 400;
        error.code = "SUBCATEGORY_NOT_ACTIVE";

        throw error;
    }


    // =====================================================
    // 5. RETURN ORDER CONTEXT
    // =====================================================

    return {
        user,
        operator,
        subCategory,
        sourceType,
        config,
    };
};


module.exports = {
    getOrderContext,
};