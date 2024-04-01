import axios from "axios";
import config from "../config";
import { colors } from "../utils";

const APIClient = axios.create({
  baseURL: `${config.userServiceUri}:${config.userServicePort}/v1`,
  headers: { "Access-Control-Allow-Origin": "*" }
});

// Auth
const Me = async token => {
  try {
    console.log(colors.FgGreen, "Request User with /me ");
    console.log(" ");
    return (await APIClient.get("/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        ContentType: "application/json"
      }
    })).data;
  } catch (e) {
    console.log(colors.FgRed, "Auth failed");
    console.log(colors.FgRed, e.message || "No messsage");
    console.log(" ");
    return false;
  }
};

const UpdateStatus = async (token, status, sessionId) => {
  try {
    console.log(colors.FgYellow, "Updating status ... ");
    return (await APIClient.patch(
      "/users/updateStatus",
      { status, sessionId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ContentType: "application/json"
        }
      }
    )).data;
  } catch (e) {
    console.log(colors.FgRed, "Update status faild ...");
    console.log(colors.FgRed, e.message || "No messsage");
    return false;
  }
};

const storeResult = async (token, data) => {
  try {
    console.log(colors.FgGreen, "* Storing Result ... *");
    return (await APIClient.post("/results", data, {
      headers: {
        Authorization: `Bearer ${token}`,
        ContentType: "application/json"
      }
    })).data;

  } catch (e) {
    console.log(colors.FgRed, "Storing Result Faild");
    console.log(colors.FgRed, e.message || "-> no Store result error message");
    return false;
  }
};

const validateWord = async (token, word: string) => {
  try {
    console.log(colors.FgGreen, `Validating word - ${word}`);
    const start = Date.now();
    const result = (await APIClient.post(
      `/words/check`,
      { word },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ContentType: "application/json"
        }
      }
    )).data;
    const end = Date.now();
    console.log(
      colors.FgGreen,
      `Elipsed Time to validate word ${word} is ${end - start} ms`
    );
    console.log(" ");
    return result;
  } catch (e) {
    console.log(colors.FgRed, `Validating ${word} faild`);
    console.log(colors.FgRed, e.message || "-> no validation error message");
    return "NaW";
  }
};

export { APIClient, Me, UpdateStatus, storeResult, validateWord };
