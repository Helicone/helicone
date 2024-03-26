import fse from 'fs-extra';
import path from 'path';
export const writeFiles = (contentDirectoryPath, targetDirectoryPath, filenames) => {
    const filePromises = [];
    filenames.forEach((filename) => {
        filePromises.push((async () => {
            const sourcePath = path.join(contentDirectoryPath, filename);
            const targetPath = path.join(targetDirectoryPath, filename);
            await fse.remove(targetPath);
            await fse.copy(sourcePath, targetPath);
        })());
    });
    return filePromises;
};
