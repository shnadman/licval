import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:3001/api/parking",
  timeout: 2000,
});
