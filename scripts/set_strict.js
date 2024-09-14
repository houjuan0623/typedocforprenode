// @ts-check
// Sets the Strict type that TypeDoc uses to enable overloads for consumers only.
// See the rationale in src/lib/utils/general.ts

const { promises: fs } = require("fs");
const { join } = require("path");

const file = join(__dirname, "../src/lib/utils/general.ts");

const isStrict = process.argv[2] === "true";

fs.readFile(file, { encoding: "utf-8" })
    .then((text) =>
        fs.writeFile(
            file,
            text.replace(
                /type InternalOnly =.*/,
                `type InternalOnly = ${isStrict};`,
            ),
        ),
    )
    .catch((reason) => {
        console.error(reason);
        process.exit(1);
    });
