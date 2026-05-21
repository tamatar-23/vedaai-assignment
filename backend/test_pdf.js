const { generateAssignmentPDF } = require('./dist/services/pdf.js');
const fs = require('fs');
const mockAssignment = {
  title: "VedaAI Test Assignment",
  subject: "Science",
  classLevel: "Grade 8",
  allowedTime: 45,
  maxMarks: 20,
  additionalInstructions: "Focus on Electricity. [Strict UI Table Configuration - Respect Count & Marks]:\n- Generate exactly 5 Short Answer questions, each valued at 3 marks.\n- Generate exactly 5 MCQ questions, each valued at 1 marks.",
  sections: [
    {
      title: "Section A: Short Answer",
      instruction: "Attempt all questions. Each question carries 3 marks.",
      questions: [
        {
          questionText: "Define electroplating.",
          difficulty: "easy",
          marks: 3,
          answer: "Electroplating is coating a metal with another metal using electric current."
        }
      ]
    }
  ]
};

generateAssignmentPDF(mockAssignment).then(buf => {
  fs.writeFileSync('test_output.pdf', buf);
  console.log("PDF generated!");
}).catch(console.error);
