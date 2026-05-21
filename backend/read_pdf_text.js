const fs = require('fs');

const pdfBuffer = fs.readFileSync('test_output.pdf');
const pdfString = pdfBuffer.toString('binary');

// Find all text inside parentheses
const matches = pdfString.match(/\([^)]*\)/g);
if (matches) {
  console.log("Found text matches:");
  matches.forEach(m => {
    // Clean parenthesis
    const text = m.slice(1, -1);
    if (text.trim().length > 0) {
      console.log(text);
    }
  });
} else {
  console.log("No text matches found.");
}
