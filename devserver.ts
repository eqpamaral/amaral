import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import http from "node:http";
import chalk from "chalk";
import { createServer } from "vite";
//@ts-expect-error no typedefs
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import {
	normalizeWebsocketUrl,
	warnOnUrlEscape,
	runRspack,
	black,
	printBanner,
} from "./devlib.ts";
import rspackConfig from "./rspack.config.ts";

const image = await fs.readFile("./assets/scramjet-mini-noalpha.png");

// Resolvendo o erro do Git com texto fixo
const commit = "v2-railway";
const branch = "main";

const packagejson = JSON.parse(await fs.readFile("./package.json", "utf-8"));
const version = packagejson.version;

// Configuração de portas unificada para o Railway
const PORTA_RAILWAY = Number(process.env.PORT) || 4141;

if (process.env.VITE_WISP_URL) {
	process.env.VITE_WISP_URL = normalizeWebsocketUrl(process.env.VITE_WISP_URL);
} else {
	process.env.VITE_WISP_URL = `ws://localhost:${PORTA_RAILWAY}/`;
}

wisp.options.allow_private_ips = true;
wisp.options.allow_loopback_ips = true;

// Inicializando o servidor principal do Vite na porta padrão do Railway
const server = await createServer({
	configFile: "./packages/demo/vite.config.ts",
	root: "./packages/demo",
	server: {
		port: PORTA_RAILWAY,
		strictPort: true,
	},
});

// Vincula o tráfego do protocolo WISP diretamente no mesmo servidor e porta
server.httpServer?.on("upgrade", (req, socket, head) => {
	wisp.routeRequest(req, socket, head);
});

warnOnUrlEscape(server);

await server.listen();

const accent = (text: string) => chalk.hex("#f1855bff").bold(text);
const highlight = (text: string) => chalk.hex("#fdd76cff").bold(text);
const urlColor = (text: string) => chalk.hex("#64DFDF").underline(text);
const connector = chalk.hex("#8D99AE").dim("@");

const lines = [
	black()(`${highlight("SCRAMJET DEV SERVER")}`),
	black()(
		`${accent("demo/wisp")} ${connector} ${urlColor(
			`http://localhost:\${PORTA_RAILWAY}/`
		)}`
	),
	black()(chalk.dim(`[${branch}] ${commit} scramjet/${version}`)),
];

runRspack(rspackConfig);

printBanner(image, lines);
