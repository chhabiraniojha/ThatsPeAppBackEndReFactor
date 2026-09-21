const MobiKwikDistrictDiscom = require(
    "../../models/MobikwikModel/MobiKwikDistrictDiscom"
);

const MobiKwikJharkhandSubdivisionCodeList = require(
    "../../models/MobikwikModel/MobiKwikJharkhandSubdivisionCodeList"
);

const MobiKwikMadhyaPradeshUrban = require(
    "../../models/MobikwikModel/MobiKwikMadhyaPradeshUrban"
);


/*
============================================================
COMMON HELPER
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


const normalize = (value) => {
    if (isEmpty(value)) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};


/*
============================================================
LOOKUP CONFIG
============================================================

Yahan actual DB lookup configuration rahega.

resolveLookup()
aur
getLookupData()

dono isi config ko use karenge.
============================================================
*/

const LOOKUP_CONFIG = {

    /*
    ========================================================
    JHARKHAND
    ========================================================
    */

    JHARKHAND_SUBDIVISION: {
        model: MobiKwikJharkhandSubdivisionCodeList,

        labelField: "NAME",

        valueField: "UCODE",

        orderBy: "NAME",

        type: "SELECT",
    },


    /*
    ========================================================
    MADHYA PRADESH URBAN
    ========================================================
    */

    MADHYA_PRADESH_URBAN: {
        model: MobiKwikMadhyaPradeshUrban,

        labelField: "Madhya Pradesh Urban",

        valueField: "Madhya Pradesh Urban",

        orderBy: "Madhya Pradesh Urban",

        type: "SELECT",
    },


    /*
    ========================================================
    DISTRICT DISCOM
    ========================================================
    */

    DISTRICT_DISCOM: {
        model: MobiKwikDistrictDiscom,

        labelField: "districtDiscom",

        valueField: "districtDiscom",

        orderBy: "districtDiscom",

        type: "SELECT",
    },
};


/*
============================================================
RESOLVE LOOKUP
============================================================

Ye function decide karega:

Kya particular parameter ko lookup chahiye?

IMPORTANT:

InputFieldBuilder pehle regex check karega.

Agar regex = ALLOWED_VALUES hai,
to ye function call hi nahi hoga.

Agar normal regex hai,
tab ye function call hoga.
============================================================
*/

const resolveLookup = ({
    op,
    paramNo,
    paramName,
    paramId,
    paymentId,
}) => {

    const operatorCode =
        String(op ?? "").trim();

    const name =
        normalize(paramName);

    const id =
        normalize(paramId);

    const payment =
        normalize(paymentId);


    /*
    ========================================================
    1. JHARKHAND
       op = 821

       Only ULB Name
    ========================================================
    */

    if (
        operatorCode === "821" &&
        name === "ulb name"
    ) {

        const lookupName =
            "JHARKHAND_SUBDIVISION";

        const config =
            LOOKUP_CONFIG[lookupName];

        return {
            isLookup: true,

            lookupType: config.type,

            lookupName,

            lookupModel:
                config.model,
        };
    }


    /*
    ========================================================
    2. MADHYA PRADESH URBAN
       op = 370 / 371

       Only UlbCode
    ========================================================
    */

    if (
        (
            operatorCode === "370" ||
            operatorCode === "371"
        ) &&
        (
            name === "ulbcode" ||
            name === "ulb code"
        )
    ) {

        const lookupName =
            "MADHYA_PRADESH_URBAN";

        const config =
            LOOKUP_CONFIG[lookupName];

        return {
            isLookup: true,

            lookupType: config.type,

            lookupName,

            lookupModel:
                config.model,
        };
    }


    /*
    ========================================================
    3. DISTRICT DISCOM
       op = 1743

       Only District-Discom
    ========================================================
    */

    if (
        operatorCode === "1743" &&
        (
            name === "district-discom" ||
            name === "district discom" ||
            id === "districtdiscom"
        )
    ) {

        const lookupName =
            "DISTRICT_DISCOM";

        const config =
            LOOKUP_CONFIG[lookupName];

        return {
            isLookup: true,

            lookupType: config.type,

            lookupName,

            lookupModel:
                config.model,
        };
    }


    /*
    ========================================================
    NO LOOKUP
    ========================================================
    */

    return {
        isLookup: false,

        lookupType: null,

        lookupName: null,

        lookupModel: null,
    };
};


/*
============================================================
GET LOOKUP DATA
============================================================

Ye function actual DB se options fetch karega.

Example:

JHARKHAND_SUBDIVISION
        ↓
MobiKwikJharkhandSubdivisionCodeList
        ↓
125 records
        ↓
label + value
============================================================
*/

const getLookupData = async ({
    lookupName,
}) => {

    /*
    ========================================================
    VALIDATE LOOKUP NAME
    ========================================================
    */

    if (isEmpty(lookupName)) {

        const error = new Error(
            "Lookup name is required"
        );

        error.code =
            "LOOKUP_NAME_REQUIRED";

        throw error;
    }


    /*
    ========================================================
    FIND CONFIG
    ========================================================
    */

    const config =
        LOOKUP_CONFIG[lookupName];


    if (!config) {

        const error = new Error(
            `Unsupported lookup: ${lookupName}`
        );

        error.code =
            "LOOKUP_NOT_SUPPORTED";

        throw error;
    }


    /*
    ========================================================
    FETCH ALL DATA
    ========================================================
    */

    const rows =
        await config.model.findAll({

            order: [
                [
                    config.orderBy,
                    "ASC",
                ],
            ],

            raw: true,
        });


    /*
    ========================================================
    FORMAT OPTIONS
    ========================================================
    */

    const options = rows
        .map((row) => {

            const label =
                row[config.labelField];

            const value =
                row[config.valueField];


            /*
            Ignore empty label
            */

            if (
                label === null ||
                label === undefined ||
                String(label).trim() === ""
            ) {
                return null;
            }


            /*
            Ignore empty value
            */

            if (
                value === null ||
                value === undefined ||
                String(value).trim() === ""
            ) {
                return null;
            }


            return {

                /*
                Frontend display value
                */

                label:
                    String(label).trim(),

                /*
                Vendor value

                String intentionally rakha hai
                taaki leading zero preserve rahe.
                */

                value:
                    String(value).trim(),
            };
        })
        .filter(Boolean);


    /*
    ========================================================
    FINAL RESULT
    ========================================================
    */

    return {

        lookupName,

        type: "SELECT",

        options,
    };
};


/*
============================================================
EXPORT
============================================================
*/

module.exports = {
    resolveLookup,
    getLookupData,
};