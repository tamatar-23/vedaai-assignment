import PDFDocument from 'pdfkit';
import { IAssignment, ISection, IQuestion } from '../models/Assignment.js';

export function generateAssignmentPDF(assignment: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Helper to format Date
      const formatDate = (dateInput: any): string => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      // Header: School Info (Delhi Public School, Sector-4, Bokaro style)
      const schoolTitle = (assignment.schoolName || 'DELHI PUBLIC SCHOOL').toUpperCase();
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#64748b').text(schoolTitle, { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#1e293b').text(assignment.title, { align: 'center' });
      doc.moveDown(0.2);
      doc.fontSize(14).fillColor('#475569').text(`Subject: ${assignment.subject}`, { align: 'center' });
      doc.moveDown(0.1);
      doc.fontSize(12).text(`Class: ${assignment.classLevel} | Term Assessment`, { align: 'center' });
      doc.moveDown(0.8);

      // Time & Marks Box
      const startY = doc.y;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');
      doc.text(`Time Allowed: ${assignment.allowedTime} minutes`, 50, startY);
      doc.text(`Maximum Marks: ${assignment.maxMarks}`, doc.page.width - 200, startY, { align: 'right', width: 150 });
      
      doc.moveDown(0.8);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b').text('All questions are compulsory unless stated otherwise.', 50, doc.y);
      doc.moveDown(0.8);

      // Student Info Lines
      const lineY = doc.y;
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
      
      doc.text('Name:', 50, lineY);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(90, lineY + 10).lineTo(250, lineY + 10).stroke();
      
      doc.text('Roll Number:', 50, lineY + 18);
      doc.moveTo(115, lineY + 28).lineTo(250, lineY + 28).stroke();
      
      doc.text(`Class: ${assignment.classLevel} Section:`, 50, lineY + 36);
      doc.moveTo(170, lineY + 46).lineTo(250, lineY + 46).stroke();
      
      doc.moveDown(5);

      // Render Sections & Questions
      let qNum = 1;
      const sections = assignment.sections || [];
      
      sections.forEach((section: any, sIdx: number) => {
        // Section Header
        doc.moveDown(1.5);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text(section.title, { align: 'center' });
        doc.moveDown(0.3);
        
        // Section Instruction
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#475569').text(section.instruction, { align: 'left' });
        doc.moveDown(0.5);

        // Questions List
        const questions = section.questions || [];
        questions.forEach((q: any) => {
          const currentY = doc.y;
          
          // Question text with difficulty and marks
          doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
          
          // Format like: "1. [Easy] Define electroplating. Explain its purpose. [2 Marks]"
          const diffText = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);
          const qText = `${qNum}. [${diffText}] ${q.questionText} [${q.marks} Marks]`;
          
          doc.text(qText, 50, currentY, { width: doc.page.width - 100, align: 'left' });
          doc.moveDown(0.5);

          // If MCQ, render options
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            const letters = ['A', 'B', 'C', 'D'];
            q.options.forEach((opt: string, oIdx: number) => {
              doc.font('Helvetica').fontSize(9).fillColor('#334155');
              doc.text(`    ${letters[oIdx]}. ${opt}`, { width: doc.page.width - 120 });
              doc.moveDown(0.2);
            });
            doc.moveDown(0.4);
          }
          
          qNum++;
          doc.moveDown(0.5);
        });
      });

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b').text('End of Question Paper', { align: 'center' });

      // Add Answer Key on a New Page
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e293b').text('Answer Key', { align: 'center' });
      doc.moveDown(1);

      let keyNum = 1;
      sections.forEach((section: any) => {
        const questions = section.questions || [];
        questions.forEach((q: any) => {
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(`Question ${keyNum}:`, { continued: true });
          doc.font('Helvetica').fontSize(10).fillColor('#334155').text(` ${q.questionText}`);
          doc.moveDown(0.2);
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('Answer: ', { continued: true });
          doc.font('Helvetica').fontSize(9).fillColor('#16a34a').text(q.answer);
          doc.moveDown(0.8);
          keyNum++;
        });
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
