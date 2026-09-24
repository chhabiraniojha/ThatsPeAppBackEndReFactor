const isEmptyValue = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

const getFieldValue = (field) => {
  const value = field?.value;

  // Select value:
  // {
  //   label: "...",
  //   value: "..."
  // }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "value")
  ) {
    return value.value;
  }

  return value;
};

const compareValidation = (frontendValidation, builderValidation) => {
  if (
    JSON.stringify(frontendValidation ?? null) !==
    JSON.stringify(builderValidation ?? null)
  ) {
    return false;
  }

  return true;
};

const validateRegex = (value, validation) => {
  if (!validation) {
    return true;
  }

  if (validation.type !== "regex") {
    return true;
  }

  if (!validation.pattern) {
    return true;
  }

  try {
    const regex = new RegExp(validation.pattern);

    return regex.test(String(value));
  } catch (error) {
    throw new Error(
      `Invalid regex configuration: ${validation.pattern}`
    );
  }
};

const validateSelectValue = (field, builderField) => {
  const frontendValue = field.value;

  if (
    !frontendValue ||
    typeof frontendValue !== "object" ||
    !Object.prototype.hasOwnProperty.call(frontendValue, "value")
  ) {
    return {
      valid: false,
      message: `${builderField.label} must contain label and value`,
    };
  }

  const selectedValue = String(frontendValue.value);

  const options = Array.isArray(builderField.options)
    ? builderField.options
    : [];

  const matchedOption = options.find(
    (option) =>
      option &&
      option.value !== undefined &&
      String(option.value) === selectedValue
  );

  if (!matchedOption) {
    return {
      valid: false,
      message: `Invalid value for ${builderField.fieldKey}`,
    };
  }

  return {
    valid: true,
    matchedOption,
  };
};

const validateOrderFields = ({
  frontendFields,
  builderFields,
}) => {
  if (!Array.isArray(frontendFields)) {
    return {
      valid: false,
      message: "fields must be an array",
    };
  }

  if (!Array.isArray(builderFields)) {
    return {
      valid: false,
      message: "Unable to load required input fields",
    };
  }

  /*
   * -----------------------------------------
   * 1. Frontend fields ko fieldKey se map karo
   * -----------------------------------------
   */

  const frontendFieldMap = new Map();

  for (const field of frontendFields) {
    if (!field?.fieldKey) {
      return {
        valid: false,
        message: "Every field must contain fieldKey",
      };
    }

    if (frontendFieldMap.has(field.fieldKey)) {
      return {
        valid: false,
        message: `Duplicate fieldKey: ${field.fieldKey}`,
      };
    }

    frontendFieldMap.set(field.fieldKey, field);
  }

  /*
   * -----------------------------------------
   * 2. Unknown frontend fields check
   * -----------------------------------------
   */

  const builderFieldKeys = new Set(
    builderFields.map((field) => field.fieldKey)
  );

  for (const frontendField of frontendFields) {
    if (!builderFieldKeys.has(frontendField.fieldKey)) {
      return {
        valid: false,
        message: `Unknown field: ${frontendField.fieldKey}`,
      };
    }
  }

  /*
   * -----------------------------------------
   * 3. Builder ke har field ko validate karo
   * -----------------------------------------
   */

  const validatedFields = [];

  for (const builderField of builderFields) {
    const frontendField = frontendFieldMap.get(
      builderField.fieldKey
    );

    /*
     * -----------------------------------------
     * Required field missing
     * -----------------------------------------
     */

    if (!frontendField) {
      if (builderField.required === true) {
        return {
          valid: false,
          message: `${builderField.label} is required`,
        };
      }

      /*
       * Optional field frontend ne nahi bheja
       * Allowed
       */
      continue;
    }

    /*
     * -----------------------------------------
     * Configuration comparison
     * -----------------------------------------
     */

    if (frontendField.label !== builderField.label) {
      return {
        valid: false,
        message: `Invalid label for ${builderField.fieldKey}`,
      };
    }

    if (frontendField.inputType !== builderField.inputType) {
      return {
        valid: false,
        message: `Invalid inputType for ${builderField.fieldKey}`,
      };
    }

    if (frontendField.required !== builderField.required) {
      return {
        valid: false,
        message: `Invalid required configuration for ${builderField.fieldKey}`,
      };
    }

    if (frontendField.parameterNo !== builderField.parameterNo) {
      return {
        valid: false,
        message: `Invalid parameterNo for ${builderField.fieldKey}`,
      };
    }

    if (
      !compareValidation(
        frontendField.validation,
        builderField.validation
      )
    ) {
      return {
        valid: false,
        message: `Invalid validation configuration for ${builderField.fieldKey}`,
      };
    }

    if (
      JSON.stringify(frontendField.lookup ?? null) !==
      JSON.stringify(builderField.lookup ?? null)
    ) {
      return {
        valid: false,
        message: `Invalid lookup configuration for ${builderField.fieldKey}`,
      };
    }

    /*
     * IMPORTANT:
     * options ko compare nahi karenge.
     *
     * Frontend:
     * options: null
     *
     * Builder:
     * actual 376 options
     */

    /*
     * -----------------------------------------
     * Value validation
     * -----------------------------------------
     */

    const value = getFieldValue(frontendField);

    if (
      builderField.required === true &&
      isEmptyValue(value)
    ) {
      return {
        valid: false,
        message: `${builderField.label} is required`,
      };
    }

    /*
     * Optional field aur value nahi hai
     */

    if (isEmptyValue(value)) {
      validatedFields.push({
        ...builderField,
        value: null,
      });

      continue;
    }

    /*
     * -----------------------------------------
     * Select validation
     * -----------------------------------------
     */

    if (builderField.inputType === "select") {
      const selectResult = validateSelectValue(
        frontendField,
        builderField
      );

      if (!selectResult.valid) {
        return selectResult;
      }
    }

    /*
     * -----------------------------------------
     * Regex validation
     * -----------------------------------------
     */

    if (builderField.validation) {
      const regexValid = validateRegex(
        value,
        builderField.validation
      );

      if (!regexValid) {
        return {
          valid: false,
          message: `Invalid value for ${builderField.fieldKey}`,
        };
      }
    }

    /*
     * -----------------------------------------
     * Validated field
     *
     * Builder configuration + frontend value
     * -----------------------------------------
     */

    validatedFields.push({
      ...builderField,
      value: frontendField.value,
    });
  }

  /*
   * -----------------------------------------
   * Success
   * -----------------------------------------
   */

  return {
    valid: true,
    fields: validatedFields,
  };
};

module.exports = {
  validateOrderFields,
};