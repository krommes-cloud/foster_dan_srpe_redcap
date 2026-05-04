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

    const answeredRows = (rows || []).filter(row => {
      const value = row[field];
      return value !== null && value !== undefined && String(value) !== '';
    });

    const latestAnsweredRow = answeredRows.length
      ? answeredRows[answeredRows.length - 1]
      : null;

    const value = latestAnsweredRow ? String(latestAnsweredRow[field]) : '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        answered: value !== '',
        value
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
