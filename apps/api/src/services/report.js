import PDFDocument from 'pdfkit';

export const buildStudentReportPdf = async ({ student, metrics, analysis }) => {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(20).text('Student Progress Report', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Student: ${student.firstName} ${student.lastName}`);
  doc.text(`Roll Number: ${student.rollNumber}`);
  doc.text(`Class: ${student.class.name} - ${student.section.name}`);
  doc.moveDown();

  doc.fontSize(14).text('Performance Metrics', { underline: true });
  doc.fontSize(12).text(`Attendance Rate: ${metrics.attendanceRate}%`);
  doc.text(`Average Marks: ${metrics.averageMark}%`);
  doc.text(`Assignment Completion: ${metrics.assignmentCompletion}%`);
  doc.moveDown();

  doc.fontSize(14).text('AI Insights', { underline: true });
  doc.fontSize(12).text(`Predicted Score: ${analysis.predictedScore}%`);
  doc.text(`Risk Level: ${analysis.riskLevel}`);
  doc.text(`Summary: ${analysis.summary}`);
  doc.moveDown();

  doc.fontSize(14).text('Recommendations', { underline: true });
  analysis.recommendations.forEach((rec) => doc.fontSize(12).text(`- ${rec}`));
  doc.moveDown();

  doc.fontSize(14).text('Recent Marks', { underline: true });
  metrics.marks.slice(-5).forEach((mark) => {
    doc.fontSize(12).text(`${mark.examName} - ${mark.score}/${mark.maxScore}`);
  });

  doc.end();

  return await new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};
