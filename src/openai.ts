import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  organization: "org-OsHxtcCg5dzKfpB5T1Gxo99b",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default openai;
