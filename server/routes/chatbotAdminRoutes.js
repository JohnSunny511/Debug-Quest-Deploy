const express = require("express");
const axios = require("axios");
const { z } = require("zod");
const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");
const { sanitizeFreeText, sanitizeText } = require("../utils/security");

const router = express.Router();
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL;

function handleProxyError(error, res) {
  if (error.response) {
    const status = Number(error.response.status) || 502;
    if (status >= 500) {
      return res.status(502).json({ error: "Chatbot service is unavailable." });
    }

    const message =
      error.response.data?.message ||
      error.response.data?.detail ||
      "Chatbot request failed.";
    return res.status(status).json({ error: message });
  }

  return res.status(502).json({ error: "Chatbot service is unavailable." });
}

async function forwardAddText(text) {
  try {
    return await axios.post(`${CHATBOT_SERVICE_URL}/add`, { text });
  } catch (error) {
    if (error.response?.status !== 422) {
      throw error;
    }
  }

  try {
    return await axios.post(`${CHATBOT_SERVICE_URL}/add`, null, {
      params: { text },
    });
  } catch (error) {
    if (error.response?.status !== 422) {
      throw error;
    }
  }

  return axios.post(
    `${CHATBOT_SERVICE_URL}/add`,
    new URLSearchParams({ text }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
}

router.use(authenticateUser, requireAdmin);

router.post("/upload", async (req, res) => {
  try {
    const response = await axios({
      method: "post",
      url: `${CHATBOT_SERVICE_URL}/upload`,
      data: req,
      headers: {
        "content-type": req.headers["content-type"],
        ...(req.headers["content-length"]
          ? { "content-length": req.headers["content-length"] }
          : {}),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, res);
  }
});

router.post("/add", async (req, res) => {
  try {
    const parsed = z
      .object({
        text: z.string().min(1).max(20000),
      })
      .safeParse({
        text: sanitizeFreeText(req.body?.text, { maxLength: 20000 }),
      });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Text is required." });
    }

    const response = await forwardAddText(parsed.data.text);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, res);
  }
});

router.get("/list", async (_req, res) => {
  try {
    const response = await axios.get(`${CHATBOT_SERVICE_URL}/list`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, res);
  }
});

router.delete("/delete/:name", async (req, res) => {
  try {
    const parsed = z
      .object({
        name: z.string().min(1).max(255),
      })
      .safeParse({
        name: sanitizeText(req.params.name, { maxLength: 255, allowNewlines: false }),
      });

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid document name." });
    }

    const safeName = encodeURIComponent(parsed.data.name);
    const response = await axios.delete(`${CHATBOT_SERVICE_URL}/delete/${safeName}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, res);
  }
});

router.post("/clear_history", async (req, res) => {
  try {
    const response = await axios.post(`${CHATBOT_SERVICE_URL}/clear_history`, req.body || {});
    return res.status(response.status).json(response.data);
  } catch (error) {
    return handleProxyError(error, res);
  }
});

module.exports = router;
