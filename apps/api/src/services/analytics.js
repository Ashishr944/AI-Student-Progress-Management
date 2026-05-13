import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const pythonScriptPath = path.resolve(
  process.cwd(),
  '../analytics/scripts/analyze_student.py'
);

const jsFallbackAnalyze = ({ attendanceRate, averageMark, assignmentCompletion }) => {
  const attendance = Number(attendanceRate || 0);
  const avgMark = Number(averageMark || 0);
  const assignment = Number(assignmentCompletion || 0);
  const predictedScore = Math.min(100, Math.max(0, 0.4 * avgMark + 0.35 * assignment + 0.25 * attendance));
  const riskScore = Math.min(100, Math.max(0, 100 - (0.5 * avgMark + 0.3 * assignment + 0.2 * attendance)));
  const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
  const recommendations = [];
  if (attendance < 75) recommendations.push('Improve attendance consistency with weekly check-ins.');
  if (assignment < 70) recommendations.push('Focus on timely assignment submissions with a weekly planner.');
  if (avgMark < 65) recommendations.push('Schedule targeted tutoring sessions for weak subjects.');
  if (!recommendations.length) recommendations.push('Maintain current performance and aim for incremental improvement.');
  return {
    predictedScore: Number(predictedScore.toFixed(1)),
    riskScore: Number(riskScore.toFixed(1)),
    riskLevel,
    summary: `Attendance at ${attendance.toFixed(1)}%, assignments at ${assignment.toFixed(1)}%, average marks ${avgMark.toFixed(1)}%. Predicted score ${predictedScore.toFixed(1)}. Risk level: ${riskLevel}.`,
    recommendations,
  };
};

export const runStudentAnalysis = (payload) => {
  try {
    if (!fs.existsSync(pythonScriptPath)) {
      return jsFallbackAnalyze(payload);
    }

    const result = spawnSync('python3', [pythonScriptPath], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    if (result.error || result.status !== 0) {
      return jsFallbackAnalyze(payload);
    }

    return JSON.parse(result.stdout || '{}');
  } catch (error) {
    return jsFallbackAnalyze(payload);
  }
};
