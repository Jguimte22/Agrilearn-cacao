exports.handler = async (event, context) => {
  // Comprehensive CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };

  // Handle CORS preflight (OPTIONS request)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Your response
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'CORS test successful!',
      timestamp: new Date().toISOString(),
      path: event.path,
      method: event.httpMethod,
      query: event.queryStringParameters,
      env: process.env.NODE_ENV || 'production'
    })
  };
};
