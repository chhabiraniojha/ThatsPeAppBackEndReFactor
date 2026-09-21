const {
    resolveLookup,
} = require("./mobikwikLookupResolver");

const PARAM_COUNT = 10;

/*
============================================================
COMMON HELPERS
============================================================
*/

const isEmpty = (value) => {
    return (
        value === null ||
        value === undefined ||
        (
            typeof value === "string" &&
            value.trim() === ""
        )
    );
};


/*
============================================================
OPTIONAL VALUE NORMALIZATION
============================================================
*/

const normalizeOptional = (value) => {
    if (isEmpty(value)) {
        return null;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized = String(value)
        .trim()
        .toLowerCase();

    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    return null;
};


/*
============================================================
FORMAT DETECTION
============================================================
*/

const detectFormat = (paramName) => {
    if (isEmpty(paramName)) {
        return null;
    }

    const name = String(paramName)
        .trim()
        .toLowerCase();

    /*
    Date of birth
    */

    if (
        name.includes("date of birth") ||
        name.includes("dob")
    ) {
        if (name.includes("yyyy-mm-dd")) {
            return "YYYY-MM-DD";
        }

        if (name.includes("dd/mm/yyyy")) {
            return "DD/MM/YYYY";
        }

        if (name.includes("dd-mm-yyyy")) {
            return "DD-MM-YYYY";
        }

        if (name.includes("mm/dd/yyyy")) {
            return "MM/DD/YYYY";
        }

        return "DATE";
    }

    /*
    Generic date
    */

    if (name.includes("date")) {
        return "DATE";
    }

    return null;
};


/*
============================================================
NORMALIZE ONE ALLOWED VALUE
============================================================

IMPORTANT:

Only OUTER regex wrapper is removed.

Inner parentheses are preserved.

Example:

^(110 Personal Accident (Individual / Family))$

becomes:

110 Personal Accident (Individual / Family)

The inner parentheses are NOT removed.
============================================================
*/

const normalizeAlternative = (part) => {
    let value = String(part).trim();

    /*
    Remove ^ from beginning.
    */

    if (value.startsWith("^")) {
        value = value.substring(1).trim();
    }

    /*
    Remove $ from end.
    */

    if (value.endsWith("$")) {
        value = value.substring(
            0,
            value.length - 1
        ).trim();
    }

    /*
    Remove ONE outer pair only.

    We intentionally do not try to understand
    inner parentheses.
    */

    if (
        value.startsWith("(") &&
        value.endsWith(")")
    ) {
        value = value.substring(
            1,
            value.length - 1
        ).trim();
    }

    return value;
};


/*
============================================================
LITERAL OPTION CHECK
============================================================

These characters are allowed inside an option:

(
)
:
/
-
&
.
,
spaces

because they can be part of actual option text.

We reject characters that normally indicate
actual regex syntax.
============================================================
*/

const isLiteralOption = (value) => {
    if (isEmpty(value)) {
        return false;
    }

    const stringValue = String(value).trim();

    return !/[\\[\]{}+*?$^]/.test(
        stringValue
    );
};


/*
============================================================
REGEX CLASSIFICATION
============================================================

Possible result:

NONE

ALLOWED_VALUES

VALIDATION_REGEX
============================================================
*/

const classifyRegex = (regex) => {
    if (isEmpty(regex)) {
        return {
            type: "NONE",
            values: null,
        };
    }

    let value = String(regex).trim();

    /*
    ========================================================
    CASE 1
    Complete grouped allowed-values regex

    Example:

    ^(A|B|C)$

    Important:
    Pehle OUTER ^(...)$ wrapper remove karenge.
    Uske baad "|" par split karenge.

    Isse first/last option me "(" / ")" nahi aayega.

    Inner parentheses remain untouched.

    Example:

    ^(110 Personal Accident (Individual / Family)|ABC)$

    Inner:
    (Individual / Family)

    preserve rahega.
    ========================================================
    */

    const groupedMatch = value.match(
        /^\^\((.*)\)\$$/
    );

    if (groupedMatch) {
        const inside = groupedMatch[1];

        const parts = inside
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean);

        if (parts.length >= 1) {
            const values = parts.map((item) => {
                return item.trim();
            });

            const allLiteral = values.every(
                isLiteralOption
            );

            if (allLiteral) {
                return {
                    type: "ALLOWED_VALUES",
                    values,
                };
            }
        }
    }


    /*
    ========================================================
    CASE 2

    Multiple separately wrapped alternatives

    Example:

    ^(A)$|^(B)$|^(C)$

    Each option ka outer wrapper separately remove hoga.
    ========================================================
    */

    if (value.includes("|")) {
        const parts = value
            .split("|")
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length >= 2) {
            const values = parts.map(
                normalizeAlternative
            );

            const allLiteral = values.every(
                isLiteralOption
            );

            if (allLiteral) {
                return {
                    type: "ALLOWED_VALUES",
                    values,
                };
            }
        }
    }


    /*
    ========================================================
    CASE 3

    Single allowed value

    Example:

    ^(Gold Loan)$

    ^(2025-2026)$

    ^(Trade License)$
    ========================================================
    */

    const singleValueMatch = value.match(
        /^\^\((.*)\)\$$/
    );

    if (singleValueMatch) {
        const singleValue =
            singleValueMatch[1].trim();

        if (isLiteralOption(singleValue)) {
            return {
                type: "ALLOWED_VALUES",
                values: [singleValue],
            };
        }
    }


    /*
    ========================================================
    NORMAL VALIDATION REGEX
    ========================================================
    */

    return {
        type: "VALIDATION_REGEX",
        values: null,
    };
};


