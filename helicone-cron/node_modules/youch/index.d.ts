declare module "youch" {
  import { StackFrame } from "stack-trace";

  class Youch<Error, Request> {
    constructor(error: Error, request: Request);

    /**
     * Stores the link `callback` which
     * will be processed when rendering
     * the HTML view.
     */
    addLink(callback: Function): this;

    /**
     * Returns error stack as JSON.
     */
    toJSON(): Promise<{
      error: {
        message: string;
        name: string;
        status: number;
        frames: {
          file: string,
          filePath: string,
          method: string,
          line: number,
          column: number,
          context: {
            start: number,
            pre: string,
            line: string,
            post: string,
          },
          isModule: boolean,
          isNative: boolean,
          isApp: boolean
        }[];
      };
    }>;

    /**
     * Returns HTML representation of the error stack
     * by parsing the stack into frames and getting
     * important info out of it.
     */
    toHTML(): Promise<string>;
  }

  export default Youch;
}
