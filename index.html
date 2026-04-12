exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const REDCAP_API_URL = process.env.REDCAP_API_URL;
    const REDCAP_API_TOKEN = process.env.REDCAP_API_TOKEN;
    const RECORD_ID_FIELD = 'record_id';

    if (!REDCAP_API_URL || !REDCAP_API_TOKEN) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REDCap API configuration' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    const {
      record,
      event_name,
      instance,
      repeat_instrument,
      field,
      value,
      complete_field
    } = body;

    if (
      !record ||
      !event_name ||
      !instance ||
      !repeat_instrument ||
      !field ||
      value === undefined ||
      value === null
    ) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const redcapRecord = {
      [RECORD_ID_FIELD]: String(record),
      redcap_event_name: String(event_name),
      redcap_repeat_instrument: String(repeat_instrument),
      redcap_repeat_instance: String(instance),
      [field]: String(value)
    };

    if (complete_field) {
      redcapRecord[complete_field] = '2';
    }

    const formData = new URLSearchParams();
    formData.append('token', REDCAP_API_TOKEN);
    formData.append('content', 'record');
    formData.append('format', 'json');
    formData.append('type', 'flat');
    formData.append('overwriteBehavior', 'overwrite');
    formData.append('forceAutoNumber', 'false');
    formData.append('data', JSON.stringify([redcapRecord]));
    formData.append('returnContent', 'count');
    formData.append('returnFormat', 'json');

    const response = await fetch(REDCAP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'REDCap API error',
          status: response.status,
          details: text
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, response: text })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Server error',
        details: err.message
      })
    };
  }
};
