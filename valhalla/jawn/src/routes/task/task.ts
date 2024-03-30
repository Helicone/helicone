import {
  OpenAPIRoute,
  Path,
  Str,
  DateOnly,
  DataOf,
} from "@cloudflare/itty-router-openapi";

const Task = {
  name: new Str({ example: "lorem" }),
  slug: String,
  description: new Str({ required: false }),
  completed: Boolean,
  due_date: new DateOnly(),
};

export class TaskFetch extends OpenAPIRoute {
  static schema = {
    tags: ["Tasks"],
    summary: "Get a single Task by slug",
    parameters: {
      taskSlug: Path(Str, {
        description: "Task slug",
      }),
    },
    responses: {
      "200": {
        description: "Task fetched successfully",
        schema: {
          metaData: {},
          task: Task,
        },
      },
    },
  };

  async handle(
    request: Request,
    env: any,
    context: any,
    data: DataOf<typeof TaskFetch.schema>
  ) {
    // Retrieve the validated slug
    const { taskSlug } = data.params;

    // Actually fetch a task using the taskSlug

    return {
      metaData: { meta: "data" },
      task: {
        name: "my task",
        slug: taskSlug,
        description: "this needs to be done",
        completed: false,
        due_date: new Date().toISOString().slice(0, 10),
      },
    };
  }
}
