// import { Row } from "@tanstack/react-table";
// /**
//  * Finds and expands the path to a specific row
//  * @param table The React Table instance
//  * @param targetId The ID of the row to find
//  * @returns True if found and expanded, false otherwise
//  */
// export const expandToSpecificIdWithPath = (
//   table: ReactTable<Person>,
//   targetId: string
// ): boolean => {
//   const rows = table.getRowModel().rows;

//   for (const row of rows) {
//     const path = findPathToId(row, targetId);
//     if (path) {
//       expandPath(path);
//       return true;
//     }
//   }

//   return false;
// };

// /**
//  * Searches for a row with the specified ID in the tree and expands the path to it
//  * @param row The current row to search in
//  * @param targetId The ID of the row we're looking for
//  * @returns True if the target was found in this branch, false otherwise
//  */
// const findAndExpandToId = (row: Row<Person>, targetId: string): boolean => {
//   // If this is the target row, we found it!
//   if (row.original?.id === targetId) {
//     return true;
//   }

//   // If this row can be expanded, check its children
//   if (row.getCanExpand()) {
//     // First, check if any direct children match the target ID
//     for (const childRow of row.subRows) {
//       if (childRow.original?.id === targetId) {
//         // Found the target as a direct child, expand this row to reveal it
//         row.getToggleExpandedHandler()();
//         return true;
//       }
//     }

//     // If not found in direct children, search deeper and expand if found
//     for (const childRow of row.subRows) {
//       const foundInChild = findAndExpandToId(childRow, targetId);
//       if (foundInChild) {
//         // Target was found in this child's branch, expand this row
//         row.getToggleExpandedHandler()();
//         return true;
//       }
//     }
//   }

//   // Target not found in this branch
//   return false;
// };

// /**
//  * Usage example - search through all top-level rows
//  * @param table The React Table instance
//  * @param targetId The ID of the row to find and expand to
//  */
// const expandToSpecificId = (table: ReactTable<Person>, targetId: string) => {
//   const rows = table.getRowModel().rows;

//   for (const row of rows) {
//     if (findAndExpandToId(row, targetId)) {
//       break; // Stop once we've found and expanded to the target
//     }
//   }
// };

// // Alternative implementation with path tracking
// // This version collects the path first, then expands it

// /**
//  * Finds the path to a specific row in the tree
//  * @param row The current row to search in
//  * @param targetId The ID of the row we're looking for
//  * @param currentPath The current path of rows
//  * @returns An array of rows representing the path to the target, or null if not found
//  */
// const findPathToId = (
//   row: Row<Person>,
//   targetId: string,
//   currentPath: Row<Person>[] = []
// ): Row<Person>[] | null => {
//   // Add current row to path
//   const path = [...currentPath, row];

//   // If this is the target, return the path
//   if (row.original?.id === targetId) {
//     return path;
//   }

//   // If this row can be expanded, check its children
//   if (row.getCanExpand() && row.subRows) {
//     for (const childRow of row.subRows) {
//       const result = findPathToId(childRow, targetId, path);
//       if (result) {
//         return result;
//       }
//     }
//   }

//   // Not found in this branch
//   return null;
// };

// /**
//  * Expands all rows in the path to the target, except for the target itself
//  * @param path Array of rows leading to the target
//  */
// const expandPath = (path: Row<Person>[]) => {
//   // Expand all rows in the path except the last one (target)
//   for (let i = 0; i < path.length - 1; i++) {
//     const row = path[i];
//     if (!row.getIsExpanded()) {
//       row.getToggleExpandedHandler()();
//     }
//   }
// };