/*
============================================================
INPUT TYPE DETECTION
============================================================
*/

const detectInputType = ({
    paramName,
    paramId,
    regex,
    regexInfo,
    lookup,
}) => {

    /*
    ALLOWED VALUES always has highest priority.
    */

    if (
        regexInfo.type === "ALLOWED_VALUES"
    ) {
        return "select";
    }


    /*
    Lookup comes after allowed values.
    */

    if (
        lookup?.isLookup
    ) {
        if (
            lookup.lookupType === "SELECT"
        ) {
            return "select";
        }

        return "search-select";
    }


    const name = String(
        paramName || ""
    )
        .trim()
        .toLowerCase();

    const id = String(
        paramId || ""
    )
        .trim()
        .toLowerCase();


    /*
    Mobile
    */

    if (
        name.includes("mobile") ||
        id.includes("mobile")
    ) {
        return "mobile";
    }


    /*
    Date
    */

    if (
        detectFormat(paramName)
    ) {
        return "date";
    }


    /*
    Numeric input

    Only obvious numeric regexes.
    */

    if (!isEmpty(regex)) {
        const regexString =
            String(regex).trim();

        if (
            /^\^?\[0-9\]/.test(regexString) ||
            /^\^?\\d/.test(regexString)
        ) {
            return "number";
        }
    }


    return "text";
};


/*
============================================================
PARAMETER CLASSIFICATION
============================================================

NONE
STATIC_VALUE
INPUT
============================================================
*/

const classifyParameter = ({
    paramName,
    paramId,
    paymentId,
    regex,
}) => {

    /*
    No parameter
    */

    if (
        isEmpty(paramName) &&
        isEmpty(paramId) &&
        isEmpty(paymentId)
    ) {
        return {
            type: "NONE",
        };
    }


    /*
    ========================================================
    KNOWN STATIC VALUE CASE

    This is intentionally conservative.

    Do not treat every numeric regex as static.
    ========================================================
    */

    if (
        String(paramId || "").trim() ===
            "bankName" &&
        !isEmpty(paymentId) &&
        !isEmpty(regex)
    ) {
        const value =
            String(regex).trim();

        if (/^[0-9]+$/.test(value)) {
            return {
                type: "STATIC_VALUE",
                staticValue: value,
            };
        }
    }


    /*
    Normal input
    */

    return {
        type: "INPUT",
    };
};


/*
============================================================
BUILD ONE PARAMETER
============================================================
*/

