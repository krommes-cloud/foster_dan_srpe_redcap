exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const REDCAP_API_URL = process.env.REDCAP_API_URL;
    const REDCAP_API_TOKEN = process.env.REDCAP_API_TOKEN;

    if (!REDCAP_API_URL || !REDCAP_API_TOKEN) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing REDCap API configuration' })
      };
    }

    const qs = event.queryStringParameters || {};
    const record = qs.record;
    const event_name = qs.event_name;
    const instance = qs.instance;
    const repeat_instrument = qs.repeat_instrument;
    const field = qs.field;

    if (!record || !event_name || !instance || !repeat_instrument || !field) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const formData = new URLSearchParams();
    formData.append('token', REDCAP_API_TOKEN);
    formData.append('content', 'record');
    formData.append('format', 'json');
    formData.append('type', 'flat');
    formData.append('rawOrLabel', 'raw');
    formData.append('rawOrLabelHeaders', 'raw');
    formData.append('exportCheckboxLabel', 'false');
    formData.append('exportSurveyFields', 'false');
    formData.append('exportDataAccessGroups', 'false');
    formData.append('records[0]', String(record));
    formData.append('fields[0]', String(field));
    formData.append('events[0]', String(event_name));

    const response = await fetch(REDCAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'REDCAP API error',
          status: response.status,
          details: text
        })
      };
    }

    let rows;
    try {
      rows = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid JSON from REDCap',
          details: text
        })
      };
    }

    const wantedInstance = String(instance);
    const wantedInstrument = String(repeat_instrument);
    const wantedEvent = String(event_name);

    const match = (rows || []).find((row) => {
      const rowEvent = String(row.redcap_event_name || '');
      const rowInstr = String(row.redcap_repeat_instrument || '');
      const rowInst = String(row.redcap_repeat_instance || '');
      return rowEvent === wantedEvent && rowInstr === wantedInstrument && rowInst === wantedInstance;
    });

    const value = match ? match[field] : '';
    const answered = value !== null && value !== undefined && String(value) !== '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        answered,
        value: answered ? String(value) : ''
      })
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
