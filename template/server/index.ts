import * as http from "http";
import { sendServerStartSignal } from "bhs-scripts";

const server = http.createServer(async (_, res) => {
  const text = "Hello World!";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.write(text);
  res.end();
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;

if (isNaN(port)) {
  throw new Error(`The env variable PORT should be defined`);
}

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  sendServerStartSignal();
});
