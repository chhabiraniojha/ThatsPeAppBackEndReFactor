const isEmpty = (value) => {
    return (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    );
};

/**
 * Known MobiKwik static/predefined parameter resolver.
 *
 * Important:
 * - FASTag: Param_2 bankName is static.
 * - CCBP: Param_4 bankCode is biller-specific predefined value.
 *
 * The user selects the biller/operator first.
 * The engine then gets the corresponding static value
 * from that biller's MobiKwik configuration.
 */

const resolveStaticParams = (config) => {
    if (!config) {
        const error = new Error(
            "MobiKwik config is required-from resolveStaticParams"
        );

        error.code = "MOBIKWIK_CONFIG_REQUIRED";

        throw error;
    }

    const staticParams = {};

    for (let parameterNo = 1; parameterNo <= 10; parameterNo++) {
        const paramId = config[`param${parameterNo}Id`];
        const regex = config[`param${parameterNo}Regex`];
        const optional = config[`param${parameterNo}Optional`];

        if (isEmpty(paramId) || isEmpty(regex)) {
            continue;
        }

        /*
         * FASTag special case
         */
        if (
            parameterNo === 2 &&
            paramId === "bankName" &&
            isEmpty(optional)
        ) {
            staticParams[paramId] = String(regex).trim();
            continue;
        }

        /*
         * CCBP special case
         */
        if (
            parameterNo === 4 &&
            paramId === "bankCode" &&
            !isEmpty(regex) &&
            String(regex).trim()
        ) {
            staticParams[paramId] = String(regex).trim();
            continue;
        }
    }

    return staticParams;
};

module.exports = {
    resolveStaticParams,
};