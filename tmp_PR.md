# Filter System Overhaul

This PR introduces a complete overhaul of the filtering system in Helicone, replacing the previous organization-based filter approach with a more flexible and powerful filter architecture.

## Key Changes

### API Changes

- Removed legacy endpoints related to organization filters and layout
- Added new dedicated endpoints for filter CRUD operations
- Added new endpoints for property search and model retrieval
- Updated schemas to support the new filter structure

### New Components

- Added `FilterASTEditor` - A powerful component for creating and managing filters
- Added `FilterConditionNode` - For handling individual filter conditions
- Added `FilterGroupNode` - For managing groups of filter conditions with AND/OR operators
- Added `SaveFilterDialog` - For saving filters with custom names
- Added `SavedFiltersList` - For displaying and managing saved filters
- Added `SearchableInput` and `SearchableSelect` - Enhanced input components with search capabilities

### New UI Components

- Added `Toaster` component using Sonner for toast notifications
- Added `ToggleGroup` and `ToggleGroupItem` components for toggle functionality
- Added `Toggle` component with variant and size options

### State Management

- Created `filterContext.tsx` for centralized filter state management
- Implemented `filterStore.ts` using Zustand for filter state
- Added various hooks for filter operations:
  - `useFilterUIDefinitions` - For fetching and combining static and dynamic filter definitions
  - `useAutoSaveFilter` - For automatically saving filters after changes
  - `useFilterActions` - For common filter operations
  - `useFilterCrud` - For filter CRUD operations
  - `useFilterNavigation` - For navigating and manipulating filter expressions
  - `useContextHelpers` - For managing saved filters for specific page types

### Filter Definition System

- Added comprehensive filter definitions for various field types (string, number, boolean, datetime)
- Implemented interfaces and types for creating filter expressions
- Added support for dynamic filter options via API

### Example Implementation

- Added an example page demonstrating the new filter system capabilities
- Included examples of programmatically creating simple and complex filters

## Dependencies

- Added new packages:
  - `@radix-ui/react-toast`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`
  - `sonner`
- Updated package versions for better compatibility

## Removed Functionality

- Removed `useOrganizationLayout` hook and related code
- Removed organization-specific filter methods from various controllers and stores

This PR significantly enhances the filtering capabilities of Helicone, providing a more intuitive and powerful way for users to filter and analyze their data.
