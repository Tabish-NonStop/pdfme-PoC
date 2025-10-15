import { generate } from "@pdfme/generator";
import { BLANK_A4_PDF } from "@pdfme/common";
import * as schemas from "@pdfme/schemas";

const barcodePlugins = schemas.barcodes || {};
const availablePlugins = {
    text: schemas.text,
    image: schemas.image,
    svg: schemas.svg,
    table: schemas.table,
    multiVariableText: schemas.multiVariableText,
    line: schemas.line,
    rectangle: schemas.rectangle,
    ellipse: schemas.ellipse,
    dateTime: schemas.dateTime,
    date: schemas.date,
    time: schemas.time,
    select: schemas.select,
    checkbox: schemas.checkbox,
    radioGroup: schemas.radioGroup,
    ...barcodePlugins,
};

function getPluginsForTemplate(schemaList) {
    const plugins = {};
    for (const field of schemaList) {
        if (availablePlugins[field.type]) {
            plugins[field.type] = availablePlugins[field.type];
        }
    }
    return plugins;
}

function processSchemaFields(schemaList) {
    return schemaList.map(field => {
        if (field.type === "signature") field.type = "image";
        return field;
    });
}

async function main() {
    // 1️⃣ Read JSON input from stdin
    const inputChunks = [];
    for await (const chunk of process.stdin) inputChunks.push(chunk);
    const inputStr = Buffer.concat(inputChunks).toString();
    const { data, template } = JSON.parse(inputStr);

    if (!template || !data) {
        console.error("Error: JSON must contain both 'template' and 'data' fields.");
        process.exit(1);
    }

    // 2️⃣ Prepare schema and plugins
    let fixedSchemas = processSchemaFields(template.schemas[0]);
    const plugins = getPluginsForTemplate(fixedSchemas);

    // 3️⃣ Construct final pdfme template
    const pdfTemplate = {
        basePdf: template.basePdf || BLANK_A4_PDF,
        schemas: [fixedSchemas],
    };

    // 4️⃣ Generate PDF using user data
    const pdfBuffer = await generate({
        template: pdfTemplate,
        inputs: [data], // 👈 directly using your 'data' field now
        plugins,
    });

    // 5️⃣ Output the generated PDF
    process.stdout.write(pdfBuffer);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
