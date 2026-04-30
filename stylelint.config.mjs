/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard-scss"],
  rules: {
    "layer-name-pattern": "^[a-z][a-zA-Z0-9]*$",
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*(?:_[A-Za-z0-9]+)?$",
      {
        message:
          "Expected class selector to match the project's CSS Modules naming convention",
      },
    ],
  },
};
