def compute_risk(score, attendance_pct):
    perf = 0.7 * score + 0.3 * attendance_pct
    prob = 1 - (perf / 100)
    if prob < 0.4:
        return 'LOW', round(prob, 3)
    elif prob < 0.7:
        return 'MEDIUM', round(prob, 3)
    else:
        return 'HIGH', round(prob, 3)


def get_recommendations(risk_level):
    if risk_level == 'HIGH':
        return [
            'Schedule advisor meeting this week',
            'Attend all upcoming classes without fail',
            'Join a study group immediately',
            'Book a tutoring session',
        ]
    elif risk_level == 'MEDIUM':
        return [
            'Review the last 3 weeks of course material',
            'Increase weekly study hours',
            'Ask questions during lectures',
        ]
    return [
        'Explore advanced reading materials',
        'Consider mentoring a peer',
        'Plan your next semester courses early',
    ]
