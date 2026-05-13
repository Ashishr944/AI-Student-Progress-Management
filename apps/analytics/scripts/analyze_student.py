import json
import sys


def clamp(value, min_val=0, max_val=100):
    return max(min_val, min(max_val, value))


def analyze(payload):
    attendance = float(payload.get("attendanceRate", 0))
    avg_mark = float(payload.get("averageMark", 0))
    assignment_completion = float(payload.get("assignmentCompletion", 0))

    predicted = 0.4 * avg_mark + 0.35 * assignment_completion + 0.25 * attendance
    predicted = clamp(predicted)

    risk_score = 100 - (0.5 * avg_mark + 0.3 * assignment_completion + 0.2 * attendance)
    risk_score = clamp(risk_score)

    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 40:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    recommendations = []
    if attendance < 75:
        recommendations.append("Improve attendance consistency with weekly check-ins.")
    if assignment_completion < 70:
        recommendations.append("Focus on timely assignment submissions with a weekly planner.")
    if avg_mark < 65:
        recommendations.append("Schedule targeted tutoring sessions for weak subjects.")
    if not recommendations:
        recommendations.append("Maintain current performance and aim for incremental improvement.")

    summary = (
        f"Attendance at {attendance:.1f}%, assignments at {assignment_completion:.1f}%, "
        f"average marks {avg_mark:.1f}%. Predicted score {predicted:.1f}. "
        f"Risk level: {risk_level}."
    )

    return {
        "predictedScore": round(predicted, 1),
        "riskScore": round(risk_score, 1),
        "riskLevel": risk_level,
        "summary": summary,
        "recommendations": recommendations,
    }


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}
    result = analyze(payload)
    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    main()
