import express from "express";

export default function createApiRoutes(db) {
  const router = express.Router();
  const coll = db.collection("processed_messages");

  router.get("/conversations", async (req, res) => {
    try {
      const agg = [
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$from",
            wa_id: { $first: "$from" },
            name: { $first: "$contact_name" },
            lastText: { $first: "$text" },
            lastTimestamp: { $first: "$timestamp" },
            unreadCount: { $sum: { $cond: [{ $eq: ["$status", "received"] }, 1, 0] } }
          }
        },
        { $sort: { lastTimestamp: -1 } }
      ];
      const rows = await coll.aggregate(agg).toArray();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to fetch conversations" });
    }
  });

  router.get("/messages/:wa_id", async (req, res) => {
    try {
      const wa_id = req.params.wa_id;
      const msgs = await coll.find({ $or: [{ from: wa_id }, { wa_id: wa_id }, { to: wa_id }] })
        .sort({ timestamp: 1 })
        .toArray();
      res.json(msgs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to fetch messages" });
    }
  });

  router.post("/messages/:wa_id", async (req, res) => {
    try {
      const wa_id = req.params.wa_id;
      const { sender = "me", text } = req.body;
      const doc = {
        id: `local-${Date.now()}`, 
        meta_msg_id: null,
        from: sender === "me" ? "me" : wa_id,
        contact_name: sender === "me" ? "You" : null,
        wa_id: wa_id,
        phone_number_id: null,
        text,
        type: "text",
        timestamp: new Date(),
        status: "sent",
        raw_payload: null,
        createdAt: new Date()
      };
      const r = await coll.insertOne(doc);
      res.status(201).json({ insertedId: r.insertedId, message: doc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to create message" });
    }
  });

  return router;
}
