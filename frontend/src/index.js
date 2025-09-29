import "./router.js";
import "./style/main.css";
import "./components/points-display.js";
import "./components/point-row.js";
import "./components/points-manager.js";
import "@shoelace-style/shoelace/dist/shoelace.js";
import { setBasePath } from "@shoelace-style/shoelace/dist/shoelace.js";

setBasePath("https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn");

if (window.location.search.includes("dark")) {
    document.body.style.background = "#373737";
}
