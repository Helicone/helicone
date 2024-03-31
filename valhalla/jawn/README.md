# Code overview

This project is structured using the MVC (Model-View-Controller) pattern, with an emphasis on separating concerns to make the codebase easier to navigate and scale. Below is an overview of the main directories and their roles:

```
src/
|-- controllers/
|   |-- userController.ts
|   `-- anotherController.ts
|-- models/
|   |-- userModel.ts
|   `-- anotherModel.ts
|-- services/
|   |-- userService.ts
|   `-- anotherService.ts
|-- middleware/
|   |-- authMiddleware.ts
|   `-- errorMiddleware.ts
|-- types/
|   `-- customTypes.ts
|-- utils/
    `-- helpers.ts
```

- `controllers/`: Contains all the route handlers for each REST object, orchestrating the application's response to client requests.
- `models/`: Defines the data models of the application, representing the structure of the data within the database.
- `services/`: Houses the business logic of the application, interacting with models to process data and handle application-specific tasks.
- `middleware/`: Stores Express middleware functions, including authentication (e.g., JWT verification) and error handling.
- `types/`: Contains custom TypeScript type definitions and interfaces that don't fit directly into models but are used across multiple parts of the application.
- `utils/`: Includes utility functions and helper methods, providing common functionality that can be reused throughout the application.

# `src/lib` overview

The `lib` directory contains core components that support the application's operations, emphasizing encapsulation of specific functionalities:

- `lib/stores/`: Responsible for specific data operations, these components interact directly with the database or data sources. An `AlertStore`, for example, might manage all operations related to alerts.

  ```typescript
  class AlertStore {
    async getAlerts() {
      // Logic to fetch alerts from the database
    }

    async updateAlert(alertId: string, updateData: object) {
      // Logic to update an alert in the database
    }
  }
  ```

- `lib/wrappers/`: Enhance or extend the functionality of existing libraries or database interactions. A `ClickhouseWrapper` might standardize interactions with the Clickhouse database, adding features like logging or error handling.

  ```typescript
  class ClickhouseWrapper {
    query(sql: string) {
      // Add logging
      console.log(`Executing query: ${sql}`);
      // Execute the query
      // Add error handling
    }
  }
  ```

- `lib/managers/`: Coordinate operations and the flow of data between components. They oversee high-level business logic and data processing, such as an `AlertManager` managing the lifecycle of alerts from retrieval to processing.

  ```typescript
  class AlertManager {
    private alertStore: AlertStore;

    constructor(alertStore: AlertStore) {
      this.alertStore = alertStore;
    }

    async processAlerts() {
      const alerts = await this.alertStore.getAlerts();
      // Process alerts
    }
  }
  ```

- `lib/clients/`: Facilitate interaction with external services or resources, such as an `S3Client` handling file operations with AWS S3.

  ```typescript
  class S3Client {
    async uploadFile(file: File) {
      // Logic to upload file to S3
    }

    async getFile(fileKey: string) {
      // Logic to retrieve file from S3
    }
  }
  ```

These components are designed to be reusable and modular, promoting a clean architecture and separation of concerns within the application.
