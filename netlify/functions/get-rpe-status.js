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

    if (!record || !field) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required parameters',
          received: qs
        })
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

    const response = await fetch(REDCAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const text = await response.text();

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

    const simplifiedRows = (rows || []).map(row => ({
      redcap_event_name: row.redcap_event_name || '',
      redcap_repeat_instrument: row.redcap_repeat_instrument || '',
      redcap_repeat_instance: row.redcap_repeat_instance || '',
      field_value: row[field] || ''
    }));

    const exactMatch = simplifiedRows.find(row =>
      String(row.redcap_event_name) === String(event_name || '') &&
      String(row.redcap_repeat_instrument) === String(repeat_instrument || '') &&
      String(row.redcap_repeat_instance) === String(instance || '')
    );

    const anyAnsweredRows = simplifiedRows.filter(row =>
      row.field_value !== ''
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        answered: exactMatch ? exactMatch.field_value !== '' : false,
        value: exactMatch ? exactMatch.field_value : '',
        debug: {
          requested: {
            record,
            event_name,
            instance,
            repeat_instrument,
            field
          },
          total_rows: simplifiedRows.length,
          exact_match: exactMatch || null,
          any_answered_rows: anyAnsweredRows,
          all_rows: simplifiedRows
        }
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