const buildParameterField = ({
    config,
    paramNo,
}) => {

    const paramName =
        config[`param${paramNo}Name`];

    const paramId =
        config[`param${paramNo}Id`];

    const paymentId =
        paramNo === 1
            ? null
            : config[`param${paramNo}PaymentId`];

    const regex =
        config[`param${paramNo}Regex`];

    const optional =
        normalizeOptional(
            config[
                `param${paramNo}Optional`
            ]
        );


    /*
    ========================================================
    CLASSIFY PARAMETER
    ========================================================
    */

    const classification =
        classifyParameter({
            paramName,
            paramId,
            paymentId,
            regex,
        });


    /*
    No parameter
    */

    if (
        classification.type === "NONE"
    ) {
        return null;
    }


    /*
    Static value

    Do not expose it to frontend.
    */

    if (
        classification.type ===
        "STATIC_VALUE"
    ) {
        return null;
    }


    /*
    ========================================================
    FIRST CLASSIFY REGEX
    ========================================================
    */

    const regexInfo =
        classifyRegex(regex);


    /*
    ========================================================
    REQUIRED / OPTIONAL
    ========================================================
    */

    let required = true;

    if (optional === true) {
        required = false;
    }

    if (optional === false) {
        required = true;
    }

    /*
    NULL is context dependent.

    For current Input Fields API we keep
    it required by default.
    */

    if (optional === null) {
        required = true;
    }


    /*
    ========================================================
    LOOKUP RESOLUTION
    ========================================================

    IMPORTANT BUSINESS RULE:

    If regex itself provides complete allowed
    values, DO NOT call lookup resolver.

    Only if regex does NOT provide allowed values,
    lookup resolver is checked.
    ========================================================
    */

    let lookup = {
        isLookup: false,
        lookupType: null,
        lookupName: null,
        lookupModel: null,
    };

    if (
        regexInfo.type !== "ALLOWED_VALUES"
    ) {
        lookup =
            resolveLookup({
                op: config.op,
                paramNo,
                paramName,
                paramId,
                paymentId,
            });
    }


    /*
    ========================================================
    INPUT TYPE
    ========================================================
    */

    const inputType =
        detectInputType({
            paramName,
            paramId,
            regex,
            regexInfo,
            lookup,
        });


    /*
    ========================================================
    BASE FIELD
    ========================================================
    */

    const field = {
        fieldKey:
            paramId || null,

        label:
            paramName ||
            paramId ||
            `Parameter ${paramNo}`,

        inputType,

        required,

        parameterNo:
            paramNo,

        validation: null,

        options: null,

        lookup: null,
    };


    /*
    ========================================================
    ALLOWED VALUES
    ========================================================

    Example:

    ^(Agra : 201|Ahmedabad : 202|...)
    */

    if (
        regexInfo.type === "ALLOWED_VALUES"
    ) {
        field.options =
            regexInfo.values;

        return field;
    }


    /*
    ========================================================
    LOOKUP
    ========================================================
    */

    if (
        lookup?.isLookup
    ) {
        field.lookup = {
            type:
                lookup.lookupType,

            name:
                lookup.lookupName,
        };

        /*
        Lookup field ko regex validation
        expose nahi karna.
        */

        return field;
    }


    /*
    ========================================================
    NORMAL REGEX VALIDATION
    ========================================================
    */

    if (
        regexInfo.type ===
        "VALIDATION_REGEX"
    ) {
        field.validation = {
            type: "regex",
            pattern: String(regex),
        };
    }


    /*
    ========================================================
    FORMAT VALIDATION
    ========================================================
    */

    const format =
        detectFormat(paramName);

    if (
        !field.validation &&
        format
    ) {
        field.validation = {
            type: "format",
            format,
        };
    }


    return field;
};


/*
============================================================
BUILD ALL PARAMETERS
============================================================
*/

const buildInputFields = (
    config
) => {

    const fields = [];

    for (
        let paramNo = 1;
        paramNo <= PARAM_COUNT;
        paramNo++
    ) {
        const field =
            buildParameterField({
                config,
                paramNo,
            });

        if (field) {
            fields.push(field);
        }
    }

    return fields;
};


/*
============================================================
EXPORT
============================================================
*/

module.exports = {
    buildInputFields,
    buildParameterField,
    classifyRegex,
    detectFormat,
};