import * as http from "http";

const server = http.createServer((_, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.write("Hello!");
  res.end();
});

server.listen(process.env.PORT, () => {
  // Logging "SERVER_STARTED" here triggers a reload of the client
  console.log("SERVER_STARTED");
});
