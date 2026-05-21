const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', (err) => { reject(err); });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Route Tests ---');
  
  // Test 1: Health Check
  try {
    const health = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/health',
      method: 'GET'
    });
    console.log('Health Check Status:', health.statusCode);
    console.log('Health Check Body:', health.body);
  } catch (err) {
    console.error('Health check failed. Make sure the server is running on port 5000.', err.message);
    process.exit(1);
  }

  // Test 2: Create Assignment
  let createdId = null;
  try {
    const assignmentData = {
      title: 'Quiz on Electrolysis and Circuits',
      subject: 'Science',
      classLevel: 'Grade 8',
      allowedTime: 45,
      maxMarks: 20,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      questionTypes: ['MCQ', 'Short Answer'],
      additionalInstructions: 'Focus on NCERT solutions, chapter 4. Chemistry priority.'
    };
    
    console.log('Creating Assignment...');
    const res = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/assignments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, assignmentData);

    console.log('Create Assignment Status:', res.statusCode);
    console.log('Created Assignment:', res.body);
    
    createdId = res.body.id || res.body._id;
    console.log('Created Assignment ID:', createdId);
  } catch (err) {
    console.error('Failed to create assignment:', err);
    process.exit(1);
  }

  // Test 3: List Assignments
  try {
    console.log('Listing Assignments...');
    const listRes = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/assignments',
      method: 'GET'
    });
    console.log('List Status:', listRes.statusCode);
    console.log('List Count:', Array.isArray(listRes.body) ? listRes.body.length : 0);
  } catch (err) {
    console.error('Failed to list assignments:', err);
  }

  // Wait 2.5 seconds for the mock queue worker to complete generation
  console.log('Waiting for AI generation worker (mock queue)...');
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Test 4: Retrieve Details & Questions
  try {
    console.log('Retrieving Assignment Details for ID:', createdId);
    const detailRes = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/assignments/${createdId}`,
      method: 'GET'
    });
    console.log('Retrieve Status:', detailRes.statusCode);
    console.log('Assignment Status:', detailRes.body.status);
    console.log('Questions Progress:', detailRes.body.progress);
    console.log('Number of Sections:', detailRes.body.sections ? detailRes.body.sections.length : 0);
    if (detailRes.body.sections && detailRes.body.sections.length > 0) {
      console.log('First Section Title:', detailRes.body.sections[0].title);
      console.log('First Section Questions:', detailRes.body.sections[0].questions.length);
    }
  } catch (err) {
    console.error('Failed to retrieve assignment details:', err);
  }

  // Test 5: Try Downloading PDF (should succeed since generation is complete)
  try {
    console.log('Requesting PDF file download...');
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `/api/assignments/${createdId}/pdf`,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log('PDF Download Status:', res.statusCode);
      console.log('PDF Content Type:', res.headers['content-type']);
      console.log('PDF Content Length:', res.headers['content-length']);
      if (res.statusCode === 200 && res.headers['content-type'] === 'application/pdf') {
        console.log('PDF download verification succeeded!');
      } else {
        console.log('PDF download verification failed.');
      }
    });
    req.end();
  } catch (err) {
    console.error('Failed PDF download check:', err);
  }

  console.log('--- API Route Tests Complete ---');
}

runTests();
