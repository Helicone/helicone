import fse from 'fs-extra';
export const writeOpenApiFiles = async (openApiFiles) => {
    const openApiTargetPath = 'src/_props/openApiFiles.json';
    await fse.remove(openApiTargetPath);
    await fse.outputFile(openApiTargetPath, JSON.stringify(openApiFiles), {
        flag: 'w',
    });
};
