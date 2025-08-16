export class Valhalla {
    database_url;
    heliconeAuth;
    url;
    constructor(database_url, heliconeAuth) {
        this.database_url = database_url;
        this.heliconeAuth = heliconeAuth;
        this.url = new URL(this.database_url);
    }
    route(path) {
        const urlCopy = new URL(this.url.toString());
        urlCopy.pathname = path;
        return urlCopy.toString();
    }
    async post(path, data) {
        return this.send(path, "POST", JSON.stringify(data));
    }
    async patch(path, data) {
        return this.send(path, "PATCH", JSON.stringify(data));
    }
    async put(path, data) {
        return this.send(path, "PUT", JSON.stringify(data));
    }
    async send(_path, _method, _body, _timeout = 5000) {
        return {
            error: "not implemented",
            data: null,
        };
        // const controller = new AbortController();
        // const timeoutId = setTimeout(() => controller.abort(), timeout);
        // try {
        //   const response = await fetch(this.route(path), {
        //     method,
        //     headers: {
        //       "Content-Type": "application/json",
        //       "Helicone-Authorization": JSON.stringify(this.heliconeAuth),
        //     },
        //     body: body,
        //     signal: controller.signal,
        //   });
        //   clearTimeout(timeoutId);
        //   const responseText = await response.text();
        //   if (response.status !== 200) {
        //     return err(`Failed to send request to Valhalla ${responseText}`);
        //   }
        //   if (responseText === "") {
        //     return err("Failed to send request to Valhalla");
        //   }
        //   try {
        //     return ok(JSON.parse(responseText) as T);
        //   } catch (e) {
        //     return err(`Failed to parse ${JSON.stringify(e)}`);
        //   }
        // } catch (e: any) {
        //   clearTimeout(timeoutId);
        //   if (e?.name === "AbortError") {
        //     return err("Request timed out");
        //   }
        //   return err(`Failed to send request to Valhalla ${JSON.stringify(e)}`);
        // }
    }
}
