import ExternalLibrary, { answer } from "external-library";
import config from "virtual:test-config";
import "./style.css";

const compressibleText = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
document.querySelector("#app").textContent = `${ExternalLibrary.name}:${answer}:${config.mode}:${compressibleText}`;
