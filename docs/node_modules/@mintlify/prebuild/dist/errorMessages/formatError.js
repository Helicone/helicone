import { getLocationErrString } from './getLocationErrString.js';
export const formatError = (error, filePath, contentDirectoryPath) => {
    if (typeof error !== 'object' || error == null) {
        return `\n ⚠️  Parsing error: ${filePath} - ${error}`;
    }
    const location = getLocationErrString(filePath, contentDirectoryPath, error);
    const errorString = 'reason' in error && error.reason != null ? error.reason : error;
    return `\n ⚠️  Parsing error: ${location} - ${errorString}`;
};
