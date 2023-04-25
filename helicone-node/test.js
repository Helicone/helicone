(async () => {
    require("dotenv").config();
    const { Configuration, OpenAIApi } = require("./index");

    let configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    let openai = new OpenAIApi(configuration);
  
    let response = await openai.createCompletion({
      model: "text-ada-001",
      prompt: "Say this is a Helicone test",
      max_tokens: 12,
      temperature: 0,
    });
    console.log(response);
  
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello are you Helicone?" }],
    });
    console.log(completion);
  
    response = await openai.createEdit({
      model: "text-davinci-edit-001",
      input: "What Helicone day of the wek is it?",
      instruction: "Fix the spelling mistakes",
    });
    console.log(response);
  
    response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: "The helicone package is delicious...",
    });
    console.log(response);
  })();
  