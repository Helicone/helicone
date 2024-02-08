import { isAbsolute, sep, relative } from 'path';
export const getLocationErrString = (filePath, contentDirectoryPath, error) => {
    filePath = isAbsolute(filePath) ? relative(contentDirectoryPath, filePath) : filePath;
    let location = filePath.startsWith(`.${sep}`) || isAbsolute(filePath) ? filePath : `.${sep}${filePath}`;
    if (typeof error === 'object' && error != null && 'line' in error && error.line != null) {
        location += `:${error.line}`;
        if ('column' in error && error.column != null) {
            location += `:${error.column}`;
        }
    }
    return location;
};
