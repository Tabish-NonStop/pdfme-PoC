import fs from "fs";
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
        if (field.type === "signature") {
            field.type = "image";
        }
        return field;
    });
}

async function main() {
    const inputChunks = [];
    for await (const chunk of process.stdin) inputChunks.push(chunk);
    const inputStr = Buffer.concat(inputChunks).toString();
    const templateData = JSON.parse(inputStr);

    let fixedSchemas = processSchemaFields(templateData.schemas[0]);
    const plugins = getPluginsForTemplate(fixedSchemas);

    const basePdfPath = "./scripts/assets/basePdfTemplate.pdf";
    const basePdfBuffer = fs.readFileSync(basePdfPath);

    const template = { basePdf: basePdfBuffer, schemas: [fixedSchemas] };
    const inputData = fixedSchemas.reduce((acc, field) => {
        acc[field.name] = field.content || field.default || "";
        return acc;
    }, {});

    const pdfBuffer = await generate({
        template,
        inputs: [inputData],
        plugins,
    });

    // Output PDF directly to stdout
    process.stdout.write(pdfBuffer);
}

main().catch(err => {
    process.exit(1);
});