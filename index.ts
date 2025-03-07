import { Hono } from "hono";
import { auth } from "./auth";

export default new Hono().on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));