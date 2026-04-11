exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  try {
    const REDCAP_API_URL = process.env.REDCAP_API_URL;
    const REDCAP_API_TOKEN = process.env.REDCAP_API_TOKEN;

    if (!REDCAP_API_URL || !REDCAP_API_TOKEN) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: "Missing REDCAP_API_URL or REDCAP_API_TOKEN"
        })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const {
      record,
      event_name,
      instance,
      repeat_instrument,
      field,
      value
    } = body;

    if (
      record === undefined ||
      record === null ||
      !field ||
      value === undefined ||
      value === null
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: "Missing one or more required values: record, field, value"
        })
      };
    }

    /*
      VIGTIGT:
      Hvis jeres record-id felt IKKE hedder record_id, så ændr linjen nedenfor.
      Eksempel:
      const RECORD_ID_FIELD = "study_id";
    */
    const RECORD_ID_FIELD = "record_id";

    const redcapRecord = {
  [RECORD_ID_FIELD]: record,
  [field]: value,
  slider_fedten_rundt_2_complete: "2"
};

    if (event_name) {
      redcapRecord.redcap_event_name = event_name;
    }

    if (repeat_instrument) {
      redcapRecord.redcap_repeat_instrument = repeat_instrument;
    }

    if (instance) {
      redcapRecord.redcap_repeat_instance = instance;
    }

    const formData = new URLSearchParams();
    formData.append("token", REDCAP_API_TOKEN);
    formData.append("content", "record");
    formData.append("action", "import");
    formData.append("format", "json");
    formData.append("type", "flat");
    formData.append("overwriteBehavior", "overwrite");
    formData.append("forceAutoNumber", "false");
    formData.append("data", JSON.stringify([redcapRecord]));
    formData.append("returnContent", "count");
    formData.append("returnFormat", "json");

    const redcapResponse = await fetch(REDCAP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const responseText = await redcapResponse.text();

    if (!redcapResponse.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          error: "REDCap API error",
          status: redcapResponse.status,
          details: responseText
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: true,
        redcap_response: responseText,
        saved: {
          record,
          event_name: event_name || null,
          instance: instance || null,
          repeat_instrument: repeat_instrument || null,
          field,
          value
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Unhandled server error",
        details: String(err)
      })
    };
  }
};
