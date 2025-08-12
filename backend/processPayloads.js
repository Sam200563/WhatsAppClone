import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "whatsapp";
const COLLECTION_NAME = "processed_messages";
const PAYLOADS_DIR = process.env.PAYLOADS_DIR || "./payloads";

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in .env");
  process.exit(1);
}

function parseTimestamp(ts) {
  if (ts === undefined || ts === null) return null;
  const n = Number(ts);
  if (Number.isNaN(n)) return null;
  return n > 9999999999 ? new Date(n) : new Date(n * 1000);
}

async function processFile(filePath, collection) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const payload = JSON.parse(raw);

    if (payload.payload_type !== "whatsapp_webhook") {
      console.log(`[SKIP] ${path.basename(filePath)} not whatsapp_webhook`);
      return;
    }

    const entry = payload.metaData?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value || {};

    if (Array.isArray(value.messages) && value.messages.length > 0) {
      for (const msg of value.messages) {
        const existing = await collection.findOne({ id: msg.id });
        if (existing) {
          console.log(`[EXISTS] message ${msg.id}`);
          continue;
        }

        const doc = {
          id: msg.id,
          meta_msg_id: msg.context?.id || null,
          from: msg.from || null,
          contact_name: value.contacts?.[0]?.profile?.name || null,
          wa_id: value.contacts?.[0]?.wa_id || null,
          phone_number_id: value.metadata?.phone_number_id || null,
          text: msg.text?.body ?? null,
          type: msg.type ?? null,
          timestamp: parseTimestamp(msg.timestamp) || new Date(),
          status: "received",
          raw_payload: payload,
          createdAt: new Date()
        };

        await collection.insertOne(doc);
        console.log(`[INSERT] msg ${msg.id}`);
      }
    }

    const statuses = value.statuses ?? (value.status ? [value.status] : null);
    if (Array.isArray(statuses) && statuses.length > 0) {
      for (const s of statuses) {
        const statusId = s.id || s.message_id || s.message?.id;
        if (!statusId) {
          console.log(`[WARN] status object without id in ${path.basename(filePath)}`);
          continue;
        }
        const filter = { $or: [{ id: statusId }, { meta_msg_id: statusId }] };
        const update = {
          $set: {
            status: s.status || s.state || "unknown",
            status_timestamp: parseTimestamp(s.timestamp) || new Date(),
            status_raw: s
          }
        };
        const res = await collection.updateOne(filter, update);
        if (res.matchedCount > 0) {
          console.log(`[UPDATE] status ${s.status} for ${statusId} (modified ${res.modifiedCount})`);
        } else {
          console.log(`[NO MATCH] status ${statusId} not matched in DB`);
        }
      }
    }

  } catch (err) {
    console.error(`[ERR] processing ${path.basename(filePath)}:`, err.message);
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  try {
    await collection.createIndex({ id: 1 }, { unique: true, sparse: true });
  } catch (e) {
    
  }
  await collection.createIndex({ meta_msg_id: 1 });


  if (!fs.existsSync(PAYLOADS_DIR)) {
    console.error("Payloads directory not found:", PAYLOADS_DIR);
    await client.close();
    process.exit(1);
  }

  const files = fs.readdirSync(PAYLOADS_DIR).filter(f => f.toLowerCase().endsWith(".json"));
  console.log(`Found ${files.length} json files in ${PAYLOADS_DIR}`);

  for (const file of files) {
    const p = path.join(PAYLOADS_DIR, file);
    await processFile(p, collection);
  }

  console.log("Processing finished.");
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
