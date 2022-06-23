const { Client } = require("@elastic/elasticsearch");
const esClient = new Client({
  node: process.env.ELASTIC_SEARCH_URL,
});

const addCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, DELETE, HEAD, OPTIONS"
  );
};

const esBulk = async (str) => {
  let json;
  try {
    json = JSON.parse(str);
  } catch (e) {
    console.error(e, str);
    return false;
  }
  if (!esClient) {
    console.error("no client provided!");
    return false;
  }
  const res = await esClient.bulk({
    body: json,
    refresh: "wait_for",
  });
  if (res.statusCode !== 200) {
    console.error("bulk api error", res);
    return false;
  }
  return true;
};

module.exports = {
  esClient,
  esBulk,
  sendJson: (res, results) => {
    addCorsHeaders(res);
    res.status(200).json(results);
  },
  send: (res, results) => {
    addCorsHeaders(res);
    res.setHeader("Content-Type", "application/json");
    res.status(200).end(results);
  },
  sendError: (res, results) => {
    addCorsHeaders(res);
    res.status(400).error(results);
  },
};
